"""Embedding providers behind a common interface.

- VoyageProvider: Voyage AI REST API (voyage-3.5), used when VOYAGE_API_KEY is set.
- LocalProvider: sentence-transformers (all-MiniLM-L6-v2, 384-dim), zero-cost dev
  fallback. Heavy deps live in the optional `embeddings` dependency group and are
  imported lazily — the API server never needs them, only scripts/embed.py.
"""

from typing import Protocol

import httpx

from app.core.config import settings


class EmbeddingProvider(Protocol):
    name: str

    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class VoyageProvider:
    name = "voyage-3.5"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.voyageai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {settings.voyage_api_key}"},
                json={"model": "voyage-3.5", "input": texts},
            )
            response.raise_for_status()
            data = response.json()["data"]
        return [item["embedding"] for item in data]


class LocalProvider:
    name = "all-MiniLM-L6-v2"

    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer  # lazy heavy import

        self._model = SentenceTransformer("all-MiniLM-L6-v2")

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return self._model.encode(texts, normalize_embeddings=True).tolist()


def get_provider() -> EmbeddingProvider:
    if settings.voyage_api_key:
        return VoyageProvider()
    return LocalProvider()
