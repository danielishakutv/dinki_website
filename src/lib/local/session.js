/**
 * The offline session.
 *
 * The app's access token lives in memory and is restored from an httpOnly refresh
 * cookie, which needs a network round trip. That is fine online and useless on a
 * bus with no signal: a cold start would land on the login screen with a full
 * local database sitting right there.
 *
 * So a small session envelope is kept in localStorage. It grants no server
 * access whatsoever — it holds no token — it only records that this device
 * belongs to this user, so the app can open their local data instantly and try
 * the network afterwards.
 */

const KEY = 'dinki.session';

// Chosen with the product owner: long enough that a genuinely rural tailor with a
// month of bad connectivity is never locked out of their own business records,
// short enough that a lost phone stops being readable eventually.
const OFFLINE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const PIN_ITERATIONS = 100_000;
const PIN_MAX_FAILURES = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Private-browsing or a full disk. The app still works for this session; it
    // just won't survive a restart offline.
  }
}

/** Synchronous on purpose — the cold boot path must not await anything. */
export function loadSession() {
  const session = read();
  if (!session?.userId) return null;
  return session;
}

export function saveSession(user) {
  const existing = read();
  // Preserve a PIN across re-logins by the same user; drop it if the device
  // changes hands to a different account.
  const keepPin = existing && existing.userId === user.id;
  write({
    userId: user.id,
    user,
    savedAt: Date.now(),
    lastOnlineAt: Date.now(),
    revoked: false,
    pin: keepPin ? existing.pin || null : null,
  });
}

/** Called after any successful contact with the server. */
export function touchOnline() {
  const session = read();
  if (!session) return;
  write({ ...session, lastOnlineAt: Date.now(), revoked: false });
}

export function updateUser(user) {
  const session = read();
  if (!session) return;
  write({ ...session, user: { ...session.user, ...user } });
}

/**
 * The server told us this session is gone.
 *
 * Note what this does NOT do: wipe anything. The outbox may hold a day of work
 * that has never reached the server. The user re-authenticates and it drains.
 */
export function markRevoked() {
  const session = read();
  if (!session) return;
  write({ ...session, revoked: true });
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** True once the device has gone this long with no successful server contact. */
export function isOfflineWindowExpired(session = read()) {
  if (!session) return true;
  return Date.now() - (session.lastOnlineAt || session.savedAt || 0) > OFFLINE_WINDOW_MS;
}

/** Local data stays readable even when writing is blocked. */
export function canWriteOffline(session = read()) {
  return Boolean(session) && !session.revoked && !isOfflineWindowExpired(session);
}

// ---------------------------------------------------------------------------
// Optional PIN
// ---------------------------------------------------------------------------

/**
 * This is a screen lock, not encryption.
 *
 * The data sits in IndexedDB either way, and anyone with the physical phone and
 * developer tools can read it regardless of the PIN. It exists to stop a curious
 * relative or a shop assistant picking up an unlocked handset. Full database
 * encryption was considered and rejected: it costs CPU on every single read on
 * exactly the weak devices this app targets, and a forgotten PIN would mean
 * permanent, unrecoverable data loss for a small business.
 */

function hasSubtle() {
  return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.deriveBits === 'function';
}

function toB64(bytes) {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromB64(value) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function derive(pin, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PIN_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toB64(new Uint8Array(bits));
}

/** PIN setup is only offered where it can be done properly. */
export function pinSupported() {
  return hasSubtle();
}

export function hasPin() {
  return Boolean(read()?.pin?.hash);
}

export async function setPin(pin) {
  if (!hasSubtle()) throw new Error('This device cannot store a PIN securely');
  if (!/^\d{4}$/.test(String(pin))) throw new Error('PIN must be 4 digits');

  const session = read();
  if (!session) throw new Error('Not signed in');

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(String(pin), salt);
  write({ ...session, pin: { salt: toB64(salt), hash, failures: 0, lockedUntil: 0 } });
}

export function clearPin() {
  const session = read();
  if (!session) return;
  write({ ...session, pin: null });
}

export function pinLockedUntil() {
  return read()?.pin?.lockedUntil || 0;
}

/**
 * Verify an entered PIN.
 *
 * Failures are counted and lock the gate for a while. This is rate limiting a
 * local check, so it is bypassable by someone determined enough to clear storage
 * — but it does stop casual guessing of a 4-digit code, which is the actual
 * threat here.
 */
export async function verifyPin(pin) {
  const session = read();
  const stored = session?.pin;
  if (!stored?.hash) return true;

  if (stored.lockedUntil && Date.now() < stored.lockedUntil) {
    const minutes = Math.ceil((stored.lockedUntil - Date.now()) / 60000);
    const err = new Error(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    err.code = 'PIN_LOCKED';
    throw err;
  }

  const candidate = await derive(String(pin), fromB64(stored.salt));
  if (candidate === stored.hash) {
    write({ ...session, pin: { ...stored, failures: 0, lockedUntil: 0 } });
    return true;
  }

  const failures = (stored.failures || 0) + 1;
  write({
    ...session,
    pin: {
      ...stored,
      failures,
      lockedUntil: failures >= PIN_MAX_FAILURES ? Date.now() + PIN_LOCKOUT_MS : 0,
    },
  });
  return false;
}

export { OFFLINE_WINDOW_MS, PIN_MAX_FAILURES };
