import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, users as usersApi, setToken, clearToken, getToken } from '../lib/api';
import { clearCache, invalidateCache } from '../hooks/useApi';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await authApi.refresh();
        if (token && !cancelled) {
          const res = await usersApi.getProfile();
          if (res.success) setUser(res.data);
        }
      } catch {
        // No valid session
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Connect socket when user is authenticated and wire the global
  // `notification:new` listener. Any push from the server — from an order,
  // a job update, or an admin broadcast — invalidates the notifications
  // cache so the list and the header badge reflect the new state without a
  // manual reload.
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return undefined;
    }

    connectSocket();
    const sock = getSocket();
    const handler = () => {
      invalidateCache('notifications', 'notifications-unread');
    };
    sock?.on('notification:new', handler);

    return () => {
      sock?.off('notification:new', handler);
      disconnectSocket();
    };
  }, [user]);

  // Signup now auto-logs-in (no OTP). Returns { accessToken, user } on success, or
  // { inactive_account, ... } when the email/phone belongs to a tailor-created
  // placeholder that must be activated instead.
  const signup = useCallback(async ({ email, phone, password, name, role, referralCode }) => {
    const res = await authApi.signup({ email, phone, password, name, role, referralCode });
    if (res.data?.accessToken) {
      setToken(res.data.accessToken);
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  const activate = useCallback(async ({ user_id, email, phone, password, name }) => {
    const res = await authApi.activate({ user_id, email, phone, password, name });
    if (res.data?.accessToken) {
      setToken(res.data.accessToken);
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  // Verify via the emailed link token. The user is already logged in; this just
  // refreshes their user object (email_verified flips true).
  const verifyEmail = useCallback(async (token) => {
    const res = await authApi.verifyEmail(token);
    // Only adopt the returned user when there's a live session (verifying via the
    // link on an already-logged-in device). A logged-out verifier stays logged out.
    if (getToken() && res.data?.user) setUser(res.data.user);
    return res.data;
  }, []);

  const resendVerification = useCallback(() => authApi.resendVerification(), []);

  // Login by email OR phone (identifier).
  const login = useCallback(async ({ identifier, email, password }) => {
    const res = await authApi.login({ identifier, email, password });
    setToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearToken();
    clearCache();
    try { sessionStorage.removeItem('dinki_pending_dismissed'); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await usersApi.getProfile();
      if (res.success) setUser(res.data);
    } catch { /* ignore */ }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signup,
    activate,
    verifyEmail,
    resendVerification,
    login,
    logout,
    refreshProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
