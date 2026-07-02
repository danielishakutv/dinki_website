import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react';

const TOUR_KEY = 'dinki_tour_v1_done';

const TOURS = {
  tailor: [
    { title: 'Welcome to Dinki 👋', body: 'This is your dashboard — a quick pulse of your jobs, customers and activity.' },
    { title: 'Add a job in seconds', body: 'Tap “New Job” (or the + button on mobile). You can add a brand-new customer and their measurements right on the same form — no separate steps.' },
    { title: 'Your storefront', body: 'Set up your public storefront so customers can find you. Anything you add shows on the Explore feed automatically.' },
    { title: 'Explore & get inspired', body: 'Browse trending styles, save favourites, and publish your own work to reach more customers.' },
  ],
  customer: [
    { title: 'Welcome to Dinki 👋', body: 'Discover talented tailors and beautiful styles, all in one place.' },
    { title: 'Explore styles', body: 'Browse thousands of looks, like and save your favourites, then order the exact style — made for you.' },
    { title: 'Your measurements', body: 'Save your measurements once and share a single link with any tailor. Find it under “My Measurements”.' },
    { title: 'Track your orders', body: 'Place orders and follow their progress right from your dashboard.' },
  ],
};

export default function OnboardingTour({ role = 'customer' }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) setOpen(true);
    } catch { /* ignore */ }
  }, []);

  const steps = TOURS[role] || TOURS.customer;

  const finish = () => {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  const next = () => (step < steps.length - 1 ? setStep((s) => s + 1) : finish());

  if (!open) return null;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={finish}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center">
              <Sparkles size={18} className="text-gold-600" />
            </div>
            <button onClick={finish} className="text-xs font-medium text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
              Skip <X size={13} />
            </button>
          </div>

          <h2 className="text-lg font-heading font-bold text-gray-900">{current.title}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{current.body}</p>

          {/* dots */}
          <div className="mt-5 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-gold-500' : 'w-1.5 bg-gray-200'}`} />
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 inline-flex items-center gap-1.5">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button onClick={next} className="flex-1 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 inline-flex items-center justify-center gap-1.5">
              {isLast ? 'Got it' : 'Next'} {!isLast && <ArrowRight size={15} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
