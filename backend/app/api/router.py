from fastapi import APIRouter

from app.api.routes import destinations

api_router = APIRouter(prefix="/api")
api_router.include_router(destinations.router)
