import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Loader2, UserCheck, AlertCircle } from 'lucide-react';

export default function AddCustomerModal({ isOpen, onClose, onSave, onLink, onForceCreate }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchField, setMatchField] = useState(null);

  const resetState = () => {
    setForm({ name: '', phone: '', email: '', location: '' });
    setMatchedUser(null);
    setMatchField(null);
    setError(null);
    setSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const result = await onSave({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        location: form.location.trim() || undefined,
      });

      // Backend found a matching user → show confirmation
      if (result?.requires_confirmation) {
        setMatchedUser(result.existing_user);
        setMatchField(result.match_field);
        setSaving(false);
        return;
      }

      // Normal creation succeeded
      resetState();
      onClose();
    } catch (err) {
      console.error('Failed to save customer:', err);
      setError(err.message || 'Failed to add customer');
      setSaving(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!matchedUser) return;
    setSaving(true);
    try {
      await onLink({ user_id: matchedUser.id });
      resetState();
      onClose();
    } catch (err) {
      console.error('Failed to link customer:', err);
      setError(err.message || 'Failed to link customer');
      setSaving(false);
    }
  };

  const handleDenyLink = async () => {
    setSaving(true);
    setError(null);
    try {
      await onForceCreate({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      resetState();
      onClose();
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError(err.message || 'Failed to create customer');
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
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {matchedUser ? (
                  <UserCheck size={20} className="text-blue-500" />
                ) : (
                  <UserPlus size={20} className="text-gold-500" />
                )}
                <h2 className="font-heading font-bold text-lg text-gray-900">
                  {matchedUser ? 'Existing Customer Found' : 'New Customer'}
                </h2>
              </div>
              <button onClick={handleClose} className="btn-touch p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Confirmation Dialog */}
            {matchedUser ? (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        A customer with this {matchField} already exists on Dinki.
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Is this the same person you're trying to add?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-heading font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: matchedUser.avatar_color || '#D4A574' }}
                  >
                    {matchedUser.initials || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{matchedUser.name}</p>
                    {matchedUser.phone && (
                      <p className="text-xs text-gray-500 truncate">{matchedUser.phone}</p>
                    )}
                    {matchedUser.email && (
                      <p className="text-xs text-gray-400 truncate">{matchedUser.email}</p>
                    )}
                    {matchedUser.location_city && (
                      <p className="text-xs text-gray-400">{matchedUser.location_city}</p>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                      matchedUser.account_status === 'active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {matchedUser.account_status === 'active' ? 'Active Account' : 'Unactivated'}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDenyLink}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    No, different person
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmLink}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Yes, link them
                  </motion.button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Amina Bello"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 8XX XXX XXXX"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition-colors btn-touch disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Adding...' : 'Add Customer'}
                </motion.button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
