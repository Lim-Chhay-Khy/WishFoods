"""
Fills MongoDB with the sample data from seed_data.py.

    python seed.py           add the sample foods and restaurants
    python seed.py --demo    ...and also create the demo account

The demo account (demo@moodbite.app) is only created with --demo, and its
password comes from DEMO_PASSWORD in backend/.env, never from the code.

WARNING: it DELETES the existing foods and restaurants first, so running
it again always gives you a fresh copy of the sample data.
Users, favorites and history are NOT touched, so accounts stay safe.
"""

import os
import sys
from datetime import datetime, timezone

from pymongo.errors import OperationFailure, ServerSelectionTimeoutError

from werkzeug.security import generate_password_hash

from config import Config
from database import client, create_indexes, db
from seed_data import FOODS, RECIPES, RESTAURANTS
from services.validation_service import find_password_error

DEMO_EMAIL = "demo@moodbite.app"


def build_foods():
    """Gives each food a number as its _id (1, 2, 3...) and puts its
    recipe inside it."""
    recipes_by_food_name = {}
    for recipe in RECIPES:
        recipe = dict(recipe)
        food_name = recipe.pop("food")
        recipes_by_food_name[food_name] = recipe

    foods = []
    for number, data in enumerate(FOODS, start=1):
        food = {"_id": number, **data, "image_url": None}
        food["recipe"] = recipes_by_food_name.get(food["name"])  # None if restaurant-only
        foods.append(food)
    return foods


def build_restaurants(foods):
    """Turns the food NAMES in seed_data.py into food ids."""
    food_id_by_name = {food["name"]: food["_id"] for food in foods}

    restaurants = []
    for number, data in enumerate(RESTAURANTS, start=1):
        restaurant = dict(data)
        food_names = restaurant.pop("foods")
        restaurant["_id"] = number
        restaurant["image_url"] = None
        restaurant["food_ids"] = [food_id_by_name[name] for name in food_names]
        restaurants.append(restaurant)
    return restaurants


def check_connection():
    """Stops with a short, clear message if MongoDB isn't reachable.
    (We don't print MONGODB_URI because it may contain your password.)"""
    try:
        client.admin.command("ping")
    except ServerSelectionTimeoutError:
        print("Could not connect to MongoDB.")
        print("- Atlas: add your IP address under Network Access.")
        print("- Local: make sure the MongoDB service is running.")
        sys.exit(1)
    except OperationFailure as error:
        print(f"MongoDB refused the login: {error}")
        print("Check the username and password in MONGODB_URI in backend/.env.")
        sys.exit(1)


def seed():
    check_connection()

    foods = build_foods()
    restaurants = build_restaurants(foods)

    print("Deleting old data...")
    db.foods.drop()
    db.restaurants.drop()

    print("Adding sample data...")
    db.foods.insert_many(foods)
    db.restaurants.insert_many(restaurants)

    # Indexes: fast lookups, plus unique emails and no duplicate favorites.
    create_indexes()

    with_recipe = db.foods.count_documents({"recipe": {"$ne": None}})
    print(
        f"Done! Added {db.foods.count_documents({})} foods ({with_recipe} with recipes) "
        f"and {db.restaurants.count_documents({})} restaurants to the "
        f"'{Config.MONGO_DB_NAME}' database."
    )


def create_demo_account():
    """Creates (or resets) the demo login, using DEMO_PASSWORD from .env."""
    password = os.getenv("DEMO_PASSWORD", "")
    error = find_password_error(password)
    if error:
        print(f"Skipped the demo account: set DEMO_PASSWORD in backend/.env. ({error})")
        return

    db.users.update_one(
        {"email": DEMO_EMAIL},
        {
            "$set": {"name": "Demo User", "password_hash": generate_password_hash(password)},
            "$setOnInsert": {"email": DEMO_EMAIL, "created_at": datetime.now(timezone.utc)},
        },
        upsert=True,  # create it if it doesn't exist yet
    )
    print(f"Demo account ready: {DEMO_EMAIL} (password = DEMO_PASSWORD in your .env)")


if __name__ == "__main__":
    seed()
    if "--demo" in sys.argv:
        create_demo_account()
