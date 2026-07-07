from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.destination import DestinationRead
from app.schemas.listing import ListingRead


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=20)


class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    check_in: date
    check_out: date
    guests: int
    status: str
    total_price: float
    created_at: datetime


class BookingDetail(BookingRead):
    listing: ListingRead
    destination: DestinationRead
