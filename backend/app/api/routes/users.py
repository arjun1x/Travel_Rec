from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models import User, UserPreference
from app.schemas.auth import PreferencesRead, PreferencesUpdate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)) -> UserRead:
    return user


@router.get("/me/preferences", response_model=PreferencesRead)
async def get_preferences(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PreferencesRead:
    prefs = await db.get(UserPreference, user.id)
    if prefs is None:
        return PreferencesRead()
    return prefs


@router.patch("/me/preferences", response_model=PreferencesRead)
async def update_preferences(
    payload: PreferencesUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PreferencesRead:
    prefs = await db.get(UserPreference, user.id)
    if prefs is None:
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
    for key, value in payload.model_dump().items():
        setattr(prefs, key, value)
    await db.commit()
    await db.refresh(prefs)
    return prefs
