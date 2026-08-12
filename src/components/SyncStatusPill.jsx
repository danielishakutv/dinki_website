import React, { useState } from 'react';
import { CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useSyncStatus, useOnline, syncNow } from '../hooks/useLocal';
import SyncIssuesPanel from './SyncIssuesPanel';

/**
 * The one place the app talks about connectivity.
 *
 * Everything else stays silent about it — a tailor recording a measurement should
 * never see an error, a spinner, or a retry button just because there is no
 * signal. The work is saved either way. This pill exists so they can check on it
 * if they want to, not so the app can nag them.
 */

function describe({ status, pending, failed }, online) {
  if (failed > 0) {
    return {
      icon: AlertCircle,
      text: `${failed} need${failed === 1 ? 's' : ''} attention`,
      className: 'text-red-600 bg-red-50 border-red-100',
    };
  }
  if (!online || status === 'offline') {
    return {
      icon: CloudOff,
      text: pending > 0 ? `${pending} saved offline` : 'Offline — work is saved',
      className: 'text-amber-700 bg-amber-50 border-amber-100',
    };
  }
  if (status === 'syncing') {
    return {
      icon: RefreshCw,
      text: 'Syncing…',
      className: 'text-gray-600 bg-gray-50 border-gray-100',
      spin: true,
    };
  }
  if (status === 'auth') {
    return {
      icon: AlertCircle,
      text: 'Sign in to sync',
      className: 'text-amber-700 bg-amber-50 border-amber-100',
    };
  }
  if (pending > 0) {
    return {
      icon: RefreshCw,
      text: `${pending} waiting`,
      className: 'text-amber-700 bg-amber-50 border-amber-100',
    };
  }
  return {
    icon: Check,
    text: 'All saved',
    className: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  };
}

export default function SyncStatusPill({ className = '' }) {
  const status = useSyncStatus();
  const online = useOnline();
  const [tapped, setTapped] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const { icon: Icon, text, className: tone, spin } = describe(status, online);
  const hasIssues = status.failed > 0;

  // With rejected changes, tapping opens the resolution panel — retrying is
  // pointless when the server has already refused them, and they're holding up
  // everything queued behind them.
  const onTap = () => {
    if (hasIssues) {
      setShowIssues(true);
      return;
    }
    setTapped(true);
    syncNow('manual');
    setTimeout(() => setTapped(false), 1200);
  };

  return (
    <>
      <button
        type="button"
        onClick={onTap}
        aria-label={hasIssues ? `${text}. Tap to review.` : `Sync status: ${text}. Tap to sync now.`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition ${tone} ${className}`}
      >
        <Icon size={12} className={spin || tapped ? 'animate-spin' : ''} />
        <span>{text}</span>
      </button>
      <SyncIssuesPanel open={showIssues} onClose={() => setShowIssues(false)} />
    </>
  );
}
