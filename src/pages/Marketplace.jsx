import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Palette, Scissors, Gem, Shirt, Sparkles, ArrowRight, Bell, Check } from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Style Gallery',
    desc: 'Browse hundreds of stunning African styles from top tailors across the continent.',
    color: 'bg-gold-50 text-gold-600',
  },
  {
    icon: Scissors,
    title: 'Premium Fabrics',
    desc: 'Shop authentic Ankara, Lace, Adire, Kente and more — delivered to your tailor.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Gem,
    title: 'Accessories & Extras',
    desc: 'Buttons, beads, embroidery threads, zippers and finishing touches for every outfit.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Shirt,
    title: 'Ready-to-Wear',
    desc: 'Grab pre-made African fashion pieces from talented designers — ready to ship.',
    color: 'bg-rose-50 text-rose-600',
  },
];

const highlights = [
  'Pick from thousands of styles by verified tailors',
  'Order fabrics and materials directly to your doorstep',
  'Compare prices and get the best deals',
  'Secure payments with buyer protection',
  'Bid on custom requests and get competitive quotes',
  'Save favourites and build your dream wardrobe',
];

export default function Marketplace() {
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);

  const handleNotify = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setNotified(true);
      setEmail('');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-28 md:pb-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-50 border border-gold-200/60 mb-5">
          <Sparkles size={14} className="text-gold-500" />
          <span className="text-xs font-semibold text-gold-700 tracking-wide uppercase">Coming Soon</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4 leading-tight">
          The Dinki<br className="sm:hidden" /> Marketplace
        </h1>
        <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          Your one-stop destination for African fashion. Styles, fabrics, accessories, and
          talented tailors — all in one place. We're stitching it up and it's going to be worth the wait.
        </p>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
          >
            <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
              <f.icon size={20} />
            </div>
            <h3 className="text-sm md:text-base font-heading font-semibold text-gray-900 mb-1.5">{f.title}</h3>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* What to Expect */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#1B1F3B] to-[#2D325A] rounded-2xl p-5 md:p-8 mb-8 md:mb-10"
      >
        <h2 className="text-lg md:text-xl font-heading font-bold text-white mb-1">What you'll get</h2>
        <p className="text-sm text-gray-400 mb-5">Everything you need to look your absolute best.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={11} className="text-gold-400" />
              </div>
              <span className="text-sm text-gray-300 leading-snug">{h}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Notify CTA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-5 md:p-8 border border-gray-100 shadow-sm text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-gold-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={24} className="text-gold-500" />
        </div>
        <h2 className="text-lg md:text-xl font-heading font-bold text-gray-900 mb-2">Be the first to know</h2>
        <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
          Drop your email and we'll let you know the moment the Marketplace goes live. Early birds get exclusive launch offers.
        </p>

        {notified ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-50 border border-green-200"
          >
            <Check size={16} className="text-green-500" />
            <span className="text-sm font-medium text-green-700">You're on the list! We'll be in touch.</span>
          </motion.div>
        ) : (
          <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <Bell size={15} />
              Notify Me
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
