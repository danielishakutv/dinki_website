import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Info, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DISMISS_KEY = 'dinki_pending_dismissed';

/**
 * A slim, closeable info line that surfaces whatever the user still has to do —
 * verify their email, set up their storefront, finish their profile. Recomputed
 * every render; dismissal is per session and keyed to the exact task set, so a
 * newly-appearing task re-shows the bar even after a previous dismissal.
 */
export default function PendingTasksBanner() {
  const { user, resendVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [closed, setClosed] = useState(false);

  const tasks = useMemo(() => {
    if (!user) return [];
    const list = [];
    if (user.email && !user.email_verified) list.push({ key: 'verify', label: 'Verify your email', kind: 'resend' });
    if (!user.onboarding_completed) list.push({ key: 'onboarding', label: 'Complete your profile', to: '/onboarding' });
    if (user.role === 'tailor') {
      const setupDone = user.tailor_profile?.storefront_setup_completed;
      const slug = user.storefront_slug || user.tailor_profile?.storefront_slug;
      if (!setupDone && slug) list.push({ key: 'storefront', label: 'Set up your storefront', to: `/t/${slug}` });
    }
    return list;
  }, [user]);

  const signature = tasks.map((t) => t.key).join(',');

  const dismissedSig = (() => {
    try { return sessionStorage.getItem(DISMISS_KEY); } catch { return null; }
  })();

  if (!tasks.length || closed || dismissedSig === signature) return null;

  const close = () => {
    try { sessionStorage.setItem(DISMISS_KEY, signature); } catch { /* ignore */ }
    setClosed(true);
  };

  const resend = async () => {
    setSending(true);
    try { await resendVerification(); setSent(true); } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div className="rounded-2xl bg-gold-50 border border-gold-200/70 px-4 py-3 flex items-start gap-3">
      <Info size={18} className="text-gold-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gold-800">A few things to finish setting up</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {tasks.map((t) => (
            t.kind === 'resend' ? (
              sent && t.key === 'verify' ? (
                <span key={t.key} className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check size={13} /> Verification email sent
                </span>
              ) : (
                <button
                  key={t.key}
                  onClick={resend}
                  disabled={sending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-900 underline underline-offset-2 disabled:opacity-60"
                >
                  {sending && <Loader2 size={12} className="animate-spin" />} {t.label}
                </button>
              )
            ) : (
              <Link
                key={t.key}
                to={t.to}
                className="text-xs font-semibold text-gold-700 hover:text-gold-900 underline underline-offset-2"
              >
                {t.label}
              </Link>
            )
          ))}
        </div>
      </div>
      <button onClick={close} aria-label="Dismiss" className="flex-shrink-0 p-1 text-gold-500 hover:text-gold-700 transition">
        <X size={16} />
      </button>
    </div>
  );
}
