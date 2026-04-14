import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, User, FileText, DollarSign,
  CheckCircle, Circle, Scissors as ScissorsIcon, Loader2,
} from 'lucide-react';
import { statusConfig, measurementFields } from '../data/mockData';
import { jobs as jobsApi, customers as customersApi } from '../lib/api';

const statusFlow = ['cutting', 'stitching', 'ready', 'delivered'];

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const jobRes = await jobsApi.get(id);
      const j = jobRes.data;
      setJob(j);
      if (j?.customer_id) {
        const custRes = await customersApi.get(j.customer_id);
        setCustomer(custRes.data);
      }
    } catch (err) {
      console.error('Failed to load job:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (newStatus) => {
    try {
      await jobsApi.updateStatus(id, newStatus);
      setJob((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleInvoiced = async () => {
    const newVal = !job.invoiced;
    try {
      await jobsApi.toggleInvoice(id, newVal);
      setJob((prev) => prev ? { ...prev, invoiced: newVal } : prev);
    } catch (err) {
      console.error('Failed to toggle invoiced:', err);
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
      {/* Back */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(-1)}
        className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </motion.button>

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
              <h3 className="font-heading font-semibold text-gray-800">Invoice Status</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {job.invoiced ? 'This job has been invoiced' : 'Mark as invoiced when payment is received'}
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
              {measurementFields.slice(0, 6).map((field) => (
                <div key={field.key} className="p-2 rounded-lg bg-gray-50 text-center">
                  <p className="text-[9px] text-gray-400 uppercase">{field.label}</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {customer.measurements?.[field.key] ?? '—'}
                  </p>
                </div>
              ))}
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
    </div>
  );
}
