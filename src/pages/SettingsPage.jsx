import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  CreditCard,
  ChevronRight,
  Moon,
  Smartphone,
  Shield,
  Download,
  Trash2,
} from 'lucide-react';

const sections = [
  {
    title: 'Account',
    items: [
      { id: 'edit-profile', label: 'Edit Profile', desc: 'Name, photo, bio', icon: User, iconBg: 'bg-gold-50', iconColor: 'text-gold-500' },
      { id: 'password', label: 'Password & Security', desc: 'Change password, 2FA', icon: Lock, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
      { id: 'phone', label: 'Phone & Email', desc: 'Verify contact info', icon: Smartphone, iconBg: 'bg-teal-50', iconColor: 'text-teal-500' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', desc: 'Push, email, SMS alerts', icon: Bell, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', toggle: true, defaultOn: true },
      { id: 'dark-mode', label: 'Dark Mode', desc: 'Switch to dark theme', icon: Moon, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500', toggle: true, defaultOn: false },
      { id: 'language', label: 'Language', desc: 'English', icon: Globe, iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
      { id: 'appearance', label: 'Appearance', desc: 'Colors, fonts, layout', icon: Palette, iconBg: 'bg-pink-50', iconColor: 'text-pink-500' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { id: 'payment-methods', label: 'Payment Methods', desc: 'Cards, bank accounts', icon: CreditCard, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    ],
  },
  {
    title: 'Data & Privacy',
    items: [
      { id: 'privacy', label: 'Privacy', desc: 'Profile visibility, data sharing', icon: Shield, iconBg: 'bg-gray-100', iconColor: 'text-gray-500' },
      { id: 'export', label: 'Export Data', desc: 'Download your data', icon: Download, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
      { id: 'delete', label: 'Delete Account', desc: 'Permanently remove account', icon: Trash2, iconBg: 'bg-red-50', iconColor: 'text-red-500', danger: true },
    ],
  },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState({
    notifications: true,
    'dark-mode': false,
  });

  const handleToggle = (id) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                      item.danger ? '' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={item.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.danger ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    {item.toggle ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.id);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 flex-shrink-0 ${
                          toggles[item.id] ? 'bg-gold-500' : 'bg-gray-200'
                        }`}
                      >
                        <motion.div
                          animate={{ x: toggles[item.id] ? 20 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-5 h-5 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    ) : (
                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Version */}
      <p className="text-center text-[10px] text-gray-300 mt-8">
        Dinki.africa v2.1.0
      </p>
    </div>
  );
}
