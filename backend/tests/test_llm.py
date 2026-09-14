import pytest

from app.schemas.itinerary import ItineraryPlan
from app.services.llm import (
    LlmNotConfiguredError,
    _reconcile_budget,
    build_itinerary_prompt,
    get_client,
)
from app.models import Destination


def _destination() -> Destination:
    return Destination(
        id=2,
        name="Kyoto",
        country="Japan",
        lat=35.0116,
        lng=135.7681,
        description="Japan's ancient capital.",
        tags=["culture", "temples"],
        popularity_score=0.9,
    )


def test_plan_schema_is_strict() -> None:
    schema = ItineraryPlan.model_json_schema()
    assert schema["additionalProperties"] is False
    for definition in schema.get("$defs", {}).values():
        assert definition["additionalProperties"] is False


def test_plan_validates_good_json() -> None:
    plan = ItineraryPlan.model_validate_json(
        '{"days":[{"date":"2026-08-01","title":"Temples","activities":'
        '[{"time":"09:00","name":"Fushimi Inari","description":"Shrine hike",'
        '"estimated_cost_usd":0,"lat":34.9671,"lng":135.7727}]}],'
        '"budget_total_usd":0,"budget_tips":["Walk everywhere"]}'
    )
    assert plan.days[0].activities[0].name == "Fushimi Inari"


def test_plan_rejects_extra_keys() -> None:
    with pytest.raises(ValueError):
        ItineraryPlan.model_validate(
            {"days": [], "budget_total_usd": 0, "budget_tips": [], "surprise": 1}
        )


def test_prompt_includes_all_context() -> None:
    prompt = build_itinerary_prompt(
        _destination(), "2026-08-01", "2026-08-04", ["food", "temples"], 900, "2026-08-01: 20-30°C"
    )
    assert "Kyoto, Japan" in prompt
    assert "2026-08-01 to 2026-08-04" in prompt
    assert "food, temples" in prompt
    assert "$900" in prompt
    assert "Weather forecast" in prompt


def test_get_client_requires_key(monkeypatch) -> None:
    from app.core import config
    from app.services import llm as llm_module

    monkeypatch.setattr(config.settings, "anthropic_api_key", None)
    monkeypatch.setattr(llm_module, "_client", None)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    with pytest.raises(LlmNotConfiguredError):
        get_client()


def test_budget_total_is_derived_from_activities() -> None:
    plan = ItineraryPlan.model_validate(
        {
            "days": [
                {"date": "2026-08-01", "title": "A", "activities": [
                    {"time": "09:00", "name": "x", "description": "d", "estimated_cost_usd": 12.5},
                    {"time": "12:00", "name": "y", "description": "d", "estimated_cost_usd": 30},
                ]},
                {"date": "2026-08-02", "title": "B", "activities": [
                    {"time": "09:00", "name": "z", "description": "d", "estimated_cost_usd": 7.25},
                ]},
            ],
            "budget_total_usd": 999,  # whatever the model claimed
            "budget_tips": [],
        }
    )
    assert _reconcile_budget(plan).budget_total_usd == 49.75
