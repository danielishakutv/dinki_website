import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { auth as authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/layout/Logo';

/**
 * Public claim page for an account an agent set up — `/claim/:token`.
 *
 * The person arrives from a WhatsApp message, usually on a cheap phone, often
 * with no idea what Dinki is. So the page leads with who registered them and
 * asks for exactly one thing: a password. Everything else about their account is
 * already filled in and editable later.
 */
export default function ClaimAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.inspectClaim(token);
        if (cancelled) return;
        setAccount(res.data);
        setName(res.data?.name || '');
      } catch (err) {
        if (!cancelled) setInvalid(err.message || 'This link is no longer valid.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await authApi.claim({ token, password, name: name.trim() || undefined });
      // The claim response is a full session, so the person lands inside the app
      // already signed in rather than being bounced to a login form.
      if (res.data?.user) setUser(res.data.user);
      navigate('/dashboard', { replace: true });
      // A hard reload lets AuthProvider re-run its bootstrap — opening the local
      // database and starting sync for this newly real account.
      setTimeout(() => window.location.reload(), 50);
    } catch (err) {
      setError(err.message || 'Could not set up your account');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={22} className="text-amber-600" />
          </div>
          <h1 className="font-heading font-bold text-lg text-gray-900">This link has expired</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Claim links only work once. Ask whoever registered you to send a fresh one.
          </p>
          <Link
            to="/"
            className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium transition"
          >
            Go to Dinki
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cloud flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        <div className="flex justify-center mb-5">
          <Logo size="md" />
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h1 className="font-heading font-bold text-xl text-gray-900">
            Welcome{account?.name ? `, ${account.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Your Dinki account is ready. Choose a password to finish setting it up.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Choose a password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {(account?.phone || account?.email) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  We'll sign you in with{' '}
                  <span className="font-medium text-gray-700">{account.phone || account.email}</span>.
                  You can change this later in settings.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || password.length < 8}
              className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-medium text-sm transition inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Setting up…' : 'Start using Dinki'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/" className="text-gold-600 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
