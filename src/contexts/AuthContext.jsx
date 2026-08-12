import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, users as usersApi, setToken, clearToken, getToken } from '../lib/api';
import { clearCache, invalidateCache } from '../hooks/useApi';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { openDb, destroyDb, closeDb } from '../lib/local/db';
import { bootstrapSync, startSync, stopSync, syncNow } from '../lib/local/sync';
import { pendingCount } from '../lib/local/outbox';
import * as session from '../lib/local/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when we're running on a stored local session because the network is
  // unreachable. Reads work; writes queue.
  const [offlineSession, setOfflineSession] = useState(false);

  // Open the local database and start background syncing for a user.
  //
  // Tailors only. The sync endpoints are tailor-scoped server-side, so running
  // this for a customer or an admin would 403 on every attempt and light up the
  // status pill with an error about a feature they don't have.
  const activateLocal = useCallback(async (u) => {
    if (!u?.id || u.role !== 'tailor') return;
    try {
      openDb(u.id);
      startSync();
      await bootstrapSync();
    } catch {
      // A blocked or corrupt IndexedDB must not stop the user signing in. They
      // fall back to online-only behaviour, which is what the app did before.
    }
  }, []);

  // Restore the session on mount.
  //
  // Order is the whole point here. The stored session is read synchronously and
  // the UI is unblocked immediately; the network refresh happens afterwards. The
  // old flow awaited a refresh call first, so opening the app with no signal
  // meant staring at a spinner and then the login screen — with a full local
  // database sitting right there unused.
  useEffect(() => {
    let cancelled = false;

    const stored = session.loadSession();
    if (stored?.user && !stored.revoked) {
      setUser(stored.user);
      setOfflineSession(true);
      setLoading(false);
      activateLocal(stored.user);
    }

    (async () => {
      try {
        const token = await authApi.refresh();
        if (!token) throw new Error('no session');
        const res = await usersApi.getProfile();
        if (res.success && !cancelled) {
          setUser(res.data);
          setOfflineSession(false);
          session.saveSession(res.data);
          session.touchOnline();
          await activateLocal(res.data);
          syncNow('login');
        }
      } catch (err) {
        if (cancelled) return;
        const unreachable = err?.code === 'NETWORK_ERROR' || navigator.onLine === false;
        if (stored?.user && unreachable) {
          // Expected offline. Keep the local session exactly as it is.
          setOfflineSession(true);
        } else if (stored?.user) {
          // The server answered and refused us. Local data stays readable and the
          // outbox stays intact — deleting a tailor's unsynced work because a
          // token expired would be the worst possible outcome.
          session.markRevoked();
          setOfflineSession(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activateLocal]);

  // Socket + notification wiring, unchanged apart from also nudging a sync when
  // the socket reconnects — that reconnect is often the earliest reliable signal
  // that a flaky connection has come back.
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
    const onReconnect = () => syncNow('socket-reconnect');
    sock?.on('notification:new', handler);
    sock?.on('connect', onReconnect);

    return () => {
      sock?.off('notification:new', handler);
      sock?.off('connect', onReconnect);
      disconnectSocket();
    };
  }, [user]);

  const adopt = useCallback(async (data) => {
    if (!data?.accessToken) return;
    setToken(data.accessToken);
    setUser(data.user);
    setOfflineSession(false);
    session.saveSession(data.user);
    await activateLocal(data.user);
    // Seed the device with everything this user owns, so they can walk out of
    // signal straight after signing in and still have their whole book.
    syncNow('login');
  }, [activateLocal]);

  const signup = useCallback(async ({ email, phone, password, name, role, referralCode }) => {
    const res = await authApi.signup({ email, phone, password, name, role, referralCode });
    await adopt(res.data);
    return res.data;
  }, [adopt]);

  const activate = useCallback(async ({ user_id, email, phone, password, name }) => {
    const res = await authApi.activate({ user_id, email, phone, password, name });
    await adopt(res.data);
    return res.data;
  }, [adopt]);

  const verifyEmail = useCallback(async (token) => {
    const res = await authApi.verifyEmail(token);
    if (getToken() && res.data?.user) {
      setUser(res.data.user);
      session.updateUser(res.data.user);
    }
    return res.data;
  }, []);

  const resendVerification = useCallback(() => authApi.resendVerification(), []);

  const login = useCallback(async ({ identifier, email, password }) => {
    const res = await authApi.login({ identifier, email, password });
    await adopt(res.data);
    return res.data;
  }, [adopt]);

  /**
   * Sign out and wipe this device's copy of the data.
   *
   * `force` skips the unsynced-work guard. Callers are expected to have asked the
   * user first — losing a day of measurements to a mis-tap is not recoverable.
   */
  const logout = useCallback(async ({ force = false } = {}) => {
    let unsynced = 0;
    try { unsynced = await pendingCount(); } catch { /* db may not be open */ }

    if (unsynced > 0 && !force) {
      const err = new Error(
        `You have ${unsynced} change${unsynced === 1 ? '' : 's'} that haven't reached the server yet. `
        + 'Connect to the internet before signing out, or sign out anyway to discard them.'
      );
      err.code = 'UNSYNCED_WORK';
      err.pending = unsynced;
      throw err;
    }

    const id = user?.id;
    try { await authApi.logout(); } catch { /* offline logout is still a logout */ }

    stopSync();
    clearToken();
    clearCache();
    session.clearSession();
    if (id) {
      try { await destroyDb(id); } catch { closeDb(); }
    } else {
      closeDb();
    }
    try { sessionStorage.removeItem('dinki_pending_dismissed'); } catch { /* ignore */ }
    setUser(null);
    setOfflineSession(false);
  }, [user]);

  /**
   * Logout for UI call sites: asks before discarding unsynced work.
   *
   * A plain confirm() rather than a styled modal — it is unskippable, it works on
   * every basic Android browser, and this is one of the few moments in the app
   * where blocking the user is the correct behaviour.
   */
  const confirmAndLogout = useCallback(async () => {
    try {
      await logout();
      return true;
    } catch (err) {
      if (err.code !== 'UNSYNCED_WORK') throw err;
      const proceed = window.confirm(
        `${err.pending} change${err.pending === 1 ? '' : 's'} on this phone `
        + 'have not reached the server yet.\n\nSigning out now will lose them permanently. '
        + 'Connect to the internet first to save them.\n\nSign out anyway?'
      );
      if (!proceed) return false;
      await logout({ force: true });
      return true;
    }
  }, [logout]);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await usersApi.getProfile();
      if (res.success) {
        setUser(res.data);
        session.updateUser(res.data);
        session.touchOnline();
        setOfflineSession(false);
      }
    } catch { /* offline — the stored profile stays */ }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    offlineSession,
    canWriteOffline: session.canWriteOffline(),
    signup,
    activate,
    verifyEmail,
    resendVerification,
    login,
    logout,
    confirmAndLogout,
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
