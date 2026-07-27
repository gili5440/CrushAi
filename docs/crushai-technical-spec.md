# CrushAI — Technical Specification (MVP)

## 1. Product Summary
CrushAI is an AI-powered dating app centered on **visual style search** instead of swiping. Users upload an "inspiration" photo (a look/style they're attracted to), and the system returns app users with visually similar characteristics using image embeddings — similar to Google Lens / Pinterest visual search. The system does **not** identify or locate the specific person in the uploaded photo; the photo is used only as a style signal.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile Frontend | React Native (Expo recommended for MVP speed) | iOS + Android from one codebase |
| Backend API | Node.js (NestJS or Express + TypeScript) | Modular, typed, scalable |
| Database | PostgreSQL | Relational data: users, profiles, matches, chat |
| Vector Search | pgvector (Postgres extension) or a managed vector DB (Pinecone/Weaviate) for embeddings similarity search | Start with pgvector for MVP simplicity — same DB, fewer moving parts |
| Object Storage | AWS S3 / Cloudflare R2 | Profile photos, inspiration photos (short retention) |
| AI Embeddings | CLIP-based model (OpenAI CLIP or open-source equivalent, e.g. via a hosted inference endpoint) | Generates a vector per photo for similarity comparison |
| Auth | Firebase Auth or Auth0 (email/password, Google, Apple) | Avoid building auth from scratch |
| Push Notifications | Firebase Cloud Messaging (FCM) + APNs | Cross-platform |
| Realtime Chat | Socket.io or a managed service (e.g. Pusher / Ably) | Typing indicators, read receipts |
| Payments | Stripe (or RevenueCat for mobile subscriptions) | Premium tier billing |
| Admin Panel | Simple React web app, separate from mobile app, behind auth | Internal only |

---

## 3. Database Schema (PostgreSQL)

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| email | text, unique | |
| password_hash | text | null if OAuth-only |
| auth_provider | enum('email','google','apple') | |
| created_at | timestamp | |
| is_verified | boolean | |
| is_banned | boolean | |
| role | enum('user','admin') | |

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| display_name | text | |
| birth_date | date | for age calculation |
| gender | text | |
| bio | text | |
| profession | text | |
| education | text, nullable | |
| looking_for | text | |
| region | text | |
| latitude / longitude | float | for distance filtering |
| height_cm | int, nullable | |
| religion | text, nullable | |
| smoking | enum('never','sometimes','regularly'), nullable | |
| lifestyle_tags | text[] | interests / lifestyle |
| visible_in_ai_search | boolean | opt-in flag (privacy requirement) |
| updated_at | timestamp | |

### `profile_photos`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| profile_id | uuid, FK | |
| storage_url | text | |
| embedding | vector(512) | pgvector column — generated on upload |
| is_primary | boolean | |
| created_at | timestamp | |

### `search_queries`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | |
| inspiration_photo_url | text | short-lived, auto-deleted per retention policy |
| embedding | vector(512) | computed once, used for the search, then can be discarded |
| filters_json | jsonb | age/distance/etc. snapshot at time of search |
| created_at | timestamp | |

### `interactions`
Tracks likes, saves, profile views, and search-result clicks — this is the taste-learning signal.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | actor |
| target_profile_id | uuid, FK | |
| type | enum('view','save','like','pass','chat_request') | |
| created_at | timestamp | |

### `matches`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_a_id / user_b_id | uuid, FK | |
| created_at | timestamp | |
| status | enum('active','unmatched') | |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| match_id | uuid, FK | |
| sender_id | uuid, FK | |
| content | text | |
| media_url | text, nullable | |
| read_at | timestamp, nullable | |
| created_at | timestamp | |

### `reports`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| reporter_id | uuid, FK | |
| reported_profile_id | uuid, FK | |
| reason | text | |
| status | enum('open','reviewed','actioned') | |
| created_at | timestamp | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | |
| tier | enum('free','premium') | |
| provider_subscription_id | text | Stripe/RevenueCat ref |
| current_period_end | timestamp | |
| status | enum('active','canceled','past_due') | |

---

## 4. Visual Search Flow (Core Feature)

1. **Upload**: User uploads inspiration photo(s) via app → uploaded to short-retention storage bucket.
2. **Embedding generation**: Backend sends image to embedding model (CLIP or similar) → receives a vector (e.g. 512-dim).
3. **Similarity search**: Backend runs a nearest-neighbor query against `profile_photos.embedding` using pgvector's `<->` cosine/L2 distance operator, filtered to `visible_in_ai_search = true` and any active filters (age, distance, gender, etc.).
4. **Ranking**: Combine visual similarity score with a secondary "taste score" derived from the user's `interactions` history (e.g. boost profiles similar to previously liked ones).
5. **Results**: Return paginated grid of candidate profiles.
6. **Fallback**: If too few visually-similar results exist (cold start problem), broaden search radius or fall back to filter-based ranking, clearly signaling this to the user ("expanding your search").
7. **Retention**: Inspiration photo + its embedding auto-deleted after N days (e.g. 30) or immediately after the session, per privacy policy — configurable.

> **Privacy note**: `profile_photos.embedding` and `search_queries.embedding` are effectively biometric-adjacent data. Encrypt at rest, restrict access via row-level security, and never expose raw embeddings via any API response.

---

## 5. API Surface (high-level)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/oauth/google
POST   /auth/oauth/apple
POST   /auth/verify-email
POST   /auth/reset-password

GET    /profile/me
PUT    /profile/me
POST   /profile/me/photos
DELETE /profile/me/photos/:id
PUT    /profile/me/visibility        # visible_in_ai_search toggle

POST   /search/visual                # upload inspiration photo(s) + filters -> results
GET    /search/results/:searchId     # paginated results

POST   /interactions                 # like / save / pass / view
GET    /matches
GET    /matches/:id/messages
POST   /matches/:id/messages
WS     /realtime                     # typing indicators, read receipts, new message push

POST   /reports
GET    /subscriptions/me
POST   /subscriptions/checkout
POST   /subscriptions/webhook        # Stripe/RevenueCat webhook

# Admin (separate auth scope)
GET    /admin/users
POST   /admin/users/:id/ban
GET    /admin/reports
POST   /admin/reports/:id/action
GET    /admin/stats
```

---

## 6. MVP Scope (What to Build First)

**Phase 1 — Core loop**
- Auth (email + Google)
- Profile creation + photo upload with embedding generation
- Visual search (upload → embedding → pgvector search → results grid)
- Basic filters (age, distance, gender)
- Like / match / basic chat

**Phase 2 — Retention & monetization**
- Taste-learning ranking boost from interactions
- Push notifications
- Premium tier + Stripe/RevenueCat integration
- Report/block system

**Phase 3 — Admin & scale**
- Admin panel
- Usage analytics dashboard
- Performance tuning (indexing, caching, CDN for images)

---

## 7. Key Risks to Flag During Build

- **Cold start**: visual search needs a critical mass of opted-in profiles with embeddings to feel useful — plan a fallback UX for low-density search results.
- **Biometric-adjacent data handling**: embeddings should be treated as sensitive data (encryption, access control, retention limits), even though the system doesn't do facial recognition per se.
- **Misuse potential**: rate-limit visual searches and monitor for patterns suggesting someone is trying to find a specific real person rather than a "style."
- **Data pipeline for taste-learning**: instrument `interactions` tracking from day one — retrofitting event tracking later is expensive.
