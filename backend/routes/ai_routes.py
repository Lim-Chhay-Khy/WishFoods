from flask import Blueprint, current_app, jsonify, request

from config import Config
from database import db
from services.ai_service import understand
from services.auth_service import get_current_user
from services.history_service import save_history
from services.nlp_service import sanitize_preferences, understood_anything
from services.recommendation_service import clean_answers, rank_foods

ai_routes = Blueprint("ai_routes", __name__)

MAX_MESSAGE_LENGTH = 500
NOT_UNDERSTOOD = (
    "We couldn't understand enough of your request. Try mentioning things like your mood, "
    "budget, food craving, or whether you want to cook."
)
NO_MATCHES = "No foods match your dietary needs and cook / restaurant choice. Try editing your preferences."


BUDGET_LABELS = {
    "$": f"Under ${Config.BUDGET_CHEAP_MAX:g}",
    "$$": f"${Config.BUDGET_CHEAP_MAX:g}–{Config.BUDGET_MODERATE_MAX:g}",
    "$$$": f"${Config.BUDGET_MODERATE_MAX:g}+",
}


def public_preferences(parsed):
    """What we send back to React so it can show "MoodBite understood"."""
    result = {key: value for key, value in parsed.items() if key != "choice_mentioned"}
    result["budget_label"] = BUDGET_LABELS.get(parsed["budget"])
    return result


# POST /api/ai/recommend
#
# Body (typed message):  {"message": "I'm tired and want something warm under $15."}
# Body (after "Edit Preferences"):
#   {"message": "<the original message>", "preferences": {"mood": "tired", ...}}
#
# Flow:  message -> parser (AI or keywords) -> structured answers
#        -> the SAME recommendation engine as the Quick Questions.
@ai_routes.route("/api/ai/recommend", methods=["POST"])
def smart_recommend():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    message = data.get("message") or ""
    if not isinstance(message, str):
        return jsonify({"error": "message must be text."}), 400
    message = message.strip()
    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify({"error": f"Please keep your message under {MAX_MESSAGE_LENGTH} characters."}), 400

    # 1. Understand the request.
    if "preferences" in data:  # the user corrected the answers by hand
        parsed, parser = sanitize_preferences(data["preferences"]), "edited"
    elif not message:
        return jsonify({"error": "Please type what you feel like eating."}), 400
    else:
        parsed, parser = understand(message, current_app.logger)

    if not understood_anything(parsed):
        return jsonify({
            "understood": False,
            "parser": parser,
            "message": NOT_UNDERSTOOD,
            "parsed_preferences": public_preferences(parsed),
            "recommendations": [],
        })

    # 2. Recommend with the existing engine. We load the recipes too, so
    #    "I have chicken and rice" can match recipe ingredients.
    foods = list(db.foods.find().sort("_id", 1))
    answers = clean_answers({**parsed, "smart": True})
    recommendations = rank_foods(foods, answers)

    # 3. Logged in? Save it to History (with the typed message).
    user = get_current_user()
    saved = bool(user and recommendations)
    if saved:
        save_history(user, answers, recommendations, original_message=message or None)

    result = {
        "understood": True,
        "parser": parser,
        "parsed_preferences": public_preferences(parsed),
        "recommendations": recommendations,
        "savedToHistory": saved,
    }
    if not recommendations:
        result["message"] = NO_MATCHES
    return jsonify(result)
