import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, CalendarDays, Scissors, AlertCircle } from 'lucide-react';
import MeasurementVault from '../components/customers/MeasurementVault';

export default function CustomerDetail({ customers, setCustomers, jobs }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="p-4 md:p-8 text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-400">Customer not found.</p>
        <Link to="/customers" className="text-gold-500 text-sm mt-2 inline-block">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const customerJobs = jobs.filter((j) => j.customerId === customer.id);

  const handleSaveMeasurements = (newMeasurements) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id ? { ...c, measurements: newMeasurements } : c
      )
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(-1)}
        className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </motion.button>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Header Banner */}
        <div className="h-24 md:h-32 bg-gradient-to-r from-[#1B1F3B] to-[#2D325A] relative">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <pattern id="africanPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#africanPattern)" />
            </svg>
          </div>
        </div>

        <div className="px-5 pb-5 -mt-10 relative z-10">
          {/* Avatar */}
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${customer.color} flex items-center justify-center text-white font-heading font-bold text-2xl border-4 border-white shadow-lg`}
          >
            {customer.initials}
          </div>

          <div className="mt-3 min-w-0">
            <h2 className="text-xl font-heading font-bold text-gray-900 break-words">{customer.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Phone size={12} className="flex-shrink-0" /> <span className="truncate">{customer.phone}</span>
              </span>
              {customer.email && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                  <Mail size={12} className="flex-shrink-0" /> <span className="truncate">{customer.email}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <MapPin size={12} className="flex-shrink-0" /> <span className="truncate">{customer.location}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                <CalendarDays size={12} className="flex-shrink-0" /> Since {new Date(customer.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Measurement Vault */}
      <MeasurementVault
        measurements={customer.measurements}
        onSave={handleSaveMeasurements}
      />

      {/* Customer's Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scissors size={18} className="text-gold-500" />
          <h3 className="font-heading font-semibold text-gray-800">Orders</h3>
          <span className="ml-auto text-xs text-gray-400">{customerJobs.length} total</span>
        </div>

        {customerJobs.length > 0 ? (
          <div className="space-y-2">
            {customerJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
                  <Scissors size={16} className="text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400">Due: {new Date(job.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold status-${job.status}`}>
                  {job.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No orders yet for this customer.</p>
        )}
      </div>
    </div>
  );
}
