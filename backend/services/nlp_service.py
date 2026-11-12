"""
Stage 6: turns a sentence like

    "I'm tired after class. I only have about $15, I want something warm,
     and I don't want anything too heavy."

into the same structured answers the Quick Questions produce:

    {"mood": "tired", "preferences": ["comfort", "light"], "budget": "$",
     "time": None, "dietary": [], "choice": "either", ...}

This is simple keyword matching (no machine learning): for each answer we
keep a list of words and phrases, and look for them in the message.

Two small extras make it smarter:
  - NEGATION: "not spicy" or "I don't want to cook" mean the opposite, so
    a word right after "not / no / don't / without..." is skipped.
  - The FIRST mood mentioned wins if there are several.

The parser only fills in answers. The existing recommendation engine
(services/recommendation_service.py) still does all the filtering and
scoring, so dietary rules are always enforced the same way.
"""

import re

from config import Config

# ----- Word lists (add your own words here) -----

MOOD_KEYWORDS = {
    "tired": ["tired", "sleepy", "exhausted", "worn out", "drained", "low energy", "no energy"],
    "sad": ["sad", "feeling down", "feel down", "a bit down", "unhappy", "upset", "lonely", "bad day", "rough day"],
    "stressed": ["stressed", "stressful", "busy", "overwhelmed", "anxious", "exam", "exams", "deadline", "deadlines"],
    "happy": ["happy", "feeling good", "feel good", "good mood", "great day", "cheerful"],
    "excited": ["excited", "celebrate", "celebrating", "pumped"],
}

# Craving words -> the preference tags our foods use (see seed_data.py).
PREFERENCE_KEYWORDS = {
    "spicy": ["spicy", "hot", "chili", "chilli", "fiery"],
    "sweet": ["sweet", "dessert", "chocolate", "sugary"],
    "healthy": ["healthy", "fresh", "nutritious", "balanced", "clean eating"],
    "light": ["light", "small", "not too heavy", "nothing heavy", "nothing too heavy"],
    "comfort": ["comfort", "comforting", "warm", "cozy", "cosy"],
    "filling": ["filling", "hearty", "heavy", "starving", "really hungry", "very hungry"],
    "protein": ["protein", "high protein", "gym", "workout", "muscle"],
    "fast": ["fast food", "quick bite"],
}
# "heavy" is special: "something heavy" = filling, but "I don't want
# anything too heavy" = light. So a NEGATED "heavy" counts as "light".
NEGATED_MEANING = {"heavy": "light"}

CUISINE_KEYWORDS = {
    "Korean": ["korean"],
    "Japanese": ["japanese"],
    "Thai": ["thai"],
    "Chinese": ["chinese"],
    "Vietnamese": ["vietnamese"],
    "Indian": ["indian"],
    "Italian": ["italian"],
    "Greek": ["greek"],
    "Mexican": ["mexican"],
    "Khmer": ["khmer", "cambodian"],
    "Middle Eastern": ["middle eastern", "lebanese", "mediterranean"],
    "African": ["african", "nigerian", "west african"],
    "Latin American": ["latin american", "latin", "south american", "venezuelan", "brazilian"],
    "Canadian": ["canadian"],
    "Western": ["western", "american"],
}
# A cuisine matches a food if any of these equals the food's cuisine,
# country, or region (e.g. "African" matches every food from Africa).
CUISINE_MATCHES = {
    "Middle Eastern": ["Middle Eastern", "Middle East"],
    "African": ["Africa"],
    "Latin American": ["Latin America"],
    "Western": ["Western", "North America"],
}
ASIAN_CUISINES = ["Korean", "Japanese", "Thai", "Chinese", "Vietnamese", "Indian", "Khmer"]

# Dietary phrases are checked BEFORE negation, because many of them
# contain "no" on purpose ("no seafood").
DIETARY_KEYWORDS = {
    "vegan": ["vegan", "plant based", "plant-based"],
    "vegetarian": ["vegetarian", "no meat", "meatless", "meat-free", "meat free"],
    "halal": ["halal"],
    "no-seafood": ["no seafood", "no fish", "no shellfish", "without seafood", "seafood allergy",
                   "allergic to seafood", "allergic to fish", "allergic to shellfish",
                   "don't eat seafood", "dont eat seafood"],
    "dairy-free": ["no dairy", "dairy free", "dairy-free", "without dairy", "lactose", "no milk", "no cheese"],
}

# Checked first, because "don't want to cook" contains "cook".
RESTAURANT_PHRASES = [
    "don't want to cook", "dont want to cook", "do not want to cook", "not cooking", "no cooking",
    "too tired to cook", "can't cook", "cant cook", "not in the mood to cook",
    "restaurant", "restaurants", "eat out", "eating out", "dine out", "near me", "nearby", "around here",
    "takeout", "take out", "take-out", "delivery", "order in", "order food",
]
COOK_PHRASES = ["cook", "cooking", "make something", "make it myself", "at home", "homemade", "recipe"]

QUICK_PHRASES = ["quick", "quickly", "in a hurry", "hurry", "no time", "not much time",
                 "don't have much time", "dont have much time", "short on time", "asap"]

CHEAP_PHRASES = ["cheap", "budget", "broke", "affordable", "inexpensive", "not too expensive",
                 "not expensive", "low cost", "save money"]
FANCY_PHRASES = ["fancy", "splurge", "treat myself", "expensive", "special occasion"]

# Phrases that mean "these are ingredients I already have".
HAVE_PATTERN = re.compile(
    r"\b(i have|i've got|ive got|i got|i still have|in my fridge|in the fridge|leftover|leftovers|using)\b"
)

# canonical ingredient -> words that mean it (in the message AND in recipes)
INGREDIENTS = {
    "chicken": ["chicken"], "beef": ["beef", "steak"], "pork": ["pork"], "tofu": ["tofu"],
    "shrimp": ["shrimp", "prawn", "prawns"], "salmon": ["salmon"], "fish": ["fish"],
    "eggs": ["egg", "eggs"], "rice": ["rice"], "noodles": ["noodle", "noodles", "ramen"],
    "pasta": ["pasta", "spaghetti"], "bread": ["bread", "toast"], "cheese": ["cheese", "mozzarella"],
    "tomatoes": ["tomato", "tomatoes"], "potatoes": ["potato", "potatoes"],
    "carrots": ["carrot", "carrots"], "onions": ["onion", "onions"], "garlic": ["garlic"],
    "spinach": ["spinach"], "broccoli": ["broccoli"], "mushrooms": ["mushroom", "mushrooms"],
    "avocado": ["avocado", "avocados"], "chickpeas": ["chickpea", "chickpeas"],
    "cucumber": ["cucumber"], "banana": ["banana", "bananas"], "berries": ["berry", "berries"],
    "chocolate": ["chocolate"], "lettuce": ["lettuce"], "coconut milk": ["coconut milk"],
}

# Dishes people ask for: words in the MESSAGE -> words to look for in a
# FOOD's name or description.
DISHES = {
    "noodles": (["noodle", "noodles", "ramen"], ["noodle", "ramen", "pad thai", "kuy teav"]),
    "soup": (["soup", "broth"], ["soup", "ramen", "kuy teav"]),
    "curry": (["curry"], ["curry", "amok", "masala"]),
    "pizza": (["pizza"], ["pizza"]),
    "burger": (["burger", "burgers"], ["burger"]),
    "sushi": (["sushi"], ["sushi"]),
    "dumplings": (["dumpling", "dumplings", "dim sum"], ["dumpling", "dim sum"]),
    "salad": (["salad"], ["salad", "bowl"]),
    "wrap": (["wrap", "wraps"], ["wrap"]),
    "fried rice": (["fried rice"], ["fried rice"]),
    "chicken": (["chicken"], ["chicken"]),
    "beef": (["beef", "steak"], ["beef"]),
    "fish": (["fish", "seafood"], ["fish", "salmon", "sushi", "amok"]),
    "tofu": (["tofu"], ["tofu"]),
    "cake": (["cake"], ["cake"]),
}

# Words like these sound natural after "something ..." in explanations.
ADJECTIVES = {"warm", "cozy", "cosy", "spicy", "hot", "light", "fresh", "healthy", "sweet", "filling", "hearty"}

NEGATION = re.compile(r"\b(not|no|don't|dont|do not|never|without|nothing|isn't|hate|avoid)\b[\w\s']{0,25}$")


# ----- Small helpers -----

def normalize(message):
    """Lowercase, straight apostrophes, single spaces."""
    text = message.lower().replace("’", "'").replace("‘", "'")
    return re.sub(r"\s+", " ", text).strip()


def find_all(text, phrase):
    """Every position where the whole word/phrase appears (so "hot" doesn't
    match inside "shot")."""
    return [m.start() for m in re.finditer(r"\b" + re.escape(phrase) + r"\b", text)]


def is_negated(text, position):
    """True if a "not / no / don't..." comes shortly before this position,
    in the same part of the sentence (we stop at . , ! ? ; and "but")."""
    before = text[max(0, position - 40):position]
    before = re.split(r"[.,!?;]|\bbut\b", before)[-1]
    return bool(NEGATION.search(before))


def first_position(text, phrases, skip_negated=True):
    """Where the earliest (non-negated) phrase appears, or None."""
    positions = [
        position
        for phrase in phrases
        for position in find_all(text, phrase)
        if not (skip_negated and is_negated(text, position))
    ]
    return min(positions) if positions else None


def mentions(text, phrases, skip_negated=True):
    return first_position(text, phrases, skip_negated) is not None


# ----- One small function per answer -----

def detect_mood(text):
    found = {mood: first_position(text, words) for mood, words in MOOD_KEYWORDS.items()}
    found = {mood: position for mood, position in found.items() if position is not None}
    return min(found, key=found.get) if found else None  # the first one mentioned


def detect_preferences(text):
    """Returns (tags, craving_words). craving_words remembers the word the
    user actually typed, e.g. {"comfort": "warm"}, for nicer explanations."""
    tags, craving_words = [], {}
    for tag, words in PREFERENCE_KEYWORDS.items():
        for word in words:
            for position in find_all(text, word):
                negated = is_negated(text, position)
                if negated and word in NEGATED_MEANING:  # "not too heavy" -> light
                    real_tag, real_word = NEGATED_MEANING[word], "not too heavy"
                elif negated:
                    continue
                else:
                    real_tag, real_word = tag, word
                if real_tag not in tags:
                    tags.append(real_tag)
                    craving_words[real_tag] = real_word
    return tags, craving_words


def detect_cuisine(text):
    for cuisine, words in CUISINE_KEYWORDS.items():
        if mentions(text, words):
            return cuisine
    return None


# Dietary words are only negated by "not" right before them ("I'm not
# vegan", "not really vegetarian"). A wider check would wrongly let the
# "no" in "no seafood and dairy free" cancel "dairy free".
DIETARY_NEGATION = re.compile(r"\b(not|isn't|don't need|no need for)\s+(\w+\s+)?$")


def is_dietary_negated(text, position):
    before = re.split(r"[.,!?;]|\band\b|\bbut\b", text[max(0, position - 30):position])[-1]
    return bool(DIETARY_NEGATION.search(before))


def detect_dietary(text):
    found = []
    for restriction, phrases in DIETARY_KEYWORDS.items():
        if any(not is_dietary_negated(text, position)
               for phrase in phrases for position in find_all(text, phrase)):
            found.append(restriction)
    return found


def detect_budget(text):
    """A dollar amount wins ("under $15", "20 dollars"). Otherwise words
    like "cheap" or "fancy". Returns "$", "$$", "$$$" or None."""
    amount = re.search(r"\$\s*(\d+(?:\.\d+)?)", text) or re.search(
        r"\b(\d+(?:\.\d+)?)\s*(?:dollars?|bucks|cad|usd)\b", text
    )
    if amount:
        value = float(amount.group(1))
        if value <= Config.BUDGET_CHEAP_MAX:
            return "$"
        if value <= Config.BUDGET_MODERATE_MAX:
            return "$$"
        return "$$$"
    if mentions(text, CHEAP_PHRASES, skip_negated=False):
        return "$"
    if mentions(text, FANCY_PHRASES):
        return "$$$"
    return None


def minutes_to_time_limit(minutes):
    """Rounds up to the Quick Questions' time options: 15, 30, 60, or None."""
    for limit in (15, 30, 60):
        if minutes <= limit:
            return limit
    return None  # more than an hour = no real limit


def detect_time(text):
    minutes = re.search(r"\b(\d+)\s*(?:min|mins|minute|minutes)\b", text)
    if minutes:
        return minutes_to_time_limit(int(minutes.group(1)))
    hours = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)\b", text)
    if hours:
        return minutes_to_time_limit(float(hours.group(1)) * 60)
    if "half an hour" in text:
        return 30
    if re.search(r"\ban hour\b", text):
        return 60
    if mentions(text, QUICK_PHRASES, skip_negated=False):
        return 15
    return None


def detect_ingredients(text):
    """Only counts as ingredients if the user says they HAVE them
    ("I have chicken, rice and eggs")."""
    if not HAVE_PATTERN.search(text):
        return []
    return [name for name, words in INGREDIENTS.items() if mentions(text, words)]


def detect_dishes(text, ingredients):
    """Dishes the user asks for ("spicy noodles"). Words already counted as
    ingredients they have are skipped."""
    return [
        dish for dish, (message_words, _) in DISHES.items()
        if dish not in ingredients and mentions(text, message_words)
    ]


def detect_choice(text, ingredients):
    if mentions(text, RESTAURANT_PHRASES, skip_negated=False):
        return "restaurant", True
    if mentions(text, COOK_PHRASES) or ingredients:
        return "cook", True
    return "either", False  # not mentioned


# ----- The main function -----

def parse_message(message):
    """Returns the structured answers found in the message."""
    text = normalize(message)
    preferences, craving_words = detect_preferences(text)
    cuisine = detect_cuisine(text)
    if cuisine in ASIAN_CUISINES and "asian" not in preferences:
        preferences.append("asian")
    if cuisine == "Western" and "western" not in preferences:
        preferences.append("western")

    ingredients = detect_ingredients(text)
    choice, choice_mentioned = detect_choice(text, ingredients)

    return {
        "mood": detect_mood(text),
        "preferences": preferences,
        "budget": detect_budget(text),
        "time": detect_time(text),
        "dietary": detect_dietary(text),
        "choice": choice,
        "choice_mentioned": choice_mentioned,
        "cuisine": cuisine,
        "ingredients": ingredients,
        "dishes": detect_dishes(text, ingredients),
        "craving_words": craving_words,
    }


def understood_anything(parsed):
    """False if we found nothing useful at all."""
    return any([
        parsed["mood"], parsed["preferences"], parsed["budget"], parsed["time"],
        parsed["dietary"], parsed["cuisine"], parsed["ingredients"], parsed["dishes"],
        parsed.get("choice_mentioned"),
    ])


# ----- Checking answers that come from somewhere else -----
# The optional AI parser (ai_service.py) and the "Edit Preferences" form
# send their own answers. We never trust them blindly: anything that isn't
# one of our known values is dropped, so the engine only ever sees valid data.

VALID_MOODS = list(MOOD_KEYWORDS) + ["unsure"]
VALID_PREFERENCES = ["spicy", "sweet", "healthy", "comfort", "fast", "protein",
                     "vegetarian", "asian", "western", "light", "filling"]
VALID_DIETARY = list(DIETARY_KEYWORDS)
VALID_CHOICES = ["cook", "restaurant", "either"]
VALID_BUDGETS = ["$", "$$", "$$$"]


def keep_known(values, allowed, limit=12):
    if not isinstance(values, list):
        return []
    result = []
    for value in values:
        if isinstance(value, str) and value in allowed and value not in result:
            result.append(value)
    return result[:limit]


def canonical_ingredient(name):
    """"chicken breast" -> "chicken"; unknown -> None."""
    text = normalize(name)
    for canonical, words in INGREDIENTS.items():
        if mentions(text, words, skip_negated=False):
            return canonical
    return None


def sanitize_preferences(raw):
    """Cleans answers from the AI or the edit form. Unknown values are dropped."""
    if not isinstance(raw, dict):
        raw = {}

    time = raw.get("time")
    if isinstance(time, bool) or not isinstance(time, (int, float)) or time <= 0:
        time = None
    else:
        time = minutes_to_time_limit(time)

    ingredients = []
    for item in raw.get("ingredients") or []:
        canonical = canonical_ingredient(item) if isinstance(item, str) else None
        if canonical and canonical not in ingredients:
            ingredients.append(canonical)

    choice = raw.get("choice") if raw.get("choice") in VALID_CHOICES else "either"
    cuisine = raw.get("cuisine") if raw.get("cuisine") in CUISINE_KEYWORDS else None

    return {
        "mood": raw.get("mood") if raw.get("mood") in VALID_MOODS else None,
        "preferences": keep_known(raw.get("preferences"), VALID_PREFERENCES),
        "budget": raw.get("budget") if raw.get("budget") in VALID_BUDGETS else None,
        "time": time,
        "dietary": keep_known(raw.get("dietary"), VALID_DIETARY),
        "choice": choice,
        "choice_mentioned": choice != "either",
        "cuisine": cuisine,
        "ingredients": ingredients[:12],
        "dishes": keep_known(raw.get("dishes"), list(DISHES)),
        "craving_words": clean_craving_words(raw.get("craving_words")),
    }


def clean_craving_words(raw):
    """Keeps {"comfort": "warm"}-style pairs only if both parts are known."""
    if not isinstance(raw, dict):
        return {}
    allowed_words = ADJECTIVES | {"not too heavy"}
    return {tag: word for tag, word in raw.items() if tag in VALID_PREFERENCES and word in allowed_words}


# ----- Used by the recommendation engine for the extra points -----

# Recipe phrases that contain an ingredient word but aren't really that
# ingredient: "rice noodles" isn't rice, "chicken broth" isn't chicken.
NOT_THE_INGREDIENT = ["rice noodles", "chicken broth", "pork or chicken broth", "fish sauce", "egg noodles"]


def recipe_uses(food, ingredient):
    """Does this food's recipe use the ingredient? (needs food["recipe"])"""
    recipe = food.get("recipe") or {}
    lines = " ".join(recipe.get("ingredients", [])).lower()
    for phrase in NOT_THE_INGREDIENT:
        lines = lines.replace(phrase, "")
    return mentions(lines, INGREDIENTS.get(ingredient, [ingredient]), skip_negated=False)


def food_is_dish(food, dish):
    """Does this food match a dish the user asked for (e.g. "noodles")?"""
    _, food_words = DISHES.get(dish, ([], [dish]))
    text = f"{food['name']} {food['description']}".lower()
    return mentions(text, food_words, skip_negated=False)


def food_matches_cuisine(food, cuisine):
    """Does this food fit the cuisine the user named?"""
    targets = CUISINE_MATCHES.get(cuisine, [cuisine])
    return any(value in targets for value in (food.get("cuisine"), food.get("country"), food.get("region")))
