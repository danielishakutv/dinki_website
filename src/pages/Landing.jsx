import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Star, Zap, ShoppingBag, Eye, EyeOff,
  Users, TrendingUp, ArrowRight, X, Scissors, User, Menu, Check, Loader2
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import { VerifiedBadge, LevelBadge } from '../components/TailorBadges';
import LandingTrending from '../components/styles/LandingTrending';
import { useAuth } from '../contexts/AuthContext';
import { auth as authApi } from '../lib/api';

/* ─────────────────────────────────────────────
   AUTH OVERLAY — full-screen, split-panel design
   ───────────────────────────────────────────── */
const BG_IMAGES = {
  signup: '/images/cc1092f5c6cf791aa0170769398442db.webp',
  login:  '/images/85423fceb9d23ecafaa9c3e1a931f4e8.webp',
};

function AuthOverlay({ mode: initialMode, onClose, onSuccess }) {
  const { signup, activate, verifyEmail, login } = useAuth();
  const [mode, setMode]                 = useState(initialMode);
  const [formData, setFormData]         = useState({ email: '', password: '', name: '', accountType: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent]       = useState(false);
  const [otpStep, setOtpStep]           = useState(false);
  const [otp, setOtp]                   = useState('');
  const [activationFlow, setActivationFlow] = useState(null); // { user_id, name }
  const [customerGated, setCustomerGated] = useState(false); // customer signup/login is coming soon
  const [resending, setResending]       = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg]       = useState('');

  // Tick down the resend cooldown so the button re-enables after 30s.
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resending || resendCooldown > 0 || !formData.email) return;
    setResending(true);
    setError('');
    setResendMsg('');
    try {
      await authApi.resendOtp(formData.email);
      setResendMsg('A new code is on its way. Check your inbox (and spam).');
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const isSignup  = mode === 'signup';

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canSubmit = isSignup
    ? formData.email && isValidEmail(formData.email) && formData.password.length >= 8 && formData.accountType && formData.name.trim().length >= 2
    : formData.email && isValidEmail(formData.email) && formData.password;

  const set = (k, v) => {
    setFormData(p => ({ ...p, [k]: v }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.email || !isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password) {
      setError('Please enter your password.');
      return;
    }
    if (isSignup && formData.name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (isSignup && formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (isSignup && !formData.accountType) {
      setError('Please select an account type.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        // If the user landed via /invite/<code>, the code was stashed in
        // sessionStorage. Attach it to signup so the backend can record
        // the referral. Cleared either way so a lingering code doesn't
        // leak into a later, unrelated signup.
        const referralCode = sessionStorage.getItem('dinki_referral_code') || undefined;
        const result = await signup({
          email: formData.email,
          password: formData.password,
          name: formData.name.trim(),
          role: formData.accountType,
          referralCode,
        });
        if (referralCode) sessionStorage.removeItem('dinki_referral_code');
        // Backend detected an inactive account with this email
        if (result.inactive_account) {
          setActivationFlow({ user_id: result.user_id, name: result.name });
          setError('');
          return;
        }
        setOtpStep(true);
      } else {
        await login({ email: formData.email, password: formData.password });
        onSuccess();
      }
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setOtpStep(true);
      } else if (err.code === 'ROLE_NOT_PERMITTED') {
        setCustomerGated(true);
      } else if (err.code === 'EMAIL_EXISTS') {
        setError('This email already has an account. Try logging in instead — or use "Forgot password" if you can\'t remember it.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyEmail({ email: formData.email, otp });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!formData.email || !isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(formData.email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setFormData({ email: '', password: '', name: '', accountType: '' });
    setError('');
    setShowPassword(false);
    setForgotPassword(false);
    setResetSent(false);
    setOtpStep(false);
    setOtp('');
    setActivationFlow(null);
    setCustomerGated(false);
  };

  const handleActivateSubmit = async () => {
    if (!formData.email || !isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await activate({
        user_id: activationFlow.user_id,
        email: formData.email,
        password: formData.password,
        name: formData.name.trim() || undefined,
      });
      setActivationFlow(null);
      setOtpStep(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="auth-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: 'rgba(10,8,6,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full sm:max-w-4xl flex flex-col md:flex-row overflow-hidden"
          style={{ borderRadius: '24px 24px 0 0', maxHeight: '95vh' }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`
            @media (min-width: 640px) {
              .auth-card { border-radius: 24px !important; }
            }
          `}</style>
          <div className="auth-card relative w-full flex flex-col md:flex-row overflow-hidden" style={{ borderRadius: '24px 24px 0 0' }}>

            {/* ── LEFT: atmospheric image panel (desktop only) ── */}
            <div className="hidden md:flex md:w-[44%] relative flex-col justify-between p-10 overflow-hidden" style={{ minHeight: 560 }}>
              <img src={BG_IMAGES[mode]} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(20,10,0,0.85) 0%, rgba(30,18,5,0.65) 50%, rgba(10,18,30,0.80) 100%)' }} />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
              <div className="relative z-10 flex justify-end">
                <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <X size={16} className="text-white" />
                </button>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(232,160,32,0.18)', color: '#e8a020', border: '1px solid rgba(232,160,32,0.3)' }}>
                  <Scissors size={11} />
                  {isSignup ? 'Join the Community' : 'Welcome Back'}
                </div>
                <h2 style={{ fontFamily: "'Georgia', serif", fontWeight: 700, lineHeight: 1.18, fontSize: 36 }} className="text-white mb-4">
                  {isSignup ? <>Your story,<br /><em>stitched</em> to<br />perfection.</> : <>Good to have<br />you <em>back</em>.</>}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  {isSignup ? "Connect with Africa's finest tailors. Celebrate culture through every cut and stitch." : 'Sign in to continue your tailoring journey across the continent.'}
                </p>
              </div>
              <div className="relative z-10 flex gap-7">
                {[['2K+', 'Tailors'], ['14K+', 'Customers'], ['4.9', 'Rating']].map(([v, l]) => (
                  <div key={l}>
                    <p style={{ fontFamily: "'Georgia', serif", color: '#e8a020', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{v}</p>
                    <p className="text-white/40 text-xs mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: form panel ── */}
            <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: '#faf8f4', padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              {/* mobile top bar */}
              <div
                className="md:hidden relative h-36 w-full overflow-hidden flex-shrink-0"
                style={{ marginLeft: 'calc(clamp(1.5rem, 4vw, 2.5rem) * -1)', marginRight: 'calc(clamp(1.5rem, 4vw, 2.5rem) * -1)', width: 'calc(100% + clamp(1.5rem, 4vw, 2.5rem) * 2)', marginTop: 'calc(clamp(1.5rem, 4vw, 2.5rem) * -1)', marginBottom: '1.25rem' }}
              >
                <img src={BG_IMAGES[mode]} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(20,10,0,0.80) 0%, rgba(20,10,0,0.45) 100%)' }} />
                <div className="relative z-10 flex items-center justify-between px-5 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e8a020' }}>
                      <Scissors size={13} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, color: '#fff', fontSize: 15 }}>Dinki Africa</span>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <X size={15} className="text-white" />
                  </button>
                </div>
                <div className="relative z-10 px-5 pt-2">
                  <p style={{ fontFamily: "'Georgia', serif", color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                    {isSignup ? <><em>Stitched</em> to perfection.</> : <>Good to have you <em>back</em>.</>}
                  </p>
                </div>
              </div>

              {/* desktop logo */}
              <div className="hidden md:flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e8a020' }}>
                  <Scissors size={13} className="text-white" strokeWidth={2.5} />
                </div>
                <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, color: '#1a0a00', fontSize: 15 }}>Dinki Africa</span>
              </div>

              {/* heading */}
              <div className="mb-5">
                <h1 style={{ fontFamily: "'Georgia', serif", fontWeight: 700, color: '#1a0a00', fontSize: 'clamp(22px, 4vw, 30px)', lineHeight: 1.15 }} className="mb-1">
                  {activationFlow ? 'Activate your account' : forgotPassword ? 'Reset Password' : isSignup ? 'Create account' : 'Sign in'}
                </h1>
                <p style={{ color: '#9a8a7a', fontSize: 14 }}>
                  {activationFlow
                    ? 'A tailor has already set up your account on Dinki.'
                    : forgotPassword
                    ? "Enter your email and we'll send you a reset link."
                    : isSignup ? 'Start your tailoring journey today.' : 'Welcome back — sign in to continue.'}
                </p>
              </div>

              {/* Activation Flow */}
              {activationFlow ? (
                <div>
                  <div style={{ background: '#fff8ec', border: '1px solid #f0d8a8', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: '#8a6a20', lineHeight: 1.6 }}>
                      Hi <strong>{activationFlow.name}</strong>! A tailor on Dinki created your account. Enter your email and a password to activate it and see all your orders and measurements.
                    </p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Email address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                      onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Create a password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="Min. 8 characters"
                        onKeyDown={e => e.key === 'Enter' && handleActivateSubmit()}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 2.8rem 0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                        onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button onClick={() => setShowPassword(p => !p)} type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9a8a7a' }}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, paddingLeft: 2 }}>{error}</p>}

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.975 }}
                    onClick={handleActivateSubmit}
                    disabled={loading}
                    style={{ width: '100%', padding: '0.82rem', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(232,160,32,0.35)', marginBottom: 16, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Activate Account <ArrowRight size={16} /></>}
                  </motion.button>

                  <p style={{ textAlign: 'center', fontSize: 13, color: '#9a8a7a' }}>
                    Not you?{' '}
                    <button onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8a020', fontWeight: 700, fontSize: 13 }}>
                      Create a new account
                    </button>
                  </p>
                </div>
              ) : forgotPassword ? (
                resetSent ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Check size={22} style={{ color: '#2e7d32' }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1a0a00', marginBottom: 8 }}>Check your email</p>
                    <p style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 20, lineHeight: 1.6 }}>
                      We've sent a password reset link to <strong style={{ color: '#1a0a00' }}>{formData.email}</strong>
                    </p>
                    <button
                      onClick={() => { setForgotPassword(false); setResetSent(false); setError(''); }}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)', color: '#fff', fontSize: 14, fontWeight: 700 }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Email address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="you@example.com"
                        onKeyDown={e => e.key === 'Enter' && handleForgotSubmit()}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                        onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, paddingLeft: 2 }}>{error}</p>}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.975 }}
                      onClick={handleForgotSubmit}
                      disabled={loading}
                      style={{ width: '100%', padding: '0.82rem', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(232,160,32,0.35)', marginBottom: 16, opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send Reset Link <ArrowRight size={16} /></>}
                    </motion.button>
                    <p style={{ textAlign: 'center', fontSize: 13, color: '#9a8a7a' }}>
                      Remember your password?{' '}
                      <button onClick={() => { setForgotPassword(false); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8a020', fontWeight: 700, fontSize: 13 }}>
                        Sign in
                      </button>
                    </p>
                  </>
                )
              ) : otpStep ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '2px solid #e8a020' }}>
                      <Scissors size={20} style={{ color: '#e8a020' }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1a0a00', marginBottom: 4 }}>Verify your email</p>
                    <p style={{ fontSize: 13, color: '#9a8a7a', lineHeight: 1.6 }}>
                      We sent a 6-digit code to <strong style={{ color: '#1a0a00' }}>{formData.email}</strong>.
                    <br />Check your spam/junk folder if you don't see it.
                    </p>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Verification code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      placeholder="000000"
                      onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                      autoFocus
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 24, color: '#1a0a00', outline: 'none', textAlign: 'center', letterSpacing: '0.5em', fontWeight: 700, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                      onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, paddingLeft: 2 }}>{error}</p>}
                  <motion.button
                    whileHover={otp.length === 6 ? { scale: 1.015 } : {}}
                    whileTap={otp.length === 6  ? { scale: 0.975 } : {}}
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    style={{
                      width: '100%', padding: '0.82rem', borderRadius: 14, border: 'none',
                      cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                      background: otp.length === 6 ? 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)' : '#e8ddd4',
                      color: otp.length === 6 ? '#fff' : '#b0a090',
                      fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: otp.length === 6 ? '0 4px 20px rgba(232,160,32,0.35)' : 'none',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Verify & Continue <ArrowRight size={16} /></>}
                  </motion.button>
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    {resendMsg && <p style={{ fontSize: 12, color: '#1a7a3a', marginBottom: 8 }}>{resendMsg}</p>}
                    <p style={{ fontSize: 12, color: '#9a8a7a', lineHeight: 1.6 }}>
                      Didn't receive a code?{' '}
                      <button
                        onClick={handleResendOtp}
                        disabled={resending || resendCooldown > 0}
                        style={{ background: 'none', border: 'none', cursor: (resending || resendCooldown > 0) ? 'default' : 'pointer', color: (resending || resendCooldown > 0) ? '#b0a090' : '#e8a020', fontWeight: 700, fontSize: 12 }}
                      >
                        {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </button>
                      {' · '}
                      <button onClick={() => { setOtpStep(false); setOtp(''); setError(''); setResendMsg(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8a020', fontWeight: 700, fontSize: 12 }}>
                        go back
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
              <>

              {/* account type selector */}
              {isSignup && (
                <div className="mb-4">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#9a8a7a', textTransform: 'uppercase', marginBottom: 10 }}>I am a…</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { value: 'customer', Icon: User,     label: 'Customer', sub: 'Find & hire tailors'  },
                      { value: 'tailor',   Icon: Scissors, label: 'Tailor',   sub: 'Showcase your craft' },
                    ].map(({ value, Icon, label, sub }) => {
                      const active = formData.accountType === value;
                      return (
                        <button
                          key={value}
                          onClick={() => set('accountType', value)}
                          style={{
                            position: 'relative', borderRadius: 16, border: `2px solid ${active ? '#e8a020' : '#e0d8d0'}`,
                            background: active ? '#fff8ec' : '#fff', padding: '12px 14px', textAlign: 'left',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: active ? '0 0 0 3px rgba(232,160,32,0.15)' : 'none',
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, background: active ? '#e8a020' : '#f0ede9' }}>
                            <Icon size={14} style={{ color: active ? '#fff' : '#9a8a7a' }} strokeWidth={2.2} />
                          </div>
                          <p style={{ fontWeight: 700, fontSize: 13, color: '#1a0a00', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 11, color: '#9a8a7a', margin: '2px 0 0' }}>{sub}</p>
                          {active && (
                            <div style={{ position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderRadius: '50%', background: '#e8a020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customerGated ? (
                <div style={{
                  padding: '28px 20px', borderRadius: 16,
                  background: 'linear-gradient(135deg, #fff8ec 0%, #fff 100%)',
                  border: '1.5px solid #f0d8a8', textAlign: 'center', marginBottom: 16,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(232,160,32,0.3)',
                  }}>
                    <Scissors size={24} color="#fff" strokeWidth={2.2} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a0a00', margin: '0 0 8px' }}>
                    Customer accounts — coming soon
                  </h3>
                  <p style={{ fontSize: 13, color: '#7a6a5a', lineHeight: 1.6, margin: '0 auto 20px', maxWidth: 320 }}>
                    We're still stitching the customer side of Dinki together. It'll be ready very soon — thanks for your patience!
                  </p>
                  <button
                    onClick={() => {
                      setCustomerGated(false);
                      setError('');
                      if (isSignup) set('accountType', 'tailor');
                    }}
                    style={{
                      width: '100%', padding: '0.8rem', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)',
                      color: '#fff', fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 4px 20px rgba(232,160,32,0.35)',
                    }}
                  >
                    <Scissors size={14} />
                    {isSignup ? 'Continue as a Tailor' : 'Back to sign in'}
                  </button>
                  {!isSignup && (
                    <p style={{ fontSize: 12, color: '#9a8a7a', marginTop: 14 }}>
                      Are you a tailor?{' '}
                      <button
                        onClick={() => switchMode('signup')}
                        style={{ background: 'none', border: 'none', color: '#e8a020', fontWeight: 700, cursor: 'pointer', fontSize: 12, padding: 0 }}
                      >
                        Create a tailor account
                      </button>
                    </p>
                  )}
                </div>
              ) : (<>
              {/* fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                {isSignup && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Full name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Your full name"
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                      onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Email address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                    onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>
                    Password {isSignup && <span style={{ fontWeight: 400, color: '#b0a090' }}>(min. 8 chars)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 2.8rem 0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                      onBlur={e  => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b0a090', padding: 0 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, paddingLeft: 2 }}>{error}</p>}

              {!isSignup && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button onClick={() => { setForgotPassword(true); setError(''); }} style={{ fontSize: 12, color: '#e8a020', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</button>
                </div>
              )}

              <motion.button
                whileHover={canSubmit && !loading ? { scale: 1.015 } : {}}
                whileTap={canSubmit && !loading  ? { scale: 0.975 } : {}}
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                style={{
                  width: '100%', padding: '0.82rem', borderRadius: 14, border: 'none',
                  cursor: (canSubmit && !loading) ? 'pointer' : 'not-allowed',
                  background: canSubmit ? 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)' : '#e8ddd4',
                  color: canSubmit ? '#fff' : '#b0a090',
                  fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: canSubmit ? '0 4px 20px rgba(232,160,32,0.35)' : 'none',
                  transition: 'background 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>{isSignup ? 'Create Account' : 'Sign In'}{canSubmit && <ArrowRight size={16} />}</>}
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e8e0d8' }} />
                <span style={{ fontSize: 12, color: '#c0b0a0' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#e8e0d8' }} />
              </div>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#9a8a7a' }}>
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8a020', fontWeight: 700, fontSize: 13 }}
                >
                  {isSignup ? 'Sign in' : 'Create account'}
                </button>
              </p>

              {isSignup && (
                <p style={{ textAlign: 'center', fontSize: 11, color: '#c0b0a0', marginTop: 12, lineHeight: 1.6 }}>
                  By creating an account you agree to our{' '}
                  <span style={{ color: '#9a8a7a', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span style={{ color: '#9a8a7a', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
                </p>
              )}
              </>)}
              </>
              )}
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


/* ─────────────────────────────────────────────
   MAIN LANDING PAGE
   ───────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth]         = useState(false);
  const [authMode, setAuthMode]         = useState('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authParamHandledRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % 4), 5000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Support deep-link auth prompts: /?auth=signup|login&next=/target/path
  useEffect(() => {
    if (authParamHandledRef.current || user) return;
    const mode = searchParams.get('auth');
    if (mode !== 'signup' && mode !== 'login') return;
    setAuthMode(mode);
    setShowAuth(true);
    authParamHandledRef.current = true;
  }, [searchParams, user]);

  const openAuth = (mode = 'signup') => {
    setAuthMode(mode);
    setShowAuth(true);
    setMobileMenuOpen(false);
  };
  const closeAuth = () => setShowAuth(false);
  const handleAuthSuccess = () => {
    setShowAuth(false);
    const next = searchParams.get('next');
    if (next && next.startsWith('/')) {
      navigate(next, { replace: true });
      return;
    }
    // Send through "/" so the role-aware redirect runs (admins → /admin,
    // tailors/customers → /dashboard or /onboarding).
    navigate('/', { replace: true });
  };

  const sliderImages = [
    { id: 1, title: 'Ankara Designs',    image: '/images/hero-1.webp' },
    { id: 2, title: 'Agbada & Kaftan',   image: '/images/hero-2.webp' },
    { id: 3, title: 'Lace & Embroidery', image: '/images/hero-3.webp' },
    { id: 4, title: 'Casual Tailored',   image: '/images/hero-4.webp' },
  ];

  const trendingStyles = [
    { id: 1, name: 'Ankara Dress',     image: '/images/agbada-2.webp' },
    { id: 2, name: 'Agbada Suit',      image: '/images/agbada-1.webp' },
    { id: 3, name: 'Wrapper & Blouse', image: '/images/suit-3.webp' },
    { id: 4, name: 'Aso Ebi Luxury',   image: '/images/agbada-3.webp' },
  ];

  const topTailors = [
    { id: 1, name: 'Aunty Zainab',  rating: 4.9,  reviews: 324, specialty: 'Traditional Ankara', image: '/images/tailor-female.webp', verified: true,  completedOrders: 580 },
    { id: 2, name: 'Master Chukwu', rating: 4.8,  reviews: 287, specialty: 'Agbada Expert',       image: '/images/tailor-male1.webp', verified: true,  completedOrders: 430 },
    { id: 3, name: 'Mama Amara',    rating: 4.95, reviews: 412, specialty: 'Luxury Aso Ebi',      image: '/images/tailor-female2.webp', verified: true,  completedOrders: 1050 },
  ];

  const materials = [
    { name: 'Ankara Fabric',    desc: 'Premium wax print',  image: '/images/hero-3.webp' },
    { name: 'Lace & Damask',    desc: 'Elegant embroidery', image: '/images/f8bc3df3f02d51d3e095cd4a68c8e470.webp' },
    { name: 'Designer Fabrics', desc: 'Imported quality',   image: '/images/hero-1.webp' },
  ];

  const accessories = [
    { name: 'Footwear',           desc: 'Custom tailored',    image: '/images/sho-1.webp' },
    { name: 'Footwear',           desc: 'Bespoke leather',    image: '/images/shoe-2.webp' },
    { name: 'Footwear',           desc: 'Handcrafted styles', image: '/images/shoe-3.webp' },
  ];

  return (
    <div className="min-h-screen bg-cloud">

      {/* ── AUTH OVERLAY ── */}
      <AnimatePresence>
        {showAuth && (
          <AuthOverlay
            mode={authMode}
            onClose={closeAuth}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU OVERLAY ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-30 md:hidden"
              style={{ background: 'rgba(10,8,6,0.5)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* drawer */}
            <motion.div
              key="mobile-menu"
              className="fixed top-0 right-0 bottom-0 z-40 md:hidden flex flex-col"
              style={{
                width: 'min(300px, 85vw)',
                background: '#faf8f4',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e8a020' }}>
                    <Scissors size={13} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, color: '#1a0a00', fontSize: 15 }}>Dinki Africa</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#f0ede9' }}
                >
                  <X size={15} style={{ color: '#5a4a3a' }} />
                </button>
              </div>

              {/* nav links */}
              <div className="flex flex-col px-5 py-6 gap-1 flex-1">
                {[
                  { label: 'Trending',    href: '#trending'  },
                  { label: 'Top Tailors', href: '#tailors'   },
                  { label: 'Shop',        href: '#materials' },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl transition"
                    style={{ fontSize: 15, fontWeight: 600, color: '#1a0a00' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f0ea'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {label}
                    <ChevronRight size={16} style={{ color: '#c0b0a0' }} />
                  </a>
                ))}
              </div>

              {/* auth buttons at bottom of drawer */}
              <div className="px-5 pb-8 flex flex-col gap-3">
                <div className="h-px bg-gray-200/70 mb-2" />
                <button
                  onClick={() => openAuth('login')}
                  className="w-full py-3 rounded-xl text-sm font-bold transition"
                  style={{
                    border: '2px solid #e8a020',
                    background: 'transparent',
                    color: '#e8a020',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="w-full py-3 rounded-xl text-sm font-bold transition"
                  style={{
                    background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(232,160,32,0.35)',
                  }}
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/60 h-14 flex items-center justify-between px-4 md:px-8">
        <Logo size="sm" />

        {/* desktop nav links */}
        <div className="hidden md:flex gap-8 items-center">
          <a href="#trending"  className="text-gray-700 hover:text-gold-500 transition font-body text-sm">Trending</a>
          <a href="#tailors"   className="text-gray-700 hover:text-gold-500 transition font-body text-sm">Top Tailors</a>
          <a href="#materials" className="text-gray-700 hover:text-gold-500 transition font-body text-sm">Shop</a>
        </div>

        {/* desktop auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => openAuth('login')}
            className="px-4 py-2 rounded-lg transition text-sm font-semibold"
            style={{
              border: '1.5px solid #e0d0c0',
              background: 'transparent',
              color: '#5a4a3a',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8a020'; e.currentTarget.style.color = '#e8a020'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0d0c0'; e.currentTarget.style.color = '#5a4a3a'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => openAuth('signup')}
            className="px-4 py-2 rounded-lg transition text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(232,160,32,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,160,32,0.45)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(232,160,32,0.3)'}
          >
            Sign Up
          </button>
        </div>

        {/* mobile: sign in + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => openAuth('login')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
            style={{
              border: '1.5px solid #e8a020',
              background: 'transparent',
              color: '#e8a020',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg transition"
            style={{ background: mobileMenuOpen ? '#f0ede9' : 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => setMobileMenuOpen(p => !p)}
            aria-label="Toggle menu"
          >
            <Menu size={20} style={{ color: '#1a0a00' }} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-14 pb-12 md:pb-0 md:min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute inset-0"
            animate={{ backgroundImage: `url(${sliderImages[currentSlide].image})` }}
            transition={{ duration: 1 }}
            style={{ backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <motion.h1
                className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 leading-tight pt-6 md:pt-0"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
              >
                Authentic African Tailoring, Your Way
              </motion.h1>
              <motion.p
                className="text-gray-100 text-lg mb-8 font-body leading-relaxed"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              >
                Connect with skilled tailors across Africa. Design custom pieces that celebrate your culture and style.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4 mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
                <button
                  onClick={() => openAuth('signup')}
                  className="px-8 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition font-heading font-semibold flex items-center justify-center gap-2 group"
                >
                  Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => openAuth('login')}
                  className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition font-heading font-semibold"
                >
                  Find a Tailor
                </button>
              </motion.div>
              <motion.div className="flex gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-gold-500" />
                  <span className="text-sm font-body text-white">2,000+ Tailors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-gold-500" />
                  <span className="text-sm font-body text-white">4.8+ Rating</span>
                </div>
              </motion.div>
            </motion.div>
            <div className="hidden md:block" />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${currentSlide === index ? 'bg-gold-500 w-6' : 'bg-white/50 w-2'}`}
            />
          ))}
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section id="trending" className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div className="flex items-center justify-between mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-indigo-500 flex items-center gap-3">
                <TrendingUp className="text-gold-500" size={32} /> Trending Styles
              </h2>
              <p className="text-gray-600 mt-2 font-body">What's hot right now in African fashion</p>
            </div>
            <a href="/explore" className="hidden md:flex items-center gap-2 px-6 py-2 text-gold-500 hover:text-gold-600 transition font-heading font-semibold group">
              View More <ChevronRight size={20} className="group-hover:translate-x-1 transition" />
            </a>
          </motion.div>
          <LandingTrending />
        </div>
      </section>

      {/* ── TOP TAILORS ── */}
      <section id="tailors" className="py-16 px-4 md:px-8 bg-gradient-to-br from-indigo-50 to-cloud">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-indigo-500 mb-2">Top Rated Tailors</h2>
            <p className="text-gray-600 font-body">Trusted craftspeople with excellence in every stitch</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {topTailors.map((tailor, index) => (
              <motion.div key={tailor.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition group cursor-pointer" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ y: -5 }}>
                <div className="w-16 h-16 rounded-full mb-4 overflow-hidden group-hover:scale-110 transition shadow-md">
                  <img src={tailor.image} alt={tailor.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-heading font-bold text-lg text-gray-800">{tailor.name}</h3>
                  {tailor.verified && <VerifiedBadge size={16} />}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-teal-600 text-sm font-body">{tailor.specialty} Specialist</p>
                  <LevelBadge completedOrders={tailor.completedOrders} compact />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.floor(tailor.rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="font-heading font-semibold text-gray-800">{tailor.rating}</span>
                  <span className="text-gray-500 text-sm font-body">({tailor.reviews})</span>
                </div>
                <button className="w-full py-2 bg-gold-50 text-gold-600 rounded-lg hover:bg-gold-100 transition font-body text-sm font-semibold">
                  View Profile
                </button>
              </motion.div>
            ))}
          </div>
          <motion.div className="flex justify-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <button className="px-8 py-3 border-2 border-indigo-500 text-indigo-500 rounded-lg hover:bg-indigo-50 transition font-heading font-semibold flex items-center gap-2 group">
              View All Tailors <ChevronRight size={20} className="group-hover:translate-x-1 transition" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── MATERIALS & ACCESSORIES ── */}
      <section id="materials" className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-indigo-500 mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            Materials, Accessories & More
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <motion.div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <h3 className="font-heading text-2xl font-bold text-gold-700 mb-6 flex items-center gap-2">
                <ShoppingBag size={24} /> Premium Materials
              </h3>
              <div className="space-y-4">
                {materials.map((m, i) => (
                  <motion.div key={i} className="bg-white rounded-lg p-4 hover:shadow-md transition overflow-hidden" whileHover={{ x: 4 }}>
                    <div className="w-full h-24 rounded mb-3 overflow-hidden">
                      <img src={m.image} alt={m.name} className="w-full h-full object-cover hover:scale-110 transition" />
                    </div>
                    <p className="font-heading font-semibold text-gray-800">{m.name}</p>
                    <p className="text-gray-600 text-sm font-body">{m.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}>
              <h3 className="font-heading text-2xl font-bold text-teal-700 mb-6 flex items-center gap-2">
                <Zap size={24} /> Accessories
              </h3>
              <div className="space-y-4">
                {accessories.map((a, i) => (
                  <motion.div key={i} className="bg-white rounded-lg p-4 hover:shadow-md transition overflow-hidden" whileHover={{ x: 4 }}>
                    <div className="w-full h-24 rounded mb-3 overflow-hidden">
                      <img src={a.image} alt={a.name} className="w-full h-full object-cover hover:scale-110 transition" />
                    </div>
                    <p className="font-heading font-semibold text-gray-800">{a.name}</p>
                    <p className="text-gray-600 text-sm font-body">{a.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-8 text-white flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <div>
                <h3 className="font-heading text-2xl font-bold mb-3">Special Offer</h3>
                <p className="font-body text-indigo-100 mb-4">Get ₦5,000 off your first custom tailoring order</p>
                <p className="text-4xl font-heading font-bold">DINKI20</p>
              </div>
              <button
                onClick={() => openAuth('signup')}
                className="mt-6 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition font-heading font-semibold"
              >
                Claim Now
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-br from-gray-50 to-cloud">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} className="rounded-xl overflow-hidden shadow-lg">
                <img src="/images/tailor-female3.webp" alt="Dinki Africa Tailoring" className="w-full h-full object-cover" />
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="order-1 md:order-2">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">About Dinki Africa</h2>
              <p className="font-body text-lg text-gray-700 mb-4 leading-relaxed">
                Dinki Africa is on a mission to revolutionize custom tailoring across the continent. We connect passionate tailors with customers who value authentic African fashion.
              </p>
              <p className="font-body text-lg text-gray-700 mb-6 leading-relaxed">
                Our platform celebrates African culture, supports local artisans, and makes custom tailoring accessible to everyone.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  ['Quality Craftsmanship', 'Vetted tailors with proven expertise'],
                  ['Cultural Pride',        'Celebrating African heritage through fashion'],
                  ['Fair Pricing',          'Transparent rates, no hidden fees'],
                ].map(([title, sub]) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-gray-900">{title}</p>
                      <p className="font-body text-sm text-gray-600">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition font-heading font-semibold flex items-center gap-2">
                Learn More <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white text-gray-800 pt-16 pb-20 md:pb-8 px-4 md:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <Logo size="md" />
              <p className="mt-4 font-body text-gray-600">Connecting Nigerian tailors with global customers</p>
            </motion.div>
            {[
              ['Product', ['Find Tailors', 'Browse Styles', 'Pricing', 'Mobile App']],
              ['Company', ['About Us', 'Blog', 'Careers', 'Contact']],
              ['Legal',   ['Privacy', 'Terms', 'Cookie Policy']],
            ].map(([heading, links], i) => (
              <motion.div key={heading} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: (i + 1) * 0.1 }} viewport={{ once: true }}>
                <h4 className="font-heading font-bold mb-4 text-gray-800">{heading}</h4>
                <ul className="space-y-2 font-body text-sm text-gray-600">
                  {links.map(l => <li key={l}><a href="#" className="hover:text-gold-500 transition">{l}</a></li>)}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="border-t border-gray-300 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 font-body text-sm">
              <p>&copy; 2024 Dinki Africa. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                {['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].map(s => (
                  <a key={s} href="#" className="hover:text-gold-500 transition">{s}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => openAuth('signup')}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition"
          style={{
            background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(232,160,32,0.3)',
          }}
        >
          Get Started Free
        </button>
        <button
          onClick={() => openAuth('login')}
          className="py-2.5 px-5 rounded-lg text-sm font-bold transition"
          style={{
            border: '1.5px solid #e0d0c0',
            background: 'transparent',
            color: '#5a4a3a',
            cursor: 'pointer',
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}