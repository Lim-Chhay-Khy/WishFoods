from datetime import timezone

import certifi
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import ConfigurationError

from config import Config

# One shared connection to MongoDB for the whole app.
#
# serverSelectionTimeoutMS=10000: if MongoDB can't be reached, give up
# after 10 seconds with an error instead of waiting 30 seconds.
# (A cloud database like MongoDB Atlas needs a bit longer than a local one.)
connection_options = {"serverSelectionTimeoutMS": 10000}

# MongoDB Atlas (a "mongodb+srv://" address) uses an encrypted TLS
# connection. certifi gives Python an up-to-date list of trusted
# certificates, which avoids "CERTIFICATE_VERIFY_FAILED" errors on Windows.
if Config.MONGODB_URI.startswith("mongodb+srv://"):
    connection_options["tlsCAFile"] = certifi.where()

# MongoClient doesn't connect right away — it connects the first time we
# actually read or write data. But for a "mongodb+srv://" address it looks
# up the cluster name immediately, so a typo in MONGODB_URI (or no internet)
# fails here. We stop with a short message instead of a long traceback.
try:
    if Config.MONGODB_URI.startswith("mongomock://"):
        # Only for the automated tests (backend/tests): a fake MongoDB that
        # lives in memory, so tests never touch your real data.
        import mongomock
        client = mongomock.MongoClient()
    else:
        client = MongoClient(Config.MONGODB_URI, **connection_options)
except ConfigurationError as error:
    raise SystemExit(
        f"\nCan't use the MONGODB_URI in backend/.env: {error}\n"
        "Check the address for typos and make sure you're connected to the internet.\n"
    )

# The MoodBite database. Its collections (like tables in SQL) are used as:
#   db.foods        -> each food, with its recipe stored inside it
#   db.restaurants  -> each restaurant, with a list of the food ids it serves
#   db.users        -> each account (name, email, HASHED password)         [Stage 4]
#   db.favorites    -> one document per saved food or restaurant, per user [Stage 4]
#   db.history      -> one document per recommendation session, per user  [Stage 4]
db = client[Config.MONGO_DB_NAME]


def create_indexes():
    """Indexes make lookups fast, and a UNIQUE index makes MongoDB itself
    refuse duplicates. Creating an index that already exists does nothing,
    so this is safe to run every time the app starts."""
    db.restaurants.create_index("food_ids")
    db.users.create_index("email", unique=True)  # no two accounts with one email
    # Stage 5 added place_id, so the old 3-field index is replaced.
    if "user_id_1_food_id_1_restaurant_id_1" in db.favorites.index_information():
        db.favorites.drop_index("user_id_1_food_id_1_restaurant_id_1")
    db.favorites.create_index(
        [("user_id", ASCENDING), ("food_id", ASCENDING),
         ("restaurant_id", ASCENDING), ("place_id", ASCENDING)],
        unique=True,  # a user can't save the same food or restaurant twice
    )
    db.history.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    # Stops the same session being saved twice at the same moment
    # (see services/history_service.py).
    db.history.create_index("session_key", unique=True)


def to_object_id(text):
    """Users, favorites and history use MongoDB's own ObjectId as their _id
    (a 24-character code like "6721f0c2a1b2c3d4e5f60718"). This turns the
    text from a URL or token back into an ObjectId, or returns None if the
    text isn't a valid id."""
    try:
        return ObjectId(text)
    except (InvalidId, TypeError):
        return None


def to_iso(moment):
    """Turns a saved date into text React can read, e.g.
    "2026-11-04T19:06:00+00:00". MongoDB stores dates in UTC."""
    if moment is None:
        return None
    return moment.replace(tzinfo=timezone.utc).isoformat()
