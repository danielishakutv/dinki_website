import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors, ChevronDown, Loader2, Edit3 } from 'lucide-react';

const statusOptions = [
  { value: 'cutting', label: 'Cutting' },
  { value: 'stitching', label: 'Stitching' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
];

const emptyForm = { customerId: '', title: '', description: '', status: 'cutting', dueDate: '', price: '' };

export default function AddJobModal({ isOpen, onClose, onSave, customers, editJob }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editJob;

  useEffect(() => {
    if (editJob) {
      setForm({
        customerId: editJob.customer_id || editJob.customerId || '',
        title: editJob.title || '',
        description: editJob.description || '',
        status: editJob.status || 'cutting',
        dueDate: editJob.due_date || editJob.dueDate ? (editJob.due_date || editJob.dueDate).slice(0, 10) : '',
        price: editJob.price != null ? String(editJob.price) : '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editJob, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.customerId) return;
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
        payload.customer_id = form.customerId;
        payload.status = form.status;
      }
      await onSave(payload, editJob?.id);
      setForm(emptyForm);
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
              {/* Customer Select */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Customer {!isEdit && '*'}</label>
                <div className="relative">
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    required={!isEdit}
                    disabled={isEdit}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select a customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
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
