import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors, Edit3 } from 'lucide-react';
import AddJobForm from './AddJobForm';

export default function AddJobModal({ isOpen, onClose, onSave, customers, editJob }) {
  const isEdit = !!editJob;

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
            <div className="p-6">
              <AddJobForm
                onSave={onSave}
                customers={customers}
                editJob={editJob}
                onCancel={onClose}
                onSuccess={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
