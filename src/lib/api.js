const API_URL = import.meta.env.VITE_API_URL || 'https://be.dinki.africa/v1';

let accessToken = null;
let refreshPromise = null;

function getToken() {
  return accessToken;
}

function setToken(token) {
  accessToken = token;
}

function clearToken() {
  accessToken = null;
}

async function refreshAccessToken() {
  // Prevent concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        clearToken();
        return null;
      }

      const data = await res.json();
      if (data.success && data.data.accessToken) {
        setToken(data.data.accessToken);
        return data.data.accessToken;
      }
      clearToken();
      return null;
    } catch {
      clearToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// fetch() that aborts after `ms` and turns transport failures (offline, CORS,
// dropped connection, timeout) into a clear, retryable error instead of the
// opaque "Failed to fetch".
async function fetchWithTimeout(url, opts, ms = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (err) {
    const e = new Error(
      err && err.name === 'AbortError'
        ? 'The request timed out. Please check your connection and try again.'
        : 'Network error — please check your connection and try again.'
    );
    e.code = 'NETWORK_ERROR';
    throw e;
  } finally {
    clearTimeout(id);
  }
}

async function request(endpoint, options = {}) {
  const { body, method = 'GET', headers: customHeaders = {}, raw = false } = options;

  const headers = { ...customHeaders };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOpts = {
    method,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  let res = await fetchWithTimeout(`${API_URL}${endpoint}`, fetchOpts);

  // If 401 and we have a token, try refresh once
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetchWithTimeout(`${API_URL}${endpoint}`, { ...fetchOpts, headers });
    }
  }

  if (raw) return res;

  // A proxy 502/504 (or any non-JSON body) must not surface as a confusing
  // JSON parse error — map it to a clear server-error message.
  let data;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      const e = new Error(`The server had a problem (${res.status}). Please try again in a moment.`);
      e.code = 'SERVER_ERROR';
      e.status = res.status;
      throw e;
    }
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.error?.message || 'Request failed');
    err.code = data.error?.code;
    err.status = res.status;
    err.details = data.error?.details;
    throw err;
  }

  return data;
}

// Auth
export const auth = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  activate: (body) => request('/auth/activate', { method: 'POST', body }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerification: () => request('/auth/resend-verification', { method: 'POST' }),
  sendPhoneCode: () => request('/auth/phone/send-code', { method: 'POST' }),
  verifyPhone: (code) => request('/auth/phone/verify', { method: 'POST', body: { code } }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  refresh: () => refreshAccessToken(),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),
};

// Users
export const users = {
  getProfile: () => request('/users/me'),
  updateProfile: (body) => request('/users/me', { method: 'PATCH', body }),
  updateAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return request('/users/me/avatar', { method: 'PATCH', body: fd });
  },
  getStats: () => request('/users/me/stats'),
  updatePreferences: (body) => request('/users/me/preferences', { method: 'PATCH', body }),
  completeOnboarding: (body) => request('/users/me/onboarding', { method: 'POST', body }),
  search: (q, role = 'customer') => {
    const params = new URLSearchParams({ q });
    if (role) params.set('role', role);
    return request(`/users/search?${params.toString()}`);
  },
  checkUsername: (username) => request(`/users/check-username?username=${encodeURIComponent(username)}`),
  setUsername: (username) => request('/users/me/username', { method: 'PUT', body: { username } }),
};

// Customers
export const customers = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/customers${q ? `?${q}` : ''}`);
  },
  get: (id) => request(`/customers/${id}`),
  create: (body) => request('/customers', { method: 'POST', body }),
  link: (body) => request('/customers/link', { method: 'POST', body }),
  forceCreate: (body) => request('/customers/force', { method: 'POST', body }),
  update: (id, body) => request(`/customers/${id}`, { method: 'PATCH', body }),
  delete: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  updateMeasurements: (id, body) => request(`/customers/${id}/measurements`, { method: 'PATCH', body }),
  addCustomField: (id, body) => request(`/customers/${id}/custom-fields`, { method: 'POST', body }),
  removeCustomField: (id, key) => request(`/customers/${id}/custom-fields/${key}`, { method: 'DELETE' }),
};

// Jobs
export const jobs = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.overdue) qs.set('overdue', 'true');
    if (params.search) qs.set('search', params.search);
    if (params.customer_id) qs.set('customer_id', params.customer_id);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/jobs${q ? `?${q}` : ''}`);
  },
  get: (id) => request(`/jobs/${id}`),
  create: (body) => request('/jobs', { method: 'POST', body }),
  update: (id, body) => request(`/jobs/${id}`, { method: 'PATCH', body }),
  updateStatus: (id, status) => request(`/jobs/${id}/status`, { method: 'PATCH', body: { status } }),
  toggleInvoice: (id, invoiced) => request(`/jobs/${id}/invoice`, { method: 'PATCH', body: { invoiced } }),
  delete: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  getStats: () => request('/jobs/stats'),
};

// Storefronts
export const storefronts = {
  getBySlug: (slug) => request(`/storefronts/${slug}`),
  search: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.location) qs.set('location', params.location);
    if (params.page) qs.set('page', params.page);
    const q = qs.toString();
    return request(`/storefronts${q ? `?${q}` : ''}`);
  },
  getFeatured: () => request('/storefronts/featured'),
  getMine: () => request('/storefronts/me'),
  update: (body) => request('/storefronts/me', { method: 'PATCH', body }),
  addPortfolio: (body) => request('/storefronts/me/portfolio', { method: 'POST', body }),
  removePortfolio: (id) => request(`/storefronts/me/portfolio/${id}`, { method: 'DELETE' }),
  getPortfolio: (slug, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/storefronts/${slug}/portfolio${q ? `?${q}` : ''}`);
  },
  getReviews: (slug, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/storefronts/${slug}/reviews${q ? `?${q}` : ''}`);
  },
};

// Styles — the public "Pinterest for fashion" feed
export const styles = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.tag) qs.set('tag', params.tag);
    if (params.q) qs.set('q', params.q);
    if (params.source_type) qs.set('source_type', params.source_type);
    if (params.sort) qs.set('sort', params.sort);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/styles${q ? `?${q}` : ''}`);
  },
  categories: () => request('/styles/categories'),
  get: (id) => request(`/styles/${id}`),
  toggleLike: (id) => request(`/styles/${id}/like`, { method: 'POST' }),
  listComments: (id, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/styles/${id}/comments${q ? `?${q}` : ''}`);
  },
  addComment: (id, body) => request(`/styles/${id}/comments`, { method: 'POST', body: { body } }),
  deleteComment: (commentId) => request(`/styles/comments/${commentId}`, { method: 'DELETE' }),
  create: (body) => request('/styles', { method: 'POST', body }),
  remove: (id) => request(`/styles/${id}`, { method: 'DELETE' }),
};

// Measurement share links (public Dinki links + owner analytics)
export const measurementShares = {
  list: () => request('/measurement-shares'),
  get: (id) => request(`/measurement-shares/${id}`),
  create: (body) => request('/measurement-shares', { method: 'POST', body }),
  update: (id, body) => request(`/measurement-shares/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/measurement-shares/${id}`, { method: 'DELETE' }),
  analytics: (id) => request(`/measurement-shares/${id}/analytics`),
  viewPublic: (token) => request(`/measurement-shares/public/${encodeURIComponent(token)}`),
};

// Orders
export const orders = {
  place: (body) => request('/orders', { method: 'POST', body }),
  listMine: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', params.page);
    const q = qs.toString();
    return request(`/orders/mine${q ? `?${q}` : ''}`);
  },
  listIncoming: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', params.page);
    const q = qs.toString();
    return request(`/orders/incoming${q ? `?${q}` : ''}`);
  },
  get: (id) => request(`/orders/${id}`),
  accept: (id) => request(`/orders/${id}/accept`, { method: 'PATCH' }),
  decline: (id, reason) => request(`/orders/${id}/decline`, { method: 'PATCH', body: { reason } }),
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  cancel: (id) => request(`/orders/${id}/cancel`, { method: 'PATCH' }),
};

// Reviews
export const reviews = {
  create: (body) => request('/reviews', { method: 'POST', body }),
  listMine: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    const q = qs.toString();
    return request(`/reviews/me${q ? `?${q}` : ''}`);
  },
};

// Favourites
export const favourites = {
  list: (type) => request(`/favourites${type ? `?type=${type}` : ''}`),
  toggle: (itemType, itemId) => request('/favourites', { method: 'POST', body: { itemType, itemId } }),
  check: (items) => request('/favourites/check', { method: 'POST', body: { items } }),
};

// Conversations / Messaging
export const conversations = {
  list: () => request('/conversations'),
  start: (body) => request('/conversations', { method: 'POST', body }),
  getMessages: (id, params = {}) => {
    const qs = new URLSearchParams();
    if (params.cursor) qs.set('cursor', params.cursor);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/conversations/${id}/messages${q ? `?${q}` : ''}`);
  },
  sendMessage: (id, body) => request(`/conversations/${id}/messages`, { method: 'POST', body }),
  markRead: (id) => request(`/conversations/${id}/read`, { method: 'PATCH' }),
  togglePin: (id) => request(`/conversations/${id}/pin`, { method: 'PATCH' }),
};

// Notifications
export const notifications = {
  list: () => request('/notifications'),
  get: (id) => request(`/notifications/${id}`),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  unreadCount: () => request('/notifications/unread-count'),
  registerPushToken: (token, platform) => request('/notifications/push-token', { method: 'POST', body: { token, platform } }),
};

// Uploads
export const uploads = {
  image: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('/uploads/image', { method: 'POST', body: fd });
  },
  images: (files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return request('/uploads/images', { method: 'POST', body: fd });
  },
};

// Admin (gated server-side by role; client must also role-check before routing)
export const admin = {
  ping: () => request('/admin/ping'),
  stats: () => request('/admin/stats'),
  broadcastNotification: (body) =>
    request('/admin/notifications/broadcast', { method: 'POST', body }),

  // User management
  listUsers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.role) qs.set('role', params.role);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return request(`/admin/users${q ? `?${q}` : ''}`);
  },
  getUser: (id) => request(`/admin/users/${id}`),
  updateUser: (id, body) => request(`/admin/users/${id}`, { method: 'PATCH', body }),
  resetUserPassword: (id) => request(`/admin/users/${id}/reset-password`, { method: 'POST' }),
  setUserPassword: (id, newPassword) =>
    request(`/admin/users/${id}/set-password`, { method: 'POST', body: { newPassword } }),
  forceLogoutUser: (id) => request(`/admin/users/${id}/force-logout`, { method: 'POST' }),
  anonymizeUser: (id) => request(`/admin/users/${id}/anonymize`, { method: 'POST' }),
  hardDeleteUser: (id, confirmEmail) =>
    request(`/admin/users/${id}/hard-delete`, { method: 'POST', body: { confirmEmail } }),

  // Analytics
  analytics: {
    overview: (days = 30) => request(`/admin/analytics/overview?days=${days}`),
    timeseries: (days = 90) => request(`/admin/analytics/timeseries?days=${days}`),
    cohorts: (weeks = 8) => request(`/admin/analytics/cohorts?weeks=${weeks}`),
    funnels: (days = 30) => request(`/admin/analytics/funnels?days=${days}`),
    marketplace: (limit = 10) => request(`/admin/analytics/marketplace?limit=${limit}`),
    referrals: (limit = 10) => request(`/admin/analytics/referrals?limit=${limit}`),
  },
};

// Support (help & contact)
export const support = {
  submitTicket: (body) => request('/support/ticket', { method: 'POST', body }),
};

// Referrals
export const referrals = {
  getMine: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', params.limit);
    if (params.offset) qs.set('offset', params.offset);
    const q = qs.toString();
    return request(`/referrals/me${q ? `?${q}` : ''}`);
  },
  getByCode: (code) => request(`/referrals/by-code/${encodeURIComponent(code)}`),
};

export { getToken, setToken, clearToken };
export default { auth, users, customers, jobs, storefronts, styles, measurementShares, orders, reviews, favourites, conversations, notifications, uploads, admin, support, referrals };
