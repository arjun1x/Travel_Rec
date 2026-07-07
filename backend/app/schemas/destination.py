from pydantic import BaseModel, ConfigDict


class DestinationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country: str
    lat: float
    lng: float
    description: str
    tags: list[str]
    image_url: str | None
    popularity_score: float
