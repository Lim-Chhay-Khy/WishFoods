"""Registration, login, and protected routes (Stage 4)."""

from database import db
from tests.conftest import register_and_login


def test_register_creates_account(client):
    response = client.post("/api/auth/register",
                           json={"name": "Jackie", "email": "jackie@example.com", "password": "examplePassword"})
    assert response.status_code == 201
    assert response.get_json() == {"message": "Account created successfully"}


def test_password_is_stored_as_hash_not_plain_text(client):
    client.post("/api/auth/register", json={"name": "J", "email": "j@example.com", "password": "examplePassword"})
    user = db.users.find_one({"email": "j@example.com"})
    assert user["password_hash"] != "examplePassword"
    assert "examplePassword" not in user["password_hash"]


def test_duplicate_email_is_rejected(client):
    body = {"name": "Jackie", "email": "jackie@example.com", "password": "examplePassword"}
    client.post("/api/auth/register", json=body)
    response = client.post("/api/auth/register", json={**body, "email": "JACKIE@example.com "})
    assert response.status_code == 409
    assert response.get_json()["error"] == "An account with this email already exists"


def test_register_validates_input(client):
    bad_bodies = [
        {"name": "", "email": "a@b.co", "password": "12345678"},  # empty name
        {"name": "A", "email": "not-an-email", "password": "12345678"},  # bad email
        {"name": "A", "email": "a@b.co", "password": "short"},  # short password
    ]
    for body in bad_bodies:
        assert client.post("/api/auth/register", json=body).status_code == 400


def test_login_success_returns_token_but_never_the_hash(client):
    client.post("/api/auth/register", json={"name": "J", "email": "j@example.com", "password": "examplePassword"})
    response = client.post("/api/auth/login", json={"email": "j@example.com", "password": "examplePassword"})
    data = response.get_json()
    assert response.status_code == 200
    assert data["token"]
    assert data["user"]["email"] == "j@example.com"
    assert "password_hash" not in str(data)


def test_wrong_password_and_unknown_email_get_the_same_message(client):
    client.post("/api/auth/register", json={"name": "J", "email": "j@example.com", "password": "examplePassword"})
    wrong_password = client.post("/api/auth/login", json={"email": "j@example.com", "password": "wrongPassword"})
    unknown_email = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "examplePassword"})
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.get_json() == unknown_email.get_json() == {"error": "Incorrect email or password."}


def test_protected_routes_need_a_token(client):
    for path in ["/api/favorites", "/api/history", "/api/profile", "/api/auth/me"]:
        response = client.get(path)
        assert response.status_code == 401
        assert response.get_json() == {"error": "Authentication required"}


def test_fake_token_is_rejected(client):
    response = client.get("/api/profile", headers={"Authorization": "Bearer not.a.real.token"})
    assert response.status_code == 401


def test_me_returns_the_logged_in_user(client):
    headers = register_and_login(client, "me@example.com")
    assert client.get("/api/auth/me", headers=headers).get_json()["user"]["email"] == "me@example.com"


def test_huge_request_body_is_rejected(client):
    huge = {"name": "A", "email": "a@example.com", "password": "x" * 200_000}
    response = client.post("/api/auth/register", json=huge)
    assert response.status_code == 413
    assert "error" in response.get_json()


def test_responses_have_security_headers(client):
    response = client.get("/api/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"


def test_demo_account_needs_a_password_from_env(monkeypatch, capsys):
    import seed
    from database import db

    monkeypatch.delenv("DEMO_PASSWORD", raising=False)
    seed.create_demo_account()
    assert db.users.find_one({"email": seed.DEMO_EMAIL}) is None

    monkeypatch.setenv("DEMO_PASSWORD", "a-long-demo-password")
    seed.create_demo_account()
    assert db.users.find_one({"email": seed.DEMO_EMAIL})["name"] == "Demo User"
