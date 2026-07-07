from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Booking, Interaction, Listing, User
from app.schemas.booking import BookingCreate
from app.services.recommendations import invalidate_feed

ACTIVE_STATUSES = ("held", "confirmed")


class BookingError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def create_booking(db: AsyncSession, user: User, payload: BookingCreate) -> Booking:
    listing = (
        await db.execute(
            select(Listing)
            .where(Listing.id == payload.listing_id)
            .options(selectinload(Listing.destination))
        )
    ).scalar_one_or_none()
    if listing is None:
        raise BookingError("Listing not found", 404)
    if payload.check_out <= payload.check_in:
        raise BookingError("Check-out must be after check-in")
    if payload.check_in < date.today():
        raise BookingError("Check-in cannot be in the past")
    if payload.guests > listing.capacity:
        raise BookingError(f"This stay sleeps at most {listing.capacity} guests")

    overlap = (
        await db.execute(
            select(Booking.id).where(
                Booking.listing_id == listing.id,
                Booking.status.in_(ACTIVE_STATUSES),
                Booking.check_in < payload.check_out,
                Booking.check_out > payload.check_in,
            )
        )
    ).first()
    if overlap:
        raise BookingError("This stay is already booked for those dates", 409)

    nights = (payload.check_out - payload.check_in).days
    booking = Booking(
        user_id=user.id,
        listing_id=listing.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        status="held",
        total_price=round(nights * listing.price_per_night, 2),
    )
    db.add(booking)
    db.add(Interaction(user_id=user.id, listing_id=listing.id, type="book"))
    await db.commit()
    await db.refresh(booking)
    await invalidate_feed(user.id)
    return booking


async def transition(db: AsyncSession, user: User, booking_id: int, action: str) -> Booking:
    booking = (
        await db.execute(
            select(Booking).where(Booking.id == booking_id, Booking.user_id == user.id)
        )
    ).scalar_one_or_none()
    if booking is None:
        raise BookingError("Booking not found", 404)

    if action == "confirm":
        if booking.status != "held":
            raise BookingError(f"Cannot confirm a {booking.status} booking", 409)
        booking.status = "confirmed"
    elif action == "cancel":
        if booking.status not in ACTIVE_STATUSES:
            raise BookingError(f"Cannot cancel a {booking.status} booking", 409)
        booking.status = "cancelled"
    else:  # pragma: no cover
        raise BookingError("Unknown action")

    await db.commit()
    await db.refresh(booking)
    return booking


async def list_bookings(db: AsyncSession, user: User) -> list[tuple[Booking, Listing]]:
    rows = await db.execute(
        select(Booking, Listing)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Booking.user_id == user.id)
        .options(selectinload(Listing.destination))
        .order_by(Booking.created_at.desc())
    )
    return [(booking, listing) for booking, listing in rows]
