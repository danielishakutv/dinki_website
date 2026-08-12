import React from 'react';
import { SYNC_STATE } from '../lib/local/db';

/**
 * Per-record sync indicator.
 *
 * Green fades out after a day on purpose. If it persisted, every row in a long
 * list would be green, the colour would stop carrying any information, and the
 * orange dots — the ones that actually mean something — would stop standing out
 * against it. So a settled record shows nothing at all, and any dot at all means
 * "this one needs your attention".
 */

const RECENTLY_SYNCED_MS = 24 * 60 * 60 * 1000;

export function syncStateOf(record) {
  if (!record) return null;
  if (record._syncState === SYNC_STATE.FAILED) return 'failed';
  if (record._syncState === SYNC_STATE.PENDING) return 'pending';
  if (record._syncedAt && Date.now() - record._syncedAt < RECENTLY_SYNCED_MS) return 'synced';
  return null;
}

const STYLES = {
  pending: { className: 'bg-amber-500', label: 'Waiting to sync' },
  syncing: { className: 'bg-amber-500 animate-pulse', label: 'Syncing now' },
  synced: { className: 'bg-emerald-500', label: 'Saved to your account' },
  failed: { className: 'bg-red-500', label: "Couldn't sync — tap for details" },
};

export default function SyncDot({ record, state, className = '' }) {
  const resolved = state || syncStateOf(record);
  if (!resolved) return null;

  const style = STYLES[resolved];
  if (!style) return null;

  return (
    <span
      role="img"
      aria-label={style.label}
      title={style.label}
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${style.className} ${className}`}
    />
  );
}
