from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    country: Mapped[str] = mapped_column(String(100), index=True)
    lat: Mapped[float]
    lng: Mapped[float]
    description: Mapped[str] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    image_url: Mapped[str | None] = mapped_column(String(500))
    popularity_score: Mapped[float] = mapped_column(default=0.0)
    # dimensionless vector: provider decides the dim (384 local / 1024 voyage);
    # exact scans are fine at this scale, no ANN index needed yet
    embedding: Mapped[list[float] | None] = mapped_column(Vector(), nullable=True)
