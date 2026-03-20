# Database Schema (MongoDB)

This is the database design for the prototype.

Implemented:
- `users`
- `listings`
- `threads`
- `messages`
- `wishlists`

Planned:
- `transactions`

## `users`

Represents buyers/sellers.

- `_id`: ObjectId
- `email`: string (unique, optional if phone-only)
- `phone`: string (unique, optional if email-only)
- `passwordHash`: string (nullable for OTP-only)
- `displayName`: string
- `role`: `"user" | "admin"`
- `isVerifiedSeller`: boolean
- `ratingAvg`: number
- `ratingCount`: number
- `createdAt`, `updatedAt`: Date

## `listings`

- `_id`: ObjectId
- `sellerId`: ObjectId (ref `users`)
- `title`: string
- `description`: string
- `price`: number
- `currency`: string
- `category`: string
- `condition`: `"new" | "like_new" | "used"`
- `location`: `{ city, state, country, lat, lng }`
- `locationText`: string (derived)
- `images`: array of `{ url, publicId, originalName, mimeType, size }`
- `status`: `"active" | "sold" | "removed"`
- `createdAt`, `updatedAt`: Date

## `threads`

Conversation container (per listing + buyer/seller pair).

- `_id`: ObjectId
- `listingId`: ObjectId (ref `listings`)
- `participants`: ObjectId[] (exactly 2; refs `users`)
- `participantsKey`: string (sorted user ids)
- `listingKey`: string
- `lastMessageAt`: Date
- `lastMessageText`: string
- `createdAt`, `updatedAt`: Date

## `messages`

- `_id`: ObjectId
- `threadId`: ObjectId (ref `threads`)
- `fromUserId`: ObjectId (ref `users`)
- `type`: `"text"`
- `text`: string
- `isSpam`: boolean
- `createdAt`, `updatedAt`: Date

## `wishlists`

- `_id`: ObjectId
- `userId`: ObjectId (ref `users`, unique)
- `listingIds`: ObjectId[] (refs `listings`)
- `createdAt`, `updatedAt`: Date

## `transactions` (planned)

- `_id`: ObjectId
- `buyerId`: ObjectId
- `sellerId`: ObjectId
- `listingId`: ObjectId
- `amount`: number
- `paymentProvider`: `"upi" | "card" | "cash"`
- `status`: `"created" | "escrowed" | "released" | "disputed" | "refunded"`
- `createdAt`, `updatedAt`: Date
