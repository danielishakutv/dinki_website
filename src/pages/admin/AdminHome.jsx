import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { admin as adminApi } from '../../lib/api';

/**
 * AdminHome — the default /admin page.
 *
 * Module 2 only verifies the admin gate is wired end-to-end (calls
 * /v1/admin/ping). Module 3 replaces this page body with real user-count
 * cards. Kept very small on purpose so Module 3 can swap it cleanly.
 */
export default function AdminHome() {
  const [status, setStatus] = useState({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.ping();
        if (cancelled) return;
        setStatus({ state: 'ok', data: res.data });
      } catch (err) {
        if (cancelled) return;
        setStatus({ state: 'error', message: err.message || 'Request failed' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status.state === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (status.state === 'error') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Admin check failed</p>
          <p className="text-red-600/80 mt-0.5">{status.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-white border border-gray-100">
        <p className="text-sm font-semibold text-gray-800 mb-1">Admin session verified</p>
        <p className="text-xs text-gray-500">
          Role: <span className="font-mono">{status.data.role}</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Dashboard metrics land here in the next module.
        </p>
      </div>
    </div>
  );
}
