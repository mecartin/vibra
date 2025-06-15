from flask import Flask, request, jsonify
from transformers import pipeline

# Pick a better, social-text-focused model from Cardiff NLP (trained on Twitter):
MODEL = "cardiffnlp/twitter-roberta-base-emotion"

app = Flask(__name__)
classifier = pipeline("text-classification", model=MODEL, top_k=None)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data['text']

    # Basic normalization (for emoji compatibility with Node.js):
    # Input is already prepped as str, so we just analyze.
    preds = classifier(text)
    # Return as a nested list to match Node route expectation for flexibility
    return jsonify([preds])

if __name__ == "__main__":
    app.run(port=5001)