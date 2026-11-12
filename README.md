# MoodBite

Smart food recommendation web application. Tell MoodBite how you feel, what
you're craving, your dietary needs, and how much time and money you have,
and it recommends three meals and explains why.

## Technologies

- React (Vite, React Router)
- JavaScript, HTML, CSS
- Python
- Flask (+ Flask-CORS)
- JWT login tokens (PyJWT) + Werkzeug password hashing
- Google Places API (New) + Maps JavaScript API (`@vis.gl/react-google-maps`)
- MongoDB (with PyMongo)
- Natural Language Processing: a keyword parser in Python (+ optional Claude API)
- REST API (JSON)

## Features

- **Smart recommendations: describe what you want in your own words**
- Mood-based meal recommendations
- Food preference filtering
- Budget filtering
- Time filtering
- Dietary filtering (vegetarian, vegan, halal, no seafood, dairy-free)
- Recipe instructions
- Real nearby restaurants from Google Places, shown on a Google map
  (uses your location, or a city you type; falls back to sample data)
- User accounts: register, log in, log out
- Favorites saved to each user's account
- Recommendation history per user, with "View Again"
- Profile page with editable name and email
- Protected pages that require login

## Project Architecture

```
React (localhost:5173)  →  Flask REST API (localhost:5000)  →  MongoDB (Atlas or local)
        │                               └──────────────→  Google Places API
        └── Google Maps JavaScript API (the map itself)
       frontend/                      backend/                  moodbite database
```

1. React shows the pages and collects the user's answers.
2. React calls the Flask API with `fetch()` (all calls are in
   `frontend/src/services/apiService.js`).
3. Flask runs the recommendation logic and reads MongoDB through PyMongo.
4. Flask sends JSON back, and React displays it.

```
MoodBite/
├── frontend/                  React app
│   └── src/
│       ├── services/apiService.js     every call to Flask + token storage
│       ├── context/AuthContext.jsx    who is logged in (login, logout...)
│       ├── context/FavoritesContext.jsx  the user's favorites
│       ├── components/ProtectedRoute.jsx sends visitors to /login
│       ├── hooks/useApi.js            loading / error / data for API calls
│       ├── utils/validation.js        form checks (email, password...)
│       ├── pages/  components/  context/AppContext.jsx  data/options.js
│
└── backend/                   Flask API
    ├── app.py                 creates the app, CORS, error handlers
    ├── config.py              reads .env (MongoDB address, port...)
    ├── database.py            the shared MongoDB connection (`db`)
    ├── models/                document shapes + functions that turn them into JSON
    ├── routes/                food, restaurant, recommendation, auth,
    │                          favorite, history, profile routes
    ├── services/              recommendation, explanation, auth (JWT +
    │                          @login_required), history, validation
    ├── seed.py + seed_data.py fills the database with sample data
    ├── requirements.txt
    └── .env.example           copy to .env
```

## Database Setup

You can use **MongoDB Atlas** (free cloud database, nothing to install) or
MongoDB installed on your own computer.

**1a. Option A: MongoDB Atlas (cloud)**

1. Sign in at cloud.mongodb.com and create a free cluster (if you don't have one).
2. **Database Access** → add a database user with a password.
3. **Network Access** → **Add IP Address** → **Add Current IP Address**.
4. **Database** → **Connect** → **Drivers** → copy the connection string.

**1b. Option B: MongoDB on your computer**

Download **MongoDB Community Server** (Windows `.msi`) from
mongodb.com/try/download/community. Choose **Complete**, and keep
**"Install MongoD as a Service"** and **"Install MongoDB Compass"** checked.
Check it's running in PowerShell with `Get-Service MongoDB` (Status: `Running`).

You do **not** need to create the database yourself. MongoDB creates
`moodbite` automatically the first time `seed.py` saves data.

**2. Configure `.env`.** In the `backend` folder, copy `.env.example` to a new
file called `.env` and set `MONGODB_URI`:

```text
# Atlas:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
# or local:
MONGODB_URI=mongodb://localhost:27017

MONGO_DB_NAME=moodbite
```

`.env` is in `.gitignore`, so your password never goes to GitHub.

**3. Install Python dependencies** (inside `backend/`):

```bash
python -m venv venv
venv\Scripts\activate          # Windows (PowerShell / cmd)
source venv/bin/activate       # Mac / Linux
pip install -r requirements.txt
```

**3b. Add login secrets to `.env`** (Stage 4). Run this twice and paste
one result into each line:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

```text
SECRET_KEY=<first value>
JWT_SECRET_KEY=<second value>
```

Flask won't start without `JWT_SECRET_KEY` and tells you so. Keep these
secret: anyone who knows `JWT_SECRET_KEY` could create fake logins.

**4. Run the seed script.** It adds 22 foods (20 with recipes) and 14
restaurants, and creates the database indexes. Running it again resets the
foods and restaurants. Users, favorites and history are not touched.

```bash
python seed.py
```

**5. Start the Flask server:**

```bash
python app.py
```

Check it works: open http://localhost:5000/api/foods in your browser.

To see the data: in Atlas, open **Database → Browse Collections**; or open
**MongoDB Compass**, paste your `MONGODB_URI`, and open the `moodbite` database.

## Google Setup (Stage 5, optional)

Without Google keys the app still works and shows the sample restaurants.
To show **real** restaurants and a map:

1. Go to **console.cloud.google.com**, sign in, and create a project
   (e.g. "MoodBite").
2. Turn on **billing** for the project. Google needs a card, but each
   product has a free monthly amount (see the costs table below), which is
   plenty for testing.
   - **Set a safety limit:** Billing → **Budgets & alerts** → create a
     budget of e.g. $1 so Google emails you before you spend anything.
3. **APIs & Services → Library**: enable **Places API (New)** and
   **Maps JavaScript API**.
4. **APIs & Services → Credentials → Create credentials → API key**. Make
   **two** keys:

   | Key | API restriction | Application restriction | Put it in |
   |---|---|---|---|
   | Server key | Places API (New) | None (or your server's IP) | `backend/.env` → `GOOGLE_PLACES_API_KEY=...` |
   | Browser key | Maps JavaScript API | Websites: `http://localhost:5173/*` | `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY=...` |

   Why two? The **server key** stays secret inside Flask. The **browser
   key** is always visible to anyone who opens the page (that's how map
   keys work), so it's locked to your website's address and to maps only.
5. Create `frontend/.env` (copy `frontend/.env.example`) for the browser key.
6. **Restart** both servers. Flask and Vite only read `.env` when they start.
7. Optional: **APIs & Services → Places API (New) → Quotas**, and set a low
   daily limit (e.g. 100 requests per day).

### Costs (Google's price list, November 2026)

| What MoodBite uses | Free each month | After that |
|---|---|---|
| Text Search Enterprise + Atmosphere (restaurant search) | 1,000 searches | $40 per 1,000 |
| Place Details Enterprise + Atmosphere (saved Google restaurants) | 1,000 | per Google's price list |
| Dynamic Maps (the map) | 10,000 map loads | $7 per 1,000 |

The search asks for ratings, price, open-now and dine-in/takeout/delivery,
which puts it in the "Enterprise + Atmosphere" tier. To pay less, remove
fields from `FIELDS` in `backend/services/places_service.py`.

### How it works

1. The restaurant page asks the browser for your location (or you type a city).
2. React calls `GET /api/foods/<id>/nearby?lat=..&lng=..` (or `?near=Toronto`).
3. Flask calls Google's **Text Search** ("Chicken Fried Rice restaurant"
   near you) with the server key, works out each distance, and sends back
   restaurants in the same shape as the sample ones.
4. React shows them as numbered cards plus numbered pins on the map.
5. If there's no key, no location, or Google fails, Flask sends the sample
   restaurants with a message instead of an error.

Saving a Google restaurant stores **only its `place_id`**. Google's terms
don't let apps keep other place details, so the Favorites page asks Google
for the current details each time.

## Running the Backend (after the first setup)

```bash
cd backend
venv\Scripts\activate      # or: source venv/bin/activate
python app.py
```

## Running the Frontend

In a **second** terminal (Flask keeps running in the first one):

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open http://localhost:5173.

## Database Collections

MongoDB stores **documents** (like JSON objects) in **collections** (like
tables). There is no fixed schema; the shape of each document is written
in the comments of `backend/models/`.

| Collection | What each document holds | How it links |
|---|---|---|
| `foods` | One dish + recommendation data (`moods`, `preferences`, `dietary_tags` lists) **and its recipe embedded inside** (`recipe`, or `null` if restaurant-only) | Food → Recipe is one-to-one, so the recipe lives *inside* the food document |
| `restaurants` | One sample restaurant + a `food_ids` list, e.g. `[1, 14, 19]` | Restaurant ↔ Food is many-to-many: `find({"food_ids": 1})` finds every restaurant serving food 1 |
| `users` | `name`, `email` (unique), `password_hash` (never the password), `created_at` | — |
| `favorites` | `user_id`, plus `food_id` **or** `restaurant_id` **or** `place_id` (Google), `created_at` | User → Favorites is one-to-many; each favorite also points to one food or restaurant |
| `history` | `user_id`, the answers (`mood`, `preferences`, `choice`, `time`, `budget`, `dietary`), a copy of `recommended_foods`, `created_at` | User → History is one-to-many |

```
users ──< favorites >── foods / restaurants
users ──< history
foods ── recipe (inside the food)      restaurants >──< foods (food_ids list)
```

Foods and restaurants use simple numbers as their `_id` (instead of
MongoDB's long ObjectIds) so URLs stay short, e.g. `/recipe/1`. Users,
favorites and history use MongoDB's own ObjectIds.

**Indexes** (created by `seed.py` and when Flask starts): `users.email` is
unique, so no two accounts share an email. `(user_id, food_id,
restaurant_id)` in `favorites` is unique, so nobody can save the same thing
twice. `history.session_key` is unique, so the same session isn't saved
twice when two identical requests arrive at the same moment.

## API Routes

| Method | Route | Returns | Errors |
|---|---|---|---|
| GET | `/api/health` | `{"status": "ok"}` | — |
| GET | `/api/foods` | `{"foods": [...]}` | 500 |
| GET | `/api/foods/<id>` | `{"food": {...}}` | 404 `Food not found` |
| GET | `/api/foods/<id>/recipe` | `{"food": {...}, "recipe": {...}}` | 404 `Food not found` / `Recipe not found` |
| GET | `/api/foods/<id>/restaurants` | `{"food": {...}, "restaurants": [...]}` (may be empty) | 404 `Food not found` |
| GET | `/api/restaurants` | `{"restaurants": [...]}` | 500 |
| POST | `/api/ai/recommend` | `{"understood", "parser", "parsed_preferences", "recommendations", "savedToHistory"}` | 400 empty / too long |
| POST | `/api/recommendations` | `{"recommendations": [...], "savedToHistory": true/false}` (top 3) | 400 bad request |

| GET | `/api/foods/<id>/nearby?lat=&lng=` or `?near=` | `{"food", "source": "google"/"sample", "message", "center", "restaurants"}` | 400 bad location, 404 food |

**Stage 4 routes.** 🔒 = needs `Authorization: Bearer <token>`, otherwise
**401** `{"error": "Authentication required"}`.

| Method | Route | Body | Returns | Errors |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{"name", "email", "password"}` | 201 `{"message": "Account created successfully"}` | 400 invalid input, 409 email taken |
| POST | `/api/auth/login` | `{"email", "password"}` | `{"message", "user", "token"}` | 401 `Incorrect email or password.` |
| GET 🔒 | `/api/auth/me` | — | `{"user"}` | 401 |
| GET 🔒 | `/api/profile` | — | `{"user", "favoritesCount", "historyCount"}` | 401 |
| PUT 🔒 | `/api/profile` | `{"name", "email"}` | same as GET | 400, 409 email taken |
| GET 🔒 | `/api/favorites` | — | `{"favorites": [...]}` newest first | 401 |
| POST 🔒 | `/api/favorites` | `{"food_id": 4}`, `{"restaurant_id": 2}` or `{"place_id": "ChIJ..."}` | 201 `{"message": "Saved to Favorites!", "favorite"}` | 400, 404, 409 `Already in Favorites.` |
| DELETE 🔒 | `/api/favorites/<id>` | — | `{"message": "Removed from Favorites."}` | 404 (also if it's someone else's) |
| GET 🔒 | `/api/history` | — | `{"history": [...]}` newest first (max 50) | 401 |
| DELETE 🔒 | `/api/history/<id>` | — | `{"message"}` | 404 |
| DELETE 🔒 | `/api/history` | — | `{"message", "deleted"}` | 401 |

To test a 🔒 route in Thunder Client or Postman: log in first, copy the
`token` from the response, then add a header `Authorization` with the
value `Bearer <token>`.

### Common MongoDB connection errors

| Error | Fix |
|---|---|
| `Could not connect to MongoDB` / timeout | Atlas: add your IP under **Network Access**. Local: start the MongoDB service. |
| `bad auth : authentication failed` | Wrong username/password in `.env`, or the password has special characters that need encoding. |
| `CERTIFICATE_VERIFY_FAILED` | Run `pip install -r requirements.txt` again (it installs `certifi`). |
| DNS error with `mongodb+srv` | Check your internet; some school/work Wi-Fi blocks it. |

### Testing POST /api/recommendations

Use Postman or Thunder Client: method **POST**, URL
`http://localhost:5000/api/recommendations`, Body → **JSON**:

```json
{
  "mood": "tired",
  "preferences": ["comfort", "asian"],
  "choice": "cook",
  "time": 30,
  "budget": "$",
  "dietary": ["halal"]
}
```

More bodies to try:

```json
{ "mood": "sad", "preferences": [], "choice": "restaurant", "dietary": ["vegan", "no-seafood"] }
```
```json
{ "surprise": true }
```
```json
{ "preferences": ["comfort"] }
```
(The last one has no mood, so it should return **400** with an error.)

| Field | Values |
|---|---|
| `mood` | `happy`, `tired`, `sad`, `stressed`, `excited`, `unsure` (required unless `surprise` is true) |
| `preferences` | list: `spicy`, `sweet`, `healthy`, `comfort`, `fast`, `protein`, `vegetarian`, `asian`, `western`, `light`, `filling` |
| `choice` | `cook`, `restaurant`, `either` |
| `time` | max minutes (e.g. `30`), or `null` for no limit |
| `budget` | `$`, `$$`, `$$$`, `any` |
| `dietary` | list: `vegetarian`, `vegan`, `halal`, `no-seafood`, `dairy-free` |

## Smart Food Recommendation (Stage 6)

Users can describe what they want using natural language:

```text
"I'm tired, I have $20, and I want something spicy nearby."
```

MoodBite extracts preferences and uses the recommendation system to find
matching meals. It combines:

```text
Natural Language Processing  +  Rule-Based Recommendation  +  Restaurant Discovery
```

```
User message ──▶ parser (keywords, or AI if turned on) ──▶ structured answers
             ──▶ the SAME engine as the Quick Questions ──▶ 3 foods + reasons
             ──▶ View Recipe (Stage 2) or Find Nearby (Stage 5 map)
```

The parser **only fills in the answers**. The recommendation engine still
does all the filtering and scoring, so dietary rules are always strict.

### What the keyword parser looks for (`backend/services/nlp_service.py`)

| Answer | Example words | Becomes |
|---|---|---|
| Mood | tired, exhausted, stressed, busy, sad, feeling down, happy, excited | `mood` |
| Cravings | warm/cozy → comfort, spicy/hot, healthy/fresh, light/"not too heavy", filling, protein/gym, sweet/dessert | `preferences` |
| Budget | "under $15", "20 dollars", cheap, fancy | `$` ≤ $15, `$$` ≤ $30, `$$$` more (change in `.env`) |
| Time | "20 minutes", "an hour", quick | 15 / 30 / 60 minutes, or none |
| Dietary | vegetarian, vegan, halal, no seafood, dairy free | strict filter |
| Cook or eat out | "don't want to cook", nearby, restaurant → restaurant; cook, recipe, "I have..." → cook | `choice` |
| Cuisine | Korean, Thai, Indian, Italian, Khmer... | +2 points |
| Dish | noodles, soup, curry, pizza, sushi... | +3 points |
| Ingredients | "I **have** chicken, rice and eggs" | +1 point per ingredient the recipe uses |

**Negation:** a word right after "not / no / don't / without..." is
skipped, so "not spicy" doesn't add spicy, and "I'm not vegetarian" doesn't
add a vegetarian filter. The first mood mentioned wins.

### "MoodBite understood"

The page shows what was understood (mood, cravings, budget...). **Edit
Preferences** opens the Quick Questions buttons so the user can fix anything;
the corrected answers go to the same endpoint.

### Optional AI parser (`backend/services/ai_service.py`)

Off by default. Add `AI_API_KEY=<Anthropic API key>` to `backend/.env` to
let Claude read messages instead of keywords. Rules:

- React never calls the AI. Flask does, and the key lives only in `.env`.
- The AI only returns the same JSON fields. Every value is checked against
  our known lists (`sanitize_preferences`), and unknown values are dropped.
- Only the message is sent, with emails and phone numbers removed.
- If the AI fails for any reason, the keyword parser is used automatically.

### Privacy

For logged-in users, History stores the typed message (`original_message`)
**separately** from the parsed answers, after removing anything that looks
like an email or phone number. Messages from logged-out users are never saved.

### Testing `POST /api/ai/recommend`

```json
{ "message": "I'm happy and want spicy Korean food under $25." }
```

Returns `understood`, `parser` (`keywords` / `ai` / `edited`),
`parsed_preferences`, `recommendations`, and `savedToHistory`.
Empty message → 400. Text with nothing useful → `understood: false`.

## How Login Works

1. **Register.** Flask checks the name, email and password, then saves
   `generate_password_hash(password)`, a one-way scrambled version of the
   password, never the password itself.
2. **Log in.** Flask finds the user by email and checks the password with
   `check_password_hash()`. If it matches, Flask returns a **JWT**: a token
   signed with `JWT_SECRET_KEY` that says "this is user X, valid for 7 days".
3. **Later requests.** React saves the token in localStorage
   (`moodbite_token`) and sends it as `Authorization: Bearer <token>`. The
   `@login_required` decorator checks the signature and expiry before the
   route runs.
4. **Refresh.** `AuthContext` calls `GET /api/auth/me` with the saved token
   to restore the login.
5. **Log out.** React deletes the token.

> **Learning-project note:** storing the token in localStorage is simple,
> but any JavaScript running on the page can read it. Production apps often
> put it in an **HTTP-only cookie**, which JavaScript can't read.

## How Recommendations Work

`backend/services/recommendation_service.py`:

1. **Filter.** Remove foods that break a dietary restriction, plus
   restaurant-only foods (if cooking) or home-only foods (if eating out).
2. **Score.** Mood +3, each matching craving +3, cook/restaurant fit +2,
   time fit +2, budget fit +1, dietary fit +3.
3. **Sort and return the top 3**, each with a `reason` sentence written by
   `explanation_service.py`.

## HTTP Status Codes Used

| Code | Meaning | When MoodBite uses it |
|---|---|---|
| 200 OK | Success | Normal answers, including empty lists |
| 201 Created | A new record was saved | Registering, saving a favorite |
| 401 Unauthorized | Not logged in, or the token is invalid | Any 🔒 route without a valid token; wrong login |
| 400 Bad Request | The client sent something wrong | Missing mood, wrong data types, body isn't JSON |
| 404 Not Found | That thing doesn't exist | Unknown food id, no recipe, unknown route, someone else's favorite |
| 409 Conflict | Clashes with existing data | Email already registered, favorite already saved |
| 405 Method Not Allowed | Wrong HTTP method | e.g. GET on `/api/recommendations` |
| 500 Internal Server Error | The server failed | MongoDB can't be reached, or a bug |

## What's Next

- Deploy online (Vercel + Render + MongoDB Atlas) for a live demo link.
- Automated tests (pytest for the parser and engine) run on every push.
- Learn from history: boost foods the user saved or chose before.

## Interview Summary

> MoodBite is a full-stack meal recommender built with React, Flask, and
> MongoDB. Users can answer a few quick questions or just describe what they
> want, like "I'm tired, I have $15, and I want something warm nearby." The
> Flask backend turns that sentence into structured preferences with a
> keyword-based NLP parser (or, optionally, an AI model with the keyword
> parser as a fallback), and passes them to my rule-based recommendation
> engine, which filters by dietary needs and scores foods by mood, cravings,
> time, budget, and ingredients the user has. Each result comes with a
> plain-language explanation and links to a recipe or nearby restaurants from
> the Google Places API. Users can log in with JWT authentication to save
> favorites and see their recommendation history.
