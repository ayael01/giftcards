# Gift Cards MVP

Minimal MVP for tracking personal gift cards and checking which cards can be used at a merchant.

## Project structure

- `backend/` - FastAPI + SQLAlchemy + PostgreSQL
- `frontend/` - React (Vite)

## Backend setup

1. Create env file:

```bash
cd backend
cp .env.example .env
```

2. Confirm `DATABASE_URL` points to your running PostgreSQL instance, for example:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/giftcards
```

`postgresql+psycopg2://...` is also accepted and automatically translated to `psycopg` internally.

3. Install dependencies and run server:

```bash
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

API base URL: `http://localhost:8000`

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Included MVP APIs

- `POST /admin/gift-card-types`
- `GET /admin/gift-card-types`
- `POST /admin/merchants`
- `GET /admin/merchants`
- `GET /admin/merchants/suggest?prefix=Go&limit=8`
- `POST /admin/gift-card-types/{giftcard_type_id}/merchants/{merchant_id}`
- `GET /admin/gift-card-type-merchants`
- `DELETE /admin/gift-card-types/{giftcard_type_id}/merchants/{merchant_id}`
- `POST /user-gift-cards`
- `GET /user-gift-cards`
- `PATCH /user-gift-cards/{id}`
- `DELETE /user-gift-cards/{id}`
- `GET /search?merchant=Golf`

## Notes

- Tables are auto-created on backend startup via SQLAlchemy metadata.
- This MVP assumes a single local user (no authentication).

## Cloud deployment (free-tier friendly)

This repository is prepared for:
- Backend + PostgreSQL: Render
- Frontend: Vercel

### 1) Deploy backend + DB on Render

1. In Render, create a new **Blueprint** and point it to this GitHub repo.
2. Render will read [`render.yaml`](/Users/eliayash/Projects/giftcards/render.yaml) and create:
   - `giftcards-db` PostgreSQL database
   - `giftcards-api` FastAPI web service
3. After first deploy, copy your frontend URL (from Vercel step below) into Render env var:
   - `FRONTEND_ORIGINS=https://<your-vercel-app>.vercel.app`
4. Redeploy `giftcards-api`.

### 2) Deploy frontend on Vercel

1. Create a new Vercel project from this repo.
2. Set the **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-render-api>.onrender.com`
4. Deploy.

### 3) Connect both sides

- Ensure Render `FRONTEND_ORIGINS` is the exact Vercel URL.
- Ensure Vercel `VITE_API_BASE_URL` is the exact Render API URL.
- Test:
  - `GET https://<render-api>/health`
  - Open Vercel app and run merchant search.
