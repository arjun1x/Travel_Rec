from fastapi import APIRouter

from app.api.routes import auth, destinations, listings, users

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(destinations.router)
api_router.include_router(listings.router)
api_router.include_router(users.router)
