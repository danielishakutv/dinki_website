# Offline-first Dinki — design

**Date:** 2026-08-12
**Status:** approved, in implementation
**Repos:** `dinki.africa` (frontend), `dinki_africa_be` (backend)

## Problem

Dinki's users are grassroots tailors and small makers on basic Android phones with
unstable 2G/3G connections. The app today is online-only in every way that matters:

- The SWR cache in `src/hooks/useApi.js` is an in-memory `Map`, wiped on every app close.
- `public/sw.js` explicitly skips all API traffic (`if (url.origin === API_ORIGIN) return`).
- The access token lives in a JS variable and is restored via an httpOnly refresh cookie,
  so a cold start without a network lands on the login screen.
- Every mutation is a direct `await` in a page component. A dropped connection loses the work.

A tailor measuring a customer in a shop with no signal cannot use the app at all.

## Goal

The app behaves as if it is always offline: all reads come from local storage, all writes
land locally and immediately. When connectivity appears, everything syncs in the background
without the user doing anything or noticing an interruption. Each record shows whether it
has reached the server.

## Scope

**In scope (read + write offline):** customers, measurements, jobs, job status, prices,
invoicing flags.

**In scope (read cached only):** styles feed, marketplace, storefronts, notifications.

**Out of scope, deliberately:**

- Finance module (deposits, payments, expenses). No such module exists today; it gets its own
  spec and inherits this offline layer for free.
- Offline chat message queueing. Messaging carries its own socket lifecycle and delivery
  semantics; folding it into the first ship raises deployment risk on a live app. The outbox
  is built generically so chat slots in later without redesign.
- Offline marketplace order placement. An order queued against a style that was deleted, or a
  price that changed, needs a user-facing resolution flow that belongs with the finance work.

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Storage engine | Dexie over IndexedDB | ~25KB gz. RxDB/Watermelon cost 3-6x for a sync engine we can write in ~700 lines. PowerSync/Electric need a second service and ~1MB of SQLite wasm — hostile to a 2G basic Android. |
| Record IDs | Client-generated UUIDv4 | Postgres already uses `gen_random_uuid()` defaults, so the server can simply accept a supplied id. Removes ID remapping, the ugliest part of offline retrofits, and lets a job reference an offline-created customer immediately. |
| Conflict policy | Field-level last-write-wins via patches | The client pushes only the fields it changed. The server applies that patch onto the current row, so concurrent edits to *different* fields both survive with zero extra schema. |
| Timestamps | Server stamps every `updated_at`; cursors come from server responses | Basic Android devices frequently have badly wrong clocks. Trusting the device clock for ordering silently loses data. |
| Sync transport | Batched `/v1/sync/pull` and `/v1/sync/push` | One round trip instead of N. On a 2G link, round trips dominate total sync time. |
| Offline session | 30 days, optional 4-digit PIN off by default | Chosen by the product owner. |
| Deletes | Soft (`deleted_at`) | A hard delete can never propagate to a device that was offline when it happened. |

## Architecture

```
  React components
        │   useLiveQuery — reactive reads, no polling
        ▼
  Repository layer  ── the only thing the UI talks to
        │
        ▼
  Dexie / IndexedDB ── outbox table ────┐
        ▲                                │
        │  pull (delta)           push   │
        └────────── sync engine ─────────┘
                        │
                   lib/api.js  →  be.dinki.africa
```

**Core invariant: the UI never awaits the network.** Every read resolves from IndexedDB.
Every write commits to IndexedDB plus the outbox and returns immediately. `lib/api.js` is
unchanged in behaviour — it stops being the UI's data source and becomes the sync engine's
transport.

## Frontend components

### `src/lib/local/db.js`
Dexie schema, namespaced per user (`dinki_<userId>`), so two tailors sharing one phone cannot
see each other's books. Tables: `customers`, `jobs`, `outbox`, `meta`.

Synced rows carry sync metadata as flat, indexable fields:

| Field | Meaning |
|---|---|
| `_dirty` | `1` while local changes are unpushed |
| `_deleted` | `1` for a soft-deleted row |
| `_syncedAt` | epoch ms of last confirmed server round trip |
| `_serverUpdatedAt` | the server's `updated_at` — the base for conflict detection |

### `src/lib/local/outbox.js`
The write queue. Entry shape:

```js
{
  id,              // uuid — doubles as the server-side idempotency key
  entity,          // 'customer' | 'job'
  op,              // 'create' | 'update' | 'delete'
  entityId,        // client-generated uuid of the target row
  patch,           // only the fields that changed
  baseUpdatedAt,   // server updated_at the client held when it edited
  seq,             // monotonic, drives FIFO
  attempts, nextAttemptAt, lastError,
  status,          // 'pending' | 'inflight' | 'failed'
}
```

Two behaviours that matter more than they look:

- **Coalescing.** Five offline edits to one customer produce one entry with merged fields, not
  five. This is the difference between a sync that completes on 2G and one that doesn't.
- **Strict FIFO with quarantine.** A job created offline references an offline-created customer.
  The client UUID makes the foreign key valid immediately, but the server still rejects the job
  if the customer row isn't there yet, so ordering must hold. An entry that fails permanently
  (validation, not network) is quarantined and surfaced to the user rather than blocking the
  queue forever.

### `src/lib/local/sync.js`
Pull, push, backoff, and a single-flight lock via `navigator.locks` so two open tabs don't
double-sync.

Triggers: app boot, successful login, `online` event, socket reconnect, tab focus, a debounced
tick after any local mutation, and a slow periodic timer while online.

Backoff is exponential with jitter and a ceiling, so a flaky link is never hammered.

### `src/lib/local/session.js`
Cold start reads the local session **first** and boots the UI from local data immediately,
without waiting on a network call that is going to fail. The refresh attempt happens after.

| Situation | Behaviour |
|---|---|
| Refresh succeeds | Online mode, full sync kicks off |
| Refresh fails on network | Offline-authenticated: reads local, writes queue |
| Refresh returns 401 (revoked) | Data stays **readable**, new writes blocked, re-login prompted. Deliberately no wipe — the outbox may hold unsynced work, and destroying a tailor's unsaved day because a token expired is the worst available failure. |
| Explicit logout | Per-user DB wiped, with a warning first if the outbox is non-empty |
| 30 days with zero server contact | Data stays readable; writes require re-login |

The optional PIN is a PBKDF2 hash (WebCrypto) with a local attempt lockout. It is a screen
lock, not encryption: the data is in IndexedDB either way and anyone with the physical phone
and devtools can read it. It stops a curious relative or shop assistant, not a determined
attacker. Full DB encryption was rejected — it costs CPU on every read on exactly the weak
devices being targeted, and a forgotten PIN would mean permanent data loss.

### Sync indicators
An 8px `<SyncDot>` per row, plus a global pill in the header (`All saved` / `3 waiting` /
`Syncing…`).

| State | Indicator |
|---|---|
| Pending — in outbox | Orange dot |
| Syncing — inflight | Orange, pulsing |
| Synced within 24h | Green dot |
| Settled (synced >24h ago) | No dot |
| Failed | Red dot, tappable for reason and retry |

Green fades after 24 hours on purpose. If green persisted, every row would be green, the colour
would stop carrying information, and the orange dots would stop standing out. Absence of a dot
reads as "settled and fine"; any dot means "look at me".

## Backend changes

All additive and backwards compatible — existing clients keep working unchanged.

### Migration `032_offline_sync_foundation.js`
- `updated_at` auto-bump triggers on `customers` and `jobs`. Today `t.timestamps(true, true)`
  only defaults on insert and nothing bumps the column on UPDATE, so there is literally nothing
  to sync on.
- `deleted_at timestamptz` on `customers` and `jobs`, with partial indexes.
- `sync_ops` table recording applied idempotency keys, scoped per user, with a TTL sweep.
- Composite indexes on `(tailor_id, updated_at)` to make delta queries cheap.

### `/v1/sync`
- `GET /v1/sync/pull?since=<iso>&limit=` → `{ cursor, has_more, entities: { customers, jobs } }`.
  Includes soft-deleted rows so deletes propagate. Omitting `since` performs a full seed pull.
- `POST /v1/sync/push` with `{ ops: [...] }` → `{ results: [{ id, status, record, error }] }`,
  where status is `applied | replayed | conflict | rejected`.

Ops are applied in submitted order inside a transaction per op, so a rejected op cannot leave a
partial write. Each op's `id` is its idempotency key: a replay returns the stored result instead
of creating a duplicate.

### Security rules on the new surface
Client-supplied IDs and idempotency are both easy to get wrong, so explicitly:

- Supplied IDs are validated as UUIDs and **scoped to the caller**. An ID colliding with another
  user's row returns 409 without revealing that the row exists.
- Idempotency keys are namespaced per user — user A cannot replay user B's stored response.
- `since` is strictly parsed. An unparseable value silently becoming "everything" would mean a
  full table scan on every sync.
- The sync endpoints are rate-limited and the push batch size is capped.
- Offline-created customers replay through the force-create path. The interactive identity-match
  confirmation in `createCustomer` cannot run without a network, and prompting the tailor days
  later for a decision they made offline is worse than the occasional duplicate, which is
  recoverable.

## Adjacent work included

- **Nigeria-only geo data.** `country-state-city` is 8.7MB. It is lazy-loaded, but any user
  reaching onboarding on 2G is stuck there. A Nigeria-only states/LGA dataset is a few KB and is
  the single largest performance win available on low-end devices.
- **PWA icons.** The manifest ships only an SVG. Chrome on Android will not offer "Install"
  without 192px and 512px PNGs, so today most target users cannot add the app to their home
  screen at all.
- **Service worker upgrade.** Precache the built asset manifest, keep the SPA navigation
  fallback, and add an LRU-capped image cache so photos don't consume a cheap phone's storage.

## Testing

The sync engine is where subtle bugs live, so it is developed test-first against
`fake-indexeddb`. Required scenarios:

- Create offline, then sync — the row appears server-side with the client's UUID.
- The same record edited on both sides — different fields both survive.
- Delete offline — propagates, and the row disappears on other devices.
- Outbox coalescing — five edits become one op.
- FIFO dependency — a customer is pushed before the job referencing it.
- Duplicate replay — pushing the same op twice creates one row.
- 401 mid-drain — the queue halts without losing entries.
- App killed mid-drain — `inflight` entries reset to `pending` on next boot.
- Clock skew — a device with a wrong date still syncs in the correct order.

## Rollout

Backend first: it is entirely additive and breaks no existing client. Then the frontend, entity
by entity — customers, then jobs — each independently shippable. Existing users get one full
seed pull on first boot after upgrade.
