import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Loader2, Check, ArrowRight } from 'lucide-react';
import { auth as authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Small modal to verify a phone number via SMS code (Termii). Degrades to a
 * "coming soon" message when SMS isn't enabled on the server yet.
 */
export default function VerifyPhoneModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [stage, setStage] = useState('idle'); // idle | sent | disabled | done
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.sendPhoneCode();
      if (res.data?.enabled === false) { setStage('disabled'); return; }
      if (res.data?.verified) { setStage('done'); return; }
      setStage('sent');
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 4) { setError('Enter the code we texted you.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyPhone(code.trim());
      if (res.data?.user) setUser(res.data.user);
      setStage('done');
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Smartphone size={18} className="text-teal-600" />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {stage === 'done' ? (
            <div className="text-center py-4">
              <Check size={40} className="mx-auto text-green-500 mb-3" />
              <h2 className="text-lg font-heading font-bold text-gray-900">Phone verified 🎉</h2>
              <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600">Done</button>
            </div>
          ) : stage === 'disabled' ? (
            <div className="text-center py-2">
              <h2 className="text-lg font-heading font-bold text-gray-900">Coming soon</h2>
              <p className="text-sm text-gray-500 mt-2">SMS phone verification is being set up. You'll be able to verify your number here shortly — your email verification still keeps your account active.</p>
              <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">Got it</button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-heading font-bold text-gray-900">Verify your phone</h2>
              <p className="text-sm text-gray-500 mt-1">
                {stage === 'sent'
                  ? <>Enter the 6-digit code we texted to <span className="font-medium text-gray-700">{user?.phone}</span>.</>
                  : <>We'll text a verification code to <span className="font-medium text-gray-700">{user?.phone || 'your number'}</span>.</>}
              </p>

              {stage === 'sent' && (
                <input
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && verify()}
                  inputMode="numeric" placeholder="000000" autoFocus
                  className="mt-4 w-full text-center tracking-[0.4em] text-xl font-bold px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              )}

              {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

              <button
                onClick={stage === 'sent' ? verify : sendCode}
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : (stage === 'sent' ? <Check size={16} /> : <ArrowRight size={16} />)}
                {loading ? 'Please wait…' : (stage === 'sent' ? 'Verify' : 'Send code')}
              </button>

              {stage === 'sent' && (
                <button onClick={sendCode} disabled={loading} className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600">
                  Resend code
                </button>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
