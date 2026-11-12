import { TIME_OPTIONS } from '../data/options.js'

// ---------------------------------------------------------------------
// Every call to the Flask backend lives in this file, so components never
// call fetch() themselves. If the API address or format changes, this is
// the only file to update.
//
// The ONE place the backend address is set (Stage 7):
//   development: frontend/.env        VITE_API_URL=http://localhost:5000
//   production:  the hosting settings  VITE_API_URL=https://<your-backend>.onrender.com
// "/api" is added for you if it's missing.
// ---------------------------------------------------------------------
export function buildApiUrl(address) {
  const base = (address || 'http://localhost:5000').trim().replace(/\/+$/, '') // drop trailing "/"
  return base.endsWith('/api') ? base : `${base}/api`
}

export const API_URL = buildApiUrl(import.meta.env.VITE_API_URL)

// ----- Login token storage (Stage 4) -----
// After login, Flask gives us a token (JWT) that proves who the user is.
// We keep it in localStorage so the login survives a page refresh.
//
// Learning-project note: localStorage is simple, but any JavaScript on the
// page can read it. Production apps often use an HTTP-only cookie instead,
// which JavaScript can't read. We never store the password itself.
const TOKEN_KEY = 'moodbite_token'

// Sent when the server says our token is no longer valid (expired, etc.),
// so AuthContext can log the user out everywhere at once.
export const SESSION_ENDED_EVENT = 'moodbite-session-ended'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null // storage blocked (e.g. some private windows)
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // If storage is blocked, the login just won't survive a refresh.
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // nothing to remove
  }
}

// Sends one request and returns the JSON body.
//   options.method   'GET' (default), 'POST', 'PUT', 'DELETE'
//   options.body     an object to send as JSON
//   options.sendToken  false for login/register (no token needed)
// If anything goes wrong it throws an Error with:
//   error.message  a friendly message we can show on the page
//   error.status   the HTTP status code (401, 404...), or 0 if the
//                  server couldn't be reached at all
async function request(path, { method = 'GET', body, sendToken = true } = {}) {
  const token = sendToken ? getToken() : null
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  // This is how Flask knows who we are: "Authorization: Bearer <token>"
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch() only throws when there is no response at all
    // (Flask not running, wrong address, no internet...).
    const error = new Error("We couldn't connect to the server. Please check your connection and try again.")
    error.status = 0
    throw error
  }

  // If the body isn't valid JSON, use an empty object instead of crashing.
  const data = await response.json().catch(() => ({}))

  // We sent a token but the server rejected it: the login has ended.
  if (response.status === 401 && token) {
    removeToken()
    window.dispatchEvent(new Event(SESSION_ENDED_EVENT))
  }

  if (!response.ok) {
    // Our API always sends a short, friendly "error" message. For server
    // crashes (500+) we show a generic one instead of anything technical.
    const friendly = response.status >= 500 ? 'Something went wrong. Please try again.' : data.message || data.error
    const error = new Error(friendly || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

// ===== Foods, recipes, restaurants (Stage 3) =====

// GET /api/foods  ->  [food, food, ...]
export async function getFoods() {
  const data = await request('/foods')
  return data.foods
}

// GET /api/foods/:id/recipe  ->  { food, recipe }
export function getRecipe(id) {
  return request(`/foods/${id}/recipe`)
}

// Google charges for every search, so if the SAME search is already on its
// way (React's development mode starts every page's effects twice), share
// that one request instead of sending a second, identical one.
const searchesInProgress = new Map() // path -> Promise

function requestOnce(path) {
  if (!searchesInProgress.has(path)) {
    const promise = request(path).finally(() => searchesInProgress.delete(path))
    searchesInProgress.set(path, promise)
  }
  return searchesInProgress.get(path)
}

// GET /api/foods/:id/nearby  ->  { food, source, message, center, restaurants }
// Stage 5: real restaurants from Google Places (through Flask).
//   search = { lat, lng }  near the user, or  { near: 'Toronto' }  in a city
// source is "google", or "sample" if Google isn't set up or can't be reached.
export function getNearbyRestaurants(foodId, search = {}) {
  const params = new URLSearchParams()
  if (search.lat !== undefined && search.lng !== undefined) {
    params.set('lat', search.lat)
    params.set('lng', search.lng)
  }
  if (search.near) params.set('near', search.near)
  const query = params.toString()
  return requestOnce(`/foods/${foodId}/nearby${query ? `?${query}` : ''}`)
}

// POST /api/recommendations  ->  { recommendations: [...], savedToHistory }
// Turns the answers stored in AppContext into the JSON body Flask expects.
// If the user is logged in, the token is sent too, so Flask saves the
// session to their History.
export function getRecommendations(answers) {
  const { mood, preferences, cookOrEat, timeLimit, budget, dietary, surpriseMe } = answers

  // "Surprise Me", or the user opened the page without answering.
  const body =
    surpriseMe || !mood
      ? { surprise: true }
      : {
          mood,
          preferences,
          choice: cookOrEat || 'either',
          // Send the number of minutes (e.g. 30), or null for "no limit".
          time: TIME_OPTIONS.find((option) => option.id === timeLimit)?.maxMinutes ?? null,
          budget: budget || 'any',
          dietary,
        }

  return request('/recommendations', { method: 'POST', body })
}

// ===== Accounts (Stage 4) =====

// POST /api/auth/register  ->  { message }
export function registerUser({ name, email, password }) {
  return request('/auth/register', { method: 'POST', body: { name, email, password }, sendToken: false })
}

// POST /api/auth/login  ->  { message, user, token }
export function loginUser({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password }, sendToken: false })
}

// GET /api/auth/me  ->  user   (checks the saved token after a refresh)
export async function getCurrentUser() {
  const data = await request('/auth/me')
  return data.user
}

// GET /api/profile  ->  { user, favoritesCount, historyCount }
export function getProfile() {
  return request('/profile')
}

// PUT /api/profile  ->  { user, favoritesCount, historyCount }
export function updateProfile({ name, email }) {
  return request('/profile', { method: 'PUT', body: { name, email } })
}

// ===== Favorites (Stage 4) =====

// GET /api/favorites  ->  [favorite, ...]
export async function getFavorites() {
  const data = await request('/favorites')
  return data.favorites
}

// POST /api/favorites  ->  { message, favorite }
// Pass ONE of: { foodId }, { restaurantId } (sample), { placeId } (Google).
export function addFavorite({ foodId, restaurantId, placeId }) {
  let body
  if (foodId !== undefined) body = { food_id: foodId }
  else if (placeId !== undefined) body = { place_id: placeId }
  else body = { restaurant_id: restaurantId }
  return request('/favorites', { method: 'POST', body })
}

// DELETE /api/favorites/:id  ->  { message }
export function removeFavorite(favoriteId) {
  return request(`/favorites/${favoriteId}`, { method: 'DELETE' })
}

// ===== History (Stage 4) =====

// GET /api/history  ->  [session, ...] newest first
export async function getHistory() {
  const data = await request('/history')
  return data.history
}

// DELETE /api/history/:id
export function deleteHistoryItem(id) {
  return request(`/history/${id}`, { method: 'DELETE' })
}

// DELETE /api/history  (clears everything)
export function clearHistory() {
  return request('/history', { method: 'DELETE' })
}

// ===== Smart recommendations (Stage 6) =====

// POST /api/ai/recommend
//   { message }               -> MoodBite reads what the user typed
//   { message, preferences }  -> after "Edit Preferences" (skip reading)
// Returns { understood, parser, parsed_preferences, recommendations,
//           savedToHistory, message }
export function smartRecommend({ message, preferences }) {
  const body = preferences ? { message, preferences } : { message }
  return request('/ai/recommend', { method: 'POST', body })
}
