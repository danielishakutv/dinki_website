import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { customers as customersApi } from '../lib/api';
import { invalidateCache } from '../hooks/useApi';
import { customersRepo } from '../lib/local/repo';

export default function NewCustomerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchField, setMatchField] = useState(null);

  const finish = () => {
    invalidateCache('customers');
    navigate('/customers');
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || undefined,
    location: form.location.trim() || undefined,
  });

  const unreachable = (err) => err?.code === 'NETWORK_ERROR' || navigator.onLine === false;

  // Saving offline is not a degraded path — it is instant and complete. The
  // customer gets its permanent id here on the device and uploads later.
  const saveLocally = async () => {
    await customersRepo.create(buildPayload());
    finish();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    setSaving(true);
    setError(null);

    // Identity matching ("this phone number already belongs to someone on
    // Dinki") searches every platform user, so it can only run on the server.
    // With a connection we still use it, because catching a duplicate at the
    // point of entry is worth a round trip. Without one, we save immediately
    // and accept that a rare duplicate may need merging later — far better
    // than refusing to record a customer standing in the shop.
    if (navigator.onLine === false) {
      await saveLocally();
      return;
    }

    try {
      const result = await customersApi.create(buildPayload());
      if (result?.data?.requires_confirmation) {
        setMatchedUser(result.data.existing_user);
        setMatchField(result.data.match_field);
        setSaving(false);
        return;
      }
      await customersRepo.adoptServerRecord(result?.data);
      finish();
    } catch (err) {
      if (unreachable(err)) {
        await saveLocally();
        return;
      }
      console.error('Failed to save customer:', err);
      setError(err.message || 'Failed to add customer');
      setSaving(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!matchedUser) return;
    setSaving(true);
    setError(null);
    try {
      const result = await customersApi.link({ user_id: matchedUser.id });
      await customersRepo.adoptServerRecord(result?.data);
      finish();
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
      const result = await customersApi.forceCreate(buildPayload());
      await customersRepo.adoptServerRecord(result?.data);
      finish();
    } catch (err) {
      if (unreachable(err)) {
        await saveLocally();
        return;
      }
      console.error('Failed to create customer:', err);
      setError(err.message || 'Failed to create customer');
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      <button
        onClick={() => navigate(-1)}
        className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-gold-400 to-amber-500" />
        <div className="px-5 md:px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {matchedUser ? (
              <UserCheck size={20} className="text-blue-500 flex-shrink-0" />
            ) : (
              <UserPlus size={20} className="text-gold-500 flex-shrink-0" />
            )}
            <div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-gray-900">
                {matchedUser ? 'Existing Customer Found' : 'New Customer'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {matchedUser
                  ? 'Is this the same person you were trying to add?'
                  : 'Add a new customer to your list.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {matchedUser ? (
            <div className="space-y-4">
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

              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDenyLink}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60 btn-touch"
                >
                  No, different person
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmLink}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 btn-touch"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Yes, link them
                </motion.button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Amina Bello"
                  required
                  autoFocus
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

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/customers')}
                  disabled={saving}
                  className="sm:flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60 btn-touch"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="sm:flex-1 py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm shadow-sm transition-colors btn-touch disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Adding...' : 'Add Customer'}
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
