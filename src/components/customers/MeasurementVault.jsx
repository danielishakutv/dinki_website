import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { measurementFields } from '../../data/mockData';
import { Save, Edit3, X, Ruler, FileText, Plus, Trash2 } from 'lucide-react';

export default function MeasurementVault({ measurements, onSave }) {
  // DB stores: { _version, standard: { neck: 15, ... }, custom: [...], notes: '...' }
  // Flatten standard into top-level for the form
  const stored = measurements || {};
  const flat = { ...(stored.standard || {}), notes: stored.notes || '' };

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...flat });
  const [customFields, setCustomFields] = useState(stored.custom || []);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldUnit, setNewFieldUnit] = useState('in');
  const [showAddField, setShowAddField] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value === '' ? null : Number(value) || value }));
  };

  const handleAddCustomField = () => {
    const trimmed = newFieldName.trim();
    if (!trimmed) return;
    const key = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_');
    // Prevent duplicates
    const allKeys = [...measurementFields.map((f) => f.key), ...customFields.map((f) => f.key)];
    if (allKeys.includes(key)) return;
    const field = { key, label: trimmed, unit: newFieldUnit, isCustom: true };
    setCustomFields((prev) => [...prev, field]);
    setNewFieldName('');
    setNewFieldUnit('in');
    setShowAddField(false);
  };

  const handleRemoveCustomField = (key) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== key));
    setForm((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    onSave({ ...form, _custom: customFields });
    setEditing(false);
  };

  const handleCancel = () => {
    const s = measurements || {};
    setForm({ ...(s.standard || {}), notes: s.notes || '' });
    setCustomFields(s.custom || []);
    setEditing(false);
    setShowAddField(false);
    setNewFieldName('');
    setNewFieldUnit('in');
  };

  const allFields = [...measurementFields, ...customFields];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className={`flex items-center ${editing ? 'justify-between' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-gold-500" />
            <h3 className="font-heading font-semibold text-gray-800">Measurement Vault</h3>
          </div>
          {!editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              className="btn-touch flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gold-600 bg-gold-50 hover:bg-gold-100 transition-colors"
            >
              <Edit3 size={14} /> Edit
            </motion.button>
          )}
        </div>
        {editing && (
          <div className="flex gap-2 mt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="btn-touch flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X size={14} /> Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="btn-touch flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 transition-colors"
            >
              <Save size={14} /> Save
            </motion.button>
          </div>
        )}
      </div>

      {/* Measurement Table */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {allFields.map((field) => (
            <div key={field.key} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 relative group">
              <div className="flex items-center gap-1.5 mb-1.5">
                {field.isCustom ? (
                  <Ruler size={12} className="text-gold-400" />
                ) : (
                  <field.icon size={12} className="text-gray-400" />
                )}
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 flex-1 truncate">
                  {field.label}
                </p>
                {editing && field.isCustom && (
                  <button
                    onClick={() => handleRemoveCustomField(field.key)}
                    className="text-red-400 hover:text-red-600 transition-colors p-0.5 -mr-1"
                    title="Remove custom measurement"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
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

          {/* Add Custom Measurement Button */}
          {editing && (
            <AnimatePresence>
              {!showAddField ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setShowAddField(true)}
                  className="p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gold-400 hover:bg-gold-50/40 flex flex-col items-center justify-center gap-1.5 transition-colors min-h-[80px] cursor-pointer"
                >
                  <Plus size={18} className="text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Add Custom
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 rounded-xl border-2 border-gold-300 bg-gold-50/30 flex flex-col gap-2"
                >
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomField()}
                    placeholder="e.g. Thigh"
                    maxLength={30}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                    autoFocus
                  />
                  <select
                    value={newFieldUnit}
                    onChange={(e) => setNewFieldUnit(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  >
                    <option value="in">inches</option>
                    <option value="cm">cm</option>
                    <option value="m">metres</option>
                    <option value="yd">yards</option>
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setShowAddField(false); setNewFieldName(''); setNewFieldUnit('in'); }}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCustomField}
                      disabled={!newFieldName.trim()}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-medium text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Notes */}
        <div className="mt-4 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <p className="text-[10px] font-medium uppercase tracking-wider text-amber-500 mb-1 flex items-center gap-1">
            <FileText size={10} /> Notes
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
