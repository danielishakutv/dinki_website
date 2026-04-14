import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MapPin, ChevronRight, Loader2 } from 'lucide-react';

export default function CustomerList({ customers, onAddCustomer, loading }) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAddCustomer}
          className="btn-touch px-4 rounded-xl bg-gold-500 hover:bg-gold-600 text-white shadow-sm transition-colors"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* Customer Count */}
      <p className="text-xs text-gray-400 font-medium px-1">
        {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Customer Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gold-500" />
        </div>
      ) : (
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/customers/${customer.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm card-hover"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: customer.avatar_color || '#D4A574' }}
                >
                  {customer.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{customer.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-gray-300 flex-shrink-0" />
                    <p className="text-xs text-gray-400 truncate">{customer.location}</p>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">{customer.phone || ''}</p>
                </div>

                {/* Arrow */}
                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">No customers found.</p>
        </div>
      )}
    </div>
  );
}
