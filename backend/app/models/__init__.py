# Every model must be imported here so Alembic autogenerate sees it.
from app.models.base import Base
from app.models.destination import Destination

__all__ = ["Base", "Destination"]
