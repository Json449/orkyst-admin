"""
Step 4 — Vectorizer
HuggingFace sentence-transformers embedder wrapped in neo4j-graphrag Embedder interface.
Model: sentence-transformers/all-MiniLM-L6-v2 (384-dim, fully local, no API key needed).
"""

from typing import Any

from neo4j_graphrag.embeddings.base import Embedder
from sentence_transformers import SentenceTransformer


class HuggingFaceEmbedder(Embedder):
    """Local sentence-transformers embedder."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> None:
        self._model = SentenceTransformer(model_name)

    def embed_query(self, text: str, **kwargs: Any) -> list[float]:
        embedding = self._model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
