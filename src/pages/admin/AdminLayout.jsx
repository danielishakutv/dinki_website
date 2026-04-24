import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Bell, ShieldCheck, Users } from 'lucide-react';

/**
 * AdminLayout — inner shell for every /admin/* page.
 *
 * Kept intentionally thin so each admin module (dashboard, notifications, …)
 * lives in its own <Outlet /> page and can fail independently.
 *
 * Role-gating happens ONE level up in App.jsx (`AdminOnlyRoute`); this
 * component assumes the caller is already an admin/superadmin.
 */

const tabs = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

function AdminTab({ to, end, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gold-500/10 text-gold-600'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
        }`
      }
    >
      <Icon size={16} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={22} className="text-gold-500" />
          <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">
            Admin
          </h1>
        </div>
        <p className="text-sm text-gray-400">
          Internal tools. Visible to admin and superadmin accounts only.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 mb-6 p-1 bg-white rounded-2xl border border-gray-100 w-fit">
        {tabs.map((t) => <AdminTab key={t.to} {...t} />)}
      </nav>

      <Outlet />
    </div>
  );
}
