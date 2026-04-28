/**
 * Matomo tracker wrapper.
 *
 * The Matomo loader (in index.html) sets up `window._paq` as a queue. This
 * module gives the rest of the app a small, typed surface to push into that
 * queue without sprinkling `window._paq.push([...])` all over the codebase.
 *
 * Every helper here is a no-op when:
 *   - running on a non-production hostname (the loader skips matomo.js, but
 *     `_paq` is still defined as an array), OR
 *   - `window._paq` somehow isn't present (e.g. tracker blocked by the user).
 *
 * Failing silently is intentional — analytics must never break the app.
 */

function paq() {
  if (typeof window === 'undefined') return null;
  return Array.isArray(window._paq) ? window._paq : null;
}

/**
 * Track a virtual page view. Used by MatomoRouteTracker on every React Router
 * navigation. Pass the in-app URL (path + search) and the document title so
 * Matomo's pages report tracks the in-app route, not the underlying SPA shell.
 */
export function trackPageView(url, title) {
  const _paq = paq();
  if (!_paq) return;
  if (url) _paq.push(['setCustomUrl', url]);
  if (title) _paq.push(['setDocumentTitle', title]);
  _paq.push(['trackPageView']);
}

/**
 * Track a discrete user action. Use this when something happens that isn't a
 * page navigation — e.g. "place_order_submitted", "search_performed",
 * "filter_applied". Keep `category` stable (one per surface) so the report
 * stays readable.
 *
 *   trackEvent('Order', 'Place', 'tailor:abc-123', 25000)
 *   trackEvent('Search', 'Submit', 'agbada')
 *   trackEvent('Storefront', 'Favourite', styleId)
 */
export function trackEvent(category, action, name, value) {
  const _paq = paq();
  if (!_paq) return;
  const args = ['trackEvent', category, action];
  if (name !== undefined && name !== null) args.push(String(name));
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
    args.push(Number(value));
  }
  _paq.push(args);
}

/**
 * Pin the current visitor to an authenticated user id. Called by
 * MatomoRouteTracker whenever auth state flips. Once set, every subsequent
 * pageview / event in the session is attributed to this user, which makes
 * cross-device behaviour analysis possible.
 */
export function setUserId(userId) {
  const _paq = paq();
  if (!_paq || !userId) return;
  _paq.push(['setUserId', String(userId)]);
}

/**
 * Drop the user id binding. Called on logout so the next anonymous session
 * isn't conflated with the previous user. We also force a new visit so
 * Matomo doesn't carry the prior user's session footprint forward.
 */
export function resetUserId() {
  const _paq = paq();
  if (!_paq) return;
  _paq.push(['resetUserId']);
  _paq.push(['appendToTrackingUrl', 'new_visit=1']);
  _paq.push(['trackPageView']);
  _paq.push(['appendToTrackingUrl', '']);
}
