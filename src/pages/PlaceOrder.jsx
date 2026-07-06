import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Check, Ruler, Image, Search, Loader2, AlertCircle, Star, Compass, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  orders as ordersApi,
  storefronts as storefrontsApi,
  styles as stylesApi,
  uploads as uploadsApi,
  conversations as convoApi,
} from '../lib/api';
import { invalidateCache } from '../hooks/useApi';
import { VerifiedBadge, LevelBadge } from '../components/TailorBadges';

/**
 * Place Order — real marketplace flow.
 *
 * Entry points pass ?tailor=<userId>&slug=<storefrontSlug>[&style=<styleId>]
 * (storefront CTA, style detail CTA). Without a preselected tailor the
 * customer picks one from the live tailor directory. Submitting creates a
 * real order (POST /orders), uploads reference images, and notifies the
 * tailor — no mock data anywhere.
 */
export default function PlaceOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preTailorId = searchParams.get('tailor') || '';
  const preSlug = searchParams.get('slug') || '';
  const preStyleId = searchParams.get('style') || '';

  const [step, setStep] = useState(1);

  // Selected tailor (from slug lookup or the picker)
  const [tailor, setTailor] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(!!(preSlug || preTailorId));

  // Optional style context (prefills the title)
  const [style, setStyle] = useState(null);

  // Tailor picker (when no preselection)
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    dueDate: '',
    fabricPreference: '',
    measurementNote: '',
  });
  const [files, setFiles] = useState([]); // [{ file, preview }]
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const filesRef = useRef([]);
  filesRef.current = files;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Resolve the preselected tailor. Prefer the slug (public storefront lookup);
  // a failed lookup degrades to the picker instead of a dead-end.
  useEffect(() => {
    let cancelled = false;
    if (!preSlug && !preTailorId) return undefined;
    (async () => {
      try {
        if (preSlug) {
          const res = await storefrontsApi.getBySlug(preSlug);
          if (!cancelled) setTailor(res.data);
        }
      } catch {
        /* fall through to the picker */
      } finally {
        if (!cancelled) setTailorLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [preSlug, preTailorId]);

  // Optional style context
  useEffect(() => {
    let cancelled = false;
    if (!preStyleId) return undefined;
    (async () => {
      try {
        const res = await stylesApi.get(preStyleId);
        if (cancelled) return;
        setStyle(res.data);
        setForm((prev) => (prev.title ? prev : { ...prev, title: res.data.title || '' }));
      } catch { /* style context is optional */ }
    })();
    return () => { cancelled = true; };
  }, [preStyleId]);

  // Tailor directory for the picker (debounced search)
  const loadPicker = useCallback(async (q) => {
    setPickerLoading(true);
    setPickerError('');
    try {
      const res = await storefrontsApi.search({ q: q || undefined, limit: 12 });
      setPickerResults(res.data?.tailors || []);
    } catch (err) {
      setPickerError(err.message || 'Could not load tailors.');
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const showPicker = !tailor && !tailorLoading;
  useEffect(() => {
    if (!showPicker) return undefined;
    const t = setTimeout(() => loadPicker(pickerQuery.trim()), pickerQuery ? 350 : 0);
    return () => clearTimeout(t);
  }, [showPicker, pickerQuery, loadPicker]);

  // Revoke object URLs on unmount
  useEffect(() => () => {
    filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const handleImageUpload = (e) => {
    const picked = Array.from(e.target.files || []);
    const valid = picked.filter((f) => f.type.startsWith('image/') && f.size <= 800 * 1024);
    const room = Math.max(0, 4 - files.length);
    const accepted = valid.slice(0, room);

    const notes = [];
    if (valid.length < picked.length) notes.push('images over 800KB were skipped');
    if (accepted.length < valid.length) notes.push('you can attach up to 4 photos');
    setSubmitError(notes.length ? `Some photos weren't added: ${notes.join('; ')}.` : '');

    if (accepted.length) {
      const mapped = accepted.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
      setFiles((prev) => [...prev, ...mapped].slice(0, 4));
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const canProceed = () => {
    if (step === 1) return !!tailor && form.title.trim().length > 0;
    if (step === 2) return form.description.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!tailor || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const body = {
        tailor_id: tailor.tailor_id,
        title: form.title.trim(),
        description: form.description.trim(),
      };
      const budgetNum = Math.round(parseFloat(form.budget));
      if (Number.isFinite(budgetNum) && budgetNum > 0) body.budget = budgetNum;
      if (form.dueDate) body.due_date = form.dueDate;
      if (form.fabricPreference.trim()) body.fabric_preference = form.fabricPreference.trim();
      if (form.measurementNote.trim()) body.measurement_notes = form.measurementNote.trim();
      if (style?.id) body.style_id = style.id;

      const res = await ordersApi.place(body);
      const order = res.data;

      // Reference images are best-effort — the order is already placed.
      if (files.length > 0) {
        try {
          const up = await uploadsApi.images(files.map((f) => f.file));
          const urls = (up.data || []).map((r) => r.url).filter(Boolean);
          if (urls.length) await ordersApi.addImages(order.id, urls);
        } catch { /* order stands without images */ }
      }

      invalidateCache('orders');
      setPlacedOrder(order);
    } catch (err) {
      setSubmitError(err.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageTailor = async () => {
    if (!tailor?.tailor_id || startingChat) return;
    setStartingChat(true);
    try {
      const res = await convoApi.start({ participant_id: tailor.tailor_id });
      const conversationId = res.data?.conversation?.id || res.data?.id;
      invalidateCache('conversations');
      navigate(conversationId ? `/messages/${conversationId}` : '/messages');
    } catch {
      navigate('/messages');
    } finally {
      setStartingChat(false);
    }
  };

  // Orders are a customer capability (backend enforces it) — steer other
  // roles away instead of letting them submit into a 403.
  if (user && user.role !== 'customer') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
            <Ruler size={24} className="text-gold-500" />
          </div>
          <h2 className="text-lg font-heading font-bold text-gray-900 mb-1.5">Orders are for customers</h2>
          <p className="text-sm text-gray-500 mb-6">
            You're signed in as a tailor. Customers place orders with you from your storefront.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your order has been sent to {tailor?.name || 'the tailor'}. They'll review it and respond soon —
            you'll get a notification either way.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleMessageTailor}
              disabled={startingChat}
              className="w-full py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition flex items-center justify-center gap-2"
            >
              {startingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
              Message Tailor
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="w-full py-3 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
            >
              View My Orders
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (tailorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-heading font-bold text-gray-900">Place Order</h1>
          <p className="text-xs text-gray-400">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-gold-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Tailor + what */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            {/* Selected tailor card */}
            {tailor ? (
              <div className="bg-white rounded-2xl p-4 border border-gold-200 flex items-center gap-3">
                {tailor.avatar_url ? (
                  <img src={tailor.avatar_url} alt={tailor.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: tailor.avatar_color || '#6366f1' }}>
                    {tailor.initials || tailor.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading font-bold text-gray-900 text-sm truncate">{tailor.name}</p>
                    {tailor.verified && <VerifiedBadge size={14} />}
                    <LevelBadge completedOrders={tailor.completed_jobs} compact />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{(tailor.specialties || []).slice(0, 2).join(' · ') || 'Tailor on Dinki Africa'}</p>
                </div>
                {!preSlug && (
                  <button onClick={() => setTailor(null)} className="text-xs text-gray-400 hover:text-gray-600 font-medium flex-shrink-0">
                    Change
                  </button>
                )}
              </div>
            ) : (
              /* Tailor picker */
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Choose a Tailor</label>
                <div className="relative mb-3">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search by name, city, or specialty..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  />
                </div>
                {pickerLoading ? (
                  <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gold-500" /></div>
                ) : pickerError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">{pickerError}</p>
                    <button onClick={() => loadPicker(pickerQuery.trim())} className="text-sm text-gold-600 font-medium hover:underline">Try again</button>
                  </div>
                ) : pickerResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">
                      {pickerQuery ? 'No tailors match your search.' : 'No tailors are available just yet.'}
                    </p>
                    <button onClick={() => navigate('/explore')} className="inline-flex items-center gap-1.5 text-sm text-gold-600 font-medium hover:underline">
                      <Compass size={14} /> Discover styles and tailors on Explore
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {pickerResults.map((t) => (
                      <button
                        key={t.tailor_id}
                        type="button"
                        onClick={() => setTailor(t)}
                        className="w-full bg-white rounded-xl p-3 border border-gray-100 hover:border-gold-300 hover:bg-gold-50/30 transition flex items-center gap-3 text-left"
                      >
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: t.avatar_color || '#6366f1' }}>
                            {t.initials || t.name?.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                            {t.verified && <VerifiedBadge size={13} />}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {(t.specialties || []).slice(0, 2).join(' · ') || [t.location_city, t.location_state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        {t.rating_avg > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                            <Star size={11} className="text-yellow-400" fill="currentColor" />
                            {parseFloat(t.rating_avg).toFixed(1)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Style context */}
            {style && (
              <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                <img src={style.thumb_url || style.image_url} alt={style.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Ordering this style</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{style.title}</p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">What do you want made?</label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={200}
                placeholder="e.g. Ankara gown for a wedding"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Describe your order</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Describe what you want — style details, colors, embroidery, fit preferences..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Budget (optional)</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20">
                  <span className="px-3 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 flex-shrink-0 font-medium select-none">&#x20A6;</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.budget}
                    onChange={(e) => set('budget', e.target.value)}
                    placeholder="15,000"
                    className="flex-1 px-3 py-3 text-sm focus:outline-none min-w-0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Needed by (optional)</label>
                <input
                  type="date"
                  value={form.dueDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Fabric preference (optional)</label>
              <input
                value={form.fabricPreference}
                onChange={(e) => set('fabricPreference', e.target.value)}
                maxLength={100}
                placeholder="e.g. I'll provide my own Ankara fabric"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                <span className="flex items-center gap-1.5"><Ruler size={13} /> Measurement notes (optional)</span>
              </label>
              <textarea
                value={form.measurementNote}
                onChange={(e) => set('measurementNote', e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Share your measurements or note that the tailor already has them"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Photos + review */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Reference photos (optional, up to 4)</label>
              <div className="grid grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={f.preview} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
                {files.length < 4 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gold-300 transition">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    <Image size={18} className="text-gray-300" />
                    <span className="text-[10px] text-gray-400 mt-1">Add</span>
                  </label>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">JPG or PNG, each under 800KB</p>
            </div>

            {/* Review summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
              <h3 className="text-sm font-heading font-semibold text-gray-800">Review your order</h3>
              <div className="text-sm text-gray-600 space-y-1.5">
                <p><span className="text-gray-400">Tailor:</span> {tailor?.name}</p>
                <p><span className="text-gray-400">Item:</span> {form.title}</p>
                {form.budget && <p><span className="text-gray-400">Budget:</span> ₦{Number(form.budget).toLocaleString('en-NG')}</p>}
                {form.dueDate && <p><span className="text-gray-400">Needed by:</span> {new Date(form.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6">
        {step < 3 ? (
          <button
            onClick={() => { if (canProceed()) { setStep(step + 1); setSubmitError(''); } }}
            disabled={!canProceed()}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition ${
              canProceed()
                ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gold-500 text-white hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Placing order...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
