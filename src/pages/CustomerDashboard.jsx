import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, Star, Heart, MessageCircle, Sparkles, Clock, Store, ChevronRight } from 'lucide-react';

export default function CustomerDashboard({ tab = 'home' }) {
  const navigate = useNavigate();
  const [savedTailors, setSavedTailors] = useState([]);

  const customerData = {
    name: 'Adeola Okafor',
    location: 'Lagos Island, Lagos',
  };

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

  const toggleSaveTailor = (id) => setSavedTailors(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

          {/* HOME TAB */}
          {tab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* Greeting */}
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                  Hello, {customerData.name.split(' ')[0]}
                </h1>
                <p className="text-sm text-gray-400 mt-1">Find tailors, track orders, and explore styles.</p>
              </div>

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
                  <button onClick={() => navigate('/orders')} className="text-xs text-gold-600 font-medium flex items-center gap-1 hover:underline">
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
                  <button onClick={() => navigate('/near-me')} className="text-xs text-gold-600 font-medium flex items-center gap-1 hover:underline">
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
          {tab === 'orders' && (
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
          {tab === 'near-me' && (
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

    </div>
  );
}