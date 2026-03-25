import json
import random
import time
import os
import numpy as np
from datetime import datetime
from typing import List, Tuple, Dict

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
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
        raise ValueError("Dataset must be a list of records")

    return data


def split_data(data: List[Dict], ratio=0.8, seed=42):
    random.seed(seed)
    data_copy = data.copy()
    random.shuffle(data_copy)
    split_idx = int(len(data_copy) * ratio)
    return data_copy[:split_idx], data_copy[split_idx:]


# ========================= CLEANING =========================
def clean_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    return text.strip().lower()


def validate_record(d: Dict):
    return (
        "complaint1" in d and
        "complaint2" in d and
        "label" in d
    )


# 🔥 FIX WRONG LABELS
def force_fix(data):
    fixed = []
    for d in data:
        c1 = clean_text(d["complaint1"])
        c2 = clean_text(d["complaint2"])

        if c1 == c2:
            label = 1
        else:
            label = d["label"]

        fixed.append({
            "complaint1": d["complaint1"],
            "complaint2": d["complaint2"],
            "label": label
        })

    return fixed


# 🔥 REMOVE DUPLICATE PAIRS
def remove_duplicates(data):
    seen = set()
    unique = []

    for d in data:
        key = tuple(sorted([d["complaint1"], d["complaint2"]]))
        if key not in seen:
            seen.add(key)
            unique.append(d)

    return unique


# ========================= TF-IDF =========================
def build_tfidf(train_data: List[Dict], test_data: List[Dict]):
    train_texts = [clean_text(d["complaint1"]) for d in train_data] + \
                  [clean_text(d["complaint2"]) for d in train_data]

    vectorizer = TfidfVectorizer(max_features=5000)
    vectorizer.fit(train_texts)

    def transform(data):
        c1 = vectorizer.transform([clean_text(d["complaint1"]) for d in data])
        c2 = vectorizer.transform([clean_text(d["complaint2"]) for d in data])
        return c1, c2

    return vectorizer, transform(train_data), transform(test_data)


# ========================= SBERT =========================
def compute_embeddings(model, texts: List[str], batch_size=64):
    return model.encode(
        texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        show_progress_bar=True,
        normalize_embeddings=True
    )


def build_sbert_embeddings(model, data: List[Dict]):
    texts1 = [clean_text(d["complaint1"]) for d in data]
    texts2 = [clean_text(d["complaint2"]) for d in data]

    emb1 = compute_embeddings(model, texts1)
    emb2 = compute_embeddings(model, texts2)

    return emb1, emb2


# ========================= SIMILARITY =========================
def compute_similarity(tfidf_c1, tfidf_c2, emb1, emb2):
    tfidf_sim = cosine_similarity(tfidf_c1, tfidf_c2).diagonal()
    bert_sim = np.sum(emb1 * emb2, axis=1)
    return tfidf_sim, bert_sim


# ========================= THRESHOLD =========================
def optimize_thresholds(y_true, tfidf_sim, bert_sim):
    best_f1 = -1
    best_params = (0.0, 0.0)

    for t_tfidf in np.linspace(0.1, 0.5, 10):
        for t_bert in np.linspace(0.5, 0.9, 10):
            preds = ((tfidf_sim >= t_tfidf) | (bert_sim >= t_bert)).astype(int)

            f1 = f1_score(y_true, preds, zero_division=0)

            if f1 > best_f1:
                best_f1 = f1
                best_params = (t_tfidf, t_bert)

    log(f"Best TF-IDF Threshold: {best_params[0]:.3f}")
    log(f"Best BERT Threshold  : {best_params[1]:.3f}")
    log(f"Best F1 Score        : {best_f1:.4f}")

    return best_params


# ========================= PREDICT =========================
def predict(tfidf_sim, bert_sim, tfidf_th, bert_th):
    return ((tfidf_sim >= tfidf_th) | (bert_sim >= bert_th)).astype(int)


# ========================= EVALUATE =========================
def evaluate(y_true, y_pred, title="Model"):
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n===== {title} =====")
    print(f"Accuracy  : {accuracy:.4f}")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1 Score  : {f1:.4f}")
    print("Confusion Matrix:")
    print(cm)

    return accuracy, precision, recall, f1


# ========================= MAIN =========================
def main():
    start_total = time.time()

    log("Loading dataset...")
    data = load_data("data/duplicate_dataset.json")

    data = [d for d in data if validate_record(d)]

    # 🔥 APPLY FIXES
    data = force_fix(data)
    data = remove_duplicates(data)

    log(f"After cleaning: {len(data)} samples")

    train_data, test_data = split_data(data)

    log("Building TF-IDF...")
    tfidf, (tfidf_c1_train, tfidf_c2_train), (tfidf_c1_test, tfidf_c2_test) = build_tfidf(train_data, test_data)

    log("Loading SBERT...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    log("Computing embeddings...")
    emb1_train, emb2_train = build_sbert_embeddings(model, train_data)
    emb1_test, emb2_test = build_sbert_embeddings(model, test_data)

    log("Computing similarity...")
    tfidf_train, bert_train = compute_similarity(tfidf_c1_train, tfidf_c2_train, emb1_train, emb2_train)
    tfidf_test, bert_test = compute_similarity(tfidf_c1_test, tfidf_c2_test, emb1_test, emb2_test)

    y_train = np.array([d["label"] for d in train_data])
    y_test = np.array([d["label"] for d in test_data])

    # BASELINE
    baseline_preds = predict(tfidf_test, bert_test, 0.2, 0.6)
    evaluate(y_test, baseline_preds, "BEFORE OPTIMIZATION")

    # OPTIMIZE
    log("Optimizing thresholds...")
    best_tfidf, best_bert = optimize_thresholds(y_train, tfidf_train, bert_train)

    # FINAL
    final_preds = predict(tfidf_test, bert_test, best_tfidf, best_bert)
    evaluate(y_test, final_preds, "AFTER OPTIMIZATION")

    # SAVE
    save_path = "duplicate_model"
    os.makedirs(save_path, exist_ok=True)

    model.save(os.path.join(save_path, "sbert"))
    joblib.dump(tfidf, os.path.join(save_path, "tfidf.pkl"))

    config = {
        "tfidf_threshold": float(best_tfidf),
        "bert_threshold": float(best_bert)
    }

    with open(os.path.join(save_path, "config.json"), "w") as f:
        json.dump(config, f, indent=4)

    log(f"TOTAL TIME: {time.time() - start_total:.2f}s")


if __name__ == "__main__":
    main()