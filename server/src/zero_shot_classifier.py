#!/usr/bin/env python3
import sys
import json

# Set standard streams encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')

try:
    from transformers import pipeline
except ImportError:
    print(json.dumps({"error": "Python package 'transformers' is not installed."}))
    sys.exit(1)

def main():
    # Read text from stdin
    try:
        input_data = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input JSON: {str(e)}"}))
        sys.exit(1)

    text = input_data.get("text", "")
    if not text:
        print(json.dumps({"category": "Other", "scores": []}))
        sys.exit(0)

    # 1. Load pipeline (downloads model automatically if not cached)
    try:
        classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    except Exception as e:
        print(json.dumps({"error": f"Failed to load zero-shot classification pipeline: {str(e)}"}))
        sys.exit(1)

    # 2. Define the candidate labels specified in the assignment
    candidate_labels = [
        "Pricing Change",
        "Feature Update",
        "Hiring Signal",
        "Content Shift",
        "Leadership Change",
        "Other"
    ]

    # 3. Perform classification
    try:
        res = classifier(text, candidate_labels)
        # Select the label with the highest probability score
        best_label = res["labels"][0]
        scores = {label: float(score) for label, score in zip(res["labels"], res["scores"])}
        
        result = {
            "category": best_label,
            "scores": scores
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Classification failed: {str(e)}"}))
        sys.exit(1)

if __name__ == '__main__':
    main()
