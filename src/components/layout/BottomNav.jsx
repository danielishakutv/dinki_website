import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Scissors, Users, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/jobs', icon: Scissors, label: 'Jobs' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Market' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
      </div>
    </nav>
  );
}
