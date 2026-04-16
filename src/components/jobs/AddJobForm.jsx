import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2, Search, User, UserPlus, AlertCircle, UserCheck } from 'lucide-react';
import { users as usersApi, customers as customersApi } from '../../lib/api';

const statusOptions = [
  { value: 'cutting', label: 'Cutting' },
  { value: 'stitching', label: 'Stitching' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
];

const emptyForm = { customerId: '', userId: '', title: '', description: '', status: 'cutting', dueDate: '', price: '' };

export default function AddJobForm({ onSave, customers = [], editJob, onCancel, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editJob;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [platformResults, setPlatformResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Quick Add Customer state
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', phone: '', email: '' });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddError, setQuickAddError] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchField, setMatchField] = useState(null);

  const resetQuickAdd = () => {
    setQuickAddMode(false);
    setQuickAddForm({ name: '', phone: '', email: '' });
    setQuickAddSaving(false);
    setQuickAddError(null);
    setMatchedUser(null);
    setMatchField(null);
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddForm.name.trim() || !quickAddForm.phone.trim()) return;
    setQuickAddSaving(true);
    setQuickAddError(null);
    try {
      const result = await customersApi.create({
        name: quickAddForm.name.trim(),
        phone: quickAddForm.phone.trim(),
        email: quickAddForm.email.trim() || undefined,
      });
      if (result?.data?.requires_confirmation) {
        setMatchedUser(result.data.existing_user);
        setMatchField(result.data.match_field);
        setQuickAddSaving(false);
        return;
      }
      const newCustomer = result?.data?.customer || result?.data;
      if (newCustomer?.id) {
        selectLocalCustomer(newCustomer);
      }
      resetQuickAdd();
    } catch (err) {
      setQuickAddError(err.message || 'Failed to add customer');
      setQuickAddSaving(false);
    }
  };

  const handleQuickAddLink = async () => {
    if (!matchedUser) return;
    setQuickAddSaving(true);
    try {
      const result = await customersApi.link({ user_id: matchedUser.id });
      const newCustomer = result?.data?.customer || result?.data;
      if (newCustomer?.id) {
        selectLocalCustomer(newCustomer);
      }
      resetQuickAdd();
    } catch (err) {
      setQuickAddError(err.message || 'Failed to link customer');
      setQuickAddSaving(false);
    }
  };

  const handleQuickAddForce = async () => {
    setQuickAddSaving(true);
    try {
      const result = await customersApi.forceCreate({
        name: quickAddForm.name.trim(),
        phone: quickAddForm.phone.trim(),
        email: quickAddForm.email.trim() || undefined,
      });
      const newCustomer = result?.data?.customer || result?.data;
      if (newCustomer?.id) {
        selectLocalCustomer(newCustomer);
      }
      resetQuickAdd();
    } catch (err) {
      setQuickAddError(err.message || 'Failed to create customer');
      setQuickAddSaving(false);
    }
  };

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
      return;
    }

    setForm(emptyForm);
    setSelectedCustomer(null);
    setSearchQuery('');
    setPlatformResults([]);
  }, [editJob]);

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

  const filteredLocal = searchQuery.trim()
    ? customers.filter((customer) => customer.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : customers;

  const localUserIds = new Set(customers.filter((customer) => customer.user_id).map((customer) => customer.user_id));
  const filteredPlatform = platformResults.filter((user) => !localUserIds.has(user.id));

  const selectLocalCustomer = (customer) => {
    setForm({ ...form, customerId: customer.id, userId: '' });
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setShowDropdown(false);
  };

  const selectPlatformUser = (user) => {
    setForm({ ...form, customerId: '', userId: user.id });
    setSelectedCustomer({ ...user, isPlatform: true });
    setSearchQuery(user.name);
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
      onSuccess?.();
    } catch (err) {
      console.error(isEdit ? 'Failed to update job:' : 'Failed to create job:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

            <AnimatePresence>
              {showDropdown && !selectedCustomer && (searchQuery.length > 0 || filteredLocal.length > 0 || quickAddMode) && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
                >
                  {filteredLocal.length > 0 && (
                    <>
                      <div className="px-3 pt-2.5 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">My Customers</p>
                      </div>
                      {filteredLocal.slice(0, 5).map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectLocalCustomer(customer)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: customer.avatar_color || '#D4A574' }}
                          >
                            {customer.initials || customer.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{customer.name}</p>
                            {customer.phone && <p className="text-[11px] text-gray-400 truncate">{customer.phone}</p>}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

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
                      {filteredPlatform.slice(0, 5).map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectPlatformUser(user)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50/50 transition-colors text-left"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: user.avatar_color || '#6366f1' }}
                          >
                            {user.initials || user.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{user.phone || user.email}</p>
                          </div>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 flex-shrink-0">Platform</span>
                        </button>
                      ))}
                    </>
                  )}

                  {filteredLocal.length === 0 && (searchQuery.trim().length < 2 || (!searching && filteredPlatform.length === 0)) && !quickAddMode && (
                    <p className="px-3 py-3 text-xs text-gray-400 text-center">Type at least 2 characters to search</p>
                  )}

                  {/* Quick Add Customer */}
                  {!quickAddMode && searchQuery.trim().length >= 2 && !searching && (
                    <div className="border-t border-gray-100 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickAddMode(true);
                          setQuickAddForm({ ...quickAddForm, name: searchQuery.trim() });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors text-left"
                      >
                        <UserPlus size={14} />
                        <span className="text-xs">Can't find them? <span className="font-semibold text-gold-600">Add new customer</span></span>
                      </button>
                    </div>
                  )}

                  {quickAddMode && !matchedUser && (
                    <div className="border-t border-gray-100 p-3 space-y-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <UserPlus size={14} className="text-gold-500" />
                        <p className="text-xs font-semibold text-gray-600">Quick Add Customer</p>
                      </div>
                      <input
                        type="text"
                        value={quickAddForm.name}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                        placeholder="Full Name *"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                      <input
                        type="tel"
                        value={quickAddForm.phone}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value })}
                        placeholder="Phone * e.g. +234..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                      <input
                        type="email"
                        value={quickAddForm.email}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, email: e.target.value })}
                        placeholder="Email (optional)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                      {quickAddError && (
                        <p className="text-xs text-red-500">{quickAddError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={resetQuickAdd}
                          className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddSubmit}
                          disabled={quickAddSaving || !quickAddForm.name.trim() || !quickAddForm.phone.trim()}
                          className="flex-1 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                        >
                          {quickAddSaving && <Loader2 size={12} className="animate-spin" />}
                          {quickAddSaving ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}

                  {quickAddMode && matchedUser && (
                    <div className="border-t border-gray-100 p-3 space-y-2.5">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-800">
                            A customer with this {matchField} already exists.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: matchedUser.avatar_color || '#D4A574' }}
                        >
                          {matchedUser.initials || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{matchedUser.name}</p>
                          {matchedUser.phone && <p className="text-[11px] text-gray-400 truncate">{matchedUser.phone}</p>}
                        </div>
                      </div>
                      {quickAddError && (
                        <p className="text-xs text-red-500">{quickAddError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleQuickAddForce}
                          disabled={quickAddSaving}
                          className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                          Different person
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddLink}
                          disabled={quickAddSaving}
                          className="flex-1 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                        >
                          {quickAddSaving && <Loader2 size={12} className="animate-spin" />}
                          Yes, link them
                        </button>
                      </div>
                    </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
          <div className="relative">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto sm:min-w-32 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition-colors btn-touch disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Job')}
        </motion.button>
      </div>
    </form>
  );
}