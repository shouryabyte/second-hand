# Second-Hand Items Marketplace — Prototype

This repo contains a demo marketplace platform (monorepo):

- `backend/`: Node.js + Express + MongoDB (JWT auth + listings + search)
- `frontend/`: Next.js app (professional UI, auth, profile, browse/search, create listing, listing detail)

## Progress (Days 1–3)

### Day 1 (completed)

- Project scaffolding (frontend + backend)
- Database design doc (`docs/DB_SCHEMA.md`)
- User authentication using JWT
  - Email + password
  - Phone OTP (demo: OTP shown in UI)
- Protected profile page

### Day 2 (completed)

- Product listing system
  - Create listing with title, description, price, category, condition
  - Upload up to 6 images (stored locally under `backend/uploads`)
  - Location fields (city/state/country)

### Day 3 (completed)

- Search & filters
  - Keyword search
  - Filter by category, price range, and location
  - Sort by recent / price asc / price desc

## Quick start (local)

### 1) MongoDB

```bash
docker compose up -d
```

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:4000`.

### 3) Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## API endpoints

### Auth

- `POST /api/auth/register` — email + password (+ optional phone)
- `POST /api/auth/login` — email + password
- `POST /api/auth/request-otp` — phone OTP (demo)
- `POST /api/auth/verify-otp` — phone OTP -> JWT
- `GET /api/me` — current user profile (requires `Authorization: Bearer <token>`)

### Listings

- `POST /api/listings` — create listing (requires JWT, `multipart/form-data`, images field name: `images`)
- `GET /api/listings` — browse/search with query params: `q`, `category`, `minPrice`, `maxPrice`, `city`, `state`, `country`, `sort`, `page`, `limit`
- `GET /api/listings/:id` — listing detail

Uploads are served at `GET /uploads/<filename>`.

