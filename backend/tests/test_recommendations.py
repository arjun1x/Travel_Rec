from app.services.recommendations import price_fit, tag_affinity


def test_price_fit_neutral_without_budget() -> None:
    assert price_fit(200, None, None) == 0.5


def test_price_fit_inside_budget() -> None:
    assert price_fit(150, 100, 300) == 1.0
    assert price_fit(100, 100, 300) == 1.0
    assert price_fit(300, 100, 300) == 1.0


def test_price_fit_decays_above_budget() -> None:
    just_over = price_fit(330, 100, 300)
    far_over = price_fit(600, 100, 300)
    assert 0 < just_over < 1
    assert far_over < just_over


def test_price_fit_decays_below_min() -> None:
    assert 0 < price_fit(80, 100, 300) < 1


def test_tag_affinity_empty_profile_is_zero() -> None:
    assert tag_affinity(["beach", "island"], {}) == 0.0


def test_tag_affinity_full_overlap_beats_partial() -> None:
    profile = {"beach": 2.0, "island": 1.5, "city": 0.5}
    full = tag_affinity(["beach", "island"], profile)
    partial = tag_affinity(["beach", "history"], profile)
    none = tag_affinity(["history", "temples"], profile)
    assert full > partial > none
    assert 0.0 <= full <= 1.0
