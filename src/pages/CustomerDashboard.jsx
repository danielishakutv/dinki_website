import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, Star, Heart, MessageCircle, Edit, Settings, LogOut, Sparkles, Clock, Search } from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [savedTailors, setSavedTailors] = useState([]);

  // Mock customer data
  const customerData = {
    name: 'Adeola Okafor',
    email: 'adeola@example.com',
    phone: '+234 (0)901 234 5678',
    location: 'Lagos Island, Lagos',
    orders: 3,
    savedTailors: 5,
  };

  // Nearby tailors data
  const nearbyTailors = [
    {
      id: 1,
      name: 'Aunty Zainab',
      specialty: 'Traditional Ankara',
      rating: 4.9,
      reviews: 324,
      distance: '0.8 km',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200&h=200&fit=crop',
      price: '₦5,000+',
      responseTime: '2 hours',
    },
    {
      id: 2,
      name: 'Master Chukwu',
      specialty: 'Agbada Expert',
      rating: 4.8,
      reviews: 287,
      distance: '1.2 km',
      image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=200&h=200&fit=crop',
      price: '₦4,500+',
      responseTime: '1 hour',
    },
    {
      id: 3,
      name: 'Mama Amara',
      specialty: 'Luxury Aso Ebi',
      rating: 4.95,
      reviews: 412,
      distance: '2.1 km',
      image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=200&h=200&fit=crop',
      price: '₦8,000+',
      responseTime: '3 hours',
    },
    {
      id: 4,
      name: 'Sister Blessing',
      specialty: 'Modern Trends',
      rating: 4.7,
      reviews: 198,
      distance: '1.5 km',
      image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=200&h=200&fit=crop',
      price: '₦3,500+',
      responseTime: '1 hour',
    },
  ];

  // Recent orders data
  const orders = [
    {
      id: 1,
      type: 'Ankara Dress',
      tailor: 'Aunty Zainab',
      amount: '₦12,000',
      status: 'In Progress',
      dueDate: '2026-04-15',
      progress: 65,
    },
    {
      id: 2,
      type: 'Agbada Suit',
      tailor: 'Master Chukwu',
      amount: '₦18,500',
      status: 'Completed',
      dueDate: '2026-03-28',
      progress: 100,
    },
    {
      id: 3,
      type: 'Wrapper & Blouse',
      tailor: 'Mama Amara',
      amount: '₦9,800',
      status: 'Pending',
      dueDate: '2026-04-22',
      progress: 10,
    },
  ];

  // Marketplace featured styles
  const featuredStyles = [
    { id: 1, name: 'Ankara Dress', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=400&fit=crop', price: '₦8,000+' },
    { id: 2, name: 'Agbada Suit', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=400&h=400&fit=crop', price: '₦15,000+' },
    { id: 3, name: 'Wrapper & Blouse', image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=400&h=400&fit=crop', price: '₦6,500+' },
    { id: 4, name: 'Aso Ebi Luxury', image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=400&h=400&fit=crop', price: '₦20,000+' },
  ];

  const handleSignOut = () => {
    navigate('/');
  };

  const toggleSaveTailor = (id) => {
    setSavedTailors(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
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
              Welcome back, {customerData.name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Find and book your perfect tailor</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
          className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Orders</p>
              <ShoppingBag size={16} className="text-gold-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{customerData.orders}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Saved Tailors</p>
              <Heart size={16} className="text-red-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{customerData.savedTailors}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Location</p>
              <MapPin size={16} className="text-teal-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Lagos Island</p>
          </div>
          <div className="bg-gradient-to-br from-gold-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gold-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gold-700 text-xs sm:text-sm font-medium">Pro Member</p>
              <Sparkles size={16} className="text-gold-500 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gold-800">Active ✨</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide"
        >
          {['marketplace', 'nearby', 'orders', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab
                  ? 'bg-gold-500 text-white shadow-sm shadow-gold-500/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gold-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-4">Browse Styles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredStyles.map((style) => (
                <motion.div
                  key={style.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 cursor-pointer"
                >
                  <div className="relative overflow-hidden bg-gray-100 h-40 sm:h-48 md:h-56">
                    <img src={style.image} alt={style.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-heading font-bold text-gray-900 mb-1 text-sm sm:text-base">{style.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">Starting from {style.price}</p>
                    <button className="w-full py-2 bg-gold-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gold-600 transition">
                      Browse
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Nearby Tailors Tab */}
        {activeTab === 'nearby' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-teal-500 flex-shrink-0 sm:w-5 sm:h-5" />
              <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Tailors Near You</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {nearbyTailors.map((tailor) => (
                <motion.div
                  key={tailor.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <img src={tailor.image} alt={tailor.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base truncate">{tailor.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{tailor.specialty}</p>
                        </div>
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 sm:px-3 py-1 rounded-lg font-medium flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                          <MapPin size={12} /> {tailor.distance}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm mb-3 flex-wrap">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Star size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                          {tailor.rating} ({tailor.reviews})
                        </span>
                        <span className="text-gray-600">{tailor.price}</span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock size={12} className="flex-shrink-0" /> {tailor.responseTime}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-gold-500 text-white rounded-lg text-xs font-medium hover:bg-gold-600 transition flex items-center justify-center gap-1">
                          <MessageCircle size={13} /> Chat
                        </button>
                        <button
                          onClick={() => toggleSaveTailor(tailor.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition border flex-shrink-0 ${
                            savedTailors.includes(tailor.id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
                          }`}
                        >
                          <Heart size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-4">Your Orders</h2>
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base">{order.type}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">by {order.tailor}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap ${
                      order.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm text-gray-600">Progress</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{order.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-gold-400 to-gold-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${order.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-gray-600">
                      Due: <span className="font-medium text-gray-900">{order.dueDate}</span>
                    </div>
                    <p className="text-lg sm:text-lg font-bold text-gray-900">{order.amount}</p>
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
                      <input type="text" defaultValue={customerData.name} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Email Address</label>
                      <input type="email" defaultValue={customerData.email} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Phone Number</label>
                      <input type="tel" defaultValue={customerData.phone} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Location</label>
                      <input type="text" defaultValue={customerData.location} className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500" />
                    </div>
                    <button className="w-full py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition">Save Changes</button>
                  </div>
                </div>
              </div>

              {/* Profile Settings */}
              <div>
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={18} /> Settings
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">SMS Updates</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-700">Marketing</span>
                    </label>
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
