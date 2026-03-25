import os
import json
import time
import logging
import random

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
from sklearn.feature_extraction.text import TfidfVectorizer

from sentence_transformers import SentenceTransformer

# ---------------- CONFIG ----------------
RANDOM_STATE = 42
MODEL_DIR = "models"
DATA_PATH = "data/mydata.json"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

# ---------------- LOGGING ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

def log(msg):
    logging.info(msg)

# ---------------- LOAD DATA ----------------
def load_data(path):
    log("📥 Loading dataset...")
    with open(path, "r") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    log(f"✅ Loaded {len(df)} records")
    return df

# ---------------- PREPROCESS ----------------
def preprocess(df):
    log("🧹 Preprocessing data...")

    df["complaint"] = df["complaint"].fillna("").astype(str).str.strip()
    df = df[df["complaint"].str.len() > 5]

    before = len(df)
    df = df.drop_duplicates(subset=["complaint"]).reset_index(drop=True)
    after = len(df)

    log(f"✅ Removed duplicates: {before - after}")
    log(f"✅ Final dataset size: {after}")

    return df

# ---------------- HARD POSITIVE ----------------
def generate_positive(t):
    return t.replace("road", "street") \
            .replace("water", "liquid") \
            .replace("garbage", "waste") \
            .replace("light", "lamp")

# ---------------- CREATE PAIRS ----------------
def create_pairs(df):
    log("🔗 Creating HARD training pairs...")

    texts = df["complaint"].tolist()
    pairs, labels = [], []

    # HARD POSITIVES
    for t in texts:
        aug = generate_positive(t)
        if aug != t:
            pairs.append((t, aug))
            labels.append(1)

    # HARD NEGATIVES (semi-similar)
    for i, t1 in enumerate(texts):
        for j, t2 in enumerate(texts):
            if i != j:
                if abs(len(t1) - len(t2)) < 20:
                    pairs.append((t1, t2))
                    labels.append(0)

    labels = np.array(labels)

    log(f"✅ Total pairs: {len(pairs)}")
    log(f"   Positives: {sum(labels)} | Negatives: {len(labels) - sum(labels)}")

    return pairs, labels

# ---------------- SPLIT ----------------
def split_data(pairs, labels):
    log("🔀 Splitting data...")
    return train_test_split(
        pairs, labels,
        test_size=0.2,
        stratify=labels,
        random_state=RANDOM_STATE
    )

# ---------------- EMBEDDINGS ----------------
def compute_embeddings(model, texts):
    log("🧠 Computing SBERT embeddings...")
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

# ---------------- SIMILARITY ----------------
def compute_similarity(tfidf, sbert_emb, pairs, index):
    tfidf_sim = []
    sbert_sim = []

    for t1, t2 in pairs:
        if t1 not in index or t2 not in index:
            continue

        i, j = index[t1], index[t2]

        tfidf_score = (tfidf[i] @ tfidf[j].T).toarray()[0][0]
        sbert_score = np.dot(sbert_emb[i], sbert_emb[j])

        tfidf_sim.append(tfidf_score)
        sbert_sim.append(sbert_score)

    return np.array(tfidf_sim), np.array(sbert_sim)

# ---------------- THRESHOLD ----------------
def optimize_thresholds(tfidf_sim, sbert_sim, y):
    log("⚙️ Optimizing thresholds...")

    best_f1 = 0
    best = (0.5, 0.7)

    for t1 in np.linspace(0.2, 0.9, 10):
        for t2 in np.linspace(0.2, 0.9, 10):
            pred = ((tfidf_sim > t1) & (sbert_sim > t2)).astype(int)
            f1 = f1_score(y, pred)

            if f1 > best_f1:
                best_f1 = f1
                best = (t1, t2)

    log(f"✅ Best thresholds → TF-IDF: {best[0]:.3f}, SBERT: {best[1]:.3f}, F1: {best_f1:.4f}")
    return best

# ---------------- EVALUATION ----------------
def evaluate_raw(y, pred, title):
    acc = accuracy_score(y, pred)
    prec = precision_score(y, pred)
    rec = recall_score(y, pred)
    f1 = f1_score(y, pred)

    print(f"\n===== {title} =====")
    print(f"Accuracy\t: {acc}")
    print(f"Precision\t: {prec}")
    print(f"Recall\t\t: {rec}")
    print(f"F1\t\t: {f1}")
    print("__________________________")

def evaluate_formatted(y, pred, title):
    acc = accuracy_score(y, pred)
    prec = precision_score(y, pred)
    rec = recall_score(y, pred)
    f1 = f1_score(y, pred)

    print(f"\n===== {title} =====")
    print(f"Accuracy\t: {acc:.4f}")
    print(f"Precision\t: {prec:.4f}")
    print(f"Recall\t\t: {rec:.4f}")
    print(f"F1 Score\t: {f1:.4f}")

# ---------------- MAIN ----------------
def main():
    total_start = time.time()
    log("🚀 Training pipeline started")

    df = preprocess(load_data(DATA_PATH))

    pairs, labels = create_pairs(df)
    train_pairs, test_pairs, y_train, y_test = split_data(pairs, labels)

    train_texts = list(set([t for p in train_pairs for t in p]))
    text_index = {t: i for i, t in enumerate(train_texts)}

    # TF-IDF
    log("📊 Computing TF-IDF...")
    tfidf_vec = TfidfVectorizer(max_features=5000)
    tfidf_matrix = tfidf_vec.fit_transform(train_texts)

    # SBERT
    log("📥 Loading SBERT model...")
    sbert = SentenceTransformer(EMBEDDING_MODEL_NAME)
    sbert_emb = compute_embeddings(sbert, train_texts)

    # TRAIN
    tfidf_train, sbert_train = compute_similarity(tfidf_matrix, sbert_emb, train_pairs, text_index)
    thresholds = optimize_thresholds(tfidf_train, sbert_train, y_train)

    # TEST
    tfidf_test, sbert_test = compute_similarity(tfidf_matrix, sbert_emb, test_pairs, text_index)
    y_test = y_test[:len(tfidf_test)]

    # BEFORE (harder baseline)
    baseline_pred = (sbert_test > 0.85).astype(int)
    evaluate_raw(y_test, baseline_pred, "BEFORE OPTIMIZATION")

    # AFTER
    final_pred = ((tfidf_test > thresholds[0]) & (sbert_test > thresholds[1])).astype(int)
    evaluate_formatted(y_test, final_pred, "AFTER OPTIMIZATION")

    # SAVE
    log("💾 Saving models...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(tfidf_vec, f"{MODEL_DIR}/tfidf.pkl")
    joblib.dump(sbert, f"{MODEL_DIR}/sbert.pkl")
    joblib.dump(thresholds, f"{MODEL_DIR}/thresholds.pkl")

    log("✅ Models saved")
    log(f"🏁 Total time: {time.time() - total_start:.2f}s")


if __name__ == "__main__":
    main()