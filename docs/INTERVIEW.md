# MoodBite: Resume, Pitch and Interview Prep

## Resume entry

**MoodBite: Smart Food Recommendation Web App** | React, Flask, MongoDB, Google Maps API | *GitHub link · Live demo link*

- Built a full-stack web app with a **React** frontend and a **Flask REST API** (20 endpoints) on **MongoDB Atlas** that recommends meals from 20 countries based on mood, ingredients, budget, time and dietary needs
- Designed a **rule-based NLP parser** in Python that turns free-text requests (e.g. "spicy, cheap, no seafood") into structured preferences, handling negation and falling back from an optional AI parser
- Implemented a **weighted scoring engine** that filters by hard dietary rules, ranks dishes and explains every recommendation to the user
- Secured user accounts with **JWT authentication** and hashed passwords, and protected per-user favorites and history with ownership checks and unique database indexes
- Integrated the **Google Places API** and **Maps JavaScript API** to show real nearby restaurants on a map, with a labelled fallback when the API is unavailable
- Wrote **80 automated tests** (pytest + mongomock, Vitest + Testing Library), ran them in **GitHub Actions CI**, and made the UI responsive and keyboard/screen-reader accessible

*(Pick 3–4 bullets if space is short. The 1st, 2nd and last are the strongest.)*

## 60–90 second pitch

> "MoodBite is a full-stack food recommendation app I built to solve a small
> everyday problem: deciding what to eat. You can pick your mood, list the
> ingredients you have, or just type something like *'I'm tired and want
> something spicy and cheap'*.
>
> The frontend is React with Vite. It talks to a Flask REST API I organised
> into routes, services and models, with MongoDB Atlas as the database. The
> most interesting part is the backend logic. I wrote a keyword-based NLP
> parser that pulls out mood, cravings, budget, time and dietary needs. It
> even handles negation, so 'not spicy' doesn't count as spicy. A scoring
> engine then filters out anything that breaks a dietary rule, ranks the rest
> with weighted points, and explains why each dish was picked.
>
> It also has JWT login, favorites, history, and real nearby restaurants from
> the Google Places API on a map. In the final stage I focused on quality: 80
> automated tests running in GitHub Actions, a mobile menu and accessibility
> fixes, consistent error handling, and deployment setup for Vercel and Render.
>
> The biggest thing I learned was that tests find real bugs. My own test caught
> the parser dropping 'dairy free' when it came right after 'no seafood'."

## Technical questions and answers

**1. Walk me through what happens when I type a sentence and press "Find Food For Me".**
React sends `POST /api/ai/recommend` with the text. The Flask route passes it
to `nlp_service.py`, which uses keyword lists and regular expressions to find
mood, cravings, budget, time, cuisine, dishes and dietary needs. If an AI key
is set, the AI parser runs first, and its answer is cleaned and checked. If
the AI fails, the keyword parser is used instead. The preferences go to
`recommendation_service.rank_foods`. It loads foods from MongoDB, removes
foods that break a dietary rule, scores the rest, and returns the top three
with explanations. If the user is logged in, the request is also saved to
their history.

**2. Why MongoDB instead of MySQL?**
Each food has nested data: a recipe with steps, a list of ingredients, and
mood and dietary tags. In MongoDB that's one document. In SQL it would be
four or five joined tables. The trade-off is that relationships like
favorites aren't enforced by foreign keys, so I use unique indexes and
check ownership in code.

**3. How does login work?**
On register, I hash the password with Werkzeug, which adds a random salt. I
never store the plain password. On login, I compare hashes and return a JWT
signed with a server secret. It expires in 7 days. React stores it and sends
`Authorization: Bearer <token>`. A `@login_required` decorator verifies the
signature and expiry and loads the user. The token can't be edited, because
changing it breaks the signature.

**4. Where is the token stored, and what's the risk?**
In localStorage, so it survives refreshes. The risk is that a cross-site
scripting bug could read it. React escapes output by default, which helps. In
production I'd move to an httpOnly cookie with short-lived access tokens
plus refresh tokens.

**5. How do you stop one user from seeing another user's favorites?**
Every query includes `user_id` from the verified token. The user ID never
comes from the request body. Deleting uses `{_id, user_id}` together, so
deleting someone else's favorite just returns 404. A test checks this.

**6. Why do you have a unique index on history?**
React's StrictMode sent the same request twice in development, which created
duplicate history rows. Checking "does it exist?" in code has a race
condition: both requests check at the same time. A unique `session_key`
index makes the database reject the second insert, which is the reliable fix.

**7. How did you test code that uses a database?**
With mongomock, an in-memory fake of MongoDB. `conftest.py` sets
`MONGODB_URI=mongomock://...` before the app imports, so tests never touch
Atlas. Each test gets a freshly seeded database, so tests don't depend on
each other. On the frontend I use Vitest and Testing Library, which test what
the user sees (roles and labels), not implementation details.

**8. What is CORS and how did you configure it?**
Browsers block a page on one origin from reading responses from another
origin unless the server allows it. My API only allows the origins in the
`FRONTEND_URL` environment variable (localhost in development, the Vercel
URL in production), not `*`.

**9. How do you keep API keys safe?**
Server keys (database, JWT secret, Google Places, AI) live only in
`backend/.env`, which is git-ignored, or in Render's settings. The frontend
only gets the Google Maps browser key, which is public by design, so I
restricted it to my domain. The frontend never calls Google Places or the
AI directly. It goes through my backend.

**10. What happens when something fails?**
Every Flask error handler returns JSON like `{"error": "..."}` with the right
status code (400, 401, 404, 409, 413, 500). The details go to the server log,
never to the user. On the frontend, `apiService.js` turns network failures
into "Can't reach the server". Every page has loading, empty and error states.

**11. What was the hardest bug?**
Two NLP bugs. "Rice noodles" was counted as having rice, so I added a list of
phrases where the word isn't the ingredient. And "no seafood and dairy free"
lost "dairy free", because the negation check looked too far back and saw
"no". I fixed it by only checking the words since the last comma, "and" or
"but". The second one was caught by a pytest test I wrote.

**12. What would you improve?**
Personalise the ranking from each user's favorites and history, add rate
limiting on login, use refresh tokens, and replace the keyword parser's lists
with a small trained classifier once I have real usage data.

**13. How is the project deployed?**
React is built by Vite and hosted on Vercel, with a rewrite so client-side
routes work on refresh. Flask runs on Render under gunicorn
(`gunicorn app:app`), with secrets in environment variables. The database is
MongoDB Atlas. GitHub Actions runs all tests on every push.

## 3–5 minute demo flow

1. **Home (20s)**: "Can't decide what to eat?" Point out the three paths.
2. **Tell MoodBite (60s)**: type *"I'm tired and want something spicy and cheap, no seafood, ready in 30 minutes"*.
   Show the "MoodBite understood" chips, then the explanations on the cards.
   Mention that the keyword parser handles negation.
3. **Recipe (20s)**: open one result and show the steps.
4. **Restaurants (40s)**: Use My Location, real Google results on the map, Directions.
5. **Use My Ingredients (30s)**: add rice, egg, chicken. Matched ingredients are highlighted.
6. **Discover (20s)**: filter by region (e.g. Southeast Asia) and cuisine.
7. **Accounts (40s)**: log in, heart a dish, open Favorites, then History → View again.
8. **Quality (30s)**: shrink the window to show the mobile menu. Show the GitHub Actions green check and `pytest` output.
9. **Wrap up (10s)**: "React, Flask, MongoDB, JWT, Google APIs, 80 tests, CI."

**Before the demo:** open the live site a minute early (Render wakes up),
log in with the demo account, and close any tabs showing keys or the Atlas dashboard.

## GitHub repository settings

- **Description:** Full-stack food recommender: React + Flask + MongoDB with an NLP parser, JWT auth, Google Maps restaurants and 80 automated tests.
- **Website:** your Vercel URL
- **Topics:** `react` `flask` `python` `mongodb` `rest-api` `jwt-authentication` `google-maps-api` `nlp` `recommendation-system` `vite` `pytest` `vitest` `full-stack` `portfolio-project`

## Example commit messages for this stage

```
fix: keep "dairy free" when it follows "no seafood"
feat: add Discover page with region and cuisine filters
feat: add Use My Ingredients page
style: responsive navbar with mobile menu and accessibility fixes
test: add backend pytest suite with mongomock
test: add frontend Vitest + Testing Library tests
ci: run tests on every push with GitHub Actions
chore: add LICENSE and deployment config
docs: rewrite README, add testing, deployment and interview guides
```
