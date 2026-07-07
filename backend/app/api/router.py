from fastapi import APIRouter

from app.api.routes import (
    auth,
    bookings,
    destinations,
    interactions,
    listings,
    recommendations,
    users,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(bookings.router)
api_router.include_router(destinations.router)
api_router.include_router(interactions.router)
api_router.include_router(listings.router)
api_router.include_router(recommendations.router)
api_router.include_router(users.router)
