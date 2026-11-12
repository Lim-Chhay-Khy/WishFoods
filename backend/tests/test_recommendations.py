"""The recommendation engine (Stages 2–6): filters, scoring, and the API."""

from database import db
from services.nlp_service import parse_message
from services.recommendation_service import clean_answers, rank_foods


def names(recommendations):
    return [food["name"] for food in recommendations]


def test_tired_comfort_quick_cook_ranks_fast_comfort_meals(client):
    body = {"mood": "tired", "preferences": ["comfort"], "choice": "cook", "time": 30, "budget": "any", "dietary": []}
    results = client.post("/api/recommendations", json=body).get_json()["recommendations"]
    assert len(results) == 3
    for food in results:
        assert food["canCook"]  # "cook" never returns restaurant-only food
        assert "comfort" in food["preferences"]
        assert food["cookingTime"] <= 30
    assert "Chicken Fried Rice" in names(results)


def test_vegetarian_returns_no_meat_dishes(client):
    body = {"mood": "happy", "preferences": [], "choice": "either", "dietary": ["vegetarian"]}
    results = client.post("/api/recommendations", json=body).get_json()["recommendations"]
    assert results
    for food in results:
        assert "vegetarian" in food["dietary"]


def test_restaurant_choice_never_returns_home_only_food(client):
    body = {"mood": "sad", "preferences": ["comfort"], "choice": "restaurant", "dietary": []}
    for food in client.post("/api/recommendations", json=body).get_json()["recommendations"]:
        assert food["availableAtRestaurant"]


def test_ingredients_give_chicken_fried_rice_a_strong_match():
    foods = list(db.foods.find().sort("_id", 1))  # with recipes, for ingredient matching
    answers = clean_answers({"mood": None, "preferences": [], "choice": "cook",
                             "ingredients": ["rice", "eggs", "chicken"], "smart": True})
    results = rank_foods(foods, answers)
    assert results[0]["name"] == "Chicken Fried Rice"
    assert sorted(results[0]["matchedIngredients"]) == ["chicken", "eggs", "rice"]


def test_every_result_has_a_reason(client):
    body = {"mood": "stressed", "preferences": ["healthy"], "choice": "either", "dietary": []}
    for food in client.post("/api/recommendations", json=body).get_json()["recommendations"]:
        assert food["reason"]


def test_missing_mood_is_a_bad_request(client):
    response = client.post("/api/recommendations", json={"preferences": ["comfort"]})
    assert response.status_code == 400
    assert "mood" in response.get_json()["error"]


def test_body_must_be_json(client):
    assert client.post("/api/recommendations", data="not json").status_code == 400


def test_surprise_me_needs_no_answers(client):
    results = client.post("/api/recommendations", json={"surprise": True}).get_json()["recommendations"]
    assert len(results) == 3


def test_smart_endpoint_understands_and_recommends(client):
    data = client.post("/api/ai/recommend",
                       json={"message": "I'm happy and want spicy Korean food under $25."}).get_json()
    assert data["understood"] is True
    assert data["parsed_preferences"]["cuisine"] == "Korean"
    assert data["recommendations"][0]["name"] == "Spicy Korean Chicken"


def test_smart_endpoint_keeps_dietary_rules_strict(client):
    data = client.post("/api/ai/recommend", json={"message": "I want vegetarian comfort food."}).get_json()
    for food in data["recommendations"]:
        assert "vegetarian" in food["dietary"]


def test_smart_endpoint_empty_and_nonsense_messages(client):
    assert client.post("/api/ai/recommend", json={"message": "   "}).status_code == 400
    data = client.post("/api/ai/recommend", json={"message": "hello there"}).get_json()
    assert data["understood"] is False


def test_parser_output_flows_into_the_engine():
    foods = list(db.foods.find().sort("_id", 1))
    parsed = parse_message("I want spicy African food")
    results = rank_foods(foods, clean_answers({**parsed, "smart": True}))
    assert all(food["region"] == "Africa" for food in results)
