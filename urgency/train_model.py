import json
import re
import time
import os
import pandas as pd
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score

import joblib  


# ========================= LOGGER =========================
def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


start_total = time.time()


# ========================= LOAD DATA =========================
log("Loading dataset...")
with open('data/complaints.json', 'r') as f:
    data = json.load(f)

df = pd.DataFrame(data)
log(f"Dataset loaded with {len(df)} samples")


# ========================= CLEAN TEXT =========================
def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


log("Cleaning text...")
df['clean_complaint'] = df['complaint'].apply(clean_text)


# ========================= LABEL ENCODING =========================
log("Encoding labels...")
le = LabelEncoder()
df['urgency_label'] = le.fit_transform(df['urgency'])


# ========================= TF-IDF =========================
log("Building TF-IDF features...")
tfidf = TfidfVectorizer(max_features=5000)
X = tfidf.fit_transform(df['clean_complaint'])
y = df['urgency_label']


# ========================= SPLIT =========================
log("Splitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# ========================= TRAIN MODEL =========================
log("Training RandomForest model...")
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)


# ========================= EVALUATION =========================
log("Evaluating model...")
y_pred = model.predict(X_test)

# -------- Metrics --------
accuracy = accuracy_score(y_test, y_pred) * 100
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0) * 100
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0) * 100
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0) * 100

print("\n===== MODEL PERFORMANCE (IN %) =====")
print(f"Accuracy  : {accuracy:.2f}%")
print(f"Precision : {precision:.2f}%")
print(f"Recall    : {recall:.2f}%")
print(f"F1 Score  : {f1:.2f}%")

print("\n===== CLASSIFICATION REPORT =====")
print(classification_report(y_test, y_pred, target_names=le.classes_))

print("===== CONFUSION MATRIX =====")
print(confusion_matrix(y_test, y_pred))


# ========================= SAVE =========================
log("Saving model and artifacts...")
os.makedirs("models", exist_ok=True)

joblib.dump(model, 'models/urgency_model.pkl')
joblib.dump(tfidf, 'models/tfidf_vectorizer.pkl')
joblib.dump(le, 'models/label_encoder.pkl')

log("Model and vectorizer saved successfully")
log(f"TOTAL EXECUTION TIME: {time.time() - start_total:.2f}s")