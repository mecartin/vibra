import pandas as pd
import re
from sklearn.model_selection import train_test_split
from datasets import Dataset, DatasetDict
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments

# --- Configuration ---
BASE_MODEL = 'j-hartmann/emotion-english-distilroberta-base'
NEW_MODEL_NAME = 'vibra-fine-tuned-emotion-model'
DATASET_PATH = './sentiment140.csv' # Path to your downloaded Sentiment140 dataset
# For Reddit data, you would first scrape it and save it to a similar CSV format.

# --- 1. Data Loading and Preprocessing ---

def clean_text(text):
    """Removes URLs, mentions, and special characters."""
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\@\w+', '', text)
    text = re.sub(r'#', '', text)
    text = text.lower()
    return text

def load_and_prepare_data(filepath):
    """Loads Sentiment140, renames columns, and cleans text."""
    # The dataset has no header, so we provide column names.
    # Columns: 0 - target, 1 - ids, 2 - date, 3 - flag, 4 - user, 5 - text
    df = pd.read_csv(
        filepath,
        encoding='latin-1',
        header=None,
        names=['target', 'ids', 'date', 'flag', 'user', 'text']
    )
    
    # We only need the text and the sentiment target.
    df = df[['text', 'target']]
    
    # Preprocess text
    df['text'] = df['text'].apply(clean_text)
    
    # Map sentiment labels (0=sadness, 4=joy) to more descriptive labels.
    # The j-hartmann model uses 'sadness' and 'joy'.
    # Note: We're only using a subset of emotions for this example fine-tuning.
    label_map = {0: 'sadness', 4: 'joy'}
    df['label_name'] = df['target'].map(label_map)
    
    # Create a numerical label ID that the model can use.
    # First, get the label mapping from the pre-trained model's config.
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model_for_labels = AutoModelForSequenceClassification.from_pretrained(BASE_MODEL)
    id2label = model_for_labels.config.id2label
    label2id = model_for_labels.config.label2id
    
    df['label'] = df['label_name'].map(label2id)
    
    # Drop rows where the label isn't in our target set (e.g., neutral tweets if any)
    df = df.dropna(subset=['label'])
    df['label'] = df['label'].astype(int)

    return df[['text', 'label']]

# --- 2. Tokenization and Dataset Creation ---

def create_hf_dataset(df):
    """Splits data and converts it into a Hugging Face Dataset object."""
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['label'])
    
    # For demonstration, we'll use a smaller subset to run faster. Remove these lines for a full run.
    train_df = train_df.sample(n=10000, random_state=42)
    test_df = test_df.sample(n=2000, random_state=42)
    
    train_dataset = Dataset.from_pandas(train_df)
    test_dataset = Dataset.from_pandas(test_df)
    
    # Tokenize the datasets
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    def tokenize_function(examples):
        return tokenizer(examples['text'], padding='max_length', truncation=True)
        
    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_test = test_dataset.map(tokenize_function, batched=True)
    
    return tokenized_train, tokenized_test, tokenizer

# --- 3. Training ---

def fine_tune_model(train_dataset, test_dataset, tokenizer):
    """Sets up and runs the Hugging Face Trainer."""
    model = AutoModelForSequenceClassification.from_pretrained(BASE_MODEL, num_labels=7) # num_labels from j-hartmann
    
    # Define training arguments
    training_args = TrainingArguments(
        output_dir=f'./results/{NEW_MODEL_NAME}',
        num_train_epochs=3,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=100,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        learning_rate=2e-5, # Recommended learning rate
    )
    
    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
    )
    
    # Start training
    print("Starting fine-tuning...")
    trainer.train()
    print("Fine-tuning complete.")
    
    # Save the fine-tuned model and tokenizer
    trainer.save_model(f'./models/{NEW_MODEL_NAME}')
    tokenizer.save_pretrained(f'./models/{NEW_MODEL_NAME}')
    print(f"Model saved to ./models/{NEW_MODEL_NAME}")

# --- Main Execution ---

if __name__ == '__main__':
    print("Step 1: Loading and preparing data...")
    main_df = load_and_prepare_data(DATASET_PATH)
    
    print("Step 2: Creating and tokenizing datasets...")
    train_ds, test_ds, tokenizer = create_hf_dataset(main_df)
    
    print("Step 3: Starting model fine-tuning...")
    fine_tune_model(train_ds, test_ds, tokenizer)

