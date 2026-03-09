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
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Included MVP APIs

- `POST /admin/gift-card-types`
- `GET /admin/gift-card-types`
- `POST /admin/merchants`
- `GET /admin/merchants`
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
