from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models import User
from app.schemas.booking import BookingCreate, BookingDetail, BookingRead
from app.services import bookings as service
from app.services.bookings import BookingError

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _detail(booking, listing) -> BookingDetail:
    return BookingDetail(
        id=booking.id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.guests,
        status=booking.status,
        total_price=booking.total_price,
        created_at=booking.created_at,
        listing=listing,
        destination=listing.destination,
    )


@router.post("", response_model=BookingRead, status_code=201)
async def create_booking(
    payload: BookingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingRead:
    try:
        return await service.create_booking(db, user, payload)
    except BookingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("", response_model=list[BookingDetail])
async def list_bookings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BookingDetail]:
    rows = await service.list_bookings(db, user)
    return [_detail(booking, listing) for booking, listing in rows]


@router.post("/{booking_id}/confirm", response_model=BookingRead)
async def confirm_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingRead:
    try:
        return await service.transition(db, user, booking_id, "confirm")
    except BookingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/{booking_id}/cancel", response_model=BookingRead)
async def cancel_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingRead:
    try:
        return await service.transition(db, user, booking_id, "cancel")
    except BookingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
