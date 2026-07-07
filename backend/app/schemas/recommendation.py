from typing import Literal

from pydantic import BaseModel

from app.schemas.destination import DestinationRead
from app.schemas.listing import ListingRead


class RecommendationItem(BaseModel):
    listing: ListingRead
    destination: DestinationRead
    score: float


class RecommendationsResponse(BaseModel):
    items: list[RecommendationItem]


class InteractionCreate(BaseModel):
    listing_id: int
    type: Literal["view", "click", "save", "book"]
