import json
import random
import os
from sentence_transformers import SentenceTransformer, util
import numpy as np

INPUT_PATH = "duplicates_dataset.json"
OUTPUT_PATH = "cleaned_augmented_dataset.json"

model = SentenceTransformer('all-MiniLM-L6-v2')


def load_data(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def clean_text(text):
    return text.strip().lower()


def fix_inconsistent_labels(data, threshold=0.75):
    texts = []
    for d in data:
        texts.append(clean_text(d["complaint1"]))
        texts.append(clean_text(d["complaint2"]))

    embeddings = model.encode(texts, convert_to_tensor=True)

    fixed_data = []
    idx = 0

    for d in data:
        emb1 = embeddings[idx]
        emb2 = embeddings[idx + 1]
        idx += 2

        sim = float(util.cos_sim(emb1, emb2))

        if sim >= threshold:
            label = 1
        elif sim < 0.4:
            label = 0
        else:
            label = d["label"]

        fixed_data.append({
            "complaint1": d["complaint1"],
            "complaint2": d["complaint2"],
            "label": label
        })

    return fixed_data


# ================= AUGMENTATION =================
def paraphrase(text):
    variations = [
        text,
        text.replace("not collected", "not picked up"),
        text.replace("near", "close to"),
        text.replace("area", "location"),
        text.replace("road", "street"),
        text.replace("garbage", "waste"),
        text.replace("pothole", "road damage"),
    ]
    return random.choice(variations)


def generate_positive_pairs(data, n=1500):
    positives = [d for d in data if d["label"] == 1]
    new_samples = []

    for _ in range(n):
        d = random.choice(positives)

        new_samples.append({
            "complaint1": paraphrase(d["complaint1"]),
            "complaint2": paraphrase(d["complaint2"]),
            "label": 1
        })

    return new_samples


def generate_negative_pairs(data, n=1500):
    new_samples = []

    for _ in range(n):
        d1 = random.choice(data)
        d2 = random.choice(data)

        if d1 != d2:
            new_samples.append({
                "complaint1": d1["complaint1"],
                "complaint2": d2["complaint2"],
                "label": 0
            })

    return new_samples


# ================= MAIN =================
def main():
    data = load_data(INPUT_PATH)
    print(f"Original size: {len(data)}")

    print("Fixing inconsistent labels...")
    cleaned_data = fix_inconsistent_labels(data)

    print("Generating positive samples...")
    pos_samples = generate_positive_pairs(cleaned_data, 1500)

    print("Generating negative samples...")
    neg_samples = generate_negative_pairs(cleaned_data, 1500)

    final_data = cleaned_data + pos_samples + neg_samples

    random.shuffle(final_data)

    print(f"Final dataset size: {len(final_data)}")

    os.makedirs("data", exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2)

    print("Saved cleaned dataset!")


if __name__ == "__main__":
    main()