import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, users as usersApi, setToken, clearToken } from '../lib/api';
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

  const signup = useCallback(async ({ email, password, name, role }) => {
    const res = await authApi.signup({ email, password, name, role });
    return res.data; // { message, userId } or { inactive_account, user_id, name, message }
  }, []);

  const activate = useCallback(async ({ user_id, email, password, name }) => {
    const res = await authApi.activate({ user_id, email, password, name });
    return res.data; // { message, userId }
  }, []);

  const verifyEmail = useCallback(async ({ email, otp }) => {
    const res = await authApi.verifyEmail({ email, otp });
    setToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const login = useCallback(async ({ email, password, rejectRoles }) => {
    const res = await authApi.login({ email, password });
    if (rejectRoles && rejectRoles.includes(res.data?.user?.role)) {
      // Do not commit the session client-side. Invalidate the server-side session too.
      try { await authApi.logout(); } catch { /* ignore */ }
      const err = new Error('Role not permitted');
      err.code = 'ROLE_NOT_PERMITTED';
      err.role = res.data?.user?.role;
      throw err;
    }
    setToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearToken();
    clearCache();
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
