# Deploying MoodBite

Three pieces, three free services:

```
Vercel (React site)  ──HTTPS──▶  Render (Flask API, gunicorn)  ──▶  MongoDB Atlas
 moodbite.vercel.app              moodbite-api.onrender.com           (already set up)
```

Deploy in this order: **database → backend → frontend → connect them back**.

---

## 1. Production database (MongoDB Atlas)

You already use Atlas, so the data is there. For production:

1. **Database Access → Add New Database User**: make a *new* user just for
   the deployed app, with a long generated password and the role
   "Read and write to any database". Don't reuse the password from your laptop.
2. **Network Access → Add IP Address**: Render's free plan has no fixed IP, so
   add `0.0.0.0/0` (allow from anywhere). The strong password is what protects
   the database. If you later pay for a fixed IP, list only that.
3. Copy the connection string (**Connect → Drivers**) and put the new
   username and password into it. This becomes `MONGODB_URI`.
4. Keep `MONGO_DB_NAME=Moodbite` so the deployed site uses the same data.
   Run `python seed.py` once from your laptop if the foods aren't there yet.

## 2. Backend on Render

1. Push the repo to GitHub, then sign in to <https://render.com> with GitHub.
2. **New → Blueprint** → pick the repo. Render reads `render.yaml`:
   - root folder `backend`
   - build: `pip install -r requirements.txt`
   - start: `gunicorn app:app --workers 2 --timeout 60`
   - health check: `/api/health`

   (Or **New → Web Service** and type those values in yourself.)
3. Fill in the secret environment variables when Render asks:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | the Atlas string from step 1 |
   | `JWT_SECRET_KEY` | a **new** value from `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `SECRET_KEY` | another new random value |
   | `FRONTEND_URL` | leave as `http://localhost:5173` for now; you'll update it in step 4 |
   | `GOOGLE_PLACES_API_KEY` | optional, your **server** key |
   | `AI_API_KEY` | optional |

   `FLASK_DEBUG=0` and `PYTHON_VERSION` are already set by `render.yaml`.
4. Deploy, then open `https://<your-service>.onrender.com/api/health`. You should see `{"status": "ok"}`.

**Why gunicorn?** `python app.py` starts Flask's development server: one
request at a time, with debug tools. Gunicorn is a production web server that
runs several copies (workers) of the app safely.

> Free Render services fall asleep after ~15 minutes without visitors. The
> first request after that takes 30–60 seconds. Open the site a minute
> before a demo.

## 3. Frontend on Vercel

1. Sign in to <https://vercel.com> with GitHub → **Add New → Project** → pick the repo.
2. **Root Directory: `frontend`**. Vercel detects Vite: build `npm run build`, output `dist`.
3. Environment variables:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-service>.onrender.com` |
   | `VITE_GOOGLE_MAPS_API_KEY` | your **browser** Maps key (optional) |
   | `VITE_GOOGLE_MAP_ID` | optional |

4. Deploy. `frontend/vercel.json` sends every path to `index.html`, so
   refreshing `/favorites` or `/recipe/3` works instead of showing a Vercel 404.

> `VITE_` values are built into the public JavaScript. Only put keys there
> that are safe to be seen, such as a Maps key restricted to your domain.
> Never put the database, JWT, Places or AI keys there.

## 4. Connect them back

1. **CORS**: in Render, set `FRONTEND_URL` to your Vercel address, e.g.
   `https://moodbite.vercel.app`. Separate several addresses with commas:
   `https://moodbite.vercel.app,http://localhost:5173`. No trailing slash
   is needed. Render restarts the API automatically.
2. **Google Cloud → Credentials**: add `https://moodbite.vercel.app/*` to the
   browser Maps key's allowed websites.
3. Open the Vercel site and run the ⭐ items in [TESTING.md](TESTING.md).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Can't reach the server" on the live site | `VITE_API_URL` wrong (redeploy Vercel after changing it), or Render is waking up |
| Console: "blocked by CORS policy" | `FRONTEND_URL` on Render doesn't exactly match the Vercel address (`https://`, no typo) |
| Render log: "Could not connect to MongoDB" | Atlas Network Access missing `0.0.0.0/0`, or a wrong password in `MONGODB_URI` |
| Render log: "JWT_SECRET_KEY is missing" | add it in Render → Environment |
| Map is grey with "development purposes only" | Maps key restrictions or billing not set up |
| Refreshing a page gives 404 on Vercel | Root Directory isn't `frontend`, so `vercel.json` isn't used |
