"""
OPTIONAL Stage 6 extra: understand messages with an external AI model
(Anthropic's Claude API), instead of only keyword matching.

It's OFF unless AI_API_KEY is set in backend/.env.

Safety rules:
  1. The AI ONLY turns the message into the same structured answers the
     keyword parser makes. It never picks foods or restaurants; our own
     recommendation engine still does that, with the same dietary filters.
  2. Everything it returns goes through sanitize_preferences(), which drops
     any value we don't recognise.
  3. Only the message is sent (with emails/phone numbers removed). Never
     the user's name, email, or id.
  4. If the AI fails in ANY way (no key, no internet, slow, bad JSON),
     we fall back to the keyword parser, so MoodBite keeps working.
"""

import json

import requests

from config import Config
from services.history_service import remove_personal_info
from services.nlp_service import parse_message, sanitize_preferences, understood_anything

API_URL = "https://api.anthropic.com/v1/messages"
TIMEOUT_SECONDS = 10

INSTRUCTIONS = f"""You convert a food request into JSON for a meal recommender.
Return ONLY one JSON object, with exactly these fields:
  "mood": one of "happy", "tired", "sad", "stressed", "excited", "unsure", or null
  "preferences": a list using only "spicy", "sweet", "healthy", "comfort", "fast",
                 "protein", "vegetarian", "asian", "western", "light", "filling"
  "budget": "$" (up to ${Config.BUDGET_CHEAP_MAX:g}), "$$" (up to ${Config.BUDGET_MODERATE_MAX:g}),
            "$$$" (more), or null
  "time": the most minutes they can spend cooking, as a number, or null
  "dietary": a list using only "vegetarian", "vegan", "halal", "no-seafood", "dairy-free"
  "choice": "cook", "restaurant", or "either"
  "cuisine": one of "Korean", "Japanese", "Thai", "Chinese", "Indian", "Italian",
             "Khmer", "Middle Eastern", "Western", or null
  "ingredients": a list of foods the user says they already have
Only use what the user actually said. Warm or cozy food means "comfort".
Do not recommend any foods. Do not add any text outside the JSON."""


class AIError(Exception):
    """The AI couldn't give us a usable answer."""


def is_configured():
    return bool(Config.AI_API_KEY)


def extract_preferences(message):
    """Asks the AI for the structured answers. Returns a dict (not yet
    checked) or raises AIError."""
    try:
        response = requests.post(
            API_URL,
            headers={
                "x-api-key": Config.AI_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": Config.AI_MODEL,
                "max_tokens": 300,
                "system": INSTRUCTIONS,
                "messages": [{"role": "user", "content": remove_personal_info(message)}],
            },
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        raise AIError(f"Couldn't reach the AI service: {error}") from error

    if response.status_code != 200:
        raise AIError(f"AI service error {response.status_code}: {response.text[:200]}")

    try:
        blocks = response.json().get("content", [])
        text = "".join(block.get("text", "") for block in blocks if block.get("type") == "text")
        # Take just the {...} part, in case the model added anything around it.
        return json.loads(text[text.index("{"): text.rindex("}") + 1])
    except (ValueError, AttributeError) as error:
        raise AIError(f"The AI didn't return valid JSON: {error}") from error


def understand(message, logger=None):
    """AI first (if turned on), keyword parser as the fallback.
    Returns (parsed_answers, parser_name)."""
    keyword_result = parse_message(message)

    if is_configured():
        try:
            parsed = sanitize_preferences(extract_preferences(message))
            if understood_anything(parsed):
                # Keep the user's own words ("warm") for nicer explanations.
                parsed["craving_words"] = keyword_result["craving_words"]
                return parsed, "ai"
        except AIError as error:
            if logger:
                logger.warning("AI parser failed, using keywords instead: %s", error)

    return keyword_result, "keywords"
