import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb, Plus, MessageCircle, UserPlus, Share2, Loader2 } from 'lucide-react';
import SummaryCards from '../components/dashboard/SummaryCards';
import RecentActivity from '../components/dashboard/RecentActivity';
import { jobs as jobsApi, customers as customersApi } from '../lib/api';

export default function Dashboard({ setShowAddJob }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, custRes] = await Promise.all([
          jobsApi.list({ limit: 50 }),
          customersApi.list({ limit: 50 }),
        ]);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gold-500" />
        </div>
      ) : (
      <>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
            {getGreeting()}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Here's what's happening with your tailoring business today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-50 to-amber-50 border border-gold-200/50">
          <Sparkles size={16} className="text-gold-500" />
          <span className="text-xs font-medium text-gold-700">
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <SummaryCards jobs={jobs} customers={customers} />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3"
      >
        <button
          onClick={() => setShowAddJob(true)}
          className="hidden md:flex bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm hover:border-gold-200 hover:shadow-md transition-all flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gold-50 flex items-center justify-center group-hover:bg-gold-100 transition">
            <Plus size={20} className="text-gold-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">New Job</span>
        </button>
        <button
          onClick={() => navigate('/messages')}
          className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition">
            <MessageCircle size={20} className="text-teal-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Messages</span>
        </button>
        <button
          onClick={() => navigate('/customers')}
          className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition">
            <UserPlus size={20} className="text-indigo-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Add Client</span>
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/tailor/1`;
            if (navigator.share) {
              navigator.share({ title: 'Dinki Africa', text: 'Check out my storefront on Dinki Africa', url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url).catch(() => {});
            }
          }}
          className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all flex flex-col items-center gap-2.5 group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition">
            <Share2 size={20} className="text-green-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Share Link</span>
        </button>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity jobs={jobs} customers={customers} />
        </div>

        {/* Quick Stats / Tips */}
        <div className="space-y-4">
          {/* Top Customer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Top Customers</h3>
            <div className="space-y-3">
              {customers.slice(0, 3).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.avatar_color || '#D4A574' }}>
                    {c.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.location}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tip Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#1B1F3B] to-[#2D325A] rounded-2xl p-5 text-white"
          >
            <p className="text-xs font-medium text-gold-400 mb-1 flex items-center gap-1"><Lightbulb size={12} /> Pro Tip</p>
            <p className="text-sm leading-relaxed text-gray-300">
              Record measurements right after a fitting session while they're fresh. Use the Quick Action button to save time!
            </p>
          </motion.div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
