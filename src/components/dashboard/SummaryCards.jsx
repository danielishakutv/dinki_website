import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, FileText, UserPlus, TrendingUp, ArrowUpRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function SummaryCards({ jobs, customers }) {
  const activeJobs = jobs.filter((j) => j.status !== 'delivered').length;
  const pendingInvoices = jobs.filter((j) => !j.invoiced).length;
  const newCustomers = customers.filter((c) => {
    const created = new Date(c.created_at || c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created >= thirtyDaysAgo;
  }).length;
  const totalRevenue = jobs.filter((j) => j.invoiced).reduce((sum, j) => sum + (j.price || 0), 0);

  const cards = [
    {
      label: 'Active Jobs',
      value: activeJobs,
      icon: Briefcase,
      color: 'from-gold-400 to-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      trend: '+2 this week',
    },
    {
      label: 'Pending Invoices',
      value: pendingInvoices,
      icon: FileText,
      color: 'from-rose-400 to-red-500',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      trend: `₦${(jobs.filter(j => !j.invoiced).reduce((s, j) => s + j.price, 0)).toLocaleString()}`,
    },
    {
      label: 'New Customers',
      value: newCustomers,
      icon: UserPlus,
      color: 'from-teal-400 to-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      trend: 'Last 30 days',
    },
    {
      label: 'Revenue',
      value: `₦${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-blue-400 to-indigo-400',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      trend: 'Invoiced total',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={item}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 card-hover cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon size={20} className={card.text} />
            </div>
            <ArrowUpRight size={16} className="text-gray-300" />
          </div>
          <p className="text-xl md:text-3xl font-heading font-bold text-gray-900 mb-0.5 truncate">
            {card.value}
          </p>
          <p className="text-[10px] md:text-xs text-gray-400 font-medium truncate">{card.label}</p>
          <p className={`text-[10px] mt-2 ${card.text} font-medium truncate`}>{card.trend}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
