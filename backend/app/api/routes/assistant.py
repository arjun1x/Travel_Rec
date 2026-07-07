from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_db
from app.models import User
from app.services import llm

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    if payload.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from the user")

    try:
        llm.get_client()
        await llm.check_rate_limit(user.id, "assistant")
    except llm.LlmNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except llm.RateLimitedError as exc:
        raise HTTPException(status_code=429, detail=str(exc))

    catalog = await llm.build_catalog_context(db)
    history = [{"role": m.role, "content": m.content} for m in payload.messages]

    async def event_stream():
        try:
            async for kind, data in llm.stream_assistant(history, catalog):
                if kind == "delta":
                    yield llm.sse({"type": "delta", "text": data})
                else:
                    await llm.log_usage(db, user, "assistant", settings.llm_model, data)
                    yield llm.sse({"type": "done"})
        except Exception as exc:
            yield llm.sse({"type": "error", "detail": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
