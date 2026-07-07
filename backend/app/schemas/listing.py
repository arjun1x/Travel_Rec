from pydantic import BaseModel, ConfigDict

from app.schemas.destination import DestinationRead


class ListingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    destination_id: int
    type: str
    title: str
    description: str
    price_per_night: float
    capacity: int
    amenities: list[str]
    images: list[str]
    rating: float


class ListingDetail(ListingRead):
    destination: DestinationRead


class ListingsPage(BaseModel):
    items: list[ListingRead]
    total: int
