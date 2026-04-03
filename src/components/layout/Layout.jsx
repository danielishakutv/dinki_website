import React, { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Logo from './Logo';
import { Menu, X, Bell, User, Settings, HelpCircle, LogOut, MessageSquare, Heart } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25,
};

const drawerItems = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/favourites', icon: Heart, label: 'Favourites' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

export default function Layout({ children, userRole, onAddJob }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setDrawerOpen(false);
    localStorage.removeItem('dinki-user-role');
    navigate('/');
  };

  const isTailor = userRole === 'tailor';
  const profileName = isTailor ? 'Dinki Atelier' : 'Adeola Okafor';
  const profileRole = isTailor ? 'Master Tailor' : 'Customer';
  const profileInitials = isTailor ? 'DA' : 'AO';

  return (
    <div className="min-h-screen bg-cloud">
      {/* Desktop Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/60 h-14 flex items-center justify-between px-4 md:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/notifications')} className="btn-touch relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full" />
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-touch p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col pb-20 md:pb-0 md:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
                <span className="text-sm font-heading font-semibold text-gray-700">Menu</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="px-5 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full avatar-gradient flex items-center justify-center text-white font-heading font-bold text-sm">
                    {profileInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{profileName}</p>
                    <p className="text-xs text-gray-400">{profileRole}</p>
                  </div>
                </div>
              </div>

              {/* Drawer Content — scrollable */}
              <div className="flex-1 overflow-y-auto">
                <nav className="px-3 py-4 space-y-1">
                  {drawerItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gold-500/10 text-gold-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`
                      }
                    >
                      <Icon size={20} strokeWidth={1.6} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-2 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut size={20} strokeWidth={1.6} />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Ad Banner */}
                <div className="px-4 py-3">
                  <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 p-4 text-white relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-x-4 -translate-y-8" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-x-2 translate-y-6" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 mb-1">Dinki Pro</p>
                      <p className="text-sm font-heading font-bold leading-snug">Grow your tailoring business</p>
                      <p className="text-xs text-white/80 mt-1 leading-relaxed">Get analytics, invoicing & priority listing in the marketplace.</p>
                      <button className="mt-3 px-4 py-2 bg-white text-gold-600 rounded-xl text-xs font-semibold shadow-sm hover:bg-gold-50 transition-colors">
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="md:ml-64 lg:ml-72 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav userRole={userRole} onAddJob={onAddJob} onRecordMeasurement={() => navigate('/customers')} />
    </div>
  );
}
