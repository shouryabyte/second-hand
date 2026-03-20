# Second-Hand Items Marketplace — Prototype

Monorepo:

- `backend/`: Node.js + Express + MongoDB (JWT auth, listings, wishlist, messaging)
- `frontend/`: Next.js app (auth, profile, browse/search, create listing, listing detail, wishlist, messages)

## Features

- User authentication
  - Email/password
  - Phone OTP (prototype flow)
- Listings
  - Create listing with images (Cloudinary by default; local fallback available)
  - Browse + keyword search + filters (category, price, location)
  - Listing detail page
- Messaging
  - Buyer ↔ seller chat per listing
- Wishlist
  - Save/unsave items

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

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `GET /api/me`

### Listings

- `POST /api/listings` (JWT + `multipart/form-data`, images field: `images`)
- `GET /api/listings`
- `GET /api/listings/:id`

### Threads / messages

- `POST /api/threads` (body: `{ listingId }`)
- `GET /api/threads`
- `GET /api/threads/:id/messages`
- `POST /api/threads/:id/messages` (body: `{ text }`)

### Wishlist

- `GET /api/wishlist/ids`
- `GET /api/wishlist`
- `POST /api/wishlist/:listingId`
- `DELETE /api/wishlist/:listingId`

