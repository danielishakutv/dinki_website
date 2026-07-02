import React, { useState } from 'react';
import { MailCheck, Loader2, LogOut, RefreshCw } from 'lucide-react';
import Logo from './layout/Logo';
import { useAuth } from '../contexts/AuthContext';

// Whether the 7-day grace has expired and the user must now verify to continue.
// Only gates accounts that CAN verify right now (i.e. have an email). Phone-only
// accounts aren't hard-gated until SMS verification (Termii) ships.
export function mustVerify(user) {
  if (!user) return false;
  const verified = user.email_verified || user.phone_verified;
  if (verified) return false;
  if (!user.email) return false; // nothing to verify against yet
  if (!user.verify_deadline) return false; // grandfathered
  return new Date(user.verify_deadline) < new Date();
}

export default function VerifyGate() {
  const { user, resendVerification, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const resend = async () => {
    setSending(true);
    setError('');
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send the email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cloud flex flex-col items-center justify-center p-4">
      <Logo size="md" />
      <div className="w-full max-w-md mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
          <MailCheck size={24} className="text-gold-600" />
        </div>
        <h1 className="text-xl font-heading font-bold text-gray-900">Please verify your email to continue</h1>
        <p className="text-sm text-gray-500 mt-2">
          Your 7-day trial period has ended. Confirm <span className="font-medium text-gray-700">{user?.email}</span> to keep using Dinki.
        </p>

        {sent ? (
          <div className="mt-5 rounded-xl bg-green-50 border border-green-100 p-3.5 text-sm text-green-700">
            Verification email sent — check your inbox (and spam). Click the link, then refresh this page.
          </div>
        ) : (
          <button
            onClick={resend}
            disabled={sending}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition disabled:opacity-60"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {sending ? 'Sending…' : 'Resend verification email'}
          </button>
        )}
        {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

        <button
          onClick={() => window.location.reload()}
          className="mt-3 w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          I've verified — refresh
        </button>

        <button
          onClick={logout}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          <LogOut size={13} /> Log out
        </button>
      </div>
    </div>
  );
}
