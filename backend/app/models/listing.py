from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.destination import Destination


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(20))  # hotel | apartment | hostel | villa
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text)
    price_per_night: Mapped[float]
    capacity: Mapped[int]
    amenities: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    images: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    rating: Mapped[float] = mapped_column(default=0.0)

    destination: Mapped[Destination] = relationship()
