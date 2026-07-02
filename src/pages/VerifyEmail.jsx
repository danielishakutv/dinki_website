import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { verifyEmail, user } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [msg, setMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React 18 StrictMode double-invoke
    ran.current = true;
    if (!token) { setStatus('error'); setMsg('This verification link is missing its code.'); return; }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => { setStatus('error'); setMsg(err.message || 'This link is invalid or has already been used.'); });
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen bg-cloud flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-8"><Logo size="md" /></Link>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 size={36} className="mx-auto animate-spin text-gold-500 mb-4" />
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={44} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-heading font-bold text-gray-900">Email verified 🎉</h1>
            <p className="text-sm text-gray-500 mt-2">Your email is confirmed. Thanks for keeping your account secure.</p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/?auth=login')}
              className="mt-5 w-full py-3 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition"
            >
              {user ? 'Go to my dashboard' : 'Log in'}
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={44} className="mx-auto text-rose-500 mb-4" />
            <h1 className="text-xl font-heading font-bold text-gray-900">Couldn't verify</h1>
            <p className="text-sm text-gray-500 mt-2">{msg}</p>
            <p className="text-xs text-gray-400 mt-2">You can request a fresh link from the banner on your dashboard.</p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="mt-5 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              {user ? 'Back to dashboard' : 'Go to Dinki'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
