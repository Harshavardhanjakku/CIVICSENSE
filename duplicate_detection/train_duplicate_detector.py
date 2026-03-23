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
    with open(path, "r") as f:
        data = json.load(f)
    return data


def split_data(data: List[Dict], ratio=0.8, seed=42):
    random.seed(seed)
    random.shuffle(data)
    split_idx = int(len(data) * ratio)
    return data[:split_idx], data[split_idx:]


# ========================= CLEANING =========================
def clean_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    return text.strip().lower()


# ========================= TF-IDF =========================
def build_tfidf(data: List[Dict]) -> Tuple[TfidfVectorizer, np.ndarray, np.ndarray]:
    all_texts = [clean_text(d["complaint1"]) for d in data] + \
                [clean_text(d["complaint2"]) for d in data]

    vectorizer = TfidfVectorizer(max_features=5000)
    vectorizer.fit(all_texts)

    tfidf_c1 = vectorizer.transform([clean_text(d["complaint1"]) for d in data])
    tfidf_c2 = vectorizer.transform([clean_text(d["complaint2"]) for d in data])

    return vectorizer, tfidf_c1, tfidf_c2


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
    tfidf_sim = np.array([
        cosine_similarity(tfidf_c1[i], tfidf_c2[i])[0][0]
        for i in range(tfidf_c1.shape[0])
    ])

    bert_sim = np.sum(emb1 * emb2, axis=1)

    return tfidf_sim, bert_sim


# ========================= THRESHOLD OPTIMIZATION =========================
def optimize_thresholds(y_true, tfidf_sim, bert_sim):
    best_f1 = -1
    best_params = (0.0, 0.0)

    tfidf_range = np.linspace(0.1, 0.5, 10)
    bert_range = np.linspace(0.5, 0.9, 10)

    for t_tfidf in tfidf_range:
        mask = tfidf_sim >= t_tfidf

        for t_bert in bert_range:
            preds = np.zeros_like(y_true)
            preds[mask] = (bert_sim[mask] >= t_bert).astype(int)

            f1 = f1_score(y_true, preds)

            if f1 > best_f1:
                best_f1 = f1
                best_params = (t_tfidf, t_bert)

    log(f"Best TF-IDF Threshold: {best_params[0]:.3f}")
    log(f"Best BERT Threshold  : {best_params[1]:.3f}")
    log(f"Best F1 Score        : {best_f1:.4f}")

    return best_params


# ========================= PREDICTION =========================
def predict(tfidf_sim, bert_sim, tfidf_th, bert_th):
    preds = np.zeros_like(tfidf_sim)
    mask = tfidf_sim >= tfidf_th
    preds[mask] = (bert_sim[mask] >= bert_th).astype(int)
    return preds


# ========================= EVALUATION =========================
def evaluate(y_true, y_pred, title="Model"):
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n===== {title} =====")
    print(f"Accuracy  : {accuracy:.4f}")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1 Score  : {f1:.4f}")
    print("Confusion Matrix:")
    print(cm)

    return accuracy, precision, recall, f1


# ========================= BASELINE =========================
def baseline_predict(tfidf_sim, bert_sim):
    return predict(tfidf_sim, bert_sim, 0.2, 0.6)


# ========================= MAIN =========================
def main():
    start_total = time.time()

    log("Loading dataset...")
    data = load_data("data\\duplicates_dataset.json")
    log(f"Loaded {len(data)} samples")

    train_data, test_data = split_data(data)

    log("Building TF-IDF...")
    tfidf, tfidf_c1_all, tfidf_c2_all = build_tfidf(data)

    log("Loading SBERT...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    log("Computing SBERT embeddings...")
    emb1_all, emb2_all = build_sbert_embeddings(model, data)

    log("Computing similarities...")
    tfidf_sim_all, bert_sim_all = compute_similarity(
        tfidf_c1_all, tfidf_c2_all,
        emb1_all, emb2_all
    )

    split_idx = len(train_data)

    tfidf_train = tfidf_sim_all[:split_idx]
    bert_train = bert_sim_all[:split_idx]
    y_train = np.array([d["label"] for d in train_data])

    tfidf_test = tfidf_sim_all[split_idx:]
    bert_test = bert_sim_all[split_idx:]
    y_test = np.array([d["label"] for d in test_data])

    # -------- BASELINE --------
    baseline_preds = baseline_predict(tfidf_test, bert_test)
    evaluate(y_test, baseline_preds, "BEFORE OPTIMIZATION")

    # -------- OPTIMIZATION --------
    log("Optimizing thresholds...")
    best_tfidf, best_bert = optimize_thresholds(y_train, tfidf_train, bert_train)

    # -------- FINAL --------
    final_preds = predict(tfidf_test, bert_test, best_tfidf, best_bert)
    evaluate(y_test, final_preds, "AFTER OPTIMIZATION")

    # -------- SAVE EVERYTHING --------
    log("Saving model and pipeline...")
    os.makedirs("duplicate_model", exist_ok=True)

    model.save("duplicate_model")
    joblib.dump(tfidf, "duplicate_model/tfidf.pkl")

    config = {
        "tfidf_threshold": float(best_tfidf),
        "bert_threshold": float(best_bert)
    }

    with open("duplicate_model/pipeline_config.json", "w") as f:
        json.dump(config, f, indent=4)

    log(f"TOTAL TIME: {time.time() - start_total:.2f}s")


if __name__ == "__main__":
    main()