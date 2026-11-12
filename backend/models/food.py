"""
A document in the "foods" collection looks like this:

{
    "_id": 1,                          # our own number (instead of an ObjectId)
    "name": "Chicken Fried Rice",
    "emoji": "🍛",
    "description": "Quick and filling Asian comfort food...",
    "cuisine": "Asian",
    "country": "China",                # Stage 7
    "region": "East Asia",             # Stage 7
    "image_url": None,
    "cooking_time": 25,                # total minutes; None = restaurant-only
    "difficulty": "Easy",
    "price_level": "$",
    "can_cook": True,
    "available_at_restaurant": True,
    "moods": ["tired", "sad", "happy", "unsure"],
    "preferences": ["comfort", "asian", "filling", "fast"],
    "dietary_tags": ["halal", "no-seafood", "dairy-free"],   # what it's SAFE for
    "recipe": { ... } or None          # EMBEDDED recipe — see models/recipe.py
}

We use simple numbers for "_id" so the URLs stay short (/recipe/1).
"""


def food_to_dict(food):
    """Turns a food document into the JSON React expects.
    Keys are camelCase because that's the JavaScript convention.
    The recipe is left out on purpose — it has its own route."""
    return {
        "id": food["_id"],
        "name": food["name"],
        "emoji": food.get("emoji"),
        "description": food["description"],
        "cuisine": food["cuisine"],
        "country": food.get("country"),  # Stage 7: for the Discover page
        "region": food.get("region"),
        "imageUrl": food.get("image_url"),
        "cookingTime": food.get("cooking_time"),
        "difficulty": food["difficulty"],
        "priceLevel": food["price_level"],
        "canCook": food["can_cook"],
        "availableAtRestaurant": food["available_at_restaurant"],
        "moods": food["moods"],
        "preferences": food["preferences"],
        "dietary": food["dietary_tags"],
    }
