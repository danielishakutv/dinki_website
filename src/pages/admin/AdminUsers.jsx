import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Search, ShieldCheck, Scissors, User as UserIcon, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { admin as adminApi } from '../../lib/api';

/**
 * AdminUsers — paginated list of every account on the platform.
 *
 * Stays read-only; mutations happen on the detail page. Search runs on
 * Enter/button-click (not debounced) — on a 1-day-old platform the row
 * count is tiny and we'd rather not spam the backend with every keystroke.
 */
export default function AdminUsers() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ q: '', role: 'all', status: 'all' });
  const [pendingQ, setPendingQ] = useState('');
  const [page, setPage] = useState(1);

  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const res = await adminApi.listUsers({
          q: filters.q || undefined,
          role: filters.role !== 'all' ? filters.role : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          page,
          limit: 20,
        });
        if (cancelled) return;
        setState({ status: 'ok', users: res.data, meta: res.meta });
      } catch (err) {
        if (cancelled) return;
        setState({ status: 'error', message: err.message || 'Failed to load users' });
      }
    })();
    return () => { cancelled = true; };
  }, [filters, page]);

  function applySearch() {
    setPage(1);
    setFilters((f) => ({ ...f, q: pendingQ.trim() }));
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-sm font-heading font-semibold text-gray-800 mb-1">Users</h2>
        <p className="text-xs text-gray-500">
          Full list of platform accounts. Click any row to open their admin profile.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={pendingQ}
            onChange={(e) => setPendingQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applySearch(); } }}
            placeholder="Search name, email, phone, or username"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.role}
            onChange={(e) => { setPage(1); setFilters({ ...filters, role: e.target.value }); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
          >
            <option value="all">All roles</option>
            <option value="customer">Customer</option>
            <option value="tailor">Tailor</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
          >
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={applySearch}
            className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-gold-500" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load users</p>
            <p className="text-red-600/80 mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      {state.status === 'ok' && (
        <>
          {state.users.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-gray-100 text-center text-sm text-gray-500">
              No users match these filters.
            </div>
          ) : (
            <ul className="rounded-2xl bg-white border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {state.users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <Avatar user={u} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                        <RoleBadge role={u.role} />
                        {!u.is_active && <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        {u.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={12} /> verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <XCircle size={12} /> unverified
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Joined {fmtDate(u.created_at)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {state.meta?.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {state.meta.page} of {state.meta.totalPages} · {state.meta.total} users
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= state.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Avatar({ user }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full avatar-gradient flex items-center justify-center text-white font-heading font-bold text-xs flex-shrink-0">
      {user.initials || user.name?.slice(0, 2)?.toUpperCase() || '??'}
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    customer:   { icon: UserIcon,    color: 'bg-blue-50 text-blue-600' },
    tailor:     { icon: Scissors,    color: 'bg-gold-50 text-gold-600' },
    agent:      { icon: UserPlus,    color: 'bg-teal-50 text-teal-600' },
    admin:      { icon: ShieldCheck, color: 'bg-gray-100 text-gray-700' },
    superadmin: { icon: ShieldCheck, color: 'bg-red-50 text-red-600' },
  };
  const { icon: Icon, color } = map[role] || map.customer;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      <Icon size={11} strokeWidth={2.2} />
      {role}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
