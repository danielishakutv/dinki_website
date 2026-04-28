import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trackPageView, setUserId, resetUserId } from '../lib/matomo';

/**
 * Mount once inside the React Router context (alongside <Routes/>) and it
 * will:
 *
 *   1. Fire a Matomo pageview on every route change, with the React Router
 *      path (incl. query string) as the URL and the current document title.
 *   2. Bind / unbind the Matomo userId as the auth state flips, so traffic
 *      is correctly attributed once the user signs in.
 *
 * Renders nothing.
 */
export default function MatomoRouteTracker() {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const lastUserIdRef = useRef(null);

  // Auth identity tracking. We track transitions specifically:
  //   anon → logged-in → setUserId
  //   logged-in → anon → resetUserId
  //   logged-in (A) → logged-in (B) → resetUserId then setUserId
  useEffect(() => {
    const next = user?.id || null;
    const prev = lastUserIdRef.current;
    if (next === prev) return;

    if (prev && !next) {
      resetUserId();
    } else if (next && !prev) {
      setUserId(next);
    } else if (next && prev && next !== prev) {
      resetUserId();
      setUserId(next);
    }
    lastUserIdRef.current = next;
  }, [user?.id]);

  // Pageview tracking. rAF defers until the new screen has had a chance to
  // update document.title — most pages set it via a useEffect on mount, so
  // tracking on the same tick would catch the OLD title.
  useEffect(() => {
    const url = pathname + (search || '');
    const id = window.requestAnimationFrame(() => {
      trackPageView(url, document.title);
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname, search]);

  return null;
}
