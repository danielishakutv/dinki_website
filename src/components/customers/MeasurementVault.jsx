import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { measurementFields } from '../../data/mockData';
import { Save, Edit3, X } from 'lucide-react';

export default function MeasurementVault({ measurements, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...measurements });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value === '' ? null : Number(value) || value }));
  };

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({ ...measurements });
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📐</span>
          <h3 className="font-heading font-semibold text-gray-800">Measurement Vault</h3>
        </div>
        {!editing ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="btn-touch flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gold-600 bg-gold-50 hover:bg-gold-100 transition-colors"
          >
            <Edit3 size={14} /> Edit
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="btn-touch flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X size={14} /> Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="btn-touch flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 transition-colors"
            >
              <Save size={14} /> Save
            </motion.button>
          </div>
        )}
      </div>

      {/* Measurement Table */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {measurementFields.map((field) => (
            <div key={field.key} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs">{field.icon}</span>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {field.label}
                </p>
              </div>
              {editing ? (
                <input
                  type="number"
                  value={form[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder="—"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
              ) : (
                <p className="text-lg font-heading font-bold text-gray-800">
                  {form[field.key] != null ? (
                    <>
                      {form[field.key]}
                      <span className="text-xs font-normal text-gray-400 ml-1">{field.unit}</span>
                    </>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-4 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <p className="text-[10px] font-medium uppercase tracking-wider text-amber-500 mb-1">
            📝 Notes
          </p>
          {editing ? (
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 resize-none"
            />
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">
              {form.notes || 'No notes recorded.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
