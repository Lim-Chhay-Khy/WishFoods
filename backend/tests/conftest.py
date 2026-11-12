"""
Shared setup for every test (pytest loads this file automatically).

The tests use "mongomock", a fake MongoDB that lives in memory, so:
  - you don't need MongoDB running to test,
  - your real Atlas data is never touched,
  - every test starts with a fresh copy of the seed data.
"""

import os
import sys

# These must be set BEFORE the app is imported, because config.py reads them.
os.environ["MONGODB_URI"] = "mongomock://localhost"
os.environ["MONGO_DB_NAME"] = "moodbite_test"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-key-that-is-long-enough-123456"
os.environ["GOOGLE_PLACES_API_KEY"] = ""  # never call Google from tests
os.environ["AI_API_KEY"] = ""  # never call the AI from tests
os.environ["FLASK_DEBUG"] = "0"

# Let the tests import app.py, seed.py, services/... from the backend folder.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

import seed  # noqa: E402
from app import app as flask_app  # noqa: E402
from database import db  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_database(capsys):
    """Runs before EVERY test: empty the fake database and seed it again."""
    for name in db.list_collection_names():
        db.drop_collection(name)
    seed.seed()
    capsys.readouterr()  # hide seed.py's "Done! Added..." messages
    yield


@pytest.fixture
def client():
    """A fake browser that can call our API without starting a server."""
    flask_app.config["TESTING"] = True
    return flask_app.test_client()


def register_and_login(client, email="jackie@example.com", password="examplePassword"):
    """Creates an account and returns the headers that prove who we are."""
    client.post("/api/auth/register", json={"name": "Jackie", "email": email, "password": password})
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


@pytest.fixture
def auth_headers(client):
    return register_and_login(client)


def food_id(name):
    """Looks up a food's id by name, so tests don't depend on id numbers."""
    return db.foods.find_one({"name": name})["_id"]
