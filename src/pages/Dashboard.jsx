import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb } from 'lucide-react';
import SummaryCards from '../components/dashboard/SummaryCards';
import RecentActivity from '../components/dashboard/RecentActivity';

export default function Dashboard({ jobs, customers, setShowAddJob }) {
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
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
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
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

    </div>
  );
}
