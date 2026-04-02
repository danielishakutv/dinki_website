import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Scissors, Users, ShoppingBag, MoreVertical, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/jobs', icon: Scissors, label: 'Jobs' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Market' },
];

const moreItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className="btn-touch flex-1"
          >
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-0.5 py-1"
                whileTap={{ scale: 0.9 }}
              >
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-200 ${
                    isActive
                      ? 'bg-gold-500/15'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-gold-500' : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? 'text-gold-600' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-gold-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}

        {/* More Button */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowMore(!showMore)}
            className="btn-touch w-full flex flex-col items-center gap-0.5 py-1"
          >
            <motion.div
              className="flex flex-col items-center gap-0.5"
              whileTap={{ scale: 0.9 }}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-200 ${
                  showMore
                    ? 'bg-gold-500/15'
                    : 'bg-transparent'
                }`}
              >
                <MoreVertical
                  size={20}
                  strokeWidth={showMore ? 2.5 : 1.8}
                  className={`transition-colors duration-200 ${
                    showMore ? 'text-gold-500' : 'text-gray-400'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  showMore ? 'text-gold-600' : 'text-gray-400'
                }`}
              >
                More
              </span>
            </motion.div>
          </button>

          {/* More Menu */}
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute bottom-20 right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                onClick={() => setShowMore(false)}
              >
                {moreItems.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold-50 hover:text-gold-600 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay to close menu */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMore(false)}
            className="fixed inset-0 z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </nav>
  );
}
