import json
import random
import time
import os
import numpy as np
from datetime import datetime
from typing import List, Dict

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, accuracy_score
from sentence_transformers import SentenceTransformer
import joblib


# ========================= LOGGER =========================
def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


# ========================= DATA =========================
def load_data(path: str) -> List[Dict]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Dataset must be a list")

    return data


def split_data(data: List[Dict], ratio=0.8, seed=42):
    random.seed(seed)
    data_copy = data.copy()
    random.shuffle(data_copy)
    split_idx = int(len(data_copy) * ratio)
    return data_copy[:split_idx], data_copy[split_idx:]


# ========================= CLEANING =========================
def clean_text(text: str) -> str:
    if not text:
        return ""
    return text.lower().strip()


def validate_record(d: Dict):
    return "complaint1" in d and "complaint2" in d and "label" in d


# 🔥 FIX LABEL ERRORS
def force_fix(data):
    fixed = []
    for d in data:
        c1 = clean_text(d["complaint1"])
        c2 = clean_text(d["complaint2"])

        label = 1 if c1 == c2 else d["label"]

        fixed.append({
            "complaint1": d["complaint1"],
            "complaint2": d["complaint2"],
            "label": label
        })
    return fixed


# 🔥 REMOVE DUPLICATES
def remove_duplicates(data):
    seen = set()
    unique = []

    for d in data:
        key = tuple(sorted([clean_text(d["complaint1"]), clean_text(d["complaint2"])]))
        if key not in seen:
            seen.add(key)
            unique.append(d)

    return unique


# ========================= TF-IDF =========================
def build_tfidf(train_data):
    texts = [clean_text(d["complaint1"]) for d in train_data] + \
            [clean_text(d["complaint2"]) for d in train_data]

    vectorizer = TfidfVectorizer(max_features=5000)
    vectorizer.fit(texts)

    return vectorizer


def tfidf_sim(vectorizer, c1_list, c2_list):
    v1 = vectorizer.transform(c1_list)
    v2 = vectorizer.transform(c2_list)
    return (v1.multiply(v2)).sum(axis=1).A1


# ========================= SBERT =========================
def compute_embeddings(model, texts):
    return model.encode(
        texts,
        batch_size=64,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=True
    )


def bert_sim(emb1, emb2):
    return np.sum(emb1 * emb2, axis=1)


# ========================= HYBRID (UPGRADED) =========================
def weighted_predict(tfidf_sim, bert_sim, w1, w2, threshold):
    score = (w1 * tfidf_sim) + (w2 * bert_sim)
    return (score >= threshold).astype(int)


# ========================= OPTIMIZATION =========================
def optimize(y_true, tfidf_s, bert_s):
    best_f1 = -1
    best_params = None

    # weights + threshold search
    for w1 in [0.3, 0.5, 0.7]:
        for w2 in [0.3, 0.5, 0.7]:
            if abs((w1 + w2) - 1.0) > 0.2:
                continue

            for th in np.linspace(0.4, 0.8, 20):
                preds = weighted_predict(tfidf_s, bert_s, w1, w2, th)
                f1 = f1_score(y_true, preds, zero_division=0)

                if f1 > best_f1:
                    best_f1 = f1
                    best_params = (w1, w2, th)

    log(f"Best weights: TF-IDF={best_params[0]:.2f}, BERT={best_params[1]:.2f}")
    log(f"Best threshold: {best_params[2]:.3f}")
    log(f"Best F1: {best_f1:.4f}")

    return best_params


# ========================= EVALUATE =========================
def evaluate(y_true, y_pred, name):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    print(f"\n===== {name} =====")
    print(f"Accuracy  : {acc:.4f}")
    print(f"Precision : {prec:.4f}")
    print(f"Recall    : {rec:.4f}")
    print(f"F1 Score  : {f1:.4f}")
    print("Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))

    return f1


# ========================= MAIN =========================
def main():
    start_total = time.time()

    log("Loading dataset...")
    data = load_data("data/duplicate_dataset.json")

    data = [d for d in data if validate_record(d)]

    # cleaning fixes
    data = force_fix(data)
    data = remove_duplicates(data)

    log(f"After cleaning: {len(data)} samples")

    train_data, test_data = split_data(data)

    # prepare text
    train_c1 = [clean_text(d["complaint1"]) for d in train_data]
    train_c2 = [clean_text(d["complaint2"]) for d in train_data]
    test_c1 = [clean_text(d["complaint1"]) for d in test_data]
    test_c2 = [clean_text(d["complaint2"]) for d in test_data]

    y_train = np.array([d["label"] for d in train_data])
    y_test = np.array([d["label"] for d in test_data])

    # TF-IDF
    log("Building TF-IDF...")
    tfidf = build_tfidf(train_data)

    tfidf_train = tfidf_sim(tfidf, train_c1, train_c2)
    tfidf_test = tfidf_sim(tfidf, test_c1, test_c2)

    # SBERT
    log("Loading SBERT...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    log("Computing embeddings...")
    emb1_train = compute_embeddings(model, train_c1)
    emb2_train = compute_embeddings(model, train_c2)
    emb1_test = compute_embeddings(model, test_c1)
    emb2_test = compute_embeddings(model, test_c2)

    bert_train = bert_sim(emb1_train, emb2_train)
    bert_test = bert_sim(emb1_test, emb2_test)

    # BASELINE
    baseline_preds = weighted_predict(tfidf_test, bert_test, 0.5, 0.5, 0.6)
    evaluate(y_test, baseline_preds, "BASELINE")

    # OPTIMIZE
    log("Optimizing...")
    w1, w2, th = optimize(y_train, tfidf_train, bert_train)

    final_preds = weighted_predict(tfidf_test, bert_test, w1, w2, th)
    evaluate(y_test, final_preds, "FINAL MODEL")

    # SAVE
    save_path = "duplicate_model"
    os.makedirs(save_path, exist_ok=True)

    model.save(os.path.join(save_path, "sbert"))
    joblib.dump(tfidf, os.path.join(save_path, "tfidf.pkl"))

    config = {
        "w1": float(w1),
        "w2": float(w2),
        "threshold": float(th)
    }

    with open(os.path.join(save_path, "config.json"), "w") as f:
        json.dump(config, f, indent=4)

    log(f"TOTAL TIME: {time.time() - start_total:.2f}s")


if __name__ == "__main__":
    main()