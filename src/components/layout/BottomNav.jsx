import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Scissors, ShoppingBag, MapPin, ClipboardList, Plus, Ruler, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const tailorLeft = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/jobs', icon: Scissors, label: 'Jobs' },
];

const getTailorRight = (storefrontSlug) => [
  { to: storefrontSlug ? `/tailor/${storefrontSlug}` : '/dashboard', icon: Store, label: 'Store' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Market' },
];

const customerItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/near-me', icon: MapPin, label: 'Near Me' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Market' },
];

function NavItem({ to, icon: Icon, label, end, onNavClick }) {
  return (
    <NavLink to={to} end={end} className="btn-touch flex-1 -m-1 p-1" onClick={onNavClick}>
      {({ isActive }) => (
        <motion.div
          className="flex flex-col items-center gap-1 py-1.5"
          whileTap={{ scale: 0.9 }}
        >
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-gold-500/15'
                : 'bg-transparent'
            }`}
          >
            <Icon
              size={21}
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
        </motion.div>
      )}
    </NavLink>
  );
}

const fabActions = [
  {
    label: 'Add New Job',
    icon: Scissors,
    color: 'bg-gold-500 hover:bg-gold-600',
    key: 'addJob',
  },
  {
    label: 'Record Measurement',
    icon: Ruler,
    color: 'bg-teal-500 hover:bg-teal-600',
    key: 'recordMeasurement',
  },
];

export default function BottomNav({ userRole, onRecordMeasurement, onNavClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isTailor = userRole === 'tailor';
  const homeRoute = '/dashboard';
  const navigate = useNavigate();
  const { user } = useAuth();
  const slug = user?.storefront_slug || user?.tailor_profile?.storefront_slug;
  const tailorRight = getTailorRight(slug);

  const handleAction = (key) => {
    setMenuOpen(false);
    if (key === 'addJob') navigate('/jobs/new');
    if (key === 'recordMeasurement') onRecordMeasurement?.();
  };

  if (isTailor) {
    return (
      <>
        {/* Backdrop with blur */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Expandable action options */}
        <AnimatePresence>
          {menuOpen && (
            <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-3 md:hidden">
              {fabActions.map((act, i) => (
                <motion.button
                  key={act.key}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.8 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => handleAction(act.key)}
                  className={`flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl text-white font-medium text-sm shadow-lg ${act.color} btn-touch`}
                >
                  <act.icon size={18} />
                  {act.label}
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 safe-bottom md:hidden">
          <div className="flex items-end justify-around h-20 px-2 max-w-lg mx-auto relative">
            {/* Left nav items */}
            {tailorLeft.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} end={to === homeRoute} onNavClick={onNavClick} />
            ))}

            {/* Center FAB */}
            <div className="flex-1 flex justify-center">
              <motion.button
                style={{ y: '-1.75rem' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/30 flex items-center justify-center ring-4 ring-white active:shadow-md transition-shadow"
              >
                <motion.div animate={{ rotate: menuOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  <Plus size={26} strokeWidth={2.5} className="text-white" />
                </motion.div>
              </motion.button>
            </div>

            {/* Right nav items */}
            {tailorRight.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} end={to === homeRoute} onNavClick={onNavClick} />
            ))}
          </div>
        </nav>
      </>
    );
  }

  // Customer bottom nav (no FAB, no drawer needed from here)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 safe-bottom md:hidden">
      <div className="flex items-center justify-around h-20 px-2 max-w-lg mx-auto">
        {customerItems.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} end={to === homeRoute} onNavClick={onNavClick} />
        ))}
      </div>
    </nav>
  );
}
