import React, { useEffect, useState } from 'react';
import { AlertCircle, X, RotateCw, Trash2 } from 'lucide-react';
import * as outbox from '../lib/local/outbox';
import { syncNow } from '../hooks/useLocal';

/**
 * Resolution for changes the server refused.
 *
 * The outbox drains strictly in order, because a job cannot be uploaded before
 * the customer it belongs to. That means one rejected change stops everything
 * behind it — which is the correct behaviour, but only if the tailor has a way
 * to clear the blockage. Without this panel a single bad record would silently
 * freeze syncing forever while the app looked fine.
 */

const LABELS = {
  'customer.create': 'New customer',
  'customer.update': 'Customer details',
  'customer.measurements': 'Measurements',
  'customer.delete': 'Deleted customer',
  'job.create': 'New job',
  'job.update': 'Job details',
  'job.status': 'Job progress',
  'job.invoice': 'Invoice status',
  'job.delete': 'Deleted job',
};

export default function SyncIssuesPanel({ open, onClose }) {
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      setEntries(await outbox.failedEntries());
    } catch {
      setEntries([]);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  if (!open) return null;

  const handleRetry = async (seq) => {
    setBusy(seq);
    await outbox.retry(seq);
    await load();
    syncNow('manual-retry');
    setBusy(null);
  };

  const handleDiscard = async (entry) => {
    const label = LABELS[`${entry.entity}.${entry.op}`] || 'this change';
    if (!window.confirm(`Discard "${label}"? It will never be saved to your account.`)) return;
    setBusy(entry.seq);
    await outbox.discard(entry.seq);
    await load();
    syncNow('after-discard');
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <h2 className="font-heading font-bold text-gray-900">Changes that need attention</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Nothing needs your attention. Everything is syncing normally.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-relaxed">
                These changes were saved on this phone but the server wouldn't accept them.
                Everything queued behind them is waiting, so please resolve them to get syncing again.
              </p>
              {entries.map((entry) => (
                <div key={entry.seq} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {LABELS[`${entry.entity}.${entry.op}`] || `${entry.entity} ${entry.op}`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">{entry.last_error}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRetry(entry.seq)}
                      disabled={busy === entry.seq}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-50"
                    >
                      <RotateCw size={12} /> Try again
                    </button>
                    <button
                      onClick={() => handleDiscard(entry)}
                      disabled={busy === entry.seq}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-medium text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Discard
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
