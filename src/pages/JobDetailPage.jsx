import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, User, FileText, DollarSign,
  CheckCircle, Circle, Scissors as ScissorsIcon,
} from 'lucide-react';
import { statusConfig, measurementFields } from '../data/mockData';

const statusFlow = ['cutting', 'stitching', 'ready', 'delivered'];

export default function JobDetailPage({ jobs, setJobs, customers }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="p-4 md:p-8 text-center py-20">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-gray-400">Job not found.</p>
        <Link to="/jobs" className="text-gold-500 text-sm mt-2 inline-block">← Back to jobs</Link>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === job.customerId);
  const status = statusConfig[job.status];
  const currentStatusIndex = statusFlow.indexOf(job.status);

  const updateStatus = (newStatus) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
  };

  const toggleInvoiced = () => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, invoiced: !j.invoiced } : j)));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

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
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">
                {job.title}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{job.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.class} flex-shrink-0`}>
              {status.emoji} {status.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} className="text-gray-400" />
              <Link to={`/customers/${job.customerId}`} className="text-gold-500 hover:underline">
                {job.customerName}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays size={16} className="text-gray-400" />
              Due: {formatDate(job.dueDate)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign size={16} className="text-gray-400" />
              ₦{job.price.toLocaleString()}
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
        <div className="flex items-center gap-2 md:gap-4">
          {statusFlow.map((s, i) => {
            const sc = statusConfig[s];
            const isCompleted = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;

            return (
              <React.Fragment key={s}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateStatus(s)}
                  className={`flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-xl flex-1 transition-all ${
                    isCurrent
                      ? 'bg-gold-50 border-2 border-gold-300'
                      : isCompleted
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <span className="text-lg">{sc.emoji}</span>
                  <span className={`text-[10px] md:text-xs font-medium ${
                    isCurrent ? 'text-gold-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
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
                    {customer.measurements[field.key] ?? '—'}
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
