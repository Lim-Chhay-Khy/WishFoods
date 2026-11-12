# Testing MoodBite

## Automated tests

| Suite | Command | What it covers |
|---|---|---|
| Backend (pytest, 50 tests) | `cd backend && pip install -r requirements-dev.txt && pytest -q` | auth, foods, recommendations, favorites, history, NLP parser, security limits, demo account |
| Frontend (Vitest, 30 tests) | `cd frontend && npm test` | FoodCard, FavoriteButton, IngredientInput, MoodCard, RestaurantCard, ProtectedRoute, Navbar, Login, RecipeDetails, validation |
| Build check | `cd frontend && npm run build` | the production bundle compiles |

The backend tests use **mongomock**, a fake MongoDB that lives in memory, so
they never change your real Atlas data. Every test starts with a freshly seeded
database (`tests/conftest.py`).

GitHub Actions runs all three on every push. Look for the green check next to a commit.

## Manual testing checklist

Run through this before a release or a demo. Use a browser window at desktop
size, then repeat the ⭐ items on a phone (or DevTools → device toolbar, 375px).

### Accounts
- [ ] ⭐ Register with a new email → success message → can log in
- [ ] Register with an email that already exists → "An account with this email already exists"
- [ ] Register with a 3-character password → clear validation message, nothing sent
- [ ] Log in with a wrong password → "Incorrect email or password." (same message for an unknown email)
- [ ] ⭐ Log out → navbar shows Login/Register; `/favorites` now redirects to Login
- [ ] Refresh the page while logged in → still logged in
- [ ] Edit name and email on Profile → saved after refresh

### Find My Food (mood flow)
- [ ] ⭐ Pick a mood → cravings → budget/time/dietary → cook or eat out → 3 recommendations
- [ ] Each card shows a "why it was picked" explanation
- [ ] "Vegan" selected → every result is vegan
- [ ] Back button works on each step without losing earlier answers

### Tell MoodBite (NLP)
- [ ] ⭐ "I'm tired and want something spicy and cheap" → Mood: Tired, Craving: Spicy, Budget: cheap
- [ ] "no seafood and dairy free" → both No Seafood **and** Dairy-Free detected
- [ ] "not spicy" → Spicy is **not** picked as a craving
- [ ] "I want noodles" → noodle dishes rank first
- [ ] "Korean food" → Korean dishes first
- [ ] Empty text → friendly message, button does not crash
- [ ] Text longer than 500 characters → stopped with a counter
- [ ] "Edit Preferences" lets me correct what MoodBite understood

### Use My Ingredients
- [ ] ⭐ Add rice, egg, chicken (Enter or comma) → chips appear → Find Recipes shows matching dishes
- [ ] Backspace in the empty box removes the last chip; × removes a chip
- [ ] Quick-add buttons add an ingredient
- [ ] "rice noodles" does **not** count as rice

### Discover
- [ ] ⭐ Region chips filter dishes and show counts
- [ ] Cuisine dropdown + search work together
- [ ] "Show more" loads the next page; a search with no results shows an empty state

### Recipes and restaurants
- [ ] Recipe page shows ingredients and numbered steps; `/recipe/9999` shows "not found"
- [ ] ⭐ Restaurants page: "Use My Location" → real Google results + map (when keys are set)
- [ ] Deny location → can type a city instead
- [ ] No Google key → sample restaurants with the "Sample restaurant (demo data)" label
- [ ] "Directions" opens Google Maps in a new tab

### Favorites and history
- [ ] ⭐ Heart a food → appears on Favorites; heart again → removed
- [ ] Heart while logged out → asked to log in
- [ ] Each recommendation appears once in History; "View again" re-opens it; delete works

### Errors and loading
- [ ] Stop the backend → pages show "Can't reach the server" instead of a blank screen
- [ ] Every list shows a loading state, then data or a helpful empty state
- [ ] `/does-not-exist` → friendly 404 page
- [ ] Browser console has no red errors during normal use

### Responsive and accessibility
- [ ] ⭐ 360px, 768px, 1024px, 1440px wide: no sideways scrolling, text readable
- [ ] ⭐ On phone width the ☰ menu opens, closes with ✕, Escape, or after picking a page
- [ ] Tab through a page: skip link appears first, focus outline is always visible, all buttons reachable
- [ ] Images have alt text; icon-only buttons have labels (screen reader or DevTools → Accessibility)

### Security spot-checks
- [ ] `backend/.env` is **not** listed by `git status` and not on GitHub
- [ ] DevTools → Sources: no database password, JWT secret, Places key or AI key in the JS bundle
- [ ] Request `/api/favorites` without a token → 401 JSON error
- [ ] Error responses never show a Python stack trace
