import React, { useState, useRef } from 'react';
import { Store, ArrowRight, ArrowLeft, Check, Loader2, Camera, Globe, Clock, Award, Rocket, AlertCircle } from 'lucide-react';
import { storefronts as storefrontsApi, uploads as uploadsApi } from '../lib/api';

const RESPONSE_TIMES = [
  'Within 1 hour',
  'Within 24 hours',
  '1-3 days',
  '3-7 days',
];

const STEPS = [
  { title: 'About Your Store', desc: 'Tell customers what makes your craft special' },
  { title: 'Business Details', desc: 'Help customers know what to expect' },
  { title: 'Cover Photo', desc: 'Make your storefront stand out' },
];

export default function StorefrontSetupWizard({ user, slug, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [bio, setBio] = useState('');
  const [customSlug, setCustomSlug] = useState(slug || '');
  const [slugTouched, setSlugTouched] = useState(false);

  // Step 2
  const [startPrice, setStartPrice] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [responseTime, setResponseTime] = useState('');

  // Step 3
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const coverRef = useRef(null);

  const slugValid = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(customSlug) && customSlug.length >= 3 && customSlug.length <= 50;

  const canProceed = () => {
    if (step === 0) return bio.trim().length >= 10 && slugValid;
    if (step === 1) return startPrice && yearsExp !== '' && responseTime;
    return true;
  };

  const handleCoverPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      setError('Image must be under 800KB. Please compress it before uploading.');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      let imageUrl = null;
      if (coverFile) {
        const uploadRes = await uploadsApi.image(coverFile);
        imageUrl = uploadRes.data.url;
      }

      const body = {
        bio: bio.trim(),
        start_price: Math.round(parseFloat(startPrice) * 100),
        years_experience: parseInt(yearsExp),
        response_time: responseTime,
        setup_completed: true,
      };

      if (customSlug !== slug) {
        body.slug = customSlug.toLowerCase();
      }
      if (imageUrl) {
        body.image = imageUrl;
      }

      await storefrontsApi.update(body);
      onComplete(customSlug !== slug ? customSlug.toLowerCase() : null);
    } catch (err) {
      const msg = err.message || 'Failed to save. Please try again.';
      if (msg.includes('Slug already taken')) {
        setStep(0);
        setError('That handle is already taken. Please choose another.');
      } else {
        setError(msg);
      }
    }
    setSaving(false);
  };

  const storeUrl = `dinki.africa/${customSlug.toLowerCase() || slug}`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
            <Store size={24} className="text-gold-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Set Up Your Storefront</h1>
          <p className="text-sm text-gray-500 mt-1.5">Takes less than a minute</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1.5">
              <div className={`h-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-gold-500' : 'bg-gray-200'
              }`} />
              <span className={`text-[10px] font-medium transition-colors ${
                i === step ? 'text-gold-600' : i < step ? 'text-gray-500' : 'text-gray-300'
              }`}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-heading font-semibold text-gray-900 mb-1">{STEPS[step].title}</h2>
          <p className="text-xs text-gray-400 mb-5">{STEPS[step].desc}</p>

          {/* Step 1: About */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Store Handle</label>
                <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20">
                  <span className="px-3 py-2.5 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 flex-shrink-0 select-none">dinki.africa/</span>
                  <input
                    value={customSlug}
                    onChange={(e) => { setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '')); setSlugTouched(true); }}
                    placeholder="your-handle"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none min-w-0"
                    maxLength={50}
                  />
                </div>
                {slugTouched && !slugValid && (
                  <p className="text-xs text-red-500 mt-1">3-50 characters, letters, numbers, and hyphens only</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Store Description
                  <span className="text-gray-300 font-normal ml-1">({bio.trim().length}/2000)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Tell customers about your work, style, and what you specialize in..."
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
                />
                {bio.trim().length > 0 && bio.trim().length < 10 && (
                  <p className="text-xs text-amber-500 mt-1">At least 10 characters</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Business */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Starting Price</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20">
                  <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 flex-shrink-0 font-medium select-none">&#x20A6;</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    placeholder="5,000"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none min-w-0"
                    min="0"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Lowest price you charge for a job</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Years of Experience</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  min="0"
                  max="80"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Response Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {RESPONSE_TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setResponseTime(t)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                        responseTime === t
                          ? 'border-gold-400 bg-gold-50 text-gold-700 ring-1 ring-gold-400/30'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cover */}
          {step === 2 && (
            <div className="space-y-4">
              {!coverPreview ? (
                <label className="flex flex-col items-center justify-center h-44 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gold-300 hover:bg-gold-50/30 transition">
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
                  <Camera size={28} className="text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">Upload a cover photo</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG under 800KB</p>
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-44 object-cover" />
                  <button
                    onClick={removeCover}
                    type="button"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition"
                  >
                    &times;
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">You can always change this later from your storefront</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <button
              onClick={() => { setStep(step - 1); setError(''); }}
              className="px-5 py-3 text-sm font-medium text-gray-500 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => { if (canProceed()) { setStep(step + 1); setError(''); } }}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                canProceed()
                  ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gold-500 text-white hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket size={15} />
                  Launch My Storefront
                </>
              )}
            </button>
          )}
        </div>

        {/* Store URL preview */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Globe size={12} />
          <span>{storeUrl}</span>
        </div>
      </div>
    </div>
  );
}
