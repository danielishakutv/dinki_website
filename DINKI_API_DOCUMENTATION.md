# Dinki Africa - Complete Backend API Documentation

> **Base URL:** `https://be.dinki.africa/v1`
> **Frontend URL:** `https://dinki.africa`
> **Version:** 1.0
> **Last Updated:** April 14, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication Flow](#2-authentication-flow)
3. [Frontend API Client Setup](#3-frontend-api-client-setup)
4. [Global Patterns](#4-global-patterns)
5. [Auth Endpoints](#5-auth-endpoints)
6. [Users Endpoints](#6-users-endpoints)
7. [Customers Endpoints](#7-customers-endpoints)
8. [Jobs Endpoints](#8-jobs-endpoints)
9. [Orders Endpoints](#9-orders-endpoints)
10. [Reviews Endpoints](#10-reviews-endpoints)
11. [Favourites Endpoints](#11-favourites-endpoints)
12. [Messaging Endpoints](#12-messaging-endpoints)
13. [Notifications Endpoints](#13-notifications-endpoints)
14. [Storefronts Endpoints](#14-storefronts-endpoints)
15. [Uploads Endpoints](#15-uploads-endpoints)
16. [Socket.IO Real-Time Events](#16-socketio-real-time-events)
17. [Health Check](#17-health-check)
18. [Error Reference](#18-error-reference)
19. [Frontend Integration Guide](#19-frontend-integration-guide)

---

## 1. Architecture Overview

### Stack
- **Backend:** Node.js 20, Express 4, PostgreSQL 16, Redis 7, Knex ORM
- **Frontend:** React 18, Vite 6, Tailwind CSS, React Router v6
- **Real-time:** Socket.IO 4.7.5
- **File Processing:** Multer + Sharp (auto WebP conversion)
- **Deployment:** Docker (API + DB + Redis), Apache reverse proxy, Cloudflare

### Infrastructure
| Service           | Host                          | Port     |
|-------------------|-------------------------------|----------|
| API               | `be.dinki.africa`             | 3101→3000|
| Frontend          | `dinki.africa`                | Static   |
| PostgreSQL        | Docker `dinki-db`             | 5433     |
| Redis             | Docker `dinki-redis`          | 6380     |
| Socket.IO         | `be.dinki.africa` (same port) | ws://    |

### Request Flow
```
Browser → Cloudflare → Apache → Docker dinki-api (port 3000)
                                   ├── PostgreSQL (port 5433)
                                   └── Redis (port 6380)
```

### Security Stack
- Helmet (security headers)
- HPP (HTTP parameter pollution prevention)
- CORS with credentials
- Rate limiting on auth endpoints
- bcrypt (12 rounds) for passwords
- JWT (15min access + 7day refresh with rotation)
- httpOnly cookies for refresh tokens

---

## 2. Authentication Flow

### Token Architecture
- **Access Token:** JWT, 15 minute expiry, stored in memory (JS variable)
- **Refresh Token:** Random 40-byte hex, 7 day expiry, stored as httpOnly cookie, rotated on each use
- **OTP:** 6-digit numeric, 5 minute expiry, stored in Redis

### JWT Payload
```json
{
  "userId": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
  "role": "tailor",
  "email": "test@dinki.africa",
  "iat": 1776096789,
  "exp": 1776097689
}
```

### Signup Flow
```
1. POST /auth/signup         → Account created, OTP emailed
2. POST /auth/verify-email   → Returns accessToken + sets refreshToken cookie
3. GET  /users/me            → Fetch full user profile
```

### Login Flow
```
1. POST /auth/login          → Returns accessToken + sets refreshToken cookie
2. GET  /users/me            → Fetch full user profile (optional, login already returns user object)
```

### Session Restoration (on page load)
```
1. POST /auth/refresh        → Uses refreshToken cookie, returns new accessToken + rotates cookie
2. GET  /users/me            → Fetch full user profile using new accessToken
```

### Token Refresh (on 401 response)
```
1. Any API call returns 401
2. Frontend auto-calls POST /auth/refresh
3. Retries original request with new accessToken
4. If refresh also fails → redirect to login
```

### Password Reset Flow
```
1. POST /auth/forgot-password → Reset token emailed (1hr expiry)
2. POST /auth/reset-password  → Validates token, resets password, invalidates all sessions
```

---

## 3. Frontend API Client Setup

### Configuration
The frontend uses a centralized API client at `src/lib/api.js` with:
- In-memory access token storage (not localStorage — prevents XSS)
- Automatic token refresh on 401 responses
- Concurrent refresh prevention (single inflight refresh)
- httpOnly cookie handling via `credentials: 'include'`

### Environment Variable
```
VITE_API_URL=https://be.dinki.africa/v1
```

### Import Pattern
```javascript
import { auth, users, customers, jobs, orders, reviews, favourites, conversations, notifications, uploads, storefronts, setToken, clearToken, getToken } from '../lib/api';
```

### Request Wrapper
Every API function returns a Promise that resolves to:
```javascript
// Success
{ success: true, data: { ... }, statusCode: 200 }

// Error (thrown as Error)
{
  message: "Human-readable error",
  code: "ERROR_CODE",
  status: 401,
  details: [{ field: "email", message: "Valid email is required" }]
}
```

### How to handle responses
```javascript
// Standard pattern
try {
  const res = await customers.list({ limit: 50 });
  // res.data is the array of customers
  // res.pagination has { page, limit, total, pages }
  setCustomers(res.data);
} catch (err) {
  console.error(err.code, err.message);
}

// For paginated endpoints
const res = await jobs.list({ page: 1, limit: 20 });
const jobList = res.data;           // Array of job objects
const pageInfo = res.pagination;     // { page: 1, limit: 20, total: 45, pages: 3 }
```

---

## 4. Global Patterns

### All Requests Must Include
| Header | When | Value |
|--------|------|-------|
| `Authorization` | Authenticated endpoints | `Bearer <accessToken>` |
| `Content-Type` | JSON body | `application/json` |
| Cookie (auto) | All requests | `credentials: 'include'` sends httpOnly cookie |

### Response Envelope
Every successful response:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }      // Only on list endpoints
}
```

Every error response:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [...]          // Only on validation errors
  }
}
```

### Pagination (List Endpoints)
List endpoints that support pagination return:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

Query parameters:
- `page` (integer, min 1, default 1)
- `limit` (integer, min 1, max varies per endpoint)

### Role-Based Access
| Role | Can Access |
|------|-----------|
| `tailor` | Customers, Jobs, Storefronts (own), Orders (incoming) |
| `customer` | Orders (own), Reviews, Favourites, Storefronts (browse) |
| Both | Users/me, Messaging, Notifications, Uploads |

### Request Body Size Limit
JSON body max: **10kb**

---

## 5. Auth Endpoints

**Prefix:** `/v1/auth`
**Rate Limits:** 5 attempts per 15 minutes (signup, login, verify, reset), 3 per 60 min (forgot-password)

---

### POST `/auth/signup`

Creates a new account and sends OTP to email.

**Auth Required:** No
**Rate Limited:** Yes (5/15min)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tailor@example.com",
    "password": "MyPass123",
    "name": "Ibrahim Fashions",
    "role": "tailor"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email, normalized |
| `password` | string | Yes | Min 8 chars, must contain 1 uppercase + 1 digit |
| `name` | string | Yes | 2-100 characters |
| `role` | string | Yes | `"customer"` or `"tailor"` |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Account created. Please verify your email.",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 409 | `EMAIL_EXISTS` | Email already registered |
| 400 | `VALIDATION_ERROR` | Invalid fields |
| 429 | `RATE_LIMITED` | Too many attempts |

**Frontend Usage:**
```javascript
const res = await auth.signup({ email, password, name, role });
// res.data.userId → store for verify step
```

**Side Effects:** OTP stored in Redis (`otp:<email>`, 5min TTL). If tailor, creates `tailor_profiles` row with auto-generated storefront slug.

---

### POST `/auth/verify-email`

Verifies OTP and activates account. Returns auth tokens.

**Auth Required:** No

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tailor@example.com",
    "otp": "749955"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email |
| `otp` | string | Yes | Exactly 6 digits, numeric only |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
      "name": "Ibrahim Fashions",
      "email": "tailor@example.com",
      "role": "tailor"
    }
  }
}
```
**Cookie Set:** `refreshToken` (httpOnly, secure, sameSite=none, 7 day expiry)

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_OTP` | Wrong or expired OTP |
| 404 | `NOT_FOUND` | User not found |

**Frontend Usage:**
```javascript
const res = await auth.verifyEmail({ email, otp });
setToken(res.data.accessToken);  // Store in memory
// res.data.user → set as current user
```

---

### POST `/auth/login`

Authenticates user with email and password. Returns auth tokens.

**Auth Required:** No
**Rate Limited:** Yes (5/15min)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dinki.africa",
    "password": "Test1234"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
      "name": "Test Tailor",
      "email": "test@dinki.africa",
      "role": "tailor",
      "avatar_url": null,
      "initials": "TT",
      "avatar_color": null,
      "onboarding_completed": false,
      "storefront_slug": "test-tailor-RVBd"
    }
  }
}
```
**Cookie Set:** `refreshToken` (httpOnly, secure, sameSite=none, 7 day expiry)

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 403 | `EMAIL_NOT_VERIFIED` | Email not verified (re-sends OTP) |
| 423 | `ACCOUNT_LOCKED` | 10+ failed attempts (30min lock) |

**Frontend Usage:**
```javascript
const res = await auth.login({ email, password });
setToken(res.data.accessToken);
setUser(res.data.user);
// Navigate to dashboard
```

---

### POST `/auth/refresh`

Rotates tokens using the httpOnly refresh cookie. Called automatically by the API client on 401.

**Auth Required:** No (uses cookie)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/refresh \
  --cookie "refreshToken=abc123..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
**Cookie Set:** New rotated `refreshToken`

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 401 | `AUTH_REQUIRED` | No refresh token cookie |
| 401 | `INVALID_TOKEN` | Expired or already-used token |

**Frontend Usage:**
```javascript
// Called automatically by api.js on 401
// Or manually:
const token = await auth.refresh();
if (token) {
  // Session restored
} else {
  // No valid session, redirect to login
}
```

**Important:** Refresh tokens are single-use (rotated). Using an old token invalidates it permanently — this prevents token replay attacks.

---

### POST `/auth/logout`

Clears refresh token and ends session.

**Auth Required:** Yes (Bearer token)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  --cookie "refreshToken=abc123..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out"
  }
}
```
**Cookie Cleared:** `refreshToken`

**Frontend Usage:**
```javascript
await auth.logout();
clearToken();
setUser(null);
// Navigate to landing page
```

---

### POST `/auth/forgot-password`

Sends password reset link to email. Always returns success (prevents email enumeration).

**Auth Required:** No
**Rate Limited:** Yes (3/60min)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@dinki.africa"}'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent."
  }
}
```

**Frontend Usage:**
```javascript
await auth.forgotPassword(email);
// Show "Check your email" message regardless of result
```

---

### POST `/auth/reset-password`

Resets password using token from email. Invalidates all existing sessions.

**Auth Required:** No

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "password": "NewPass123"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `token` | string | Yes | Reset token from email |
| `password` | string | Yes | Min 8 chars, 1 uppercase + 1 digit |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset. Please log in."
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_TOKEN` | Expired or invalid reset token |

**Frontend Usage:**
```javascript
await auth.resetPassword({ token, password });
// Navigate to login page
```

---

### POST `/auth/change-password`

Changes password for logged-in user. Invalidates all sessions (user must re-login).

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/auth/change-password \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test1234",
    "newPassword": "NewPass456"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | Yes | Must match current password |
| `newPassword` | string | Yes | Min 8 chars, 1 uppercase + 1 digit |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed. Please log in again."
  }
}
```
**Cookie Cleared:** `refreshToken`

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_CREDENTIALS` | Current password is wrong |

---

## 6. Users Endpoints

**Prefix:** `/v1/users`
**All endpoints require:** `Authorization: Bearer <accessToken>`

---

### GET `/users/me`

Returns the full profile of the currently authenticated user. For tailors, includes `tailor_profile` with storefront details.

**Auth Required:** Yes

**Request:**
```bash
curl https://be.dinki.africa/v1/users/me \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200) — Tailor:**
```json
{
  "success": true,
  "data": {
    "id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "email": "test@dinki.africa",
    "name": "Test Tailor",
    "phone": "+2348012345678",
    "avatar_url": null,
    "initials": "TT",
    "avatar_color": null,
    "bio": "Expert bespoke tailor with 5 years experience",
    "location_city": "Lagos",
    "location_state": "Lagos",
    "location_country": null,
    "specialties": ["agbada", "senator", "kaftan"],
    "role": "tailor",
    "onboarding_completed": false,
    "preferences": {
      "notifications": true,
      "darkMode": false,
      "language": "en"
    },
    "referral_code": "Ab3xK9mQ",
    "created_at": "2025-06-01T10:00:00.000Z",
    "tailor_profile": {
      "verified": false,
      "completed_jobs": 0,
      "response_time": null,
      "start_price": null,
      "years_experience": null,
      "rating_avg": null,
      "rating_count": 0,
      "storefront_slug": "test-tailor-RVBd",
      "storefront_bio": null,
      "storefront_image": null
    }
  }
}
```

**Success Response (200) — Customer:**
```json
{
  "success": true,
  "data": {
    "id": "2ab03546-a80e-4038-a7a4-48ba8db71365",
    "email": "customer@dinki.africa",
    "name": "Test Customer",
    "phone": null,
    "avatar_url": null,
    "initials": "TC",
    "avatar_color": null,
    "bio": null,
    "location_city": null,
    "location_state": null,
    "location_country": null,
    "specialties": null,
    "role": "customer",
    "onboarding_completed": false,
    "preferences": null,
    "referral_code": "mN7pQ2wX",
    "created_at": "2025-06-01T10:00:00.000Z"
  }
}
```

**Frontend Usage:**
```javascript
const res = await users.getProfile();
const profile = res.data;
// profile.name, profile.email, profile.role, profile.tailor_profile?.storefront_slug
```

---

### PATCH `/users/me`

Updates the current user's profile fields. Only provided fields are updated.

**Auth Required:** Yes

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/users/me \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ibrahim Fashions",
    "bio": "Expert bespoke tailor",
    "phone": "+2348012345678",
    "location_city": "Lagos",
    "location_state": "Lagos",
    "specialties": ["agbada", "senator", "kaftan"]
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | No | 2-100 characters |
| `bio` | string | No | Max 500 characters |
| `phone` | string | No | Max 20 characters |
| `location_city` | string | No | Max 100 characters |
| `location_state` | string | No | Max 100 characters |
| `specialties` | array | No | Max 10 items |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "name": "Ibrahim Fashions",
    "email": "test@dinki.africa",
    "phone": "+2348012345678",
    "bio": "Expert bespoke tailor",
    "avatar_url": null,
    "initials": "IF",
    "location_city": "Lagos",
    "location_state": "Lagos",
    "specialties": ["agbada", "senator", "kaftan"]
  }
}
```

**Frontend Usage:**
```javascript
const res = await users.updateProfile({ name: 'New Name', bio: 'My bio' });
setUser(prev => ({ ...prev, ...res.data }));
```

---

### PATCH `/users/me/avatar`

Uploads and sets user avatar. Image is auto-converted to WebP.

**Auth Required:** Yes

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/users/me/avatar \
  -H "Authorization: Bearer eyJhbGci..." \
  -F "avatar=@photo.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "avatar_url": "/uploads/a1b2c3d4-avatar.webp"
  }
}
```

**Frontend Usage:**
```javascript
const res = await users.updateAvatar(fileInputElement.files[0]);
// res.data.avatar_url → update UI
// Full URL: https://be.dinki.africa + res.data.avatar_url
```

**Note:** Access uploaded files at `https://be.dinki.africa/uploads/<filename>`. Static files are served with 7-day cache headers.

---

### GET `/users/me/stats`

Returns summary statistics for the current user. Response format differs by role.

**Auth Required:** Yes

**Request:**
```bash
curl https://be.dinki.africa/v1/users/me/stats \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200) — Tailor:**
```json
{
  "success": true,
  "data": {
    "customers": 12,
    "activeJobs": 3,
    "completedJobs": 45,
    "pendingInvoices": 2,
    "revenue": 1500000
  }
}
```

**Success Response (200) — Customer:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 8,
    "activeOrders": 2
  }
}
```

**Frontend Usage:**
```javascript
const res = await users.getStats();
const stats = res.data;
// Tailor: stats.customers, stats.activeJobs, stats.completedJobs, stats.pendingInvoices, stats.revenue
// Customer: stats.totalOrders, stats.activeOrders
```

**IMPORTANT for Frontend:** `res.data` is a flat object, NOT an array. Do not call `.map()` on it.

---

### PATCH `/users/me/preferences`

Updates user notification/display preferences. Merges with existing preferences.

**Auth Required:** Yes

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/users/me/preferences \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": true,
    "darkMode": false,
    "language": "en"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `notifications` | boolean | No | |
| `darkMode` | boolean | No | |
| `language` | string | No | `"en"`, `"fr"`, `"ha"`, `"yo"`, or `"ig"` |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": true,
    "darkMode": false,
    "language": "en"
  }
}
```

**Frontend Usage:**
```javascript
const res = await users.updatePreferences({ darkMode: true });
```

---

### POST `/users/me/onboarding`

Completes user onboarding. Sets `onboarding_completed: true`.

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/users/me/onboarding \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ibrahim Fashions",
    "location_city": "Lagos",
    "location_state": "Lagos",
    "specialties": ["agbada", "senator"]
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | 2-100 characters |
| `location_city` | string | Yes | |
| `location_state` | string | Yes | |
| `specialties` | array | No | Max 10 items |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "name": "Ibrahim Fashions",
    "onboarding_completed": true
  }
}
```

**Frontend Usage:**
```javascript
const res = await users.completeOnboarding({ name, location_city, location_state, specialties });
setUser(prev => ({ ...prev, onboarding_completed: true }));
```

---

### DELETE `/users/me`

Soft-deletes the user account. Deactivates user and invalidates all tokens.

**Auth Required:** Yes

**Request:**
```bash
curl -X DELETE https://be.dinki.africa/v1/users/me \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Account deleted"
  }
}
```

---

## 7. Customers Endpoints

**Prefix:** `/v1/customers`
**All endpoints require:** `Authorization: Bearer <accessToken>` + role must be `tailor`

Customers are client records managed by tailors. Each customer belongs to one tailor.

---

### GET `/customers`

Lists the tailor's customers with optional search and pagination.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl "https://be.dinki.africa/v1/customers?search=ade&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Query Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `search` | string | No | Max 100 chars, searches name/phone/email |
| `page` | integer | No | Min 1 |
| `limit` | integer | No | Min 1, Max 100 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "89b2f97a-1b5b-453e-8f76-651cc87e12db",
      "tailor_id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
      "name": "Adeola Johnson",
      "phone": "+2348098765432",
      "email": "adeola@example.com",
      "location": "Ikeja, Lagos",
      "measurements": {
        "neck": 40,
        "chest": 100,
        "waist": 85,
        "hips": 95,
        "shoulder": 43,
        "sleeve": 65,
        "length": 75,
        "inseam": 78,
        "notes": "Prefers loose fit"
      },
      "custom_fields": {
        "arm_length": 72,
        "back_width": 38
      },
      "created_at": "2025-07-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

**Frontend Usage:**
```javascript
const res = await customers.list({ search: 'ade', limit: 50 });
const customerList = res.data;            // Array of customer objects
const { total, pages } = res.pagination;  // Pagination info
```

---

### POST `/customers`

Creates a new customer for the tailor.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/customers \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Adeola Johnson",
    "phone": "+2348098765432",
    "email": "adeola@example.com",
    "location": "Ikeja, Lagos"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | Max 100 characters |
| `phone` | string | No | Max 20 characters |
| `email` | string | No | Valid email |
| `location` | string | No | Max 200 characters |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "89b2f97a-1b5b-453e-8f76-651cc87e12db",
    "tailor_id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "name": "Adeola Johnson",
    "phone": "+2348098765432",
    "email": "adeola@example.com",
    "location": "Ikeja, Lagos",
    "measurements": null,
    "custom_fields": null,
    "created_at": "2025-07-15T10:30:00.000Z"
  },
  "statusCode": 201
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 409 | `DUPLICATE` | Customer name already exists for this tailor |

**Frontend Usage:**
```javascript
const res = await customers.create({ name, phone, email, location });
// res.data → the new customer object
```

---

### GET `/customers/:id`

Fetches a single customer by ID. Must belong to the authenticated tailor.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl https://be.dinki.africa/v1/customers/89b2f97a-1b5b-453e-8f76-651cc87e12db \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "89b2f97a-1b5b-453e-8f76-651cc87e12db",
    "tailor_id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "name": "Adeola Johnson",
    "phone": "+2348098765432",
    "email": "adeola@example.com",
    "location": "Ikeja, Lagos",
    "measurements": { "chest": 100, "waist": 85 },
    "custom_fields": { "arm_length": 72 },
    "created_at": "2025-07-15T10:30:00.000Z"
  }
}
```

**Frontend Usage:**
```javascript
const res = await customers.get(customerId);
const customer = res.data;
```

---

### PATCH `/customers/:id`

Updates customer details. Only provided fields are changed.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/customers/89b2f97a-... \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2349012345678", "location": "Victoria Island, Lagos"}'
```

**Success Response (200):** Updated customer object (same shape as GET).

---

### DELETE `/customers/:id`

Deletes a customer. Soft delete.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X DELETE https://be.dinki.africa/v1/customers/89b2f97a-... \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Customer deleted"
  }
}
```

---

### PATCH `/customers/:id/measurements`

Updates standard measurements for a customer.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/customers/89b2f97a-.../measurements \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "neck": 40,
    "chest": 100,
    "waist": 85,
    "hips": 95,
    "shoulder": 43,
    "sleeve": 65,
    "length": 75,
    "inseam": 78,
    "notes": "Prefers loose fit"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `neck` | float | No | Positive number |
| `chest` | float | No | Positive number |
| `waist` | float | No | Positive number |
| `hips` | float | No | Positive number |
| `shoulder` | float | No | Positive number |
| `sleeve` | float | No | Positive number |
| `length` | float | No | Positive number |
| `inseam` | float | No | Positive number |
| `notes` | string | No | Max 1000 characters |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "measurements": {
      "neck": 40,
      "chest": 100,
      "waist": 85,
      "hips": 95,
      "shoulder": 43,
      "sleeve": 65,
      "length": 75,
      "inseam": 78,
      "notes": "Prefers loose fit"
    },
    "updated_at": "2025-07-15T12:00:00.000Z"
  }
}
```

**Frontend Usage:**
```javascript
const res = await customers.updateMeasurements(customerId, {
  chest: 100, waist: 85, notes: 'Prefers loose fit'
});
```

---

### POST `/customers/:id/custom-fields`

Adds a custom measurement field to a customer.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/customers/89b2f97a-.../custom-fields \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "key": "arm_length",
    "label": "Arm Length",
    "unit": "cm",
    "value": 72
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `key` | string | Yes | Lowercase alphanumeric + underscores, 1-50 chars |
| `label` | string | Yes | 1-100 characters |
| `unit` | string | No | Max 20 characters |
| `value` | float | Yes | Positive number |

**Success Response (201):** Updated custom fields + measurements object.

---

### DELETE `/customers/:id/custom-fields/:key`

Removes a custom measurement field.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X DELETE https://be.dinki.africa/v1/customers/89b2f97a-.../custom-fields/arm_length \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):** Updated customer measurements object.

---

## 8. Jobs Endpoints

**Prefix:** `/v1/jobs`
**All endpoints require:** `Authorization: Bearer <accessToken>` + role must be `tailor`

Jobs track tailoring work for customers. Status flow: `cutting` → `stitching` → `ready` → `delivered`.

---

### GET `/jobs`

Lists the tailor's jobs with filtering and pagination.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl "https://be.dinki.africa/v1/jobs?status=cutting&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Query Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | string | No | `"cutting"`, `"stitching"`, `"ready"`, `"delivered"` |
| `overdue` | boolean | No | `"true"` to filter overdue jobs |
| `search` | string | No | Max 100 chars |
| `customer_id` | string | No | Filter by customer UUID |
| `page` | integer | No | Min 1 |
| `limit` | integer | No | Min 1, Max 100 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0123-4567-89abcdef0123",
      "tailor_id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
      "customer_id": "89b2f97a-1b5b-453e-8f76-651cc87e12db",
      "title": "Agbada - Wedding",
      "description": "3-piece agbada set for wedding ceremony. Gold embroidery.",
      "status": "cutting",
      "style_image_url": "https://be.dinki.africa/uploads/style123.webp",
      "due_date": "2025-08-01T00:00:00.000Z",
      "price": 75000,
      "invoiced": false,
      "created_at": "2025-07-15T10:30:00.000Z",
      "updated_at": "2025-07-16T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

**Frontend Usage:**
```javascript
const res = await jobs.list({ status: 'cutting', limit: 50 });
const jobList = res.data;
const { total } = res.pagination;
```

---

### POST `/jobs`

Creates a new job for a customer.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/jobs \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "89b2f97a-1b5b-453e-8f76-651cc87e12db",
    "title": "Agbada - Wedding",
    "description": "3-piece agbada set for wedding ceremony",
    "style_image_url": "https://be.dinki.africa/uploads/style.webp",
    "due_date": "2025-08-01",
    "price": 75000
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `customer_id` | string | Yes | Valid UUID, must belong to tailor |
| `title` | string | Yes | 1-200 characters |
| `description` | string | No | Max 2000 characters |
| `style_image_url` | string | No | Valid URL |
| `due_date` | string | No | ISO 8601 date |
| `price` | integer | No | Positive number (kobo/minor currency unit) |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-4567-89abcdef0123",
    "tailor_id": "0be1b814-...",
    "customer_id": "89b2f97a-...",
    "title": "Agbada - Wedding",
    "description": "3-piece agbada set for wedding ceremony",
    "status": "cutting",
    "style_image_url": "https://be.dinki.africa/uploads/style.webp",
    "due_date": "2025-08-01T00:00:00.000Z",
    "price": 75000,
    "invoiced": false,
    "created_at": "2025-07-15T10:30:00.000Z",
    "updated_at": "2025-07-15T10:30:00.000Z"
  },
  "statusCode": 201
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 400 | `REFERENCE_ERROR` | customer_id doesn't exist or doesn't belong to tailor |

**Frontend Usage:**
```javascript
const res = await jobs.create({
  customer_id: selectedCustomerId,
  title: 'Agbada - Wedding',
  description: '3-piece agbada set',
  due_date: '2025-08-01',
  price: 75000
});
```

---

### GET `/jobs/stats`

Returns aggregate statistics for the tailor's jobs.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl https://be.dinki.africa/v1/jobs/stats \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_jobs": 50,
    "cutting": 5,
    "stitching": 10,
    "ready": 8,
    "delivered": 27,
    "overdue": 2,
    "total_earnings": 2500000
  }
}
```

**Frontend Usage:**
```javascript
const res = await jobs.getStats();
const stats = res.data;
// stats.total_jobs, stats.cutting, stats.stitching, etc.
```

---

### GET `/jobs/:id`

Fetches a single job by ID.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl https://be.dinki.africa/v1/jobs/d4e5f6a7-... \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):** Single job object (same shape as list items).

---

### PATCH `/jobs/:id`

Updates job details.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/jobs/d4e5f6a7-... \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "price": 80000}'
```

**Success Response (200):** Updated job object.

---

### PATCH `/jobs/:id/status`

Updates job status. Status must follow the workflow: `cutting` → `stitching` → `ready` → `delivered`.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/jobs/d4e5f6a7-.../status \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"status": "stitching"}'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | string | Yes | `"cutting"`, `"stitching"`, `"ready"`, or `"delivered"` |

**Success Response (200):** Updated job object with new status.

**Frontend Usage:**
```javascript
const res = await jobs.updateStatus(jobId, 'stitching');
```

---

### PATCH `/jobs/:id/invoice`

Toggles the invoiced flag on a job.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/jobs/d4e5f6a7-.../invoice \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"invoiced": true}'
```

**Success Response (200):** Updated job object with `invoiced: true`.

**Frontend Usage:**
```javascript
const res = await jobs.toggleInvoice(jobId, true);
```

---

### DELETE `/jobs/:id`

Deletes a job. Soft delete.

**Auth Required:** Yes (tailor only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Job deleted"
  }
}
```

---

## 9. Orders Endpoints

**Prefix:** `/v1/orders`
**Auth Required:** Yes (role-specific per endpoint)

Orders are requests from customers to tailors. Flow: `pending` → `accepted`/`declined` → `in_progress` → `completed`.

---

### POST `/orders` (Customer only)

Places a new order with a tailor.

**Auth Required:** Yes (customer only)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/orders \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "tailor_id": "0be1b814-2692-44f5-97ef-8dde9a68cebe",
    "title": "Wedding Agbada",
    "description": "3-piece set with gold embroidery",
    "budget": 100000,
    "due_date": "2025-09-01",
    "fabric_preference": "Aso Oke",
    "measurement_notes": "Chest 44, Waist 38",
    "style_id": null
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `tailor_id` | string | Yes | Valid UUID |
| `title` | string | Yes | Max 200 characters |
| `description` | string | No | Max 2000 characters |
| `budget` | integer | No | Positive (kobo) |
| `due_date` | string | No | ISO 8601 date |
| `fabric_preference` | string | No | Max 100 characters |
| `measurement_notes` | string | No | Max 1000 characters |
| `style_id` | string | No | Valid UUID |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
    "customer_id": "2ab03546-...",
    "tailor_id": "0be1b814-...",
    "title": "Wedding Agbada",
    "description": "3-piece set with gold embroidery",
    "status": "pending",
    "budget": 100000,
    "due_date": "2025-09-01T00:00:00.000Z",
    "fabric_preference": "Aso Oke",
    "measurement_notes": "Chest 44, Waist 38",
    "style_id": null,
    "reference_images": [],
    "created_at": "2025-07-15T10:30:00.000Z"
  },
  "statusCode": 201
}
```

**Frontend Usage:**
```javascript
const res = await orders.place({
  tailor_id: tailorId,
  title: 'Wedding Agbada',
  budget: 100000,
  due_date: '2025-09-01'
});
```

---

### GET `/orders` (Customer only)

Lists the customer's orders.

**Auth Required:** Yes (customer only)

**Query Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | string | No | `"pending"`, `"accepted"`, `"in_progress"`, `"completed"`, `"cancelled"` |
| `page` | integer | No | Min 1 |
| `limit` | integer | No | Min 1, Max 50 |

**Success Response (200):** Array of order objects with pagination.

**Frontend Usage:**
```javascript
const res = await orders.listMine({ status: 'pending' });
```

---

### GET `/orders/incoming` (Tailor only)

Lists orders placed to this tailor by customers.

**Auth Required:** Yes (tailor only)

**Success Response (200):** Array of order objects with pagination.

**Frontend Usage:**
```javascript
const res = await orders.listIncoming({ status: 'pending' });
```

---

### GET `/orders/:id` (Both roles)

Fetches a single order. Authorization checked by service — must be the customer or tailor involved.

**Success Response (200):** Single order object.

---

### PATCH `/orders/:id/accept` (Tailor only)

Accepts a pending order. Status changes to `"accepted"`.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/orders/f1a2b3c4-.../accept \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):** Updated order with `status: "accepted"`.

**Frontend Usage:**
```javascript
const res = await orders.accept(orderId);
```

---

### PATCH `/orders/:id/decline` (Tailor only)

Declines a pending order with a reason.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/orders/f1a2b3c4-.../decline \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"reason": "Fully booked for this period"}'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `reason` | string | Yes | Max 500 characters |

**Success Response (200):** Updated order with `status: "declined"`.

---

### PATCH `/orders/:id/cancel` (Customer only)

Cancels a pending order.

**Auth Required:** Yes (customer only)

**Success Response (200):** Updated order with `status: "cancelled"`.

---

### POST `/orders/:id/images` (Customer only)

Adds reference images to an order.

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/orders/f1a2b3c4-.../images \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"images": ["/uploads/img1.webp", "/uploads/img2.webp"]}'
```

**Success Response (200):** Updated order with `reference_images` array.

---

## 10. Reviews Endpoints

**Prefix:** `/v1/reviews`
**Auth Required:** Yes

---

### POST `/reviews` (Customer only)

Creates a review for a completed order.

**Auth Required:** Yes (customer only)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/reviews \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
    "rating": 5,
    "text": "Excellent work! The agbada was perfect."
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `order_id` | string | Yes | Valid UUID of a completed order |
| `rating` | integer | Yes | 1-5 |
| `text` | string | No | Max 2000 characters |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "customer_id": "2ab03546-...",
    "tailor_id": "0be1b814-...",
    "order_id": "f1a2b3c4-...",
    "rating": 5,
    "text": "Excellent work! The agbada was perfect.",
    "created_at": "2025-07-20T14:00:00.000Z"
  },
  "statusCode": 201
}
```

**Frontend Usage:**
```javascript
const res = await reviews.create({ order_id: orderId, rating: 5, text: 'Great work!' });
```

---

### GET `/reviews/me` (Customer only)

Lists the customer's reviews.

**Query Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `page` | integer | No | Min 1 |
| `limit` | integer | No | Min 1, Max 50 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "order_id": "f1a2b3c4-...",
      "tailor_name": "Test Tailor",
      "tailor_avatar": "/uploads/avatar.webp",
      "rating": 5,
      "text": "Excellent work!",
      "created_at": "2025-07-20T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

**Frontend Usage:**
```javascript
const res = await reviews.listMine({ page: 1 });
```

---

## 11. Favourites Endpoints

**Prefix:** `/v1/favourites`
**Auth Required:** Yes

---

### POST `/favourites/toggle`

Toggles favourite status for a style, fabric, or tailor. If not favourited, adds it. If already favourited, removes it.

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/favourites/toggle \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "item_type": "tailor",
    "item_id": "0be1b814-2692-44f5-97ef-8dde9a68cebe"
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `item_type` | string | Yes | `"style"`, `"fabric"`, or `"tailor"` |
| `item_id` | string | Yes | Valid UUID |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "item_id": "0be1b814-...",
    "item_type": "tailor",
    "is_favourite": true
  }
}
```

**Frontend Usage:**
```javascript
const res = await favourites.toggle('tailor', tailorId);
// res.data.is_favourite → true if now favourited, false if removed
```

**Note:** The frontend API client sends `{ itemType, itemId }` (camelCase). Verify the backend validator accepts this format — if not, use `{ item_type, item_id }`.

---

### GET `/favourites`

Lists user's favourites with optional type filter.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `type` | string | No | `"style"`, `"fabric"`, or `"tailor"` |
| `page` | integer | No | Min 1 |
| `limit` | integer | No | Min 1, Max 50 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "x1y2z3...",
      "item_id": "0be1b814-...",
      "item_type": "tailor",
      "item_details": {
        "name": "Test Tailor",
        "image": "/uploads/avatar.webp"
      },
      "created_at": "2025-07-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**Frontend Usage:**
```javascript
const res = await favourites.list('tailor');
```

---

### POST `/favourites/check`

Checks which items from a list are favourited.

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/favourites/check \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"item_type": "tailor", "item_id": "0be1b814-..."},
      {"item_type": "style", "item_id": "abc123-..."}
    ]
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "0be1b814-...": true,
    "abc123-...": false
  }
}
```

---

## 12. Messaging Endpoints

**Prefix:** `/v1/conversations`
**Auth Required:** Yes

---

### GET `/conversations`

Lists all conversations for the authenticated user. Includes other participant info, last message, and unread count.

**Auth Required:** Yes

**Request:**
```bash
curl https://be.dinki.africa/v1/conversations \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "c1d2e3f4-...",
      "participant": {
        "id": "2ab03546-...",
        "name": "Test Customer",
        "initials": "TC",
        "avatar_url": null,
        "avatar_color": null,
        "role": "customer"
      },
      "last_message": {
        "id": "m1m2m3m4-...",
        "sender_id": "2ab03546-...",
        "text": "When will my agbada be ready?",
        "image_url": null,
        "is_read": false,
        "created_at": "2025-07-15T14:30:00.000Z"
      },
      "unread_count": 2,
      "pinned": false,
      "last_message_at": "2025-07-15T14:30:00.000Z",
      "created_at": "2025-07-10T08:00:00.000Z"
    }
  ]
}
```

**Frontend Usage:**
```javascript
const res = await conversations.list();
const convList = res.data;  // Array of conversation objects
// Each has: .participant (other user), .last_message, .unread_count, .pinned
```

---

### POST `/conversations`

Starts a new conversation (or returns existing one if already exists between users).

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/conversations \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "2ab03546-a80e-4038-a7a4-48ba8db71365",
    "text": "Hello! I saw your storefront and I would like to place an order."
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `participant_id` | string | Yes | Valid UUID, cannot be self |
| `text` | string | No | Max 2000 characters (initial message) |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "c1d2e3f4-...",
      "participant_1": "0be1b814-...",
      "participant_2": "2ab03546-..."
    },
    "message": {
      "id": "m1m2m3m4-...",
      "text": "Hello! I saw your storefront and I would like to place an order.",
      "created_at": "2025-07-15T10:00:00.000Z"
    }
  },
  "statusCode": 201
}
```

**Frontend Usage:**
```javascript
const res = await conversations.start({ participant_id: userId, text: 'Hello!' });
// Navigate to: /messages/${res.data.conversation.id}
```

---

### GET `/conversations/:id/messages`

Fetches messages for a conversation with cursor-based pagination. Messages are returned in **chronological order** (oldest first).

**Auth Required:** Yes

**Request:**
```bash
curl "https://be.dinki.africa/v1/conversations/c1d2e3f4-.../messages?limit=30" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Query Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `cursor` | string | No | ISO 8601 timestamp — load messages before this time |
| `limit` | integer | No | Min 1, Max 50 (default 30) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "m0a1b2c3-...",
        "sender_id": "0be1b814-...",
        "text": "Hello!",
        "image_url": null,
        "is_read": true,
        "read_at": "2025-07-15T10:05:00.000Z",
        "created_at": "2025-07-15T10:00:00.000Z"
      },
      {
        "id": "m1m2m3m4-...",
        "sender_id": "2ab03546-...",
        "text": "Hi! When will my order be ready?",
        "image_url": null,
        "is_read": false,
        "read_at": null,
        "created_at": "2025-07-15T10:10:00.000Z"
      }
    ],
    "next_cursor": null
  }
}
```

**IMPORTANT for Frontend:** `res.data` is an **object** with `.messages` (array) and `.next_cursor` (string|null), NOT a flat array. Do NOT call `.reverse()` on `res.data`.

**Frontend Usage:**
```javascript
const res = await conversations.getMessages(conversationId, { limit: 30 });
const messages = res.data.messages;       // Array, already in chronological order
const nextCursor = res.data.next_cursor;  // null if no more, or ISO timestamp

// Load older messages:
if (nextCursor) {
  const older = await conversations.getMessages(conversationId, { cursor: nextCursor, limit: 30 });
  const olderMessages = older.data.messages;
}
```

---

### POST `/conversations/:id/messages`

Sends a message in a conversation. Also emits Socket.IO events for real-time delivery.

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/conversations/c1d2e3f4-.../messages \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"text": "Your agbada will be ready by Friday!"}'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `text` | string | No* | Max 2000 characters |
| `image_url` | string | No* | Max 500 characters |

*At least one of `text` or `image_url` must be provided.

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "m5n6o7p8-...",
    "conversation_id": "c1d2e3f4-...",
    "sender_id": "0be1b814-...",
    "text": "Your agbada will be ready by Friday!",
    "image_url": null,
    "is_read": false,
    "read_at": null,
    "created_at": "2025-07-15T15:00:00.000Z"
  },
  "statusCode": 201
}
```

**Socket.IO Side Effects:**
- `message:new` emitted to recipient
- `message:delivered` emitted to sender

**Frontend Usage:**
```javascript
const res = await conversations.sendMessage(conversationId, { text: 'Hello!' });
// Append res.data to messages list
```

---

### PATCH `/conversations/:id/read`

Marks all unread messages from the other participant as read.

**Auth Required:** Yes

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/conversations/c1d2e3f4-.../read \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "marked": 3,
    "read_at": "2025-07-15T15:00:00.000Z"
  }
}
```

**Socket.IO Side Effects:** `message:read` emitted to other participant.

**Frontend Usage:**
```javascript
await conversations.markRead(conversationId);
```

---

### PATCH `/conversations/:id/pin`

Toggles pinned state for the conversation (per-user).

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "pinned": true
  }
}
```

**Frontend Usage:**
```javascript
const res = await conversations.togglePin(conversationId);
// res.data.pinned → new pinned state
```

---

## 13. Notifications Endpoints

**Prefix:** `/v1/notifications`
**Auth Required:** Yes

---

### GET `/notifications`

Lists all notifications grouped by time period (today, this week, older).

**Auth Required:** Yes

**Request:**
```bash
curl https://be.dinki.africa/v1/notifications \
  -H "Authorization: Bearer eyJhbGci..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "today": [
      {
        "id": "n1n2n3n4-...",
        "type": "order_created",
        "title": "New Order",
        "message": "Adeola Johnson placed a new order",
        "read": false,
        "data": {
          "order_id": "f1a2b3c4-...",
          "sender_name": "Adeola Johnson"
        },
        "created_at": "2025-07-15T10:00:00.000Z"
      }
    ],
    "week": [],
    "older": []
  }
}
```

**IMPORTANT for Frontend:** `res.data` is an **object** with `.today`, `.week`, `.older` arrays — NOT a flat array. Each array contains notification objects.

**Frontend Usage:**
```javascript
const res = await notifications.list();
const { today, week, older } = res.data;
// Combine: const all = [...today, ...week, ...older];
```

**Notification Types:**
| Type | When |
|------|------|
| `order_created` | Customer places order |
| `order_accepted` | Tailor accepts order |
| `order_declined` | Tailor declines order |
| `message_received` | New chat message |
| `review_posted` | Customer posts review |

---

### GET `/notifications/unread-count`

Returns count of unread notifications.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Frontend Usage:**
```javascript
const res = await notifications.unreadCount();
const count = res.data.count;
```

---

### PATCH `/notifications/read-all`

Marks all notifications as read.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "All notifications marked as read"
  }
}
```

---

### GET `/notifications/:id`

Fetches a single notification.

**Success Response (200):** Single notification object (same shape as list items).

---

### PATCH `/notifications/:id/read`

Marks a single notification as read.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "n1n2n3n4-...",
    "read": true,
    "read_at": "2025-07-15T15:00:00.000Z"
  }
}
```

---

### POST `/notifications/push-token`

Registers a push notification token for the device.

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/notifications/push-token \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"token": "fcm-token-abc123...", "platform": "web"}'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `token` | string | Yes | 10-500 characters |
| `platform` | string | No | `"android"`, `"ios"`, or `"web"` |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pt1pt2pt3-...",
    "token_hash": "hashed_value",
    "platform": "web",
    "active": true,
    "created_at": "2025-07-15T10:00:00.000Z"
  }
}
```

---

## 14. Storefronts Endpoints

**Prefix:** `/v1/storefronts`
**Mixed auth:** Some endpoints are public, some require tailor auth

---

### GET `/storefronts/:slug` (Public)

Fetches a tailor's public storefront by URL slug.

**Auth Required:** No

**Request:**
```bash
curl https://be.dinki.africa/v1/storefronts/test-tailor-RVBd
```

**URL Parameter:** `slug` — URL-friendly string (pattern: `^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "sf-uuid-...",
    "user_id": "0be1b814-...",
    "slug": "test-tailor-RVBd",
    "name": "Test Tailor",
    "bio": "Expert bespoke tailor",
    "image": "/uploads/storefront.webp",
    "response_time": "2 hours",
    "start_price": 15000,
    "years_experience": 5,
    "average_rating": 4.8,
    "review_count": 50,
    "created_at": "2025-06-01T10:00:00.000Z"
  }
}
```

**Frontend Usage:**
```javascript
const res = await storefronts.getBySlug('test-tailor-RVBd');
const storefront = res.data;
```

---

### GET `/storefronts/:slug/portfolio` (Public)

Lists a tailor's portfolio items.

**Auth Required:** No

**Query Parameters:** `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pf-uuid-...",
      "storefront_id": "sf-uuid-...",
      "title": "Wedding Gown",
      "image_url": "/uploads/portfolio1.webp",
      "display_order": 1,
      "created_at": "2025-06-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

### GET `/storefronts/:slug/reviews` (Public)

Lists reviews for a tailor's storefront.

**Auth Required:** No

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rv-uuid-...",
      "customer_name": "Adeola Johnson",
      "customer_avatar": "/uploads/avatar.webp",
      "rating": 5,
      "text": "Excellent work on my agbada!",
      "created_at": "2025-07-20T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

### PATCH `/storefronts/me` (Tailor only)

Updates the tailor's own storefront.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X PATCH https://be.dinki.africa/v1/storefronts/me \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Premium bespoke tailoring since 2020",
    "response_time": "2 hours",
    "start_price": 15000,
    "years_experience": 5
  }'
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `bio` | string | No | Max 2000 characters |
| `slug` | string | No | 3-50 chars, URL-friendly |
| `image` | string | No | Max 500 characters (URL) |
| `response_time` | string | No | Max 30 characters |
| `start_price` | integer | No | Positive (kobo) |
| `years_experience` | integer | No | 0-80 |

**Success Response (200):** Updated storefront object.

---

### POST `/storefronts/me/portfolio` (Tailor only)

Adds a portfolio item.

**Auth Required:** Yes (tailor only)

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/storefronts/me/portfolio \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wedding Gown",
    "image_url": "/uploads/portfolio1.webp",
    "display_order": 1
  }'
```

**Success Response (201):** Created portfolio item.

---

### DELETE `/storefronts/me/portfolio/:id` (Tailor only)

Removes a portfolio item.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Portfolio item removed"
  }
}
```

---

## 15. Uploads Endpoints

**Prefix:** `/v1/uploads`
**Auth Required:** Yes

All images are automatically converted to WebP format with:
- **Full size:** 1200px max width, 80% quality
- **Thumbnail:** 200px width, 70% quality

---

### POST `/uploads/image`

Uploads a single image.

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/uploads/image \
  -H "Authorization: Bearer eyJhbGci..." \
  -F "image=@photo.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/a1b2c3d4-image.webp",
    "thumbnail": "/uploads/a1b2c3d4-image_thumb.webp"
  },
  "statusCode": 201
}
```

**Full URL:** `https://be.dinki.africa` + `res.data.url`

**Frontend Usage:**
```javascript
const res = await uploads.image(file);
const imageUrl = res.data.url;        // /uploads/uuid.webp
const thumbUrl = res.data.thumbnail;  // /uploads/uuid_thumb.webp

// Use in job creation:
await jobs.create({ ..., style_image_url: imageUrl });
```

---

### POST `/uploads/images`

Uploads multiple images (1-4 files).

**Auth Required:** Yes

**Request:**
```bash
curl -X POST https://be.dinki.africa/v1/uploads/images \
  -H "Authorization: Bearer eyJhbGci..." \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "data": [
    {
      "url": "/uploads/uuid1.webp",
      "thumbnail": "/uploads/uuid1_thumb.webp"
    },
    {
      "url": "/uploads/uuid2.webp",
      "thumbnail": "/uploads/uuid2_thumb.webp"
    }
  ],
  "statusCode": 201
}
```

**Frontend Usage:**
```javascript
const res = await uploads.images([file1, file2]);
const urls = res.data.map(img => img.url);
```

**File Constraints:**
- Accepted types: JPEG, PNG, WebP
- Max file size: 2MB (configurable via `MAX_FILE_SIZE` env var)
- Maximum 4 files per batch upload

---

## 16. Socket.IO Real-Time Events

### Connection Setup

```javascript
import { io } from 'socket.io-client';
import { getToken } from '../lib/api';

const socket = io('https://be.dinki.africa', {
  auth: { token: getToken() },       // Pass JWT access token
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('Connected to real-time server');
});

socket.on('connect_error', (err) => {
  if (err.message === 'AUTH_REQUIRED' || err.message === 'INVALID_TOKEN') {
    // Token expired — refresh and reconnect
    refreshAccessToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  }
});
```

### Events Reference

#### Incoming Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `presence` | `{ userId: string, online: boolean }` | User comes online/offline |
| `message:new` | `{ message: MessageObject }` | New message received |
| `message:delivered` | `{ messageId: string }` | Your sent message was delivered |
| `message:read` | `{ conversationId: string, readAt: string }` | Your messages were read |
| `typing` | `{ conversationId: string, userId: string, typing: boolean }` | User is typing/stopped |
| `notification:new` | `{ notification: NotificationObject }` | New notification |
| `error` | `{ message: string }` | Server-side error |

#### Outgoing Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ conversationId: string, text: string, imageUrl?: string }` | Send a message |
| `message:read` | `{ conversationId: string }` | Mark messages as read |
| `typing:start` | `{ conversationId: string }` | Start typing indicator |
| `typing:stop` | `{ conversationId: string }` | Stop typing indicator |

### Full Chat Integration Example

```javascript
// Listen for new messages
socket.on('message:new', ({ message }) => {
  // If message is for the currently open conversation, append it
  if (message.conversation_id === currentConversationId) {
    setMessages(prev => [...prev, message]);
  }
  // Update conversation list with new last_message
});

// Listen for typing indicators
socket.on('typing', ({ conversationId, userId, typing }) => {
  if (conversationId === currentConversationId) {
    setIsTyping(typing);
  }
});

// Listen for read receipts
socket.on('message:read', ({ conversationId, readAt }) => {
  if (conversationId === currentConversationId) {
    setMessages(prev => prev.map(m => ({
      ...m,
      is_read: true,
      read_at: readAt
    })));
  }
});

// Listen for online/offline status
socket.on('presence', ({ userId, online }) => {
  // Update user's online status in conversation list
});

// Send a message via Socket (alternative to REST POST)
function sendViaSocket(conversationId, text) {
  socket.emit('message:send', { conversationId, text });
}

// Send typing indicators
let typingTimer;
function handleTyping(conversationId) {
  socket.emit('typing:start', { conversationId });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('typing:stop', { conversationId });
  }, 2000);
}

// Mark as read
function markRead(conversationId) {
  socket.emit('message:read', { conversationId });
}
```

---

## 17. Health Check

### GET `/v1/health`

No authentication required. Checks DB and Redis connectivity.

**Request:**
```bash
curl https://be.dinki.africa/v1/health
```

**Healthy Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 86400,
    "db": "ok",
    "redis": "ok",
    "timestamp": "2025-07-15T10:00:00.000Z"
  }
}
```

**Degraded Response (503):**
```json
{
  "success": true,
  "data": {
    "status": "degraded",
    "uptime": 86400,
    "db": "error",
    "redis": "ok",
    "timestamp": "2025-07-15T10:00:00.000Z"
  }
}
```

---

## 18. Error Reference

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation",
    "details": [
      { "field": "email", "message": "Valid email is required" }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or no auth header |
| `TOKEN_EXPIRED` | 401 | JWT has expired — refresh needed |
| `INVALID_TOKEN` | 401 | JWT verification failed |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `EMAIL_NOT_VERIFIED` | 403 | Email not verified (OTP re-sent) |
| `FORBIDDEN` | 403 | Not authorized for this resource |
| `ACCOUNT_LOCKED` | 423 | Too many failed login attempts |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `REFERENCE_ERROR` | 400 | Referenced ID doesn't exist |
| `EMPTY_MESSAGE` | 400 | Message needs text or image |
| `INVALID_PARTICIPANT` | 400 | Cannot message yourself |
| `DUPLICATE` | 409 | Resource already exists |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_OTP` | 400 | Wrong or expired OTP |
| `RATE_LIMITED` | 429 | Too many requests |
| `NO_FILE` | 400 | No file uploaded |
| `INVALID_FILE_TYPE` | 400 | Unsupported file format |

### Frontend Error Handling Pattern
```javascript
try {
  const res = await someApiCall();
  // Handle success
} catch (err) {
  switch (err.code) {
    case 'VALIDATION_ERROR':
      // Show field-level errors from err.details
      err.details?.forEach(d => {
        setFieldError(d.field, d.message);
      });
      break;
    case 'AUTH_REQUIRED':
    case 'TOKEN_EXPIRED':
    case 'INVALID_TOKEN':
      // Redirect to login
      logout();
      navigate('/');
      break;
    case 'FORBIDDEN':
      toast.error('You do not have permission');
      break;
    case 'NOT_FOUND':
      navigate('/404');
      break;
    case 'RATE_LIMITED':
      toast.error('Too many attempts. Please wait.');
      break;
    default:
      toast.error(err.message || 'Something went wrong');
  }
}
```

---

## 19. Frontend Integration Guide

### Accessing Uploaded Files
All uploaded files (avatars, images) are served as static files:
```
https://be.dinki.africa/uploads/<filename>
```

When the API returns a path like `/uploads/uuid.webp`, construct the full URL:
```javascript
const fullUrl = `https://be.dinki.africa${user.avatar_url}`;
```

### Currency Format
All monetary values (`price`, `budget`, `revenue`, `total_earnings`, `start_price`) are in **kobo** (minor currency unit). To display in Naira:
```javascript
const formatPrice = (kobo) => `₦${(kobo / 100).toLocaleString()}`;
// formatPrice(75000) → "₦750"
```

If prices are stored as whole Naira values (check your data), adjust accordingly:
```javascript
const formatPrice = (amount) => `₦${amount.toLocaleString()}`;
```

### Date Handling
All dates from the API are ISO 8601 strings in UTC:
```javascript
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};
// "Jul 15, 2025"
```

### Test Accounts
| Account | Email | Password | Role | ID |
|---------|-------|----------|------|----|
| Test Tailor | `test@dinki.africa` | `Test1234` | tailor | `0be1b814-2692-44f5-97ef-8dde9a68cebe` |
| Test Customer | `customer@dinki.africa` | `Test1234` | customer | `2ab03546-a80e-4038-a7a4-48ba8db71365` |

### Deployment Commands

**Frontend (static files):**
```bash
cd /home/dinki/frontend-src && git pull origin main && npm run build && cp -r dist/* /home/dinki/public_html/
```

**Backend (Docker):**
```bash
cd /var/www/dinki/backend && git pull origin main && cd /var/www/dinki && docker compose build --no-cache dinki-api && docker compose up -d --force-recreate dinki-api
```

### Common Frontend Gotchas

1. **`res.data` shapes vary by endpoint:**
   - List endpoints: `res.data` is an **array**, `res.pagination` has page info
   - Stats endpoints: `res.data` is a **flat object** (NOT an array — don't `.map()` it)
   - Messages endpoint: `res.data` is `{ messages: [...], next_cursor: ... }` (NOT a flat array — don't `.reverse()` it)
   - Notifications list: `res.data` is `{ today: [...], week: [...], older: [...] }` (NOT a flat array)

2. **Auth refresh on mount:** The `AuthContext` calls `auth.refresh()` on mount. If there's no valid session cookie, this returns `null` gracefully (not an error). The 401 in console on landing page is expected for unauthenticated users.

3. **Tailor profile in login response:** The login response includes `storefront_slug` and `onboarding_completed` at the top level of `user`. The `GET /users/me` response nests tailor-specific data under `tailor_profile`.

4. **Credentials must be included:** All `fetch()` calls must include `credentials: 'include'` for cookies to be sent cross-origin. The API client handles this automatically.

5. **CORS:** The backend allows credentials from the configured origin(s). If you get CORS errors, verify `CORS_ORIGIN` env var in the backend includes your frontend URL.

6. **File uploads use FormData:** Don't set `Content-Type` header manually for file uploads — the browser sets the correct `multipart/form-data` boundary automatically.

7. **Socket.IO authentication:** Pass the current access token in `socket.auth.token`. If the token expires, handle `connect_error` and reconnect with a refreshed token.

---

## Quick Reference: All Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/signup` | No | - | Create account |
| POST | `/auth/verify-email` | No | - | Verify email OTP |
| POST | `/auth/login` | No | - | Login |
| POST | `/auth/refresh` | Cookie | - | Refresh tokens |
| POST | `/auth/logout` | Yes | - | Logout |
| POST | `/auth/forgot-password` | No | - | Request password reset |
| POST | `/auth/reset-password` | No | - | Reset password |
| POST | `/auth/change-password` | Yes | - | Change password |
| GET | `/users/me` | Yes | Both | Get profile |
| PATCH | `/users/me` | Yes | Both | Update profile |
| PATCH | `/users/me/avatar` | Yes | Both | Upload avatar |
| GET | `/users/me/stats` | Yes | Both | Get stats |
| PATCH | `/users/me/preferences` | Yes | Both | Update preferences |
| POST | `/users/me/onboarding` | Yes | Both | Complete onboarding |
| DELETE | `/users/me` | Yes | Both | Delete account |
| GET | `/customers` | Yes | Tailor | List customers |
| POST | `/customers` | Yes | Tailor | Create customer |
| GET | `/customers/:id` | Yes | Tailor | Get customer |
| PATCH | `/customers/:id` | Yes | Tailor | Update customer |
| DELETE | `/customers/:id` | Yes | Tailor | Delete customer |
| PATCH | `/customers/:id/measurements` | Yes | Tailor | Update measurements |
| POST | `/customers/:id/custom-fields` | Yes | Tailor | Add custom field |
| DELETE | `/customers/:id/custom-fields/:key` | Yes | Tailor | Remove custom field |
| GET | `/jobs` | Yes | Tailor | List jobs |
| POST | `/jobs` | Yes | Tailor | Create job |
| GET | `/jobs/stats` | Yes | Tailor | Get job stats |
| GET | `/jobs/:id` | Yes | Tailor | Get job |
| PATCH | `/jobs/:id` | Yes | Tailor | Update job |
| PATCH | `/jobs/:id/status` | Yes | Tailor | Update job status |
| PATCH | `/jobs/:id/invoice` | Yes | Tailor | Toggle invoice |
| DELETE | `/jobs/:id` | Yes | Tailor | Delete job |
| POST | `/orders` | Yes | Customer | Place order |
| GET | `/orders` | Yes | Customer | List my orders |
| GET | `/orders/incoming` | Yes | Tailor | List incoming orders |
| GET | `/orders/:id` | Yes | Both | Get order |
| PATCH | `/orders/:id/accept` | Yes | Tailor | Accept order |
| PATCH | `/orders/:id/decline` | Yes | Tailor | Decline order |
| PATCH | `/orders/:id/cancel` | Yes | Customer | Cancel order |
| POST | `/orders/:id/images` | Yes | Customer | Add reference images |
| POST | `/reviews` | Yes | Customer | Create review |
| GET | `/reviews/me` | Yes | Customer | List my reviews |
| POST | `/favourites/toggle` | Yes | Both | Toggle favourite |
| GET | `/favourites` | Yes | Both | List favourites |
| POST | `/favourites/check` | Yes | Both | Check if favourited |
| GET | `/conversations` | Yes | Both | List conversations |
| POST | `/conversations` | Yes | Both | Start conversation |
| GET | `/conversations/:id/messages` | Yes | Both | Get messages |
| POST | `/conversations/:id/messages` | Yes | Both | Send message |
| PATCH | `/conversations/:id/read` | Yes | Both | Mark read |
| PATCH | `/conversations/:id/pin` | Yes | Both | Toggle pin |
| GET | `/notifications` | Yes | Both | List notifications |
| GET | `/notifications/unread-count` | Yes | Both | Unread count |
| PATCH | `/notifications/read-all` | Yes | Both | Mark all read |
| GET | `/notifications/:id` | Yes | Both | Get notification |
| PATCH | `/notifications/:id/read` | Yes | Both | Mark read |
| POST | `/notifications/push-token` | Yes | Both | Register push token |
| GET | `/storefronts/:slug` | No | - | Get storefront |
| GET | `/storefronts/:slug/portfolio` | No | - | Get portfolio |
| GET | `/storefronts/:slug/reviews` | No | - | Get reviews |
| PATCH | `/storefronts/me` | Yes | Tailor | Update storefront |
| POST | `/storefronts/me/portfolio` | Yes | Tailor | Add portfolio item |
| DELETE | `/storefronts/me/portfolio/:id` | Yes | Tailor | Remove portfolio item |
| POST | `/uploads/image` | Yes | Both | Upload single image |
| POST | `/uploads/images` | Yes | Both | Upload multiple images |
| GET | `/health` | No | - | Health check |
