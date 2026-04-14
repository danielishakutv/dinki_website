import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, CalendarDays, ChevronRight, Filter, DollarSign, Scissors, Loader2, Trash2, Edit3, MoreVertical, X, AlertTriangle } from 'lucide-react';
import { statusConfig } from '../../data/mockData';

const statusFilters = ['all', 'cutting', 'stitching', 'ready', 'delivered'];

export default function JobList({ jobs, onAddJob, onDeleteJob, onEditJob, loading }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = jobs
    .filter((j) => {
      if (activeFilter !== 'all' && j.status !== activeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          (j.customer_name || j.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(a.due_date || a.dueDate) - new Date(b.due_date || b.dueDate));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntilDue = (dateStr) => {
    const due = new Date(dateStr);
    const now = new Date();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteJob) return;
    setDeleting(true);
    try {
      await onDeleteJob(deleteTarget.id);
    } catch (err) {
      console.error('Failed to delete job:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search & Add */}
      <div className="flex gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAddJob}
          className="btn-touch px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gold-500 hover:bg-gold-600 text-white shadow-sm transition-colors flex-shrink-0"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
        </motion.button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth touch-pan-x">
        {statusFilters.map((filter) => (
          <motion.button
            key={filter}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter)}
            className={`btn-touch px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start min-h-[40px] sm:min-h-[44px] flex items-center justify-center ${
              activeFilter === filter
                ? 'bg-gold-500 text-white shadow-md shadow-gold-500/30'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gold-200 active:bg-gray-50'
            }`}
          >
            {filter === 'all'
              ? `All (${jobs.length})`
              : (() => {
                  const StatusIcon = statusConfig[filter]?.icon;
                  return <>{StatusIcon && <StatusIcon size={13} className="mr-1" />}{statusConfig[filter]?.label || filter} ({jobs.filter((j) => j.status === filter).length})</>;
                })()}
          </motion.button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="space-y-2 sm:space-y-3">
        <AnimatePresence>
          {filtered.map((job, i) => {
            const status = statusConfig[job.status];
            const daysLeft = daysUntilDue(job.due_date || job.dueDate);
            const isUrgent = daysLeft <= 3 && daysLeft >= 0;
            const isOverdue = daysLeft < 0;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="relative">
                <Link
                  to={`/jobs/${job.id}`}
                  className="block bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden"
                >
                  <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                    {/* Style Image Placeholder */}
                    <div className="w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 rounded-lg sm:rounded-xl bg-gradient-to-br from-gold-100 to-amber-50 flex items-center justify-center flex-shrink-0 border border-gold-100">
                      <status.icon size={22} className="text-gold-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{job.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{job.customer_name || job.customerName}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1 sm:w-[18px] sm:h-[18px]" />
                      </div>

                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{job.description}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5 sm:mt-3">
                        <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.class}`}>
                          {status.label}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] ${
                          isOverdue
                            ? 'text-red-500 font-semibold'
                            : isUrgent
                            ? 'text-amber-500 font-semibold'
                            : 'text-gray-400'
                        }`}>
                          <CalendarDays size={10} />
                          {isOverdue ? 'Overdue' : `Due ${formatDate(job.due_date || job.dueDate)}`}
                        </span>
                        {job.invoiced && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-600 inline-flex items-center gap-0.5">
                            <DollarSign size={10} /> Invoiced
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price bar */}
                  <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Price</span>
                    <span className="text-xs sm:text-sm font-heading font-bold text-gray-800">
                      ₦{(job.price || 0).toLocaleString()}
                    </span>
                  </div>
                </Link>

                {/* Action Menu Button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === job.id ? null : job.id); }}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-lg bg-white/90 hover:bg-gray-100 transition-colors z-10 shadow-sm border border-gray-100"
                >
                  <MoreVertical size={14} className="text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {menuOpen === job.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      className="absolute top-10 right-3 sm:top-11 sm:right-4 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden min-w-[140px]"
                    >
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(null); onEditJob?.(job); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 size={14} className="text-gold-500" /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(null); setDeleteTarget(job); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gold-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-3"><Scissors size={40} className="text-gray-300" /></div>
          <p className="text-sm text-gray-400">No jobs match your filter.</p>
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">Delete Job?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
