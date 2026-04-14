import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, CalendarDays, Bell } from 'lucide-react';
import { statusConfig } from '../../data/mockData';

export default function RecentActivity({ jobs, customers }) {
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
    .slice(0, 3);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  const daysUntilDue = (dateStr) => {
    const due = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gold-500" />
          <h3 className="font-heading font-semibold text-gray-800">Recent Jobs</h3>
        </div>
        <Link
          to="/jobs"
          className="flex items-center gap-1 text-xs font-medium text-gold-500 hover:text-gold-600 transition-colors"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {recentJobs.map((job, i) => {
          const status = statusConfig[job.status];
          const daysLeft = daysUntilDue(job.due_date || job.dueDate);
          const isUrgent = daysLeft <= 3 && daysLeft >= 0;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/jobs/${job.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* Style image placeholder */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                  <status.icon size={20} className="text-gold-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.customer_name || job.customerName}</p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.class}`}>
                    {status.label}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] ${isUrgent ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    <CalendarDays size={10} />
                    {formatDate(job.due_date || job.dueDate)}
                    {isUrgent && <Bell size={10} />}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {recentJobs.length === 0 && (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-400">No jobs yet. Create your first job!</p>
        </div>
      )}
    </div>
  );
}
