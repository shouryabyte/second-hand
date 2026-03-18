# Database Schema (MongoDB)

This is the **Days 1–3 database design** for the prototype.

- Implemented: `users`, `listings`
- Planned next: `messages`, `wishlists`, `transactions`

## `users`

Represents buyers/sellers.

- `_id`: ObjectId
- `email`: string (unique, optional if phone-only)
- `phone`: string (unique, optional if email-only)
- `passwordHash`: string (nullable for OTP-only / social auth)
- `displayName`: string
- `photoUrl`: string (optional)
- `role`: `"user" | "admin"` (default `"user"`)
- `isVerifiedSeller`: boolean (default `false`)
- `ratingAvg`: number (default `0`)
- `ratingCount`: number (default `0`)
- `createdAt`, `updatedAt`: Date

Indexes:
- unique `email` (sparse)
- unique `phone` (sparse)

## `listings`

- `_id`: ObjectId
- `sellerId`: ObjectId (ref `users`)
- `title`: string
- `description`: string
- `price`: number
- `currency`: string (e.g. `"INR"`)
- `category`: string (enum: Electronics, Furniture, Books, Vehicles, Clothes, Gadgets, Appliances, Other)
- `condition`: `"new" | "like_new" | "used"`
- `location`: `{ city, state, country, lat, lng }`
- `locationText`: string (lowercased, derived for filtering)
- `images`: array of `{ url, publicId, originalName, mimeType, size }`
- `status`: `"active" | "sold" | "removed"`
- `createdAt`, `updatedAt`: Date

Indexes:
- text index on `title`, `description`
- compound index for `category`, `price`, `status`, `createdAt`

## `messages` (planned)

- `_id`: ObjectId
- `threadId`: ObjectId
- `fromUserId`: ObjectId
- `toUserId`: ObjectId
- `listingId`: ObjectId (optional)
- `type`: `"text" | "voice"`
- `text`: string (optional)
- `voiceUrl`: string (optional)
- `isSpam`: boolean (default `false`)
- `createdAt`: Date

## `wishlists` (planned)

- `_id`: ObjectId
- `userId`: ObjectId
- `listingIds`: ObjectId[]
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

