import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, Check, Lock } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { authApi } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const canSubmit = password.length >= 6 && password === confirmPassword;

  const handleSubmit = async () => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <Logo size={36} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a0a00', marginBottom: 8 }}>Invalid Reset Link</h2>
          <p style={{ fontSize: 14, color: '#9a8a7a', marginBottom: 24, lineHeight: 1.6 }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '0.82rem', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)', color: '#fff', fontSize: 15, fontWeight: 700 }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <Logo size={36} style={{ marginBottom: 16 }} />
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={22} style={{ color: '#2e7d32' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a0a00', marginBottom: 8 }}>Password Reset</h2>
          <p style={{ fontSize: 14, color: '#9a8a7a', marginBottom: 24, lineHeight: 1.6 }}>
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '0.82rem', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #e8a020 0%, #c87d10 100%)', color: '#fff', fontSize: 15, fontWeight: 700 }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Logo size={36} style={{ marginBottom: 16 }} />
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '2px solid #e8a020' }}>
            <Lock size={20} style={{ color: '#e8a020' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a0a00', marginBottom: 4 }}>Set New Password</h2>
          <p style={{ fontSize: 14, color: '#9a8a7a' }}>Enter your new password below.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>
              New password <span style={{ fontWeight: 400, color: '#b0a090' }}>(min. 6 chars)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter new password"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 2.8rem 0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b0a090', padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5a4a3a', marginBottom: 6, letterSpacing: '0.02em' }}>Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Re-enter new password"
              onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid #e0d8d0', background: '#fff', fontSize: 14, color: '#1a0a00', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor = '#e8a020'; e.target.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e0d8d0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {confirmPassword && password !== confirmPassword && (
          <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, paddingLeft: 2 }}>Passwords do not match.</p>
        )}

        {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, paddingLeft: 2 }}>{error}</p>}

        <motion.button
          whileHover={canSubmit && !loading ? { scale: 1.015 } : {}}
          whileTap={canSubmit && !loading ? { scale: 0.975 } : {}}
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Reset Password <ArrowRight size={16} /></>}
        </motion.button>
      </div>
    </div>
  );
}
