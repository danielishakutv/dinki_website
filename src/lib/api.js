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

async function request(endpoint, options = {}) {
  const { body, method = 'GET', headers: customHeaders = {}, raw = false } = options;

  const headers = { ...customHeaders };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // If 401 and we have a token, try refresh once
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        credentials: 'include',
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (raw) return res;

  const data = await res.json();

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
  verifyEmail: (body) => request('/auth/verify-email', { method: 'POST', body }),
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
  search: (q, role = 'customer') => request(`/users/search?q=${encodeURIComponent(q)}&role=${role}`),
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
  updatePortfolio: (body) => request('/storefronts/me/portfolio', { method: 'PATCH', body }),
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

export { getToken, setToken, clearToken };
export default { auth, users, customers, jobs, storefronts, orders, reviews, favourites, conversations, notifications, uploads };
