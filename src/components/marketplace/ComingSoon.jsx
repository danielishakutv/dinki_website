import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

export default function ComingSoon({ title, description, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B1F3B]/80 to-[#2D325A]/80 backdrop-blur-md z-10" />

      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5 z-0">
        <svg width="100%" height="100%">
          <pattern id="comingSoonPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 0L60 30L30 60L0 30Z" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#comingSoonPattern)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
          {Icon ? <Icon size={28} className="text-gold-400" /> : <Lock size={28} className="text-gold-400" />}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-gold-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-gold-400">
            Coming Soon
          </span>
          <Sparkles size={16} className="text-gold-400" />
        </div>
        <h3 className="text-xl font-heading font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{description}</p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="mt-6 px-6 py-3 rounded-xl glass text-white font-medium text-sm hover:bg-white/20 transition-colors btn-touch"
        >
          Notify Me
        </motion.button>
      </div>
    </motion.div>
  );
}
