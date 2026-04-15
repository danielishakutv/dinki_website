import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, Users, Image, Edit, Settings, LogOut, Sparkles, Briefcase, Star, Clock, Store, ExternalLink, Plus, MessageCircle, Share2, UserPlus } from 'lucide-react';

export default function TailorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [portfolio, setPortfolio] = useState([]);

  // Mock tailor data
  const tailorData = {
    name: 'Aunty Zainab',
    specialty: 'Traditional Ankara',
    email: 'aunty.zainab@example.com',
    phone: '+234 (0)901 234 5678',
    location: 'Ikoyi, Lagos',
    rating: 4.9,
    reviews: 324,
    earnings: '₦245,500',
    activeJobs: 5,
    totalCustomers: 28,
  };

  // Active jobs/orders
  const activeJobs = [
    {
      id: 1,
      customer: 'Adeola Okafor',
      design: 'Ankara Dress',
      dueDate: '2026-04-15',
      amount: '₦12,000',
      status: 'In Progress',
      progress: 65,
      image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=200&h=200&fit=crop',
    },
    {
      id: 2,
      customer: 'Chioma Nwankwo',
      design: 'Traditional Wrapper Set',
      dueDate: '2026-04-20',
      amount: '₦8,500',
      status: 'In Progress',
      progress: 40,
      image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=200&h=200&fit=crop',
    },
    {
      id: 3,
      customer: 'Blessing Adeyemi',
      design: 'Luxury Aso Ebi',
      dueDate: '2026-04-25',
      amount: '₦18,000',
      status: 'Pending',
      progress: 5,
      image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=200&h=200&fit=crop',
    },
  ];

  // Earnings data
  const earnings = [
    { id: 1, customer: 'Adeola Okafor', amount: '₦12,000', date: '2026-03-28', status: 'Completed', design: 'Ankara Dress' },
    { id: 2, customer: 'Ngozi Obi', amount: '₦15,500', date: '2026-03-25', status: 'Completed', design: 'Agbada Suit' },
    { id: 3, customer: 'Favour Akosile', amount: '₦9,800', date: '2026-03-22', status: 'Completed', design: 'Wrapper & Blouse' },
    { id: 4, customer: 'Amara Ejim', amount: '₦6,200', date: '2026-03-18', status: 'Pending', design: 'Casual Wear' },
  ];

  // Customers
  const customers = [
    { id: 1, name: 'Adeola Okafor', orders: 3, totalSpent: '₦32,500', rating: 5, image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop' },
    { id: 2, name: 'Ngozi Obi', orders: 2, totalSpent: '₦21,000', rating: 4.8, image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=100&h=100&fit=crop' },
    { id: 3, name: 'Chioma Nwankwo', orders: 1, totalSpent: '₦8,500', rating: 5, image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=100&h=100&fit=crop' },
    { id: 4, name: 'Blessing Adeyemi', orders: 4, totalSpent: '₦45,200', rating: 4.9, image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=100&h=100&fit=crop' },
  ];

  // Portfolio samples
  const portfolioSamples = [
    { id: 1, design: 'Ankara Dress', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=400&fit=crop', rating: 4.9 },
    { id: 2, design: 'Traditional Agbada', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=400&h=400&fit=crop', rating: 4.8 },
    { id: 3, design: 'Luxury Wrapper Set', image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=400&h=400&fit=crop', rating: 4.9 },
    { id: 4, design: 'Aso Ebi Premium', image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=400&h=400&fit=crop', rating: 5.0 },
  ];

  const handleSignOut = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cloud to-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8">
        {/* Header with Profile */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 sm:gap-0 mb-6 sm:mb-8"
        >
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Welcome back, {tailorData.name.split(' ')[0]}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">{tailorData.specialty} • {tailorData.location}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/tailor/1')}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 bg-gold-500 text-white rounded-lg sm:rounded-xl transition hover:bg-gold-600 text-xs sm:text-sm font-medium shadow-sm shadow-gold-500/15"
              title="View My Storefront"
            >
              <Store size={16} />
              <span className="hidden sm:inline">My Storefront</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg sm:rounded-xl transition border border-gray-200"
              title="Profile"
            >
              <Edit size={18} className="text-gray-600 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 sm:p-2.5 hover:bg-red-50 rounded-lg sm:rounded-xl transition border border-red-200"
              title="Sign Out"
            >
              <LogOut size={18} className="text-red-500 sm:w-5 sm:h-5" />
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Rating</p>
              <Star size={16} className="text-yellow-400 sm:w-5 sm:h-5" fill="currentColor" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{tailorData.rating}</p>
            <p className="text-xs text-gray-500">({tailorData.reviews} reviews)</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Jobs</p>
              <Briefcase size={16} className="text-gold-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{tailorData.activeJobs}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Customers</p>
              <Users size={16} className="text-teal-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{tailorData.totalCustomers}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Earnings</p>
              <DollarSign size={16} className="text-green-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-lg sm:text-lg font-bold text-gray-900">{tailorData.earnings}</p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
          <div className="bg-gradient-to-br from-gold-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gold-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gold-700 text-xs sm:text-sm font-medium">Status</p>
              <Sparkles size={16} className="text-gold-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gold-800">Available</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-6 sm:mb-8"
        >
          <button
            onClick={() => navigate('/jobs/new')}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:border-gold-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gold-50 flex items-center justify-center group-hover:bg-gold-100 transition">
              <Plus size={18} className="text-gold-600 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">New Job</span>
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition">
              <MessageCircle size={18} className="text-teal-600 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Messages</span>
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition">
              <UserPlus size={18} className="text-indigo-600 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Add Client</span>
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/tailor/1`;
              if (navigator.share) {
                navigator.share({ title: 'Aunty Zainab — Dinki Africa', text: 'Check out my storefront on Dinki Africa', url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(url).catch(() => {});
              }
            }}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition">
              <Share2 size={18} className="text-green-600 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Share Link</span>
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6 sm:mb-8"
        >
          {['jobs', 'earnings', 'customers', 'portfolio', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all min-h-[40px] sm:min-h-[44px] flex items-center justify-center truncate ${
                activeTab === tab
                  ? 'bg-gold-500 text-white shadow-md shadow-gold-500/25'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gold-200 active:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-4">Active Orders</h2>
            <div className="space-y-3 sm:space-y-4">
              {activeJobs.map((job) => (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <img src={job.image} alt={job.design} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base truncate">{job.design}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">Customer: {job.customer}</p>
                        </div>
                        <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap ${
                          job.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : job.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm text-gray-600">Progress</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-gold-400 to-gold-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Due: <span className="font-medium text-gray-900">{job.dueDate}</span></span>
                        <p className="text-lg font-bold text-gold-600">{job.amount}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={18} className="text-green-500 flex-shrink-0 sm:w-5 sm:h-5" />
              <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Earnings</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-200">
                <p className="text-xs sm:text-sm text-green-700 mb-1">Total Earnings (March 2026)</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">₦245,500</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-700 mb-1">Pending Payouts</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">₦6,200</p>
              </div>
            </div>
            <div className="space-y-3">
              {earnings.map((earning) => (
                <motion.div
                  key={earning.id}
                  whileHover={{ x: 4 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
                >
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-gray-900 text-sm sm:text-base truncate">{earning.design}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{earning.customer} • {earning.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base sm:text-lg font-bold text-green-600">{earning.amount}</p>
                    <p className={`text-xs font-medium ${earning.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {earning.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-4">My Customers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {customers.map((customer) => (
                <motion.div
                  key={customer.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <img src={customer.image} alt={customer.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base truncate">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                        <span className="text-gray-700 text-xs sm:text-sm">{customer.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
                    <p><span className="font-medium text-gray-900">{customer.orders}</span> orders</p>
                    <p>Total spent: <span className="font-medium text-gray-900">{customer.totalSpent}</span></p>
                  </div>
                  <button
                    onClick={() => navigate(`/messages/${customer.id}`)}
                    className="w-full py-2 bg-gold-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gold-600 transition"
                  >
                    Contact
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <div className="flex items-center gap-2">
                <Image size={18} className="text-indigo-500 flex-shrink-0 sm:w-5 sm:h-5" />
                <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Portfolio</h2>
              </div>
              <button
                onClick={() => {
                  const title = prompt('Enter design name:');
                  if (title) {
                    setPortfolio(prev => [{ id: Date.now(), design: title, image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=400&fit=crop', rating: 0 }, ...prev]);
                  }
                }}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gold-600 transition flex-shrink-0"
              >
                + Add Work
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {portfolioSamples.map((work) => (
                <motion.div
                  key={work.id}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 cursor-pointer group"
                >
                  <div className="relative overflow-hidden bg-gray-100 h-32 sm:h-40 md:h-48">
                    <img src={work.image} alt={work.design} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300 flex items-end p-2 sm:p-4">
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-lg">
                        <Star size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                        <span className="text-xs font-bold">{work.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-heading font-bold text-gray-900 mb-2 text-xs sm:text-sm truncate">{work.design}</h3>
                    <button
                      onClick={() => navigate(`/marketplace`)}
                      className="w-full py-2 bg-gold-50 text-gold-700 rounded-lg text-xs font-medium hover:bg-gold-100 transition"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Profile Info */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Full Name</label>
                      <input type="text" defaultValue={tailorData.name} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Specialty</label>
                      <input type="text" defaultValue={tailorData.specialty} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Email Address</label>
                      <input type="email" defaultValue={tailorData.email} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Phone Number</label>
                      <input type="tel" defaultValue={tailorData.phone} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Location</label>
                      <input type="text" defaultValue={tailorData.location} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <button className="w-full py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition">Save Changes</button>
                  </div>
                </div>
              </div>

              {/* Profile Settings */}
              <div>
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={16} className="sm:w-5 sm:h-5" /> Settings
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">Order Alerts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">Payment Updates</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">Marketing</span>
                    </label>
                  </div>
                  <hr className="my-4" />
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 font-medium">ACCOUNT STATUS</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Active & Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
