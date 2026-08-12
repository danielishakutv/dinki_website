/**
 * Client-generated record ids.
 *
 * Every synced table uses a UUID primary key with a `gen_random_uuid()` default,
 * so the server can simply accept an id the phone minted. That is what makes
 * offline creation work at all: a job created with no signal can reference a
 * customer created thirty seconds earlier with no signal, because both already
 * have their final, permanent identity before either has ever been uploaded.
 */

const HEX = [];
for (let i = 0; i < 256; i += 1) HEX.push((i + 0x100).toString(16).slice(1));

function fromRandomBytes() {
  const b = new Uint8Array(16);
  globalThis.crypto.getRandomValues(b);
  // Set the version (4) and variant bits per RFC 4122.
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return (
    `${HEX[b[0]]}${HEX[b[1]]}${HEX[b[2]]}${HEX[b[3]]}-${HEX[b[4]]}${HEX[b[5]]}-` +
    `${HEX[b[6]]}${HEX[b[7]]}-${HEX[b[8]]}${HEX[b[9]]}-` +
    `${HEX[b[10]]}${HEX[b[11]]}${HEX[b[12]]}${HEX[b[13]]}${HEX[b[14]]}${HEX[b[15]]}`
  );
}

export function uuid() {
  // randomUUID needs a secure context and Chrome 92+. Plenty of the target
  // devices run older WebViews, so getRandomValues — available essentially
  // everywhere — is the real workhorse here rather than a theoretical fallback.
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return fromRandomBytes();
  }
  // Last resort. Math.random is not cryptographically strong, but a collision
  // needs two ids to match within one tailor's own account, and the server
  // rejects a colliding id rather than merging records.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
