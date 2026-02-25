from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
import os

# Load your trained duplicate detection model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "duplicate_model")
model = SentenceTransformer(MODEL_PATH)

# FastAPI app
app = FastAPI(title="Duplicate Detection API")


class ExistingComplaint(BaseModel):
    id: str
    text: str


class DuplicateCheckRequest(BaseModel):
    text: str
    existing_complaints: List[ExistingComplaint] = []
    threshold: float = 0.6


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    similarity: float
    matched_id: Optional[str] = None


@app.get("/")
def home():
    return {"message": "Duplicate Detection API is running"}


@app.post("/check", response_model=DuplicateCheckResponse)
def check_duplicate(payload: DuplicateCheckRequest):
    """
    Compare an incoming complaint against previously stored complaints.
    The service is stateless: the caller provides the complaints to compare with.
    """
    if not payload.existing_complaints:
        return DuplicateCheckResponse(is_duplicate=False, similarity=0.0, matched_id=None)

    existing_texts = [item.text for item in payload.existing_complaints]
    embeddings = model.encode(existing_texts + [payload.text], convert_to_tensor=True)

    new_embedding = embeddings[-1]
    existing_embeddings = embeddings[:-1]

    cosine_scores = util.cos_sim(new_embedding, existing_embeddings)
    max_score = float(cosine_scores.max())

    print(f"New Complaint: {payload.text}")
    print(f"Max Similarity Score: {max_score}, Threshold: {payload.threshold}")

    if max_score >= payload.threshold:
        best_match_index = int(cosine_scores.argmax())
        matched_id = payload.existing_complaints[best_match_index].id
        return DuplicateCheckResponse(
            is_duplicate=True,
            similarity=max_score,
            matched_id=matched_id,
        )

    return DuplicateCheckResponse(is_duplicate=False, similarity=max_score, matched_id=None)
