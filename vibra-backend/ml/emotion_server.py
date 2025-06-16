import os
import gc
import torch
from flask import Flask, request, jsonify
from transformers import pipeline, AutoTokenizer
from collections import defaultdict
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

# --- Ensemble and Mapping Configuration ---

# Define the models, their weights, and their specific labels.
ENSEMBLE_CONFIG = {
    'primary': {
        'name': 'j-hartmann/emotion-english-distilroberta-base',
        'weight': 0.40,
    },
    'detailed': {
        'name': 'SamLowe/roberta-base-go_emotions',
        'weight': 0.35,
    },
    'social': {
        'name': 'cardiffnlp/twitter-roberta-base-emotion-latest',
        'weight': 0.25,
    }
}

# The master set of emotions Vibra will use.
MASTER_EMOTIONS = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral']

# Map emotions from each model to the MASTER_EMOTIONS set.
# This is crucial for combining the scores from different models.
EMOTION_MAPPING = {
    # Mapping for 'SamLowe/roberta-base-go_emotions' (28 emotions)
    'admiration': 'joy', 'amusement': 'joy', 'approval': 'joy', 'caring': 'joy',
    'desire': 'joy', 'excitement': 'joy', 'gratitude': 'joy', 'love': 'joy',
    'optimism': 'joy', 'pride': 'joy', 'relief': 'joy', 'joy': 'joy',
    'sadness': 'sadness', 'disappointment': 'sadness', 'grief': 'sadness', 'remorse': 'sadness',
    'anger': 'anger', 'annoyance': 'anger', 'disapproval': 'anger',
    'fear': 'fear', 'nervousness': 'fear', 'embarrassment': 'fear',
    'surprise': 'surprise', 'realization': 'surprise',
    'disgust': 'disgust',
    'confusion': 'neutral', 'curiosity': 'neutral', 'neutral': 'neutral',

    # Mapping for 'cardiffnlp/twitter-roberta-base-emotion-latest' (4 emotions)
    # 'joy' -> 'joy', 'sadness' -> 'sadness', 'anger' -> 'anger' are direct
    'optimism': 'joy',

    # Mapping for 'j-hartmann/emotion-english-distilroberta-base' (7 emotions)
    # All labels in this model are already in the MASTER_EMOTIONS set.
}


app = Flask(__name__)

# --- Model Loading ---

# Use GPU if available, otherwise CPU.
device = 0 if torch.cuda.is_available() else -1
models = {}

logging.info("Loading ensemble models...")
for name, config in ENSEMBLE_CONFIG.items():
    logging.info(f"Loading model: {config['name']}")
    models[name] = pipeline(
        "text-classification",
        model=config['name'],
        tokenizer=config['name'],
        device=device,
        top_k=None # Return scores for all labels
    )
logging.info("All models loaded successfully.")


# --- Analysis Endpoint ---

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyzes text to determine emotion using a weighted ensemble of models.
    Accepts:
    - text: The user's current input.
    - history (optional): A list of recent user inputs for contextual analysis.
    - user_bias (optional): An object with bias scores for each emotion for personalization.
    """
    try:
        data = request.json
        text = data.get('text')
        history = data.get('history', [])
        user_bias = data.get('user_bias', {})

        if not text:
            return jsonify({"error": "Text input is required."}), 400

        # Contextual Analysis: Combine recent history with the current text.
        contextual_text = ". ".join(history + [text])

        # --- Ensemble Prediction Logic ---
        # 1. Get predictions from all models
        raw_predictions = {}
        for name, model in models.items():
            raw_predictions[name] = model(contextual_text)

        # 2. Calculate weighted scores for each master emotion
        weighted_scores = defaultdict(float)
        for model_name, preds in raw_predictions.items():
            model_weight = ENSEMBLE_CONFIG[model_name]['weight']
            for pred in preds[0]: # preds is a list containing a list of dicts
                label = pred['label']
                score = pred['score']

                # Map the predicted label to a master emotion label
                master_emotion = EMOTION_MAPPING.get(label, label)

                if master_emotion in MASTER_EMOTIONS:
                    # Apply the model's weight to the score
                    weighted_scores[master_emotion] += score * model_weight

        # 3. Apply user-specific bias
        for emotion, bias in user_bias.items():
            if emotion in weighted_scores:
                weighted_scores[emotion] += bias
                # Ensure scores don't go below zero after applying bias
                weighted_scores[emotion] = max(0, weighted_scores[emotion])


        # 4. Determine the final dominant emotion
        if not weighted_scores:
             return jsonify({"error": "Could not determine emotion."}), 500

        # Normalize the final scores to sum to 1 (optional, but good practice)
        total_score = sum(weighted_scores.values())
        final_scores = {emotion: score / total_score for emotion, score in weighted_scores.items()}

        # Get the emotion with the highest score
        dominant_emotion = max(final_scores, key=final_scores.get)

        # Clean up memory
        gc.collect()
        if device == 0:
            torch.cuda.empty_cache()

        return jsonify({
            "dominant_emotion": dominant_emotion,
            "scores": final_scores
        })

    except Exception as e:
        logging.error(f"An error occurred during analysis: {e}")
        return jsonify({"error": "An internal error occurred."}), 500


if __name__ == '__main__':
    # For production, use a proper WSGI server like Gunicorn or uWSGI
    app.run(host='0.0.0.0', port=5001)
