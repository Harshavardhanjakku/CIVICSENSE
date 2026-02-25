from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os

# Define request format
class ComplaintRequest(BaseModel):
    Complaint: str
    Location: str

# Initialize FastAPI
app = FastAPI(title="Urgency Analyzer API")

# Load models
MODEL_PATH = os.path.join("app", "models", "urgency_model.pkl")
VECTORIZER_PATH = os.path.join("app", "models", "tfidf_vectorizer.pkl")
ENCODER_PATH = os.path.join("app", "models", "label_encoder.pkl")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)
label_encoder = joblib.load(ENCODER_PATH)

@app.get("/")
def home():
    return {"message": "Urgency Analyzer API is running!"}

@app.post("/predict")
def predict_urgency(data: ComplaintRequest):
    # Step 1: Transform complaint text into TF-IDF vector
    X = vectorizer.transform([data.Complaint])
    
    # Step 2: Predict urgency (numerical)
    y_pred = model.predict(X)[0]
    
    # Step 3: Convert number back to label
    urgency_label = label_encoder.inverse_transform([y_pred])[0]

    return {
        "Urgency": urgency_label,
    }
