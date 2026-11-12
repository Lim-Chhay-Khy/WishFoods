"""Foods, recipes, and errors (Stages 3 and 7)."""

from tests.conftest import food_id


def test_get_all_foods(client):
    foods = client.get("/api/foods").get_json()["foods"]
    assert len(foods) == 30
    assert "recipe" not in foods[0]  # the big recipe isn't sent in the list
    assert {food["region"] for food in foods} >= {"East Asia", "Africa", "Latin America", "Europe"}


def test_get_one_food(client):
    response = client.get(f"/api/foods/{food_id('Chicken Fried Rice')}")
    assert response.status_code == 200
    assert response.get_json()["food"]["country"] == "China"


def test_invalid_food_id_returns_404(client):
    response = client.get("/api/foods/9999")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Food not found"}


def test_recipe_has_ingredients_and_instructions(client):
    data = client.get(f"/api/foods/{food_id('Chicken Fried Rice')}/recipe").get_json()
    assert data["recipe"]["ingredients"]
    assert data["recipe"]["instructions"]
    assert data["recipe"]["totalTime"] == data["food"]["cookingTime"]


def test_restaurant_only_food_has_no_recipe(client):
    response = client.get(f"/api/foods/{food_id('Sushi Platter')}/recipe")
    assert response.status_code == 404
    assert response.get_json()["error"] == "Recipe not found"


def test_unknown_route_returns_json_404(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_nearby_without_google_key_falls_back_to_samples(client):
    data = client.get(f"/api/foods/{food_id('Chicken Fried Rice')}/nearby?near=Toronto").get_json()
    assert data["source"] == "sample"
    assert data["restaurants"]


def test_nearby_rejects_bad_location(client):
    response = client.get(f"/api/foods/{food_id('Chicken Fried Rice')}/nearby?lat=abc&lng=1")
    assert response.status_code == 400
