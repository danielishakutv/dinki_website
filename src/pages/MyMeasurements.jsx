import React, { useState, useEffect, useCallback } from 'react';
import {
  Ruler, Plus, Link2, Eye, Users, BarChart3, Copy, Check, Trash2, Pencil,
  Loader2, X, Share2, Globe, Lock,
} from 'lucide-react';
import { measurementShares as sharesApi } from '../lib/api';

const STANDARD_FIELDS = [
  ['neck', 'Neck'], ['shoulder', 'Shoulder'], ['chest', 'Chest'], ['bust', 'Bust'],
  ['waist', 'Waist'], ['hip', 'Hip'], ['sleeve', 'Sleeve Length'], ['arm', 'Arm Length'],
  ['wrist', 'Wrist'], ['thigh', 'Thigh'], ['knee', 'Knee'], ['inseam', 'Inseam'],
  ['outseam', 'Outseam'], ['ankle', 'Ankle'], ['full_length', 'Full Length'], ['round_body', 'Round Body'],
];

const emptyForm = () => ({ title: 'My Measurements', unit: 'in', standard: {}, custom: [], notes: '' });

function ShareEditor({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!initial) return emptyForm();
    const m = initial.measurements || {};
    return {
      title: initial.title || 'My Measurements',
      unit: initial.unit || 'in',
      standard: m.standard || {},
      custom: m.custom || [],
      notes: m.notes || '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setStd = (key, val) => setForm((f) => ({ ...f, standard: { ...f.standard, [key]: val } }));
  const addCustom = () => setForm((f) => ({ ...f, custom: [...f.custom, { key: `c${f.custom.length + 1}`, label: '', value: '' }] }));
  const setCustom = (i, field, val) => setForm((f) => ({ ...f, custom: f.custom.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));
  const removeCustom = (i) => setForm((f) => ({ ...f, custom: f.custom.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.title.trim()) { setError('Give this link a title.'); return; }
    setSaving(true);
    setError('');
    // Strip empty values so the public page only shows what was filled in.
    const standard = Object.fromEntries(Object.entries(form.standard).filter(([, v]) => v !== '' && v != null));
    const custom = form.custom.filter((c) => c.label.trim() && c.value !== '');
    const payload = { title: form.title.trim(), unit: form.unit, measurements: { standard, custom, notes: form.notes.trim() } };
    try {
      const res = initial ? await sharesApi.update(initial.id, payload) : await sharesApi.create(payload);
      onSaved(res.data);
    } catch (err) {
      setError(err.message || 'Could not save. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-gray-900">{initial ? 'Edit measurement link' : 'New measurement link'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Wedding Agbada, Everyday Fit"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Unit</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {['in', 'cm'].map((u) => (
                <button key={u} onClick={() => setForm((f) => ({ ...f, unit: u }))}
                  className={`px-4 py-2.5 text-sm font-semibold ${form.unit === u ? 'bg-gold-500 text-white' : 'bg-white text-gray-500'}`}>{u}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Measurements ({form.unit})</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {STANDARD_FIELDS.map(([key, label]) => (
              <div key={key}>
                <input
                  type="number" inputMode="decimal" value={form.standard[key] ?? ''}
                  onChange={(e) => setStd(key, e.target.value)} placeholder={label}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-400" />
                <span className="block mt-0.5 text-[10px] text-gray-400 px-1">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {form.custom.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Custom fields</label>
            {form.custom.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c.label} onChange={(e) => setCustom(i, 'label', e.target.value)} placeholder="Label"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-400" />
                <input type="number" value={c.value} onChange={(e) => setCustom(i, 'value', e.target.value)} placeholder="Value"
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-400" />
                <button onClick={() => removeCustom(i)} className="px-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addCustom} className="flex items-center gap-1.5 text-sm text-gold-600 font-medium"><Plus size={15} /> Add custom field</button>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes for the tailor</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
            placeholder="e.g. Prefer a slightly loose fit on the sleeves"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2.5">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {initial ? 'Save changes' : 'Create link'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Analytics({ shareId }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    sharesApi.analytics(shareId).then((r) => setData(r.data)).catch(() => setFailed(true));
  }, [shareId]);
  if (failed) return <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">Analytics unavailable right now — try again shortly.</p>;
  if (!data) return <div className="py-4 flex justify-center"><Loader2 size={18} className="animate-spin text-gold-400" /></div>;
  const max = Math.max(1, ...data.timeseries.map((d) => d.views));
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-sm"><Eye size={15} className="text-gold-500" /> <b>{data.total_views}</b> <span className="text-gray-400">views</span></div>
        <div className="flex items-center gap-1.5 text-sm"><Users size={15} className="text-teal-500" /> <b>{data.unique_viewers}</b> <span className="text-gray-400">unique</span></div>
      </div>
      {data.timeseries.length > 0 ? (
        <div className="flex items-end gap-1 h-16">
          {data.timeseries.map((d) => (
            <div key={d.day} title={`${d.day}: ${d.views}`} className="flex-1 bg-gold-200 rounded-t hover:bg-gold-400 transition-colors" style={{ height: `${(d.views / max) * 100}%`, minHeight: 2 }} />
          ))}
        </div>
      ) : <p className="text-xs text-gray-400">No views yet — share your link to start tracking.</p>}
    </div>
  );
}

function ShareRow({ share, onEdit, onDelete, onToggle }) {
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(share.public_url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const nativeShare = async () => {
    const data = { title: share.title, text: `My measurements on Dinki — ${share.title}`, url: share.public_url };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelled */ } } else copy();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-gray-900 truncate">{share.title}</h3>
            {share.is_public
              ? <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded"><Globe size={10} /> Public</span>
              : <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"><Lock size={10} /> Private</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <Eye size={12} /> {share.view_count} views
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onToggle(share)} title={share.is_public ? 'Make private' : 'Make public'} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700">{share.is_public ? <Lock size={15} /> : <Globe size={15} />}</button>
          <button onClick={() => onEdit(share)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"><Pencil size={15} /></button>
          <button onClick={() => onDelete(share)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
        <Link2 size={14} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-xs text-gray-500 truncate">{share.public_url}</span>
        <button onClick={copy} className="text-gold-600 hover:text-gold-700">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={nativeShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-50 text-gold-700 text-xs font-semibold hover:bg-gold-100 transition"><Share2 size={14} /> Share</button>
        <button onClick={() => setShowStats((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition"><BarChart3 size={14} /> {showStats ? 'Hide' : 'Analytics'}</button>
      </div>

      {showStats && <Analytics shareId={share.id} />}
    </div>
  );
}

export default function MyMeasurements() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // share being edited, or 'new', or null

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await sharesApi.list();
      setShares(res.data || []);
    } catch (err) {
      // A failed load must not masquerade as "no links yet" — users would
      // recreate duplicates of links that still exist.
      setLoadError(err.message || 'Could not load your measurement links.');
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved) => {
    setShares((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev];
    });
    setEditing(null);
  };

  const handleDelete = async (share) => {
    if (!window.confirm(`Delete "${share.title}"? The link will stop working.`)) return;
    setShares((prev) => prev.filter((s) => s.id !== share.id));
    try { await sharesApi.remove(share.id); } catch { load(); }
  };

  const handleToggle = async (share) => {
    setShares((prev) => prev.map((s) => (s.id === share.id ? { ...s, is_public: !s.is_public } : s)));
    try { await sharesApi.update(share.id, { is_public: !share.is_public }); } catch { load(); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Ruler size={22} className="text-gold-500" />
        <h1 className="text-2xl font-heading font-bold text-gray-900">My Measurements</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">Save your measurements once and share a single Dinki link with any tailor. See how many have viewed it.</p>

      {editing ? (
        <ShareEditor
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={handleSaved}
        />
      ) : (
        <>
          <button onClick={() => setEditing('new')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 shadow-sm shadow-gold-500/20 transition mb-5">
            <Plus size={16} /> New measurement link
          </button>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gold-500" /></div>
          ) : loadError ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-3">{loadError}</p>
              <button onClick={load} className="text-sm text-gold-600 font-medium hover:underline">Try again</button>
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Ruler size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No measurement links yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create one to share your measurements with tailors.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <ShareRow key={share.id} share={share} onEdit={setEditing} onDelete={handleDelete} onToggle={handleToggle} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
