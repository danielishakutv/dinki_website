import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { referrals as referralsApi } from '../lib/api';
import Logo from '../components/layout/Logo';

/**
 * Invite — public landing page at /invite/:code.
 *
 * Resolves the code via /referrals/by-code/:code, shows a friendly
 * "invited by X" card, and stashes the code in sessionStorage so the
 * real signup form can pick it up and submit it with the signup payload.
 *
 * Unknown / expired codes render a soft not-found so the page stays a
 * safe dead-end rather than a broken one.
 */
export default function Invite() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await referralsApi.getByCode(code);
        if (cancelled) return;
        // Stash for the Landing signup handler to pick up.
        sessionStorage.setItem('dinki_referral_code', code);
        setState({ status: 'ok', referrer: res.data });
      } catch (err) {
        if (cancelled) return;
        sessionStorage.removeItem('dinki_referral_code');
        setState({ status: 'error', message: err.message || 'Invite link not recognised.' });
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center p-6">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-cloud flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-lg font-heading font-bold text-gray-900 mb-1">Invite not recognised</h1>
          <p className="text-sm text-gray-500 mb-5">
            This invite link isn't valid or has expired. You can still create an account directly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition"
          >
            Go to Dinki Africa
          </button>
        </div>
      </div>
    );
  }

  const r = state.referrer;
  const roleLabel = r.role === 'tailor' ? 'Tailor' : r.role === 'customer' ? 'Customer' : 'Member';

  return (
    <div className="min-h-screen bg-cloud flex flex-col items-center justify-center p-6">
      <div className="mb-6">
        <Logo size="md" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Inviter header */}
        <div className="p-6 border-b border-gray-50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Gift size={26} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-gold-600 uppercase tracking-wider mb-1">You've been invited</p>
          <h1 className="text-lg font-heading font-bold text-gray-900">
            {r.name} wants you on Dinki Africa
          </h1>
          <p className="text-xs text-gray-400 mt-1">{roleLabel}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Dinki is where Africa's tailors and customers meet. Sign up in under a minute and we'll
            connect your account to <span className="font-semibold text-gray-800">{r.name}</span>'s invite.
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            Create your account
            <ArrowRight size={16} />
          </button>

          <p className="text-[11px] text-center text-gray-400 leading-relaxed">
            By continuing you agree to Dinki Africa's Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
