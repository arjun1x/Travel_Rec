"""API integration tests — run against the app with the local dev database.

Skipped automatically when Postgres isn't reachable (e.g. docker compose down),
so `uv run pytest` stays green in any environment.
"""

import uuid

import httpx
import pytest
from sqlalchemy import text

from app.core.db import engine
from app.main import app


async def _db_available() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@pytest.fixture
async def client():
    if not await _db_available():
        pytest.skip("database not available")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    # each test runs in its own event loop — drop pooled connections bound to it
    await engine.dispose()


async def test_destinations_list_and_detail(client) -> None:
    listed = await client.get("/api/destinations?limit=5")
    assert listed.status_code == 200
    items = listed.json()
    assert len(items) == 5
    first = items[0]

    detail = await client.get(f"/api/destinations/{first['id']}")
    assert detail.status_code == 200
    assert detail.json()["name"] == first["name"]

    missing = await client.get("/api/destinations/999999")
    assert missing.status_code == 404


async def test_destination_search(client) -> None:
    res = await client.get("/api/destinations/search?q=kyoto")
    assert res.status_code == 200
    assert any(d["name"] == "Kyoto" for d in res.json())


async def test_listing_filters(client) -> None:
    res = await client.get("/api/listings?type=villa&max_price=400&sort=price_asc&limit=5")
    assert res.status_code == 200
    page = res.json()
    prices = [item["price_per_night"] for item in page["items"]]
    assert all(item["type"] == "villa" for item in page["items"])
    assert all(price <= 400 for price in prices)
    assert prices == sorted(prices)


async def test_register_login_me_flow(client) -> None:
    email = f"it-{uuid.uuid4().hex[:10]}@test.dev"

    registered = await client.post(
        "/api/auth/register",
        json={"email": email, "password": "integration1", "name": "Integration Test"},
    )
    assert registered.status_code == 201
    tokens = registered.json()

    me = await client.get(
        "/api/users/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == email
    assert body["is_admin"] is False

    # non-admins are locked out of admin metrics
    forbidden = await client.get(
        "/api/admin/metrics", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert forbidden.status_code == 403

    # bad password rejected
    bad = await client.post(
        "/api/auth/login", json={"email": email, "password": "wrong-password"}
    )
    assert bad.status_code == 401


async def test_request_id_header(client) -> None:
    res = await client.get("/api/destinations?limit=1")
    assert res.headers.get("X-Request-ID")

    echoed = await client.get(
        "/api/destinations?limit=1", headers={"X-Request-ID": "test-trace-42"}
    )
    assert echoed.headers["X-Request-ID"] == "test-trace-42"
