# Dinki Africa — Unified Customer Identity Architecture

## Date: April 15, 2026

---

## 1. Problem Statement

The current system has a fundamental fragmentation issue:

- **Tailor-owned customers**: When a tailor adds a customer, that customer record lives in the `customers` table, owned exclusively by that tailor (`tailor_id` foreign key). No platform user account is created.
- **Platform customers**: When a customer signs up themselves, they get a `users` record but have no connection to any tailor-created customer records.
- **Duplicate identities**: If Tailor A adds "Amina (08012345678)" and later Amina signs up on the platform herself, she now has two separate identities — one as Tailor A's customer record and one as a platform user. Her measurements, jobs, and order history are fragmented.
- **Cross-tailor silos**: If Tailor B also serves Amina and adds her with the same phone number, that's a third isolated record. No data sharing, no identity continuity.

This creates a poor experience for customers who eventually join the platform and for tailors who unknowingly duplicate records.

---

## 2. Solution: Unified Customer Identity

### Core Principle
Every customer who enters the Dinki ecosystem (whether added by a tailor or self-registered) gets a single `users` record as their identity anchor. This record can be **active** (customer signed up/activated) or **inactive** (created on behalf of customer by a tailor).

### How It Works

#### Scenario A: Tailor adds a new customer
1. Tailor enters customer name + phone (and/or email)
2. Backend checks `users` table for matching phone or email
3. **No match found** → Create an **inactive** user account (role: `customer`, status: `inactive`) + customer record linked via `user_id`
4. **Inactive match found** → Another tailor already added this person. Confirm identity with tailor ("Is this Amina from Lagos?"). If confirmed, create a new `customers` record for this tailor, linked to the same `user_id`
5. **Active match found** → This customer has a real account. Show confirmation to tailor, then link

#### Scenario B: Customer signs up on the platform
1. Customer enters phone/email during signup
2. Backend detects an inactive account exists with that phone/email
3. Instead of "email already taken" error, show: "An account was set up for you by a tailor. Verify to activate it."
4. Send OTP to their email → Customer verifies → Account activated
5. Customer now sees ALL jobs, orders, and measurements from every tailor who has served them

#### Scenario C: Tailor adds customer, match exists (cross-tailor)
1. Tailor B enters phone "08012345678" for a new customer
2. Backend finds existing user (created by Tailor A)
3. Return to Tailor B: "A customer named Amina with this phone already exists on Dinki. Is this the same person?"
4. Tailor B confirms → New `customers` record created for Tailor B, linked to same `user_id`
5. Tailor B gets their own measurement set (not shared with Tailor A)

---

## 3. Measurements Architecture

### Decision: Per-Tailor Measurements (NOT Centralized)

**Why not share measurements across tailors?**

| Problem with shared measurements | Impact |
|---|---|
| Tailors measure differently (technique, tools, posture assumptions) | Tailor A's "chest = 42" might mean something different from Tailor B's "chest = 44" |
| One tailor's update overwrites another's working data | Ruined garments — a tailor cuts fabric based on measurements they trust |
| Cultural practice — tailors treat their measurement book as proprietary | Forcing shared data contradicts how the profession works |
| Liability — who is responsible if shared measurements are wrong? | Neither tailor would trust the other's numbers |

**What we do instead:**

- Each tailor maintains their **own** measurement set per customer (existing `customers.measurements` JSONB field). This doesn't change.
- When a customer activates their account, they see a **read-only aggregated view**: "Tailor Adewale's measurements", "Tailor Bisi's measurements"
- The customer can optionally create their own **personal measurement profile** that they manage themselves
- No tailor is ever blocked by another tailor's data. No approval workflows. No gatekeeping.

### Measurement History (Future Enhancement)

- Each measurement update is logged with timestamp and tailor ID
- Customer can view a timeline: "Tailor A updated your chest from 40 to 42 on March 5"
- This is **informational only** — no approve/reject flow
- Rationale: Target audience (everyday people, possibly low tech literacy, intermittent internet) should never be asked to "approve" a measurement change they don't understand. This creates confusion and friction.

---

## 4. Why NOT Approve/Reject Measurements

This was explicitly considered and rejected for the following reasons:

| Factor | Problem |
|---|---|
| **Target audience** | Everyday people in Nigeria/Africa, many not tech-savvy. "Approve measurement change?" is confusing. |
| **Internet dependency** | If approval is required and customer is offline, tailor is blocked from working. Unacceptable. |
| **Workflow friction** | Tailors need to work fast. Waiting for customer approval on measurements slows production. |
| **False rejections** | Customer might reject a correct measurement out of confusion, breaking the tailor's workflow. |
| **Unnecessary complexity** | The per-tailor isolation already prevents data corruption. There's nothing to approve. |

**Alternative**: Measurement history as a read-only timeline gives transparency without friction.

---

## 5. Trust & Privacy Boundaries

### What tailors can see
- Only their own customer records and measurements
- Tailor A cannot see Tailor B's jobs, measurements, or notes for the same customer
- When adding a customer whose phone/email matches an existing user, the tailor sees only: name, avatar, and city — enough to confirm identity, not enough to breach privacy

### What customers can see (when active)
- All their jobs and orders from all tailors
- Measurements from each tailor (labeled by tailor name)
- Their own personal measurement profile (if they create one)
- Full messaging history with each tailor

### Who can update measurements
- Any tailor with an active customer relationship (has a `customers` record for that user)
- Updates only affect **that tailor's** measurement set
- Customer can edit their own personal profile measurements

---

## 6. Database Changes Required

### 6a. Users Table Modifications

```sql
-- Add account status
ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive'));

-- Add phone field (for identity matching)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Index for phone-based lookups
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;

-- Index for status filtering
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
```

**New fields:**
- `status`: `active` (normal user) or `inactive` (created by tailor, not yet self-registered)
- `phone`: Stored at user level for identity matching (currently only on customer records)

**Note**: Inactive users have no password, no email verification, and cannot log in. They are identity placeholders.

### 6b. Customers Table Modifications

```sql
-- Add user_id to link customer records to user accounts
-- This may already exist in some form; ensure it's a proper FK
ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for user-based lookups (find all tailors who serve this customer)
CREATE INDEX idx_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;
```

**What this enables:**
- Multiple tailors can have separate `customers` records for the same person
- All linked via the same `user_id` to one `users` record
- Each tailor's record has independent measurements

### 6c. Measurement History Table (New)

```sql
CREATE TABLE measurement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tailor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  measurements JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mhist_user ON measurement_history(user_id, created_at DESC);
CREATE INDEX idx_mhist_customer ON measurement_history(customer_id, created_at DESC);
```

**Purpose**: Append-only log. Every time a tailor saves measurements, the previous state is archived here. Customer can view history when active.

---

## 7. API Changes Required

### 7a. Modified: POST /v1/customers (Create Customer)

**Current behavior**: Creates a customer record owned by the tailor. No user account involved.

**New behavior**:
1. Receive `{ name, phone, email, location }`
2. If `phone` or `email` provided, search `users` table for match
3. **No match** → Create inactive `users` record (name, phone, email, role: customer, status: inactive) → Create `customers` record with `user_id` set
4. **Inactive match** → Return `{ existing_user: { id, name, avatar_color, initials, location_city }, match_type: "inactive" }` — frontend shows confirmation dialog
5. **Active match** → Return `{ existing_user: { id, name, avatar_color, initials, location_city }, match_type: "active" }` — frontend shows confirmation dialog
6. If no phone AND no email → Create customer record without user link (offline/anonymous customer, same as today)

### 7b. New: POST /v1/customers/link (Confirm & Link Customer)

**Purpose**: After tailor confirms the matched user is indeed their customer
**Request**: `{ user_id, name?, phone?, email?, location? }`
**Behavior**: Creates a `customers` record for this tailor linked to the existing `user_id`. Copies name/phone/email from user if not provided.
**Response**: New customer record

### 7c. Modified: POST /v1/auth/signup

**Current behavior**: Creates new user, sends OTP to email.

**New behavior**:
1. Receive `{ email, password, name, role }`
2. Check for existing user with this email
3. **Active user exists** → Return error "Account already exists" (same as today)
4. **Inactive user exists** → Return `{ inactive_account: true, user_id, message: "An account was set up for you. Verify to activate." }` — frontend switches to activation flow
5. **No match** → Normal signup flow (same as today)

### 7d. New: POST /v1/auth/activate

**Purpose**: Activate an inactive account
**Request**: `{ user_id, email, password }`
**Behavior**:
1. Verify the user_id belongs to an inactive account
2. Update the user's email (in case tailor had a different/no email)
3. Set password hash
4. Send OTP to the provided email
5. After OTP verification (reuse existing verify-email endpoint), set status to `active`
**Response**: Same as signup (message + userId for OTP verification step)

### 7e. Modified: PATCH /v1/customers/:id/measurements

**Additional behavior**: Before overwriting, save current measurements to `measurement_history` table. This is backend-only, transparent to the frontend.

---

## 8. Frontend Changes Required

### 8a. AddCustomerModal.jsx — Enhanced Creation Flow

**Current**: Simple form → POST → done.

**New flow**:
1. Tailor fills form (name, phone, email, location)
2. On submit, POST to `/v1/customers`
3. If response includes `existing_user` → Show confirmation dialog:
   - "A customer named [Name] with this phone already exists on Dinki."
   - "Is this the same person?" → [Yes, link them] / [No, create new]
   - If yes → POST to `/v1/customers/link` with `user_id`
   - If no → POST to `/v1/customers` with `force_new: true` (create without linking)
4. If no existing user → Customer created normally (with auto-created inactive user behind the scenes)

### 8b. Auth Flow (AuthOverlay.jsx / Signup) — Activation Path

**Current**: Signup form → verify OTP → onboarding.

**New flow**:
1. User enters email + password + name + role on signup form
2. POST to `/v1/auth/signup`
3. If response includes `inactive_account: true`:
   - Show message: "Good news! A tailor has already set up an account for you on Dinki."
   - "Enter your email and create a password to activate your account."
   - POST to `/v1/auth/activate` → OTP sent → Verify → Account active
   - Redirect to onboarding (or dashboard if onboarding already done)
4. Normal flow otherwise

### 8c. CustomerDetail.jsx — Message Button (Already Done)

The message button added in the previous session already checks for `customer.user_id`. Once this architecture is in place, every linked customer will have a `user_id`, making the message button available for them.

### 8d. Customer Dashboard (Future) — Measurement Aggregation View

When customers log in, they see measurements grouped by tailor. This is a new page/component for the customer role, not an immediate requirement.

---

## 9. Migration Strategy (Safe Rollout)

### Step 1: Backend Migration (Non-Breaking)
- Add `status` column to `users` with default `active` (all existing users stay active)
- Add `phone` column to `users` (nullable)
- Add `user_id` column to `customers` (nullable FK)
- Create `measurement_history` table
- **Zero downtime**: These are all additive changes. Existing functionality is unaffected.

### Step 2: Backend Logic Changes
- Modify customer creation to check for existing users
- Add `/customers/link` endpoint
- Modify signup to detect inactive accounts
- Add `/auth/activate` endpoint
- Add measurement history logging to measurement update handler
- **Backward compatible**: Old clients that don't handle the new response fields still work.

### Step 3: Frontend Updates
- Update AddCustomerModal with confirmation dialog
- Update signup flow with activation path
- **Deployed independently**: Frontend changes only affect UX, not data integrity.

### Step 4: Backfill (Optional)
- Run a one-time script to match existing `customers` records to `users` by phone/email
- Link where matches are found, creating the `user_id` relationship retroactively
- This recovers connections for existing data

---

## 10. Edge Cases & Mitigations

| Edge Case | Handling |
|---|---|
| **Phone number recycled** (common in Africa) | Require name match in addition to phone. Show tailor the matched name for confirmation. Never auto-link silently. |
| **Tailor enters wrong phone** | Customer's real signup creates a separate account. No harm — tailor's customer record is just unlinked. Tailor can manually re-link later. |
| **Customer has no email** (tailor adding) | Inactive user created with phone only. When customer signs up later, match by phone. Activation requires them to provide an email (for OTP). |
| **Multiple tailors have conflicting contact info** | Each keeps their own customer record. The user account stores the authoritative contact info (set by customer on activation). |
| **Customer never activates** | Inactive account sits dormant. No impact. Tailor workflow is completely unaffected. |
| **Tailor adds customer with no phone AND no email** | Old behavior — customer record created with no user link. Fully offline/anonymous customer. Works exactly as today. |
| **Customer deletes their account** | Soft delete on `users`. Tailor's `customers` records remain (they still need their measurement data). `user_id` reference preserved but inactive. |

---

## 11. Security Considerations

- **Inactive accounts have no password** — they cannot be logged into. Only the activation flow (with OTP) can convert them to active.
- **Tailor confirmation required** — No auto-linking to active accounts. Tailor must explicitly confirm "yes, this is my customer" before any link is created.
- **Minimal data exposure** — When showing "existing user found", only reveal name + city + avatar. No phone, email, jobs, or measurements disclosed to the querying tailor.
- **Rate limiting** — Customer lookup during creation uses the existing auth rate limiter to prevent enumeration.
- **OTP for activation** — Same security as signup (6-digit, 5-min expiry, rate-limited).

---

## 12. Summary of Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Customer identity unification | Yes — inactive user accounts | Eliminates fragmentation, enables platform-wide customer experience |
| Shared measurements | No — per-tailor isolation | Tailors measure differently; shared data causes errors and trust issues |
| Approval/reject workflow | No — removed entirely | Too complex for target audience; creates friction and blocks tailors |
| Measurement history | Yes — read-only timeline | Provides transparency without gatekeeping; informational only |
| Cross-tailor dedup | Yes — by phone/email | Matches how customers are identified in the real world (phone is king in Africa) |
| Auto-link vs. confirm | Confirm required | Prevents wrong-person links from typos or recycled numbers |
| Offline customers (no phone/email) | Same as today | No breaking change for tailors who don't collect contact info |
