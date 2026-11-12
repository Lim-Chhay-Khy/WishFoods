"""The Stage 6 keyword parser (services/nlp_service.py)."""

from services.nlp_service import parse_message, sanitize_preferences, understood_anything


def test_tired_cheap_and_warm():
    parsed = parse_message("I'm tired and want something cheap and warm.")
    assert parsed["mood"] == "tired"
    assert parsed["budget"] == "$"
    assert "comfort" in parsed["preferences"]
    assert parsed["craving_words"]["comfort"] == "warm"


def test_ingredients_and_time_mean_cook():
    parsed = parse_message("I have chicken, rice and eggs and only 20 minutes.")
    assert sorted(parsed["ingredients"]) == ["chicken", "eggs", "rice"]
    assert parsed["time"] == 30  # "15–30 minutes"
    assert parsed["choice"] == "cook"


def test_dont_want_to_cook_spicy_korean_nearby():
    parsed = parse_message("I don't want to cook. Find me spicy Korean food nearby.")
    assert parsed["choice"] == "restaurant"
    assert "spicy" in parsed["preferences"]
    assert parsed["cuisine"] == "Korean"


def test_budget_amounts():
    assert parse_message("under $15")["budget"] == "$"
    assert parse_message("I have 25 dollars")["budget"] == "$$"
    assert parse_message("up to $40 tonight")["budget"] == "$$$"


def test_negation_is_respected():
    assert "spicy" not in parse_message("nothing spicy please")["preferences"]
    assert parse_message("I'm not vegetarian")["dietary"] == []
    assert "light" in parse_message("I don't want anything too heavy")["preferences"]


def test_dietary_phrases():
    parsed = parse_message("vegan, no seafood and dairy free please")
    assert sorted(parsed["dietary"]) == ["dairy-free", "no-seafood", "vegan"]


def test_nonsense_is_not_understood():
    assert not understood_anything(parse_message("hello there"))


def test_unknown_values_from_outside_are_dropped():
    cleaned = sanitize_preferences({"mood": "angry", "dietary": ["keto", "vegan"], "choice": "fly", "time": True})
    assert cleaned["mood"] is None
    assert cleaned["dietary"] == ["vegan"]
    assert cleaned["choice"] == "either"
    assert cleaned["time"] is None
