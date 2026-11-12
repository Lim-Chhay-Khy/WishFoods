"""Favorites belong to one user only (Stage 4)."""

from tests.conftest import food_id, register_and_login


def test_save_list_and_remove_a_favorite(client, auth_headers):
    save = client.post("/api/favorites", json={"food_id": food_id("Chicken Ramen")}, headers=auth_headers)
    assert save.status_code == 201
    assert save.get_json()["message"] == "Saved to Favorites!"

    favorites = client.get("/api/favorites", headers=auth_headers).get_json()["favorites"]
    assert [f["food"]["name"] for f in favorites] == ["Chicken Ramen"]

    favorite_id = favorites[0]["id"]
    assert client.delete(f"/api/favorites/{favorite_id}", headers=auth_headers).status_code == 200
    assert client.get("/api/favorites", headers=auth_headers).get_json()["favorites"] == []


def test_cannot_save_the_same_food_twice(client, auth_headers):
    body = {"food_id": food_id("Chicken Ramen")}
    client.post("/api/favorites", json=body, headers=auth_headers)
    response = client.post("/api/favorites", json=body, headers=auth_headers)
    assert response.status_code == 409
    assert response.get_json()["error"] == "Already in Favorites."


def test_favorite_input_is_validated(client, auth_headers):
    for body in [{}, {"food_id": "4"}, {"food_id": 1, "restaurant_id": 1}, {"place_id": "bad id!"}]:
        assert client.post("/api/favorites", json=body, headers=auth_headers).status_code == 400
    assert client.post("/api/favorites", json={"food_id": 9999}, headers=auth_headers).status_code == 404


def test_users_cannot_see_or_delete_each_others_favorites(client):
    alice = register_and_login(client, "alice@example.com")
    bob = register_and_login(client, "bob@example.com")
    saved = client.post("/api/favorites", json={"food_id": food_id("Fish Amok")}, headers=alice).get_json()

    assert client.get("/api/favorites", headers=bob).get_json()["favorites"] == []
    # Bob guesses Alice's favorite id: it must look like it doesn't exist.
    assert client.delete(f"/api/favorites/{saved['favorite']['id']}", headers=bob).status_code == 404
    assert len(client.get("/api/favorites", headers=alice).get_json()["favorites"]) == 1


def test_favorites_require_login(client):
    assert client.post("/api/favorites", json={"food_id": 1}).status_code == 401
