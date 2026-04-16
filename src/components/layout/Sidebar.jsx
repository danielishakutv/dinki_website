import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Scissors, Users, ShoppingBag, Settings, HelpCircle, LogOut, MapPin, ClipboardList, User, MessageSquare, Heart, Bell, Store, Trophy, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { useAuth } from '../../contexts/AuthContext';

const getTailorNav = (storefrontSlug) => [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: storefrontSlug ? `/tailor/${storefrontSlug}` : '/dashboard', icon: Store, label: 'My Storefront' },
  { to: '/jobs', icon: Scissors, label: 'Jobs & Orders' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/news', icon: Newspaper, label: 'News & Articles' },
];

const customerNav = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/near-me', icon: MapPin, label: 'Near Me' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/news', icon: Newspaper, label: 'News & Articles' },
];

const bottomNav = [
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/favourites', icon: Heart, label: 'Favourites' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

function SideLink({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-gold-500/10 text-gold-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
          <span>{label}</span>
          {isActive && (
            <motion.div
              layoutId="sidebarIndicator"
              className="ml-auto w-1.5 h-6 rounded-full bg-gold-500"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </motion.div>
      )}
    </NavLink>
  );
}

export default function Sidebar({ userRole }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const slug = user?.storefront_slug || user?.tailor_profile?.storefront_slug;
  const mainNav = userRole === 'customer' ? customerNav : getTailorNav(slug);
  const homeRoute = '/dashboard';

  const profileName = user?.name || (userRole === 'tailor' ? 'Tailor' : 'Customer');
  const profileInitials = profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const profileRole = userRole === 'customer' ? 'Customer' : 'Master Tailor';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 h-screen bg-white border-r border-gray-200/60 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-100">
        <Logo size="md" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
          Menu
        </p>
        {mainNav.map((item) => (
          <SideLink key={item.to} {...item} end={item.to === homeRoute} />
        ))}

        <div className="my-6 border-t border-gray-100" />

        <p className="px-4 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
          Other
        </p>
        {bottomNav.map((item) => (
          <SideLink key={item.to} {...item} />
        ))}
      </nav>

      {/* User Profile Mini & Logout */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gold-50 to-amber-50 cursor-pointer hover:from-gold-100 hover:to-amber-100 transition-all"
        >
          <div className="w-10 h-10 rounded-full avatar-gradient flex items-center justify-center text-white font-heading font-bold text-sm">
            {profileInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {profileName}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {profileRole}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <LogOut size={20} strokeWidth={1.6} />
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}
