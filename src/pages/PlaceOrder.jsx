import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Upload, X, Check, Scissors, Ruler, Calendar, DollarSign, Image, FileText, Search } from 'lucide-react';
import { marketplaceStyles } from '../data/mockData';
import { VerifiedBadge, LevelBadge } from '../components/TailorBadges';

const recentTailorIds = ['1', '3']; // Tailors the user has interacted with recently

const tailorOptions = [
  { id: '1', name: 'Aunty Zainab', username: '@auntyzainab', specialty: 'Traditional Ankara', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop', verified: true, completedOrders: 580 },
  { id: '2', name: 'Master Chukwu', username: '@masterchukwu', specialty: 'Agbada Expert', image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=100&h=100&fit=crop', verified: true, completedOrders: 430 },
  { id: '3', name: 'Mama Amara', username: '@mamaamara', specialty: 'Luxury Aso Ebi', image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=100&h=100&fit=crop', verified: true, completedOrders: 720 },
  { id: '4', name: 'Sister Blessing', username: '@sisterblessing', specialty: 'Modern Trends', image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=100&h=100&fit=crop', verified: false, completedOrders: 85 },
  { id: '5', name: 'Baba Tunde', username: '@babatunde', specialty: 'Kaftan & Senator', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=100&h=100&fit=crop', verified: true, completedOrders: 310 },
  { id: '6', name: 'Dinki Atelier', username: '@dinkiatelier', specialty: 'Bespoke Design', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=100&h=100&fit=crop', verified: true, completedOrders: 1050 },
];

export default function PlaceOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTailor = searchParams.get('tailor') || '';
  const preselectedStyle = searchParams.get('style') || '';

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [tailorSearch, setTailorSearch] = useState('');
  const [form, setForm] = useState({
    tailorId: preselectedTailor,
    styleId: preselectedStyle,
    title: preselectedStyle ? (marketplaceStyles.find(s => s.id === preselectedStyle)?.title || '') : '',
    description: '',
    budget: '',
    dueDate: '',
    referenceImages: [],
    measurementNote: '',
    fabricPreference: '',
  });

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const selectedTailor = tailorOptions.find(t => t.id === form.tailorId);
  const selectedStyle = marketplaceStyles.find(s => s.id === form.styleId);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 2 * 1024 * 1024);
    const newImages = validFiles.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    set('referenceImages', [...form.referenceImages, ...newImages].slice(0, 4));
  };

  const removeImage = (index) => {
    set('referenceImages', form.referenceImages.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (step === 1) return form.tailorId && form.title;
    if (step === 2) return form.description;
    return true;
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
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
            Your order has been sent to {selectedTailor?.name || 'the tailor'}. They'll respond with a quote soon.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/messages/' + (form.tailorId || '1'))}
              className="w-full py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition"
            >
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

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-heading font-bold text-gray-900">Place Order</h1>
          <p className="text-xs text-gray-400">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-gold-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: What & Who */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              {/* Recent Tailors */}
              <label className="block text-xs font-semibold text-gray-500 mb-2">Recent Tailors</label>
              <div className="space-y-2 mb-4">
                {tailorOptions
                  .filter(t => recentTailorIds.includes(t.id))
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => { set('tailorId', t.id); setTailorSearch(''); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition ${
                        form.tailorId === t.id
                          ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-400/20'
                          : 'border-gray-200 bg-white hover:border-gold-200'
                      }`}
                    >
                      <img src={t.image} alt={t.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                          {t.verified && <VerifiedBadge size={14} />}
                          <LevelBadge completedOrders={t.completedOrders} compact />
                        </div>
                        <p className="text-xs text-gray-400">{t.username} · {t.specialty}</p>
                      </div>
                      {form.tailorId === t.id && (
                        <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
              </div>

              {/* Search for more tailors */}
              <label className="block text-xs font-semibold text-gray-500 mb-2">Find More Tailors</label>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={tailorSearch}
                  onChange={(e) => setTailorSearch(e.target.value)}
                  placeholder="Search by name or @username"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
                {tailorSearch && (
                  <button onClick={() => setTailorSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5">
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Search results */}
              {tailorSearch.trim() && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tailorOptions
                    .filter(t => {
                      const q = tailorSearch.toLowerCase();
                      return (t.name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q) || t.specialty.toLowerCase().includes(q));
                    })
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => { set('tailorId', t.id); setTailorSearch(''); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition ${
                          form.tailorId === t.id
                            ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-400/20'
                            : 'border-gray-200 bg-white hover:border-gold-200'
                        }`}
                      >
                        <img src={t.image} alt={t.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                            {t.verified && <VerifiedBadge size={14} />}
                            <LevelBadge completedOrders={t.completedOrders} compact />
                          </div>
                          <p className="text-xs text-gray-400">{t.username} · {t.specialty}</p>
                        </div>
                        {form.tailorId === t.id && (
                          <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  {tailorOptions.filter(t => {
                    const q = tailorSearch.toLowerCase();
                    return t.name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q) || t.specialty.toLowerCase().includes(q);
                  }).length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-400">No tailor found for "{tailorSearch}"</p>
                      <p className="text-xs text-gray-300 mt-1">Try a different name or username</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {preselectedStyle && selectedStyle ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Selected Style</label>
                <div className="flex items-center gap-3 p-3 bg-gold-50 rounded-xl border border-gold-200">
                  <img src={selectedStyle.image} alt={selectedStyle.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedStyle.title}</p>
                    <p className="text-xs text-gold-600 font-medium">₦{selectedStyle.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Order Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g., Ankara Dress for Wedding"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fabric Preference</label>
              <input
                type="text"
                value={form.fabricPreference}
                onChange={(e) => set('fabricPreference', e.target.value)}
                placeholder="e.g., Premium Ankara, Lace, Guinea Brocade"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                placeholder="Describe what you want — style details, colors, embroidery, fit preferences..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reference Images (max 4)</label>
              <div className="grid grid-cols-4 gap-2">
                {form.referenceImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
                {form.referenceImages.length < 4 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gold-300 transition">
                    <Upload size={16} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Measurement Notes</label>
              <textarea
                value={form.measurementNote}
                onChange={(e) => set('measurementNote', e.target.value)}
                rows={2}
                placeholder="Any special fit notes (e.g., 'Slightly loose around waist, my measurements are on file')"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Budget & Timeline */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Budget (₦)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value.replace(/[^0-9,]/g, ''))}
                  placeholder="e.g., 25,000"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Needed By</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-heading font-semibold text-gray-800">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tailor</span>
                  <span className="font-medium text-gray-800">{selectedTailor?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Style</span>
                  <span className="font-medium text-gray-800 truncate max-w-[200px]">{form.title || '—'}</span>
                </div>
                {form.budget && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-medium text-gold-600">₦{form.budget}</span>
                  </div>
                )}
                {form.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-medium text-gray-800">{form.dueDate}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
          >
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => canProceed() && setStep(step + 1)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
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
            className="flex-1 py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
          >
            <Scissors size={16} />
            Submit Order
          </button>
        )}
      </div>
    </div>
  );
}
