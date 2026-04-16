import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, User, MapPin, ChevronRight, Check, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { users as usersApi } from '../lib/api';

const tailorSpecialties = ['Agbada', 'Kaftan', 'Ankara', 'Aso Ebi', 'Lace', 'Embroidery', 'Bridal', 'Corporate Wear', 'Senator', 'Wrapper & Blouse'];
const customerPreferences = ['Ankara Dresses', 'Agbada', 'Kaftan', 'Aso-Oke', 'Lace Styles', 'Corporate Wear', 'Casual Wear', 'Bridal', 'Event Wear', 'Evening Gowns'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const role = user?.role || 'customer';
  const isTailor = role === 'tailor';

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [form, setForm] = useState({
    displayName: user?.name || '',
    location: '',
    bio: '',
    specialties: [],
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleSpecialty = (item) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(item)
        ? prev.specialties.filter(s => s !== item)
        : [...prev.specialties, item],
    }));
  };

  const canProceed = () => {
    if (step === 1) return form.displayName.trim().length >= 2;
    if (step === 2) return form.location.trim();
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const locationParts = form.location.split(',').map(s => s.trim());
      const body = {
        name: form.displayName.trim(),
        location_city: locationParts[0] || form.location.trim(),
        location_state: locationParts[1] || '',
      };
      if (form.specialties.length > 0) body.specialties = form.specialties;

      await usersApi.completeOnboarding(body);

      // Also update bio and phone if provided
      const profileUpdate = {};
      if (form.bio.trim()) profileUpdate.bio = form.bio.trim();
      if (form.phone.trim()) profileUpdate.phone = form.phone.trim();
      if (Object.keys(profileUpdate).length > 0) {
        await usersApi.updateProfile(profileUpdate);
      }

      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cloud to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
            <Scissors size={16} className="text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-gray-900">Dinki Africa</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-gold-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Name & Bio */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center">
                  <User size={18} className="text-gold-600" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">
                    {isTailor ? 'Set up your shop' : 'Tell us about you'}
                  </h2>
                  <p className="text-xs text-gray-400">Step 1 of {totalSteps}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {isTailor ? 'Business / Display Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => set('displayName', e.target.value)}
                    placeholder={isTailor ? 'e.g., Dinki Atelier' : 'e.g., Adeola Okafor'}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => set('bio', e.target.value)}
                    rows={3}
                    placeholder={isTailor ? 'Tell customers about your craft...' : 'Tell tailors about your style...'}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <MapPin size={18} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Where are you based?</h2>
                  <p className="text-xs text-gray-400">Step 2 of {totalSteps}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="e.g., Victoria Island, Lagos"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {isTailor
                      ? 'Your location helps customers find you. You can update this anytime.'
                      : 'Your location helps us show you nearby tailors and relevant styles.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Specialties/Preferences */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles size={18} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">
                    {isTailor ? 'Your specialties' : 'Style preferences'}
                  </h2>
                  <p className="text-xs text-gray-400">Step 3 of {totalSteps} — select all that apply</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(isTailor ? tailorSpecialties : customerPreferences).map(item => (
                  <button
                    key={item}
                    onClick={() => toggleSpecialty(item)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                      form.specialties.includes(item)
                        ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                canProceed()
                  ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? 'Setting up...' : 'Get Started'}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-500 text-center">{error}</p>
        )}

        {/* Skip */}
        <button
          onClick={async () => {
            setSaving(true);
            try {
              await usersApi.completeOnboarding({
                name: form.displayName.trim() || user?.name || 'User',
                location_city: form.location.trim() || 'Not set',
                location_state: '',
              });
              await refreshProfile();
              navigate('/dashboard', { replace: true });
            } catch {
              navigate('/dashboard', { replace: true });
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition text-center"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
