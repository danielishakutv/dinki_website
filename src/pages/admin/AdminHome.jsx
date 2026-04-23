import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Users, UserCheck, Scissors, ClipboardList, TrendingUp, ShieldCheck } from 'lucide-react';
import { admin as adminApi } from '../../lib/api';

/**
 * AdminHome — the /admin dashboard landing page.
 *
 * Renders a single GET /v1/admin/stats call into metric cards. Kept read-only
 * so this page can never mutate platform state on load. Further modules
 * (notifications, user management) live on their own /admin/* routes.
 */
export default function AdminHome() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.stats();
        if (cancelled) return;
        setState({ status: 'ok', data: res.data });
      } catch (err) {
        if (cancelled) return;
        setState({ status: 'error', message: err.message || 'Request failed' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Could not load dashboard</p>
          <p className="text-red-600/80 mt-0.5">{state.message}</p>
        </div>
      </div>
    );
  }

  const { users, jobs, orders } = state.data;

  return (
    <div className="space-y-6">
      <Section title="Users" subtitle={`${fmt(users.total)} total · ${fmt(users.verified)} verified`}>
        <StatCard icon={Users} label="Customers" value={users.customers} tone="blue" />
        <StatCard icon={Scissors} label="Tailors" value={users.tailors} tone="gold" />
        <StatCard icon={ShieldCheck} label="Admin" value={users.admins + users.superadmins} tone="slate" />
        <StatCard icon={TrendingUp} label="New (24h)" value={users.new_24h} sub={`${fmt(users.new_7d)} in 7d`} tone="emerald" />
      </Section>

      <Section title="Jobs" subtitle={`${fmt(jobs.total)} total · ${fmt(jobs.new_7d)} new in 7d`}>
        <StatCard icon={ClipboardList} label="Cutting" value={jobs.cutting} tone="slate" />
        <StatCard icon={ClipboardList} label="Stitching" value={jobs.stitching} tone="gold" />
        <StatCard icon={ClipboardList} label="Ready" value={jobs.ready} tone="blue" />
        <StatCard icon={UserCheck} label="Delivered" value={jobs.delivered} tone="emerald" />
      </Section>

      <Section title="Orders" subtitle={`${fmt(orders.total)} total · ${fmt(orders.new_7d)} new in 7d`}>
        <StatCard icon={ClipboardList} label="Pending" value={orders.pending} tone="slate" />
        <StatCard icon={ClipboardList} label="Accepted" value={orders.accepted} tone="blue" />
        <StatCard icon={ClipboardList} label="In progress" value={orders.in_progress} tone="gold" />
        <StatCard icon={UserCheck} label="Completed" value={orders.completed} sub={orders.cancelled ? `${fmt(orders.cancelled)} cancelled` : null} tone="emerald" />
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-heading font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {children}
      </div>
    </section>
  );
}

const TONE = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
  gold:    { bg: 'bg-gold-50',    text: 'text-gold-600' },
  slate:   { bg: 'bg-gray-100',   text: 'text-gray-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

function StatCard({ icon: Icon, label, value, sub, tone = 'slate' }) {
  const t = TONE[tone] || TONE.slate;
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100">
      <div className={`w-9 h-9 rounded-xl ${t.bg} ${t.text} flex items-center justify-center mb-3`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-heading font-bold text-gray-900 mt-0.5">{fmt(value)}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}
