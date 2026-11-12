"""Recommendation history (Stages 4 and 6)."""

from tests.conftest import register_and_login


def test_logged_in_recommendations_are_saved_newest_first(client, auth_headers):
    client.post("/api/recommendations", json={"mood": "tired", "preferences": [], "choice": "cook"}, headers=auth_headers)
    client.post("/api/recommendations", json={"mood": "happy", "preferences": [], "choice": "cook"}, headers=auth_headers)
    history = client.get("/api/history", headers=auth_headers).get_json()["history"]
    assert [entry["mood"] for entry in history] == ["happy", "tired"]


def test_guests_are_not_saved(client, auth_headers):
    client.post("/api/recommendations", json={"mood": "tired", "preferences": [], "choice": "cook"})
    assert client.get("/api/history", headers=auth_headers).get_json()["history"] == []


def test_same_request_twice_is_one_session(client, auth_headers):
    body = {"mood": "sad", "preferences": ["comfort"], "choice": "either"}
    client.post("/api/recommendations", json=body, headers=auth_headers)
    client.post("/api/recommendations", json=body, headers=auth_headers)
    assert len(client.get("/api/history", headers=auth_headers).get_json()["history"]) == 1


def test_typed_message_is_saved_without_personal_info(client, auth_headers):
    message = "I'm tired, email me at me@mail.com or 416-555-0199, want something warm under $15"
    client.post("/api/ai/recommend", json={"message": message}, headers=auth_headers)
    entry = client.get("/api/history", headers=auth_headers).get_json()["history"][0]
    assert entry["source"] == "smart"
    assert "me@mail.com" not in entry["originalMessage"]
    assert "416-555-0199" not in entry["originalMessage"]


def test_users_cannot_see_or_delete_each_others_history(client):
    alice = register_and_login(client, "alice@example.com")
    bob = register_and_login(client, "bob@example.com")
    client.post("/api/recommendations", json={"mood": "happy", "preferences": [], "choice": "cook"}, headers=alice)
    entry_id = client.get("/api/history", headers=alice).get_json()["history"][0]["id"]
    assert client.get("/api/history", headers=bob).get_json()["history"] == []
    assert client.delete(f"/api/history/{entry_id}", headers=bob).status_code == 404
