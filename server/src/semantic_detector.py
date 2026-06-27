#!/usr/bin/env python3
import sys
import json
import numpy as np

# Set standard streams encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print(json.dumps({"error": "Python package 'sentence-transformers' is not installed."}))
    sys.exit(1)

def cosine_similarity(a, b):
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

def get_chunks(text):
    if not text:
        return []
    # Split text into paragraphs/lines, strip whitespaces, and ignore tiny fragments
    lines = text.split("\n")
    chunks = []
    for line in lines:
        cleaned = line.strip()
        if len(cleaned) > 10:
            chunks.append(cleaned)
    return chunks

def main():
    # Read input JSON from stdin
    try:
        input_raw = sys.stdin.read()
        input_data = json.loads(input_raw)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input JSON: {str(e)}"}))
        sys.exit(1)

    old_text = input_data.get("old_text", "")
    new_text = input_data.get("new_text", "")
    threshold = input_data.get("threshold", 0.85)

    # 1. Clean and chunk texts
    old_chunks = get_chunks(old_text)
    new_chunks = get_chunks(new_text)

    # Case A: Brand new competitor (no old text)
    if not old_text or len(old_chunks) == 0:
        result = {
            "hasChanged": len(new_chunks) > 0,
            "similarity": 0.0,
            "diffText": "\n".join([f"+ {c}" for c in new_chunks]),
            "addedChunks": new_chunks,
            "removedChunks": []
        }
        print(json.dumps(result))
        sys.exit(0)

    # Case B: Both are empty
    if len(old_chunks) == 0 and len(new_chunks) == 0:
        result = {
            "hasChanged": False,
            "similarity": 1.0,
            "diffText": "",
            "addedChunks": [],
            "removedChunks": []
        }
        print(json.dumps(result))
        sys.exit(0)

    # Case C: One becomes completely empty (massive change)
    if len(new_chunks) == 0:
        result = {
            "hasChanged": True,
            "similarity": 0.0,
            "diffText": "\n".join([f"- {c}" for c in old_chunks]),
            "addedChunks": [],
            "removedChunks": old_chunks
        }
        print(json.dumps(result))
        sys.exit(0)

    # 2. Load Model (will download automatically if not cached)
    try:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as e:
        print(json.dumps({"error": f"Failed to load sentence-transformers model: {str(e)}"}))
        sys.exit(1)

    # 3. Generate embeddings (normalized vectors)
    old_embeddings = model.encode(old_chunks, normalize_embeddings=True)
    new_embeddings = model.encode(new_chunks, normalize_embeddings=True)

    added_chunks = []
    matched_old_indices = set()
    diff_lines = []

    # Check for added or modified paragraphs
    for idx_new, new_emb in enumerate(new_embeddings):
        best_match_score = -1.0
        best_match_index = -1

        for idx_old, old_emb in enumerate(old_embeddings):
            score = cosine_similarity(new_emb, old_emb)
            if score > best_match_score:
                best_match_score = score
                best_match_index = idx_old

        if best_match_score < threshold:
            added_chunks.append(new_chunks[idx_new])
            diff_lines.append(f"+ {new_chunks[idx_new]}")
        else:
            matched_old_indices.add(best_match_index)

    # Check for removed paragraphs
    removed_chunks = []
    for idx_old, old_emb in enumerate(old_embeddings):
        if idx_old not in matched_old_indices:
            removed_chunks.append(old_chunks[idx_old])
            diff_lines.append(f"- {old_chunks[idx_old]}")

    # Calculate overall similarity using average of best matches
    total_match_score = 0.0
    for new_emb in new_embeddings:
        max_score = 0.0
        for old_emb in old_embeddings:
            score = cosine_similarity(new_emb, old_emb)
            if score > max_score:
                max_score = score
        total_match_score += max_score

    overall_similarity = float(total_match_score / len(new_embeddings)) if len(new_embeddings) > 0 else 0.0
    has_changed = len(added_chunks) > 0 or len(removed_chunks) > 0

    result = {
        "hasChanged": has_changed,
        "similarity": overall_similarity,
        "diffText": "\n".join(diff_lines),
        "addedChunks": added_chunks,
        "removedChunks": removed_chunks
    }
    print(json.dumps(result))

if __name__ == '__main__':
    main()
