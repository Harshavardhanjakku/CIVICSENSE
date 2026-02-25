import json
import random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sentence_transformers import SentenceTransformer
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset
with open("data\duplicates_dataset.json", "r") as f:
    data = json.load(f)

random.shuffle(data)
split_ratio = 0.8
split_idx = int(len(data) * split_ratio)
train_data = data[:split_idx]
test_data = data[split_idx:]

# TF-IDF Vectorizer
all_sentences = [d["complaint1"] for d in data] + [d["complaint2"] for d in data]
tfidf = TfidfVectorizer().fit(all_sentences)

# BERT Model
bert_model = SentenceTransformer('all-MiniLM-L6-v2')

def tfidf_similarity(c1, c2):
    v1 = tfidf.transform([c1])
    v2 = tfidf.transform([c2])
    return cosine_similarity(v1, v2)[0][0]

def bert_similarity(c1, c2):
    v1 = bert_model.encode([c1])[0]
    v2 = bert_model.encode([c2])[0]
    return cosine_similarity([v1], [v2])[0][0]

def hybrid_predict(c1, c2, tfidf_threshold=0.3, bert_threshold=0.75):
    sim_tfidf = tfidf_similarity(c1, c2)
    
    # Step 1: Quick reject using TF-IDF
    if sim_tfidf < tfidf_threshold:
        return 0  # not duplicate
    
    # Step 2: Confirm with BERT
    sim_bert = bert_similarity(c1, c2)
    return 1 if sim_bert >= bert_threshold else 0

# Evaluate
y_true, y_pred = [], []
for d in test_data:
    y_true.append(d["label"])
    y_pred.append(hybrid_predict(d["complaint1"], d["complaint2"]))

acc = accuracy_score(y_true, y_pred)
prec = precision_score(y_true, y_pred)
rec = recall_score(y_true, y_pred)
f1 = f1_score(y_true, y_pred)

# Plot Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["Not Duplicate", "Duplicate"], yticklabels=["Not Duplicate", "Duplicate"])
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("True")
plt.show()

# Plot Precision, Recall, F1-score
metrics = [prec, rec, f1]
metric_names = ["Precision", "Recall", "F1-score"]

plt.figure(figsize=(8, 5))
sns.barplot(x=metric_names, y=metrics, palette="viridis")
plt.title("Model Performance Metrics")
plt.ylabel("Score")
plt.ylim(0, 1) # Ensure y-axis is from 0 to 1
plt.show()

# Save trained model
bert_model.save("duplicate_model")
