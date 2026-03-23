import os
import json
import time
import logging
from datetime import datetime

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

from sentence_transformers import SentenceTransformer


# ---------------- LOGGING SETUP ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def log(msg):
    logging.info(msg)


# ---------------- CONFIG ----------------
RANDOM_STATE = 42
MODEL_DIR = "models"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


# ---------------- STEP 1: LOAD DATA ----------------
def load_data(path="data/complaints.json"):
    log("Loading dataset...")
    start = time.time()

    with open(path, "r") as f:
        data = json.load(f)

    df = pd.DataFrame(data)

    log(f"Loaded {len(df)} records in {time.time() - start:.2f}s")
    return df


# ---------------- STEP 2: PREPROCESS ----------------
def preprocess(df):
    log("Preprocessing text...")

    # Minimal cleaning (important for embeddings)
    df["complaint"] = df["complaint"].astype(str).str.strip()

    return df


# ---------------- STEP 3: EMBEDDINGS ----------------
def load_embedding_model():
    log(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def embed_text(model, texts, batch_size=32):
    log("Generating embeddings...")
    start = time.time()

    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True
    )

    log(f"Embeddings generated in {time.time() - start:.2f}s")
    return embeddings


# ---------------- STEP 4: TRAIN MODEL ----------------
def train_model(X, y):
    log("Training model with cross-validation...")

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=RANDOM_STATE
    )

    # Cross-validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    cv_scores = cross_val_score(
        model, X, y,
        cv=skf,
        scoring="f1_weighted"
    )

    log(f"CV F1 Scores: {cv_scores}")
    log(f"Mean CV F1: {np.mean(cv_scores):.4f}")

    # Final training
    model.fit(X, y)

    return model


# ---------------- STEP 5: EVALUATION ----------------
def evaluate_model(model, X_test, y_test, label_names):
    log("Evaluating model...")

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    print("\n===== RESULTS =====")
    print(f"Accuracy: {accuracy:.4f}")

    print("\n===== CLASSIFICATION REPORT =====")
    print(classification_report(y_test, y_pred, target_names=label_names))


# ---------------- STEP 6: SAVE ARTIFACTS ----------------
def save_artifacts(model, embedding_model_name):
    log("Saving artifacts...")

    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, os.path.join(MODEL_DIR, "urgency_model.pkl"))

    # Save metadata (important for reload)
    metadata = {
        "embedding_model": embedding_model_name
    }

    joblib.dump(metadata, os.path.join(MODEL_DIR, "metadata.pkl"))

    log("Artifacts saved successfully.")


# ---------------- MAIN PIPELINE ----------------
def main():
    start_total = time.time()

    # Load
    df = load_data()

    # Preprocess
    df = preprocess(df)

    # Encode labels
    labels = df["urgency"].astype("category")
    y = labels.cat.codes
    label_names = list(labels.cat.categories)

    # Split BEFORE embeddings (avoid leakage)
    X_train_text, X_test_text, y_train, y_test = train_test_split(
        df["complaint"],
        y,
        test_size=0.2,
        stratify=y,
        random_state=RANDOM_STATE
    )

    # Load embedding model
    embedding_model = load_embedding_model()

    # Generate embeddings
    X_train = embed_text(embedding_model, X_train_text.tolist())
    X_test = embed_text(embedding_model, X_test_text.tolist())

    # Train
    model = train_model(X_train, y_train)

    # Evaluate
    evaluate_model(model, X_test, y_test, label_names)

    # Save
    save_artifacts(model, EMBEDDING_MODEL_NAME)

    log(f"TOTAL EXECUTION TIME: {time.time() - start_total:.2f}s")


if __name__ == "__main__":
    main()