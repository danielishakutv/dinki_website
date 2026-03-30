import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Scissors, Ruler } from 'lucide-react';

export default function QuickAction({ onAddJob, onRecordMeasurement }) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Add New Job',
      icon: Scissors,
      color: 'bg-gold-500 hover:bg-gold-600',
      action: () => {
        setIsOpen(false);
        onAddJob?.();
      },
    },
    {
      label: 'Record Measurement',
      icon: Ruler,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => {
        setIsOpen(false);
        onRecordMeasurement?.();
      },
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
              onClick={() => setIsOpen(false)}
            />
            {/* Action buttons */}
            <div className="absolute bottom-16 right-0 z-40 flex flex-col gap-3 items-end">
              {actions.map((act, i) => (
                <motion.button
                  key={act.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={act.action}
                  className={`flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl text-white font-medium text-sm shadow-lg ${act.color} btn-touch`}
                >
                  <act.icon size={18} />
                  {act.label}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative z-40 w-14 h-14 rounded-2xl bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/30 flex items-center justify-center transition-colors"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </motion.div>
      </motion.button>
    </div>
  );
}
