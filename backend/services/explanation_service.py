"""
Builds the "Why we recommend this" text on each food card, e.g.

  "You said you are feeling tired and want comfort food.
   Chicken Fried Rice is comforting, filling, and easy to prepare.
   It takes about 25 minutes to make. It fits your $ budget."

It is made of three short sentences:
  1. what the user told us   (mood + matching cravings)
  2. why this food fits      (words based on the food's tags)
  3. the practical part      (cook / restaurant, time, budget)
"""

MOOD_WORDS = {
    "happy": "happy",
    "tired": "tired",
    "sad": "a little down",
    "stressed": "stressed",
    "excited": "excited",
}

# How each craving reads inside a sentence ("...and want comfort food").
PREFERENCE_PHRASES = {
    "spicy": "something spicy",
    "sweet": "something sweet",
    "healthy": "something healthy",
    "comfort": "comfort food",
    "fast": "something fast",
    "protein": "something high in protein",
    "vegetarian": "vegetarian food",
    "asian": "Asian food",
    "western": "Western food",
    "light": "something light",
    "filling": "something filling",
}

# How each food tag is described in sentence 2.
TRAIT_WORDS = {
    "comfort": "comforting",
    "filling": "filling",
    "light": "light",
    "healthy": "balanced",
    "protein": "high in protein",
    "spicy": "spicy",
    "sweet": "sweet",
    "fast": "quick",
}


def join_words(words):
    """["a"] -> "a",  ["a","b"] -> "a and b",  ["a","b","c"] -> "a, b, and c" """
    if len(words) <= 1:
        return "".join(words)
    if len(words) == 2:
        return f"{words[0]} and {words[1]}"
    return ", ".join(words[:-1]) + f", and {words[-1]}"


# Words that read naturally after "something ...", e.g. "something warm".
ADJECTIVES = {"warm", "cozy", "cosy", "spicy", "hot", "light", "fresh", "healthy", "sweet", "filling", "hearty"}


def craving_phrase(tag, craving_words):
    """Uses the user's own word when we have it ("something warm"),
    otherwise the standard phrase ("comfort food")."""
    word = craving_words.get(tag)
    if word == "not too heavy":
        return "nothing too heavy"
    if word in ADJECTIVES:
        return f"something {word}"
    return PREFERENCE_PHRASES.get(tag)


def describe_user(mood, cravings, mood_matched, smart=False):
    """cravings: phrases like ["something warm", "Korean food"]."""
    verb = "mentioned" if smart else "said"

    if mood == "unsure":
        if cravings:
            return f"You weren't sure how you feel, but you want {join_words(cravings)}."
        return "You weren't sure how you feel, so we picked something easy to enjoy."
    if mood_matched:
        wants = f" and want {join_words(cravings)}" if cravings else ""
        feeling = "you're feeling" if smart else "you are feeling"
        return f"You {verb} {feeling} {MOOD_WORDS[mood]}{wants}."
    if cravings:
        return f"You {verb} you want {join_words(cravings)}."
    if smart:
        return None  # the other sentences (ingredients, time...) say enough
    return "This was the closest match to your answers."


def describe_food(food, choice):
    traits = [TRAIT_WORDS[tag] for tag in food["preferences"] if tag in TRAIT_WORDS][:2]
    if food["difficulty"] == "Easy" and food["can_cook"] and choice != "restaurant":
        traits.append("easy to prepare")
    if not traits:
        return f"{food['name']} is a {food['cuisine']} favorite."
    return f"{food['name']} is {join_words(traits)}."


def describe_practical(food, answers, checks):
    choice = answers["choice"]
    budget = answers["budget"]

    if choice == "restaurant" or not food["can_cook"]:
        sentence = "You can find it at restaurants nearby"
    elif food["cooking_time"] <= 15:
        sentence = f"It only takes about {food['cooking_time']} minutes to make"
    else:
        sentence = f"It takes about {food['cooking_time']} minutes to make"

    sentence += "." if checks["time"] else ", which is a bit longer than you wanted."

    if budget:
        if checks["budget"]:
            sentence += f" It fits your {budget} budget."
        else:
            sentence += f" It costs a little more than your {budget} budget."
    return sentence


DIETARY_WORDS = {
    "vegetarian": "vegetarian", "vegan": "vegan", "halal": "halal-friendly",
    "no-seafood": "seafood-free", "dairy-free": "dairy-free",
}


def describe_dietary(dietary):
    """Stage 6: "It's vegetarian, like you asked." """
    words = [DIETARY_WORDS[d] for d in dietary if d in DIETARY_WORDS]
    return f"It's {join_words(words)}, like you asked." if words else None


def describe_ingredients(matched_ingredients):
    """Stage 6: "It uses the chicken and rice you already have." """
    if not matched_ingredients:
        return None
    return f"It uses the {join_words(matched_ingredients)} you already have."


def build_explanation(food, answers, result):
    """food: a food document from MongoDB, answers: cleaned user answers,
    result: the dictionary returned by score_food().

    Mood is only used as a preference signal. We never claim a food will
    fix or improve how someone feels."""
    craving_words = answers.get("craving_words", {})
    cravings = [craving_phrase(tag, craving_words) for tag in result["matched_preferences"]]
    if result.get("cuisine_match"):
        # "Korean food" says more than "Asian food", so use it instead.
        cravings = [c for c in cravings if c not in ("Asian food", "Western food")]
        cravings.append(f"{answers['cuisine']} food")
    cravings += result.get("matched_dishes", [])
    cravings = [phrase for phrase in cravings if phrase]

    sentences = [
        describe_user(answers["mood"], cravings, result["checks"]["mood"], answers.get("smart")),
        describe_food(food, answers["choice"]),
        describe_ingredients(result.get("matched_ingredients")),
        describe_dietary(answers["dietary"]) if answers.get("smart") else None,
        describe_practical(food, answers, result["checks"]),
    ]
    return " ".join(sentence for sentence in sentences if sentence)


def build_popular_explanation(food):
    return f"A popular pick for any mood. {describe_food(food, None)}"
