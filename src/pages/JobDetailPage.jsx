import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, User, FileText, DollarSign,
  CheckCircle, Circle, Scissors as ScissorsIcon, Loader2,
  Edit3, Trash2, AlertTriangle, MessageCircle,
} from 'lucide-react';
import { statusConfig, measurementFields } from '../data/mockData';
import { jobs as jobsApi, customers as customersApi, conversations as convoApi } from '../lib/api';
import { useApi, useApiMulti, invalidateCache, TTL } from '../hooks/useApi';
import AddJobModal from '../components/jobs/AddJobModal';

const statusFlow = ['cutting', 'stitching', 'ready', 'delivered'];

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const { data: jobRes, loading: jobLoading, refresh: refreshJob } = useApi(
    `job-${id}`, () => jobsApi.get(id), { ttl: TTL.long }
  );
  const { data: custListRes } = useApi(
    'customers-list', () => customersApi.list({ limit: 100 }), { ttl: TTL.medium }
  );

  const job = jobRes?.data || null;
  const rawCust = custListRes?.data;
  const customers = Array.isArray(rawCust) ? rawCust : Array.isArray(rawCust?.customers) ? rawCust.customers : [];

  const { data: custRes } = useApi(
    job?.customer_id ? `customer-${job.customer_id}` : null,
    () => customersApi.get(job.customer_id),
    { ttl: TTL.long }
  );
  const customer = custRes?.data || null;
  const loading = jobLoading;

  const updateStatus = async (newStatus) => {
    try {
      await jobsApi.updateStatus(id, newStatus);
      invalidateCache(`job-${id}`, 'jobs');
      refreshJob();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleInvoiced = async () => {
    const newVal = !job.invoiced;
    try {
      await jobsApi.toggleInvoice(id, newVal);
      invalidateCache(`job-${id}`, 'jobs');
      refreshJob();
    } catch (err) {
      console.error('Failed to toggle invoiced:', err);
    }
  };

  const handleEditSave = async (payload) => {
    await jobsApi.update(id, payload);
    invalidateCache(`job-${id}`, 'jobs', 'customers');
    refreshJob();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await jobsApi.delete(id);
      invalidateCache('jobs');
      navigate('/jobs', { replace: true });
    } catch (err) {
      console.error('Failed to delete job:', err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMessageCustomer = async () => {
    if (!customer?.user_id || startingChat) return;
    setStartingChat(true);
    try {
      const res = await convoApi.start({ participant_id: customer.user_id });
      const conversationId = res.data?.id;
      if (conversationId) {
        invalidateCache('conversations');
        navigate(`/messages/${conversationId}`);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setStartingChat(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 md:p-8 text-center py-20">
        <p className="text-gray-400">Job not found.</p>
        <Link to="/jobs" className="text-gold-500 text-sm mt-2 inline-block">Back to jobs</Link>
      </div>
    );
  }

  const status = statusConfig[job.status] || statusConfig.cutting;
  const currentStatusIndex = statusFlow.indexOf(job.status);
  const custId = job.customer_id || job.customerId;
  const custName = job.customer_name || job.customerName || customer?.name || 'Customer';
  const dueDate = job.due_date || job.dueDate;
  const price = job.price || 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </motion.button>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditModal(true)}
            className="btn-touch flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-50 text-gold-600 hover:bg-gold-100 text-sm font-medium transition-colors"
          >
            <Edit3 size={15} /> Edit
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-touch flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 text-sm font-medium transition-colors"
          >
            <Trash2 size={15} /> Delete
          </motion.button>
        </div>
      </div>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Top Accent */}
        <div className="h-2 bg-gradient-to-r from-gold-400 to-amber-500" />

        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900 break-words">
                {job.title}
              </h1>
              <p className="text-sm text-gray-400 mt-1 break-words">{job.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.class} flex-shrink-0 inline-flex items-center gap-1`}>
              <status.icon size={12} /> {status.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} className="text-gray-400" />
              <Link to={`/customers/${custId}`} className="text-gold-500 hover:underline">
                {custName}
              </Link>
              {customer?.user_id && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMessageCustomer}
                  disabled={startingChat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-50 text-gold-600 hover:bg-gold-100 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {startingChat ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                  Message
                </motion.button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays size={16} className="text-gray-400" />
              Due: {formatDate(dueDate)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign size={16} className="text-gray-400" />
              ₦{Number(price).toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6"
      >
        <h3 className="font-heading font-semibold text-gray-800 mb-4">Progress</h3>

        {/* Desktop: horizontal stepper */}
        <div className="hidden md:flex items-center gap-4">
          {statusFlow.map((s, i) => {
            const sc = statusConfig[s];
            const isCompleted = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;

            return (
              <React.Fragment key={s}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateStatus(s)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl flex-1 min-w-0 transition-all ${
                    isCurrent
                      ? 'bg-gold-50 border-2 border-gold-300'
                      : isCompleted
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <sc.icon size={20} className={isCompleted ? (isCurrent ? 'text-gold-600' : 'text-emerald-600') : 'text-gray-400'} />
                  <span className={`text-xs font-medium ${isCurrent ? 'text-gold-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {sc.label}
                  </span>
                  {isCompleted ? (
                    <CheckCircle size={14} className="text-emerald-500" />
                  ) : (
                    <Circle size={14} className="text-gray-300" />
                  )}
                </motion.button>
                {i < statusFlow.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded ${i < currentStatusIndex ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden space-y-0">
          {statusFlow.map((s, i) => {
            const sc = statusConfig[s];
            const isCompleted = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;
            const isLast = i === statusFlow.length - 1;

            return (
              <div key={s} className="flex gap-3">
                {/* Left rail: icon + connector */}
                <div className="flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCurrent
                        ? 'bg-gold-100 ring-2 ring-gold-400 ring-offset-2'
                        : isCompleted
                        ? 'bg-emerald-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <sc.icon size={18} className={isCurrent ? 'text-gold-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'} />
                  </motion.div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[20px] my-1 rounded-full ${i < currentStatusIndex ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>

                {/* Right content: tappable row */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => updateStatus(s)}
                  className={`flex items-center gap-3 flex-1 rounded-xl px-4 py-3 mb-2 text-left transition-all ${
                    isCurrent
                      ? 'bg-gold-50 border-2 border-gold-300 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-50/60 border border-emerald-200'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-gold-700' : isCompleted ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {sc.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isCurrent ? 'text-gold-500' : isCompleted ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {isCurrent ? 'Current stage' : isCompleted ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle size={20} className="text-gray-300 flex-shrink-0" />
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoice Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-gray-800">Payment Status</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {job.invoiced ? 'Paid' : 'Unpaid — mark as paid when payment is received'}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleInvoiced}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                job.invoiced ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: job.invoiced ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Linked Measurements */}
        {customer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Linked Measurements</h3>
            <div className="grid grid-cols-3 gap-2">
              {measurementFields.map((field) => {
                const val = customer.measurements?.standard?.[field.key];
                return (
                  <div key={field.key} className="p-2 rounded-lg bg-gray-50 text-center">
                    <p className="text-[9px] text-gray-400 uppercase">{field.label}</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {val != null ? `${val} ${field.unit}` : '—'}
                    </p>
                  </div>
                );
              })}
              {(customer.measurements?.custom || []).map((field) => {
                const val = customer.measurements?.standard?.[field.key];
                return (
                  <div key={field.key} className="p-2 rounded-lg bg-gray-50 text-center">
                    <p className="text-[9px] text-gray-400 uppercase">{field.label}</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {val != null ? `${val} ${field.unit || 'in'}` : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
            <Link
              to={`/customers/${customer.id}`}
              className="block mt-3 text-xs text-center text-gold-500 hover:underline"
            >
              View full measurements →
            </Link>
          </motion.div>
        )}
      </div>

      {/* Edit Job Modal */}
      <AddJobModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        customers={customers}
        editJob={job}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
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
                Are you sure you want to delete <strong>"{job.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
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
