import React, { useState, useMemo } from 'react';
import { Send, Users, Scissors, Globe, User, CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { admin as adminApi } from '../../lib/api';

/**
 * AdminNotifications — compose and send a system notification.
 *
 * Target modes:
 *   - all    → every active user
 *   - role   → customers | tailors
 *   - user   → single user (search-then-pick)
 *
 * Confirms before firing. Shows the server's actual delivered count on success.
 */
export default function AdminNotifications() {
  const [scope, setScope] = useState('all');
  const [role, setRole] = useState('customer');
  const [targetUser, setTargetUser] = useState(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [alsoEmail, setAlsoEmail] = useState(false);

  const [status, setStatus] = useState({ state: 'idle' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canSubmit = useMemo(() => {
    if (title.trim().length < 3) return false;
    if (scope === 'user' && !targetUser) return false;
    return true;
  }, [title, scope, targetUser]);

  const targetLabel = useMemo(() => {
    if (scope === 'all') return 'every active user on the platform';
    if (scope === 'role') return `all ${role}s`;
    if (scope === 'user') return targetUser ? `${targetUser.name} (${targetUser.email})` : 'one user';
    return '';
  }, [scope, role, targetUser]);

  const payload = useMemo(() => {
    const target =
      scope === 'all' ? { scope: 'all' } :
      scope === 'role' ? { scope: 'role', role } :
      { scope: 'user', userId: targetUser?.id };
    return {
      target,
      title: title.trim(),
      message: message.trim() || undefined,
      link: link.trim() || undefined,
      email: alsoEmail || undefined,
    };
  }, [scope, role, targetUser, title, message, link, alsoEmail]);

  async function doSend() {
    setConfirmOpen(false);
    setStatus({ state: 'sending' });
    try {
      const res = await adminApi.broadcastNotification(payload);
      setStatus({
        state: 'sent',
        sent: res.data.sent,
        emailed: res.data.emailed || 0,
        target: res.data.target,
      });
      setTitle('');
      setMessage('');
      setLink('');
      setAlsoEmail(false);
    } catch (err) {
      setStatus({ state: 'error', message: err.message || 'Failed to send' });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="text-sm font-heading font-semibold text-gray-800 mb-1">Send notification</h2>
        <p className="text-xs text-gray-500">
          In-app notification delivered instantly to selected users. Optionally mirror it to their inbox.
        </p>
      </header>

      {/* Target selector */}
      <section className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">Who should receive this?</label>
        <div className="grid grid-cols-3 gap-2">
          <ScopeChip icon={Globe} label="Everyone" active={scope === 'all'} onClick={() => setScope('all')} />
          <ScopeChip icon={Users} label="A role" active={scope === 'role'} onClick={() => setScope('role')} />
          <ScopeChip icon={User} label="One user" active={scope === 'user'} onClick={() => setScope('user')} />
        </div>

        {scope === 'role' && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <RoleChip icon={Users} label="Customers" active={role === 'customer'} onClick={() => setRole('customer')} />
            <RoleChip icon={Scissors} label="Tailors" active={role === 'tailor'} onClick={() => setRole('tailor')} />
          </div>
        )}

        {scope === 'user' && (
          <UserPicker value={targetUser} onChange={setTargetUser} />
        )}
      </section>

      {/* Message */}
      <section className="space-y-3">
        <Field label="Title" required hint="Shown as the notification headline (3–200 chars)">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Welcome to Dinki Pro"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
          />
        </Field>
        <Field label="Message" hint="Optional body (max 2000 chars)">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Write something helpful…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all resize-none"
          />
        </Field>
        <Field label="Link" hint="Optional — where clicking the notification should take the user (e.g. /marketplace)">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            maxLength={500}
            placeholder="/marketplace"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
          />
        </Field>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-gold-300 transition">
          <input
            type="checkbox"
            checked={alsoEmail}
            onChange={(e) => setAlsoEmail(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-gold-500"
          />
          <span className="flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Mail size={14} className="text-gold-600" /> Also send as email
            </span>
            <span className="block text-[11px] text-gray-500 mt-0.5">
              Mirrors the notification into each recipient's inbox using the Dinki template.
              In-app delivery is always on; this adds email on top.
            </span>
          </span>
        </label>
      </section>

      {/* Status banner */}
      {status.state === 'sent' && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-start gap-2">
          <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Delivered to {status.sent} {status.sent === 1 ? 'user' : 'users'}</p>
            <p className="text-emerald-600/80 text-xs mt-0.5">
              Target: {status.target}
              {status.emailed > 0 && ` · ${status.emailed} email${status.emailed === 1 ? '' : 's'} queued`}
            </p>
          </div>
        </div>
      )}
      {status.state === 'error' && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Send failed</p>
            <p className="text-red-600/80 text-xs mt-0.5">{status.message}</p>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          disabled={!canSubmit || status.state === 'sending'}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-white font-semibold text-sm shadow-sm hover:bg-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.state === 'sending' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          <span>Send notification</span>
        </button>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          target={targetLabel}
          title={title.trim()}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSend}
        />
      )}
    </div>
  );
}

function ScopeChip({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition ${
        active
          ? 'bg-gold-500/10 border-gold-300 text-gold-700'
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

function RoleChip({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
        active
          ? 'bg-gold-500/10 border-gold-300 text-gold-700'
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <Icon size={16} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

/**
 * Two-stage user picker: search by name/email/phone/username, pick one.
 * Uses the admin list endpoint so we can match ANY role (the generic
 * /users/search hard-defaults the role filter to 'customer' for
 * non-admin callers and was hiding tailors/admins from this picker).
 */
function UserPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState(null);

  async function runSearch() {
    if (q.trim().length < 2) return;
    setSearching(true);
    setErr(null);
    try {
      const res = await adminApi.listUsers({ q: q.trim(), limit: 10 });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-800">{value.name}</p>
          <p className="text-xs text-gray-500">{value.email} · {value.role}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-medium text-gray-500 hover:text-gray-800"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }}
          placeholder="Search name, email, or phone"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={q.trim().length < 2 || searching}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
        >
          {searching ? '…' : 'Search'}
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {results.length > 0 && (
        <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {results.slice(0, 10).map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => { onChange(u); setResults([]); setQ(''); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{u.role}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfirmDialog({ target, title, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-heading font-semibold text-gray-900 mb-2">Send this notification?</h3>
        <p className="text-sm text-gray-600">
          "<span className="font-medium">{title}</span>" will be delivered to <span className="font-medium">{target}</span>.
          This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-gold-500 text-white text-sm font-semibold shadow-sm hover:bg-gold-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
