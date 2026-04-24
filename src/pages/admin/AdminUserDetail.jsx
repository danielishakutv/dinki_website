import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, ArrowLeft, Save, Mail, KeyRound, LogOut, UserX, UserCheck,
  ShieldCheck, CheckCircle2, XCircle, EyeOff, Trash2,
} from 'lucide-react';
import { admin as adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AdminUserDetail — full admin-side profile for one user.
 *
 * Layout is a stack of focused "cards": Profile, Credentials, Role & Status,
 * Danger. Each card owns its own form state and save button so a failure in
 * one area doesn't roll back the others.
 */
export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [state, setState] = useState({ status: 'loading' });

  async function load() {
    setState({ status: 'loading' });
    try {
      const res = await adminApi.getUser(id);
      setState({ status: 'ok', user: res.data });
    } catch (err) {
      setState({ status: 'error', message: err.message || 'Failed to load' });
    }
  }

  useEffect(() => { load(); }, [id]);

  function onUpdated(fresh) {
    setState({ status: 'ok', user: fresh });
  }

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={14} /> Back to users
        </Link>
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load user</p>
            <p className="text-red-600/80 mt-0.5">{state.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const u = state.user;
  const isSelf = me?.id === u.id;
  const iAmSuperadmin = me?.role === 'superadmin';
  const cannotTouch = u.role === 'superadmin' && !iAmSuperadmin;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header card */}
      <div className="p-5 rounded-2xl bg-white border border-gray-100 flex items-center gap-4">
        {u.avatar_url ? (
          <img src={u.avatar_url} alt={u.name} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full avatar-gradient flex items-center justify-center text-white font-heading font-bold text-sm">
            {u.initials || u.name?.slice(0, 2)?.toUpperCase() || '??'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-heading font-bold text-gray-900 truncate">{u.name}</h1>
            <RoleBadge role={u.role} />
            {!u.is_active && <Badge color="red">Inactive</Badge>}
            {u.email_verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                <CheckCircle2 size={11} /> email verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                <XCircle size={11} /> email unverified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{u.email} · joined {fmtDate(u.created_at)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {u.login_count || 0} logins · last {u.last_login_at ? fmtDate(u.last_login_at) : 'never'}
            {u.activity ? ` · ${u.activity.jobs} jobs · ${u.activity.orders} orders` : ''}
          </p>
        </div>
      </div>

      {cannotTouch && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs flex items-start gap-2">
          <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
          <p>This is a superadmin account. Only another superadmin can modify it.</p>
        </div>
      )}

      <ProfileCard user={u} disabled={cannotTouch} onUpdated={onUpdated} />
      <CredentialsCard user={u} me={me} disabled={cannotTouch} onUpdated={onUpdated} />
      <RoleStatusCard user={u} me={me} isSelf={isSelf} disabled={cannotTouch} onUpdated={onUpdated} />
      <DangerCard
        user={u}
        me={me}
        isSelf={isSelf}
        disabled={cannotTouch}
        onUpdated={onUpdated}
        onReload={load}
        onDeleted={() => navigate('/admin/users', { replace: true })}
      />
    </div>
  );
}

/* ---------------- Profile ---------------- */

function ProfileCard({ user, disabled, onUpdated }) {
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    username: user.username || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const dirty = form.name !== (user.name || '')
    || form.phone !== (user.phone || '')
    || form.username !== (user.username || '');

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const patch = {};
      if (form.name !== (user.name || '')) patch.name = form.name;
      if (form.phone !== (user.phone || '')) patch.phone = form.phone;
      if (form.username !== (user.username || '')) patch.username = form.username;
      const res = await adminApi.updateUser(user.id, patch);
      onUpdated(res.data);
      setMsg({ kind: 'ok', text: 'Saved.' });
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Profile">
      <Field label="Name" required>
        <input type="text" value={form.name} disabled={disabled}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls} />
      </Field>
      <Field label="Phone">
        <input type="text" value={form.phone} disabled={disabled}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={inputCls} />
      </Field>
      <Field label="Username" hint="3–30 chars, letters/numbers/underscore/dot">
        <input type="text" value={form.username} disabled={disabled}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className={inputCls} />
      </Field>
      <Footer msg={msg}>
        <button type="button" onClick={save} disabled={!dirty || saving || disabled}
          className={primaryBtn}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save profile
        </button>
      </Footer>
    </Card>
  );
}

/* ---------------- Credentials ---------------- */

function CredentialsCard({ user, me, disabled, onUpdated }) {
  const [email, setEmail] = useState(user.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [setBusy, setSetBusy] = useState(false);
  const [setMsg, setSetMsg] = useState(null);
  const [confirmSetOpen, setConfirmSetOpen] = useState(false);

  async function saveEmail() {
    setSavingEmail(true);
    setEmailMsg(null);
    try {
      const res = await adminApi.updateUser(user.id, { email });
      onUpdated(res.data);
      setEmailMsg({ kind: 'ok', text: 'Email updated. User must re-verify.' });
    } catch (err) {
      setEmailMsg({ kind: 'err', text: err.message || 'Failed to update email' });
    } finally {
      setSavingEmail(false);
    }
  }

  async function sendReset() {
    setResetBusy(true);
    setResetMsg(null);
    try {
      await adminApi.resetUserPassword(user.id);
      setResetMsg({ kind: 'ok', text: 'Reset email sent to the user.' });
    } catch (err) {
      setResetMsg({ kind: 'err', text: err.message || 'Failed to send reset email' });
    } finally {
      setResetBusy(false);
    }
  }

  async function doSetPassword() {
    setConfirmSetOpen(false);
    setSetBusy(true);
    setSetMsg(null);
    try {
      await adminApi.setUserPassword(user.id, newPassword);
      setSetMsg({ kind: 'ok', text: 'Password set. All sessions revoked.' });
      setNewPassword('');
    } catch (err) {
      setSetMsg({ kind: 'err', text: err.message || 'Failed to set password' });
    } finally {
      setSetBusy(false);
    }
  }

  return (
    <Card title="Credentials" subtitle="Changing the email flips verified back to false.">
      <Field label="Email">
        <div className="flex gap-2">
          <input type="email" value={email} disabled={disabled}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls} />
          <button type="button" onClick={saveEmail} disabled={disabled || savingEmail || email === (user.email || '')}
            className={secondaryBtn}>
            {savingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Save
          </button>
        </div>
      </Field>
      {emailMsg && <Msg msg={emailMsg} />}

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
        <div className="flex items-start gap-3">
          <KeyRound size={16} className="text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Send password reset email</p>
            <p className="text-xs text-gray-500">Emails a one-hour reset link. Safe default — no password is ever revealed.</p>
          </div>
          <button type="button" onClick={sendReset} disabled={disabled || resetBusy}
            className={secondaryBtn}>
            {resetBusy ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
          </button>
        </div>
        {resetMsg && <Msg msg={resetMsg} />}

        <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
          <KeyRound size={16} className="text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Set password directly</p>
            <p className="text-xs text-gray-500">Use only when the user has lost email access too. Revokes all sessions.</p>
            <div className="mt-2 flex gap-2">
              <input type="text" value={newPassword} disabled={disabled || setBusy}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={inputCls} />
              <button type="button"
                onClick={() => setConfirmSetOpen(true)}
                disabled={disabled || setBusy || newPassword.length < 8}
                className={dangerBtn}>
                {setBusy ? <Loader2 size={14} className="animate-spin" /> : 'Set'}
              </button>
            </div>
          </div>
        </div>
        {setMsg && <Msg msg={setMsg} />}
      </div>

      {confirmSetOpen && (
        <ConfirmDialog
          title="Set this user's password?"
          body={`This replaces ${user.name}'s password immediately and revokes every active session. The new password will NOT be emailed — you must share it out-of-band.`}
          confirmLabel="Set password"
          onCancel={() => setConfirmSetOpen(false)}
          onConfirm={doSetPassword}
        />
      )}
    </Card>
  );
}

/* ---------------- Role & Status ---------------- */

function RoleStatusCard({ user, me, isSelf, disabled, onUpdated }) {
  const iAmSuperadmin = me?.role === 'superadmin';
  const canChangeRole = iAmSuperadmin && !isSelf && !disabled;

  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function doSaveRole() {
    setConfirmOpen(false);
    setSaving(true);
    setMsg(null);
    try {
      const res = await adminApi.updateUser(user.id, { role });
      onUpdated(res.data);
      setMsg({ kind: 'ok', text: `Role changed to ${role}. All sessions revoked.` });
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Failed to change role' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await adminApi.updateUser(user.id, { is_active: !user.is_active });
      onUpdated(res.data);
      setMsg({ kind: 'ok', text: user.is_active ? 'Account deactivated. Sessions revoked.' : 'Account reactivated.' });
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Failed to update status' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Role & status">
      <Field label="Role" hint={iAmSuperadmin ? null : 'Only a superadmin can change roles.'}>
        <div className="flex gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)}
            disabled={!canChangeRole}
            className={`${inputCls} bg-white`}>
            <option value="customer">Customer</option>
            <option value="tailor">Tailor</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <button type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canChangeRole || saving || role === user.role}
            className={dangerBtn}>
            Change role
          </button>
        </div>
      </Field>

      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {user.is_active ? 'Account is active' : 'Account is inactive'}
          </p>
          <p className="text-xs text-gray-500">
            {user.is_active
              ? 'Deactivating blocks login and revokes sessions, but keeps all data.'
              : 'Reactivating lets the user log in again with the same credentials.'}
          </p>
        </div>
        <button type="button"
          onClick={toggleActive}
          disabled={disabled || saving || (isSelf && user.is_active)}
          className={user.is_active ? dangerBtn : primaryBtn}>
          {saving ? <Loader2 size={14} className="animate-spin" />
            : user.is_active ? <><UserX size={14} /> Deactivate</>
            : <><UserCheck size={14} /> Reactivate</>}
        </button>
      </div>
      {msg && <Msg msg={msg} />}

      {confirmOpen && (
        <ConfirmDialog
          title="Change this user's role?"
          body={`${user.name} will become "${role}". All their active sessions will be revoked — they'll need to log in again for the new role to take effect.`}
          confirmLabel="Change role"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSaveRole}
        />
      )}
    </Card>
  );
}

/* ---------------- Danger ---------------- */

function DangerCard({ user, me, isSelf, disabled, onReload, onDeleted }) {
  const iAmSuperadmin = me?.role === 'superadmin';
  const alreadyAnonymized = user.account_status === 'anonymized';

  const [busy, setBusy] = useState(null); // 'logout' | 'anonymize' | 'delete' | null
  const [msg, setMsg] = useState(null);
  const [confirmAnon, setConfirmAnon] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function forceLogout() {
    setBusy('logout');
    setMsg(null);
    try {
      const res = await adminApi.forceLogoutUser(user.id);
      setMsg({ kind: 'ok', text: `${res.data.sessions_revoked} session(s) revoked.` });
      onReload();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Failed to force logout' });
    } finally {
      setBusy(null);
    }
  }

  async function doAnonymize() {
    setConfirmAnon(false);
    setBusy('anonymize');
    setMsg(null);
    try {
      await adminApi.anonymizeUser(user.id);
      setMsg({ kind: 'ok', text: 'Account anonymized. Personal data wiped, history kept.' });
      onReload();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Failed to anonymize' });
    } finally {
      setBusy(null);
    }
  }

  async function doHardDelete(confirmEmail) {
    setBusy('delete');
    setMsg(null);
    try {
      await adminApi.hardDeleteUser(user.id, confirmEmail);
      setConfirmDelete(false);
      onDeleted();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Failed to delete' });
      setBusy(null);
    }
  }

  return (
    <Card title="Danger zone">
      {/* Force logout */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Force logout</p>
          <p className="text-xs text-gray-500">Invalidates every active refresh token. The user will be kicked out on their next API call.</p>
        </div>
        <button type="button" onClick={forceLogout}
          disabled={disabled || busy != null || isSelf}
          className={dangerBtn}>
          {busy === 'logout' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          Force logout
        </button>
      </div>

      {/* Anonymize */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <div className="pr-3">
          <p className="text-sm font-medium text-gray-800">Anonymize account</p>
          <p className="text-xs text-gray-500">
            NDPR/GDPR-style erasure. Wipes name, email, phone, avatar, bio. Orders,
            reviews and messages stay but show "Deleted User". Irreversible.
          </p>
        </div>
        <button type="button"
          onClick={() => setConfirmAnon(true)}
          disabled={disabled || busy != null || isSelf || alreadyAnonymized}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm shadow-sm hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
          {busy === 'anonymize' ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
          Anonymize
        </button>
      </div>
      {alreadyAnonymized && (
        <p className="text-[11px] text-amber-600 -mt-1">This account is already anonymized.</p>
      )}

      {/* Hard delete — superadmin only */}
      {iAmSuperadmin && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div className="pr-3">
            <p className="text-sm font-medium text-gray-800">Hard delete</p>
            <p className="text-xs text-gray-500">
              Physically removes the user and every record linked to them —
              orders, reviews, messages, storefront. Use for test accounts or
              spam cleanup. <span className="font-semibold">Cannot be undone.</span>
            </p>
          </div>
          <button type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={disabled || busy != null || isSelf}
            className={dangerBtn}>
            {busy === 'delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Hard delete
          </button>
        </div>
      )}

      {msg && <Msg msg={msg} />}

      {isSelf && (
        <p className="mt-3 text-[11px] text-amber-600">
          This is your own account. Destructive actions are disabled — use /settings instead.
        </p>
      )}

      {confirmAnon && (
        <ConfirmDialog
          title="Anonymize this user?"
          body={`Personal data for ${user.name} (${user.email}) will be permanently wiped. Their orders, reviews and messages will remain as "Deleted User" so other users' history stays intact. This cannot be undone.`}
          confirmLabel="Anonymize account"
          onCancel={() => setConfirmAnon(false)}
          onConfirm={doAnonymize}
        />
      )}

      {confirmDelete && (
        <TypedConfirmDialog
          title="Permanently delete this user?"
          body={`This will physically remove ${user.name} (${user.email}) AND every row that references them: orders, reviews, conversations, messages, storefront, referrals on the referrer side. Other users will lose shared history too. This cannot be undone.`}
          expectedText={user.email}
          confirmLabel="Delete permanently"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={doHardDelete}
        />
      )}
    </Card>
  );
}

/**
 * Confirm dialog that requires the admin to re-type the target email
 * verbatim before the action fires. Used for hard delete — the typing
 * friction is intentional.
 */
function TypedConfirmDialog({ title, body, expectedText, confirmLabel, onCancel, onConfirm }) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim().toLowerCase() === (expectedText || '').trim().toLowerCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-heading font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{body}</p>
        <p className="text-xs text-gray-500 mt-3">
          Type <span className="font-mono font-semibold text-gray-800">{expectedText}</span> to confirm:
        </p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          autoFocus
        />
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button type="button"
            disabled={!matches}
            onClick={() => onConfirm(typed)}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all disabled:bg-gray-50 disabled:text-gray-400';

const primaryBtn =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 text-white font-semibold text-sm shadow-sm hover:bg-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const secondaryBtn =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const dangerBtn =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm shadow-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

function Card({ title, subtitle, children }) {
  return (
    <section className="p-5 rounded-2xl bg-white border border-gray-100 space-y-3">
      <header>
        <h3 className="text-sm font-heading font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </section>
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

function Footer({ msg, children }) {
  return (
    <div className="flex items-center justify-between pt-2 mt-1">
      <div className="flex-1">{msg && <Msg msg={msg} />}</div>
      <div>{children}</div>
    </div>
  );
}

function Msg({ msg }) {
  if (!msg) return null;
  const cls = msg.kind === 'ok' ? 'text-emerald-600' : 'text-red-600';
  return <p className={`text-xs ${cls}`}>{msg.text}</p>;
}

function Badge({ color = 'gray', children }) {
  const map = {
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    customer:   'bg-blue-50 text-blue-600',
    tailor:     'bg-gold-50 text-gold-600',
    admin:      'bg-gray-100 text-gray-700',
    superadmin: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${map[role] || map.customer}`}>
      {role}
    </span>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-heading font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{body}</p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-sm hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
