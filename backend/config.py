import os

from dotenv import load_dotenv

# Read the values from the .env file into environment variables.
# This keeps connection details (and any passwords) out of the code.
load_dotenv()


def _get_mongo_uri():
    """Use a local MongoDB by default so the server can still start
    when the sample .env file still has the placeholder Atlas string.
    """
    mongo_uri = os.getenv("MONGODB_URI", "").strip()
    placeholder_markers = ("<username>", "<password>", "cluster0.xxxxx.mongodb.net", "xxxxx.mongodb.net")

    if not mongo_uri or any(marker in mongo_uri for marker in placeholder_markers):
        return "mongodb://localhost:27017"

    return mongo_uri


class Config:
    # Where MongoDB is running. A local install listens on port 27017.
    MONGODB_URI = _get_mongo_uri()
    # The database name. MongoDB creates it automatically the first time
    # seed.py saves data into it — no "CREATE DATABASE" needed.
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "Moodbite").strip() or "Moodbite"

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    PORT = int(os.getenv("PORT", "5000"))

    # ----- Stage 4: login -----
    # Flask's own secret key (Flask uses it to sign cookies/sessions).
    SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
    # The secret used to sign login tokens (JWTs). Anyone who knows it could
    # create fake tokens, so it lives only in .env, never in GitHub.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
    # How long a login lasts before the user must log in again.
    JWT_EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))

    # ----- Stage 5: real restaurants (Google Places API) -----
    # A SERVER key: only Flask uses it, so it never reaches the browser.
    # Leave it empty to keep using the sample restaurants.
    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
    # How far around the user to look, in metres (5000 = 5 km).
    PLACES_SEARCH_RADIUS_M = int(os.getenv("PLACES_SEARCH_RADIUS_M", "5000"))

    # ----- Stage 6: smart (natural-language) recommendations -----
    # How a dollar amount in a message becomes a budget level:
    #   up to $15 -> "$",  up to $30 -> "$$",  more -> "$$$"
    BUDGET_CHEAP_MAX = float(os.getenv("BUDGET_CHEAP_MAX", "15"))
    BUDGET_MODERATE_MAX = float(os.getenv("BUDGET_MODERATE_MAX", "30"))

    # OPTIONAL external AI parser (services/ai_service.py). Leave AI_API_KEY
    # empty to use only the free keyword parser (services/nlp_service.py).
    AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
    AI_MODEL = os.getenv("AI_MODEL", "claude-haiku-5-5").strip()

