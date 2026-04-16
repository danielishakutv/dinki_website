import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, CalendarDays, Scissors, AlertCircle, Loader2, MessageCircle, AtSign, Copy, Check } from 'lucide-react';

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 3) + '***' + phone.slice(-3);
}

function maskEmail(email) {
  if (!email) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length <= 2 ? local[0] + '***' : local.slice(0, 2) + '***';
  return masked + '@' + domain;
}
import MeasurementVault from '../components/customers/MeasurementVault';
import { customers as customersApi, jobs as jobsApi, conversations as convoApi } from '../lib/api';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: custRes, loading: custLoading, refresh: refreshCust } = useApi(
    `customer-${id}`, () => customersApi.get(id), { ttl: TTL.long }
  );
  const { data: jobsRes, loading: jobsLoading } = useApi(
    `customer-${id}-jobs`, () => jobsApi.list({ customer_id: id, limit: 50 }), { ttl: TTL.medium }
  );

  const customer = custRes?.data || null;
  const customerJobs = jobsRes?.data && Array.isArray(jobsRes.data) ? jobsRes.data : [];
  const loading = custLoading || jobsLoading;
  const [startingChat, setStartingChat] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUsername = () => {
    if (!customer?.username) return;
    navigator.clipboard.writeText(customer.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMessageCustomer = async () => {
    if (!customer?.user_id || startingChat) return;
    setStartingChat(true);
    try {
      const res = await convoApi.start({ participant_id: customer.user_id });
      const conversationId = res.data?.conversation?.id || res.data?.id;
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

  const handleSaveMeasurements = async (newMeasurements) => {
    try {
      await customersApi.updateMeasurements(id, newMeasurements);
      invalidateCache(`customer-${id}`, 'customers');
      refreshCust();
    } catch (err) {
      console.error('Failed to save measurements:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 md:p-8 text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-400">Customer not found.</p>
        <Link to="/customers" className="text-gold-500 text-sm mt-2 inline-block">
          Back to customers
        </Link>
      </div>
    );
  }

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
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-2xl border-4 border-white shadow-lg"
            style={{ backgroundColor: customer.avatar_color || '#D4A574' }}
          >
            {customer.initials || '?'}
          </div>

          <div className="mt-3 min-w-0">
            <h2 className="text-xl font-heading font-bold text-gray-900 break-words">{customer.name}</h2>
            {customer.username && (
              <button
                onClick={copyUsername}
                className="flex items-center gap-1.5 mt-0.5 text-sm text-gold-500 font-medium hover:text-gold-600 transition-colors"
              >
                <AtSign size={14} />
                {customer.username}
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-gray-300" />}
              </button>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Phone size={12} className="flex-shrink-0" /> <span className="truncate">{maskPhone(customer.phone)}</span>
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                  <Mail size={12} className="flex-shrink-0" /> <span className="truncate">{maskEmail(customer.email)}</span>
                </span>
              )}
              {customer.location && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin size={12} className="flex-shrink-0" /> <span className="truncate">{customer.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                <CalendarDays size={12} className="flex-shrink-0" /> Since {new Date(customer.created_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {customer.user_id && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMessageCustomer}
                disabled={startingChat}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-50 text-gold-600 hover:bg-gold-100 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {startingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                Message
              </motion.button>
            )}
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
                  <p className="text-xs text-gray-400">Due: {new Date(job.due_date || job.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</p>
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
