import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Star, Heart, MessageCircle, Settings, LogOut, Sparkles, Clock, MoreVertical, Bell, Home, Store, HelpCircle, ChevronRight } from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [savedTailors, setSavedTailors] = useState([]);
  const [showMore, setShowMore] = useState(false);

  const customerData = {
    name: 'Adeola Okafor',
    role: 'Customer',
    email: 'adeola@example.com',
    phone: '+234 (0)901 234 5678',
    location: 'Lagos Island, Lagos',
  };

  const initials = customerData.name.split(' ').map(n => n[0]).join('');

  const nearbyTailors = [
    { id: 1, name: 'Aunty Zainab', specialty: 'Traditional Ankara', rating: 4.9, reviews: 324, distance: '0.8 km', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200&h=200&fit=crop', price: '₦5,000+', responseTime: '2 hours' },
    { id: 2, name: 'Master Chukwu', specialty: 'Agbada Expert', rating: 4.8, reviews: 287, distance: '1.2 km', image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=200&h=200&fit=crop', price: '₦4,500+', responseTime: '1 hour' },
    { id: 3, name: 'Mama Amara', specialty: 'Luxury Aso Ebi', rating: 4.95, reviews: 412, distance: '2.1 km', image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=200&h=200&fit=crop', price: '₦8,000+', responseTime: '3 hours' },
    { id: 4, name: 'Sister Blessing', specialty: 'Modern Trends', rating: 4.7, reviews: 198, distance: '1.5 km', image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=200&h=200&fit=crop', price: '₦3,500+', responseTime: '1 hour' },
  ];

  const orders = [
    { id: 1, type: 'Ankara Dress', tailor: 'Aunty Zainab', amount: '₦12,000', status: 'In Progress', dueDate: '2026-04-15', progress: 65 },
    { id: 2, type: 'Agbada Suit', tailor: 'Master Chukwu', amount: '₦18,500', status: 'Completed', dueDate: '2026-03-28', progress: 100 },
    { id: 3, type: 'Wrapper & Blouse', tailor: 'Mama Amara', amount: '₦9,800', status: 'Pending', dueDate: '2026-04-22', progress: 10 },
  ];

  const featuredStyles = [
    { id: 1, name: 'Ankara Dress', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=400&fit=crop', price: '₦8,000+' },
    { id: 2, name: 'Agbada Suit', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=400&h=400&fit=crop', price: '₦15,000+' },
    { id: 3, name: 'Wrapper & Blouse', image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=400&h=400&fit=crop', price: '₦6,500+' },
    { id: 4, name: 'Aso Ebi Luxury', image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=400&h=400&fit=crop', price: '₦20,000+' },
  ];

  const handleSignOut = () => navigate('/');
  const toggleSaveTailor = (id) => setSavedTailors(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          {/* Profile Section: initials + name + role */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-bold text-base sm:text-lg leading-none">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-heading font-bold text-gray-900 leading-tight truncate">
                {customerData.name}
              </p>
              <span className="text-xs font-medium text-gold-600 bg-gold-50 px-2.5 py-0.5 rounded-full">
                Customer
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="p-2 sm:p-2.5 hover:bg-white rounded-lg sm:rounded-xl transition border border-gray-200 relative">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMore(!showMore)}
                className="p-2 sm:p-2.5 hover:bg-white rounded-lg sm:rounded-xl transition border border-gray-200"
              >
                <MoreVertical size={18} className="text-gray-600" />
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                    onClick={() => setShowMore(false)}
                  >
                    <button className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gold-50 hover:text-gold-600 transition-colors border-b border-gray-100 text-sm font-medium min-h-[44px]">
                      <Settings size={16} className="flex-shrink-0" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gold-50 hover:text-gold-600 transition-colors border-b border-gray-100 text-sm font-medium min-h-[44px]">
                      <HelpCircle size={16} className="flex-shrink-0" />
                      <span>Help</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium min-h-[44px]"
                    >
                      <LogOut size={16} className="flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {showMore && (
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation: Home | Orders | Near Me | Marketplace */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
          {[
            { key: 'home', label: 'Home', icon: Home },
            { key: 'orders', label: 'Orders', icon: ShoppingBag },
            { key: 'near-me', label: 'Near Me', icon: MapPin },
            { key: 'marketplace', label: 'Marketplace', icon: Store },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition flex-shrink-0 min-h-[44px] flex items-center justify-center gap-2 ${
                activeTab === key
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gold-300 active:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>

          {/* HOME TAB — Dashboard */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingBag size={18} className="text-gold-500" />
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Active</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'In Progress').length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Heart size={18} className="text-red-500" fill="currentColor" />
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Saved</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Saved Tailors</p>
                  <p className="text-2xl font-bold text-gray-900">{savedTailors.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <MapPin size={18} className="text-teal-500" />
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Near</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{customerData.location.split(',')[0]}</p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles size={18} className="text-purple-500" fill="currentColor" />
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Member</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-sm font-bold text-gray-900">Premium</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-gray-900">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-gold-600 font-medium flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={13} />
                  </button>
                </div>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{order.type}</p>
                        <p className="text-xs text-gray-500">by {order.tailor}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>{order.status}</span>
                        <span className="text-sm font-bold text-gray-900">{order.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Tailors Preview */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-gray-900">Tailors Near You</h3>
                  <button onClick={() => setActiveTab('near-me')} className="text-xs text-gold-600 font-medium flex items-center gap-1 hover:underline">
                    See all <ChevronRight size={13} />
                  </button>
                </div>
                <div className="space-y-3">
                  {nearbyTailors.slice(0, 2).map((tailor) => (
                    <div key={tailor.id} className="flex items-center gap-3">
                      <img src={tailor.image} alt={tailor.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{tailor.name}</p>
                        <p className="text-xs text-gray-500 truncate">{tailor.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-500">
                        <Star size={11} className="text-yellow-400" fill="currentColor" />
                        {tailor.rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-4">Your Orders</h2>
              {orders.map((order) => (
                <motion.div key={order.id} whileHover={{ y: -2 }} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base">{order.type}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">by {order.tailor}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>{order.status}</span>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm text-gray-600">Due: <span className="font-medium text-gray-900">{order.dueDate}</span></div>
                    <p className="text-lg font-bold text-gray-900">{order.amount}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* NEAR ME TAB */}
          {activeTab === 'near-me' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-teal-500" />
                <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Tailors Near You</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {nearbyTailors.map((tailor) => (
                  <motion.div key={tailor.id} whileHover={{ y: -2 }} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div className="flex gap-3 sm:gap-4">
                      <img src={tailor.image} alt={tailor.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0" />
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
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
                          <span className="flex items-center gap-1 text-gray-700">
                            <Star size={12} className="text-yellow-400" fill="currentColor" />
                            {tailor.rating} ({tailor.reviews})
                          </span>
                          <span className="text-gray-600">{tailor.price}</span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock size={12} /> {tailor.responseTime}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-gold-500 text-white rounded-lg text-xs font-medium hover:bg-gold-600 transition flex items-center justify-center gap-1 min-h-[40px]">
                            <MessageCircle size={13} /> Chat
                          </button>
                          <button
                            onClick={() => toggleSaveTailor(tailor.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition border flex-shrink-0 min-h-[40px] flex items-center justify-center ${
                              savedTailors.includes(tailor.id)
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
                            }`}
                          >
                            <Heart size={13} fill={savedTailors.includes(tailor.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MARKETPLACE TAB */}
          {activeTab === 'marketplace' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 mb-4">
                <Store size={18} className="text-gold-500" />
                <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Marketplace</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {featuredStyles.map((style) => (
                  <motion.div key={style.id} whileHover={{ y: -3 }} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer">
                    <div className="aspect-square overflow-hidden">
                      <img src={style.image} alt={style.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{style.name}</h3>
                      <p className="text-gold-600 font-bold text-sm mt-0.5">{style.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}