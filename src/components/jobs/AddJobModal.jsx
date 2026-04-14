import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors, ChevronDown, Loader2, Edit3, Search, User } from 'lucide-react';
import { users as usersApi } from '../../lib/api';

const statusOptions = [
  { value: 'cutting', label: 'Cutting' },
  { value: 'stitching', label: 'Stitching' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
];

const emptyForm = { customerId: '', userId: '', title: '', description: '', status: 'cutting', dueDate: '', price: '' };

export default function AddJobModal({ isOpen, onClose, onSave, customers, editJob }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editJob;

  // Customer search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [platformResults, setPlatformResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (editJob) {
      const custName = editJob.customer_name || editJob.customerName || '';
      setForm({
        customerId: editJob.customer_id || editJob.customerId || '',
        userId: '',
        title: editJob.title || '',
        description: editJob.description || '',
        status: editJob.status || 'cutting',
        dueDate: editJob.due_date || editJob.dueDate ? (editJob.due_date || editJob.dueDate).slice(0, 10) : '',
        price: editJob.price != null ? String(editJob.price) : '',
      });
      setSelectedCustomer({ name: custName, id: editJob.customer_id || editJob.customerId });
      setSearchQuery(custName);
    } else {
      setForm(emptyForm);
      setSelectedCustomer(null);
      setSearchQuery('');
      setPlatformResults([]);
    }
  }, [editJob, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced platform user search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setPlatformResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await usersApi.search(searchQuery.trim());
        setPlatformResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setPlatformResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Filter local customers by search query
  const filteredLocal = searchQuery.trim()
    ? customers.filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : customers;

  // Exclude platform users already in local customers (by user_id if present)
  const localUserIds = new Set(customers.filter(c => c.user_id).map(c => c.user_id));
  const filteredPlatform = platformResults.filter((u) => !localUserIds.has(u.id));

  const selectLocalCustomer = (c) => {
    setForm({ ...form, customerId: c.id, userId: '' });
    setSelectedCustomer(c);
    setSearchQuery(c.name);
    setShowDropdown(false);
  };

  const selectPlatformUser = (u) => {
    setForm({ ...form, customerId: '', userId: u.id });
    setSelectedCustomer({ ...u, isPlatform: true });
    setSearchQuery(u.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.customerId && !form.userId) return;
    if (!form.title.trim() || !form.dueDate) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due_date: form.dueDate,
        price: Number(form.price) || 0,
      };
      if (isEdit) {
        payload.status = form.status;
      } else {
        if (form.userId) {
          payload.user_id = form.userId;
        } else {
          payload.customer_id = form.customerId;
        }
        payload.status = form.status;
      }
      await onSave(payload, editJob?.id);
      setForm(emptyForm);
      setSelectedCustomer(null);
      setSearchQuery('');
      onClose();
    } catch (err) {
      console.error(isEdit ? 'Failed to update job:' : 'Failed to create job:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pt-4 pb-24 md:pb-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                {isEdit ? <Edit3 size={20} className="text-gold-500" /> : <Scissors size={20} className="text-gold-500" />}
                <h2 className="font-heading font-bold text-lg text-gray-900">{isEdit ? 'Edit Job' : 'New Job'}</h2>
              </div>
              <button onClick={onClose} className="btn-touch p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Customer Search */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Customer {!isEdit && '*'}</label>
                {isEdit ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                    {selectedCustomer?.name || 'Customer'}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                          if (selectedCustomer) {
                            setSelectedCustomer(null);
                            setForm({ ...form, customerId: '', userId: '' });
                          }
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search by customer name..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                      />
                      {selectedCustomer && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selectedCustomer.isPlatform ? 'bg-blue-50 text-blue-600' : 'bg-gold-50 text-gold-600'}`}>
                            {selectedCustomer.isPlatform ? 'Platform' : 'My Customer'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dropdown results */}
                    <AnimatePresence>
                      {showDropdown && !selectedCustomer && (searchQuery.length > 0 || filteredLocal.length > 0) && (
                        <motion.div
                          ref={dropdownRef}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto"
                        >
                          {/* My Customers */}
                          {filteredLocal.length > 0 && (
                            <>
                              <div className="px-3 pt-2.5 pb-1">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">My Customers</p>
                              </div>
                              {filteredLocal.slice(0, 5).map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => selectLocalCustomer(c)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: c.avatar_color || '#D4A574' }}>
                                    {c.initials || c.name?.[0] || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                                    {c.phone && <p className="text-[11px] text-gray-400 truncate">{c.phone}</p>}
                                  </div>
                                </button>
                              ))}
                            </>
                          )}

                          {/* Platform Users */}
                          {searchQuery.trim().length >= 2 && (
                            <>
                              <div className="px-3 pt-2.5 pb-1 border-t border-gray-100">
                                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-1">
                                  <User size={10} /> Platform Customers
                                </p>
                              </div>
                              {searching && (
                                <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-400">
                                  <Loader2 size={12} className="animate-spin" /> Searching...
                                </div>
                              )}
                              {!searching && filteredPlatform.length === 0 && (
                                <p className="px-3 py-2.5 text-xs text-gray-400">No platform customers found</p>
                              )}
                              {filteredPlatform.slice(0, 5).map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => selectPlatformUser(u)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50/50 transition-colors text-left"
                                >
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: u.avatar_color || '#6366f1' }}>
                                    {u.initials || u.name?.[0] || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                                  </div>
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 flex-shrink-0">Platform</span>
                                </button>
                              ))}
                            </>
                          )}

                          {filteredLocal.length === 0 && (searchQuery.trim().length < 2 || (!searching && filteredPlatform.length === 0)) && (
                            <p className="px-3 py-3 text-xs text-gray-400 text-center">Type at least 2 characters to search</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Job Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 3-Piece Ankara Ensemble"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about the style, fabric, and design..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (₦)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 45000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition-colors btn-touch disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Job')}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
