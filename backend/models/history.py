"""
A document in the "history" collection (one recommendation session):

{
    "_id": ObjectId("..."),
    "user_id": ObjectId("..."),          # WHO asked (links to users._id)
    "source": "questions" or "smart",    # Quick Questions, or a typed message
    "original_message": "I'm tired...",  # what they typed (smart only), else None
    "mood": "tired",
    "preferences": ["comfort"],
    "choice": "cook",
    "time": 30,                          # max minutes, or None = no limit
    "budget": "$",                       # or None = no preference
    "dietary": ["halal"],
    "cuisine": "Korean",                 # smart only (else None)
    "ingredients": ["chicken", "rice"],  # smart only
    "dishes": ["noodles"],               # smart only
    "recommended_foods": [               # a small copy of the results
        {"id": 1, "name": "Chicken Fried Rice", "emoji": "🍛", "score": 17},
        ...
    ],
    "session_key": "...",                # stops duplicate saves (see history_service.py)
    "created_at": datetime(...)
}

We copy the food names into the history on purpose, so old sessions still
show what was recommended *at that time*, even if the food data changes.
"""

from database import to_iso


def history_to_dict(entry):
    return {
        "id": str(entry["_id"]),
        "mood": entry["mood"],
        "preferences": entry["preferences"],
        "choice": entry["choice"],
        "time": entry["time"],
        "budget": entry["budget"],
        "dietary": entry["dietary"],
        # Stage 6 (older entries don't have these, so use defaults)
        "source": entry.get("source", "questions"),
        "originalMessage": entry.get("original_message"),
        "cuisine": entry.get("cuisine"),
        "ingredients": entry.get("ingredients") or [],
        "dishes": entry.get("dishes") or [],
        "recommendedFoods": entry["recommended_foods"],
        "createdAt": to_iso(entry.get("created_at")),
    }
