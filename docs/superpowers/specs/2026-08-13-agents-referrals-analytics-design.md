# Agents, universal referrals, and analytics — design

**Date:** 2026-08-13
**Status:** approved, in implementation
**Repos:** `dinki.africa` (frontend), `dinki_africa_be` (backend)

## Problem

Three related gaps:

1. **Referral links exist but nobody has one.** Every user is issued a
   `referral_code` at signup and `/invite/:code` works, but `/referral` is linked
   from no navigation anywhere in the app, so the feature is reachable only by
   typing the URL. `referral_code` is also nullable, so any user missing one is
   handed `https://dinki.africa/invite/null`.

2. **No agent role.** Growth depends on field agents who sign people up in
   markets and workshops, and the platform has no way to represent them, let
   alone measure them.

3. **Tailors can't see their own business.** `jobs.getStats` returns six numbers
   used on the dashboard. There is no trend, no customer insight, and no view of
   how the storefront is performing.

## Scope

Three phases, independently shippable, in this order: referral fix, tailor
analytics, agent role.

**Out of scope:** commissions and payouts. The `referrals.reward_amount` column
exists and is unused; money belongs with the finance module, which has its own
spec. Agent metrics are counts only.

## Phase 1 — Universal referral links

- Migration backfills `referral_code` for every user missing one.
- `referrals.getMyStats` generates and persists a code if one is somehow still
  missing, so a null can never again reach the UI as a broken link.
- A referral entry is added to the navigation for every role. This is the actual
  fix — the rest is guarding against an edge case.

## Phase 2 — Tailor analytics

Metrics are split by where the data lives, which decides what works offline.

**Computed on-device from Dexie, works with no signal:** revenue over time, jobs
by status, completion rate, average job value, overdue count, new vs returning
customers, top customers by value, and customers with no recent job.

**Server-side, online only:** storefront visits, order conversion, review rating
trend, referral performance.

### New tracking: storefront visits

Nothing records storefront traffic today. A plain counter on `tailor_profiles`
would give a number with no trend; a row per view grows without bound. So:

```
storefront_views_daily (tailor_id, day, count)   PK (tailor_id, day)
```

Incremented on storefront fetch, excluding the owner's own visits. Presented as
"profile visits", not "unique visitors" — it counts page loads, and the label
should not claim more than the data supports.

`GET /v1/analytics/tailor?days=30` serves the server-side half; the local half
never leaves the device.

## Phase 3 — Agent role

### Recording model

Agent-registered people are recorded in the **existing `referrals` table** with
`referrer_id = agent.id`. No new join table, and the roster and analytics reuse
machinery that already works.

One new column, `referrals.source` (`'link' | 'direct'`), separates people who
used the agent's link from people the agent registered by hand. Both count; they
are different kinds of work and the agent should see them separately.

### Becoming an agent

Admin-assigned only. Agents are a trusted distribution channel — a self-declared
agent role means nothing and invites signup farming. Migration extends the
`users.role` CHECK constraint to allow `'agent'`; promotion happens through the
existing admin user-management screen.

### Registering someone

The agent fills a form; an **inactive account** is created, reusing the pattern
already used for tailor-created customers. The person then claims it by setting
their own password. The agent never knows their credentials.

Delivery is belt-and-braces, because a large share of grassroots tailors will
have no email address:

- The dashboard shows a **claim link the agent can send over WhatsApp** — this is
  how this market actually communicates and it needs no infrastructure at all.
- An **email** goes out automatically when an address was given.
- An **SMS** goes out via Termii. `smsService.js` already exists, is env-gated,
  and already defaults its sender ID to the approved `"Dinki"`. It needs
  `TERMII_API_KEY` in the environment and no code change.

### Security: claim tokens

The existing `activate` endpoint accepts a raw `user_id` and only checks that the
account is inactive. Anyone who learns an inactive user's UUID can therefore set
a password on it and take the account. UUIDs are unguessable, so this has not
been exploited, but the agent flow deliberately broadcasts claim links over
WhatsApp — precisely the situation where obscurity stops being a defence.

Agent claims use a new `activation_tokens` table: a **hashed**, single-use,
expiring token, consumed by `POST /auth/claim`. Only the hash is stored, so a
database read cannot be turned into account takeover.

The legacy `activate` path stays for tailor-created customers so nothing breaks.
Tightening it is worth a follow-up and is noted rather than bundled here.

### Endpoints

Gated to `agent`, `admin`, `superadmin`:

| Endpoint | Purpose |
|---|---|
| `GET /agents/me/stats` | Registered, claimed, active — by role, plus weekly trend |
| `GET /agents/me/recruits` | Roster with status and a re-shareable claim link |
| `POST /agents/recruits` | Register a person, create the inactive account, send the claim |
| `POST /agents/recruits/:id/resend` | Re-issue and re-send the claim |

### Metric definitions

- **Registered** — everyone the agent brought, by either route.
- **Claimed** — directly-registered accounts whose owner has set a password.
- **Active** — the platform's existing activation KPI: a tailor who has recorded
  measurements for any customer, a customer who has placed an order.

The third is the one that matters. Counting raw signups rewards an agent for
registering people who never return; counting activation rewards them for
bringing real businesses onto the platform.

### Frontend

`/agent` (dashboard), `/agent/register` (form), `/agent/recruits` (roster),
`/claim/:token` (public claim page), agent-specific navigation, and `/dashboard`
routing an agent to their own home rather than a tailor workspace.

## Testing

- Claim tokens: single-use, expiry honoured, wrong token rejected, hash never
  matches a raw value.
- Agent stats: counts split correctly by source and role; activation reflects the
  KPI rather than raw signup.
- Referral backfill: no user left without a code; `getMyStats` never returns null.
- Local analytics: aggregates computed from Dexie match a known fixture.

## Rollout

Migration 033 is additive. Backend first, then frontend. `TERMII_API_KEY` must be
present in the backend environment for SMS; without it the claim flow still works
through the link and email, and SMS degrades silently.
