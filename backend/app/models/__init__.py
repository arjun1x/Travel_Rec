# Every model must be imported here so Alembic autogenerate sees it.
from app.models.base import Base
from app.models.booking import Booking
from app.models.destination import Destination
from app.models.interaction import Interaction
from app.models.itinerary import Itinerary
from app.models.listing import Listing
from app.models.review import Review
from app.models.user import User, UserPreference

__all__ = [
    "Base",
    "Booking",
    "Destination",
    "Interaction",
    "Itinerary",
    "Listing",
    "Review",
    "User",
    "UserPreference",
]
