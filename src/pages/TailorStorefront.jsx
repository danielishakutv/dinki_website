import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Clock, Scissors, MessageCircle, Heart, ChevronLeft, Share2, Image, ShoppingBag, Award, Edit3, Plus, Trash2, Settings, Eye, Link2, X } from 'lucide-react';
import { VerifiedBadge, LevelBadge } from '../components/TailorBadges';

const tailors = [
  {
    id: '1',
    name: 'Aunty Zainab',
    specialty: 'Traditional Ankara',
    location: 'Ikoyi, Lagos',
    rating: 4.9,
    reviews: 324,
    responseTime: '2 hours',
    startPrice: '5,000',
    bio: 'Award-winning Ankara specialist with 15 years experience. Known for vibrant designs and meticulous hand-finishing. Every piece tells a story.',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=400&h=400&fit=crop',
    verified: true,
    completedJobs: 580,
    specialties: ['Ankara', 'Aso Ebi', 'Wrapper & Blouse', 'Bridal'],
    portfolio: [
      { id: 1, title: 'Ankara Dress', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=500&fit=crop', rating: 4.9 },
      { id: 2, title: 'Aso Ebi Set', image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=400&h=500&fit=crop', rating: 5.0 },
      { id: 3, title: 'Wrapper & Blouse', image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=400&h=500&fit=crop', rating: 4.8 },
      { id: 4, title: 'Modern Ankara', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=500&fit=crop', rating: 4.9 },
    ],
    reviewsList: [
      { id: 1, name: 'Adeola O.', rating: 5, text: 'Absolutely stunning work! My Ankara dress was perfect for the wedding. Will definitely come back.', date: '2 weeks ago' },
      { id: 2, name: 'Blessing A.', rating: 5, text: 'Best tailor in Lagos! Fast delivery with excellent attention to detail.', date: '1 month ago' },
      { id: 3, name: 'Ngozi I.', rating: 4, text: 'Great quality but needed a minor adjustment. She fixed it same day. Very professional.', date: '2 months ago' },
    ],
  },
  {
    id: '2',
    name: 'Master Chukwu',
    specialty: 'Agbada Expert',
    location: 'Victoria Island, Lagos',
    rating: 4.8,
    reviews: 287,
    responseTime: '1 hour',
    startPrice: '4,500',
    bio: 'Master tailor specializing in Agbada, Kaftan, and men\'s traditional wear. Known for precision cuts and premium fabric sourcing.',
    image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=400&h=400&fit=crop',
    verified: true,
    completedJobs: 430,
    specialties: ['Agbada', 'Kaftan', 'Senator', 'Corporate Wear'],
    portfolio: [
      { id: 1, title: 'Grand Agbada', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=400&h=500&fit=crop', rating: 4.9 },
      { id: 2, title: 'Premium Kaftan', image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=400&h=500&fit=crop', rating: 4.8 },
      { id: 3, title: 'Senator Set', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=400&h=500&fit=crop', rating: 5.0 },
    ],
    reviewsList: [
      { id: 1, name: 'Musa A.', rating: 5, text: 'My wedding Agbada was a masterpiece. Everyone was asking who made it!', date: '3 weeks ago' },
      { id: 2, name: 'Ibrahim G.', rating: 5, text: 'Consistent quality every time. Master Chukwu never disappoints.', date: '1 month ago' },
    ],
  },
  {
    id: '3',
    name: 'Mama Amara',
    specialty: 'Luxury Aso Ebi',
    location: 'Ikeja, Lagos',
    rating: 4.95,
    reviews: 412,
    responseTime: '3 hours',
    startPrice: '8,000',
    bio: 'Luxury Aso Ebi specialist serving clients across West Africa. Known for breathtaking embroidery work and custom beading.',
    image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=400&h=400&fit=crop',
    verified: true,
    completedJobs: 720,
    specialties: ['Aso Ebi', 'Lace', 'Embroidery', 'Bridal', 'Event Wear'],
    portfolio: [
      { id: 1, title: 'Luxury Lace Dress', image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=400&h=500&fit=crop', rating: 5.0 },
      { id: 2, title: 'Aso Ebi Premium', image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=400&h=500&fit=crop', rating: 4.9 },
      { id: 3, title: 'Bridal Gown', image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=500&fit=crop', rating: 5.0 },
      { id: 4, title: 'Event Special', image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=400&h=500&fit=crop', rating: 4.9 },
      { id: 5, title: 'Embroidery Kaftan', image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=400&h=500&fit=crop', rating: 4.8 },
    ],
    reviewsList: [
      { id: 1, name: 'Chioma N.', rating: 5, text: 'Mama Amara is the queen of Aso Ebi. My entire bridal party looked incredible!', date: '1 week ago' },
      { id: 2, name: 'Favour A.', rating: 5, text: 'Worth every naira. The embroidery work is on another level.', date: '3 weeks ago' },
      { id: 3, name: 'Amara E.', rating: 5, text: 'I travel from Abuja just for her work. Nobody compares.', date: '2 months ago' },
    ],
  },
];

export default function TailorStorefront({ userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const tailor = tailors.find(t => t.id === id);
  const isOwner = userRole === 'tailor' && id === '1';
  const [activeTab, setActiveTab] = useState('portfolio');
  const [saved, setSaved] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState(tailor?.reviewsList || []);
  const [showCopied, setShowCopied] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(tailor?.bio || '');
  const [specialties, setSpecialties] = useState(tailor?.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [portfolio, setPortfolio] = useState(tailor?.portfolio || []);
  const [showAddWork, setShowAddWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');

  const shareStorefront = async () => {
    const url = `${window.location.origin}/tailor/${id}`;
    const shareData = {
      title: tailor ? `${tailor.name} — Dinki Africa` : 'Dinki Africa',
      text: tailor ? `Check out ${tailor.name} on Dinki Africa — ${tailor.specialty}` : 'Check out this tailor on Dinki Africa',
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  if (!tailor) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Tailor not found.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-gold-600 font-medium text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header Image + Info */}
      <div className="relative h-56 sm:h-60 md:h-72 bg-gradient-to-br from-indigo-900 to-indigo-800 overflow-hidden">
        <img src={tailor.image} alt={tailor.name} className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2.5">
            {isOwner ? (
              <button
                onClick={() => navigate('/profile')}
                className="h-10 px-4 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <Settings size={15} className="text-white" />
                <span className="text-white text-sm font-medium">Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setSaved(!saved)}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
              >
                <Heart size={18} className={saved ? 'text-red-400 fill-red-400' : 'text-white'} />
              </button>
            )}
            <button
              onClick={shareStorefront}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center relative"
            >
              <Share2 size={18} className="text-white" />
              {showCopied && (
                <span className="absolute -bottom-8 right-0 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tailor info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div className="flex items-end gap-4">
            <img src={tailor.image} alt={tailor.name} className="w-18 h-18 md:w-22 md:h-22 rounded-2xl object-cover ring-3 ring-white shadow-lg flex-shrink-0" style={{ width: '4.5rem', height: '4.5rem' }} />
            <div className="flex-1 min-w-0 mb-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white truncate">{tailor.name}</h1>
                {tailor.verified && <VerifiedBadge size={18} />}
                <LevelBadge completedOrders={tailor.completedJobs} />
              </div>
              <p className="text-white/70 text-sm md:text-base">{tailor.specialty}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Star size={14} className="text-yellow-400" fill="currentColor" />
            <span className="text-base font-bold text-gray-900">{tailor.rating}</span>
          </div>
          <p className="text-xs text-gray-400">{tailor.reviews} reviews</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-base font-bold text-gray-900">{tailor.completedJobs}</p>
          <p className="text-xs text-gray-400">Jobs done</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-base font-bold text-gray-900">{tailor.responseTime}</p>
          <p className="text-xs text-gray-400">Response</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-base font-bold text-gold-600">₦{tailor.startPrice}</p>
          <p className="text-xs text-gray-400">Starting</p>
        </div>
      </div>

      {/* Bio + Specialties */}
      <div className="px-5 mt-5 space-y-4">
        {isOwner && editingBio ? (
          <div className="space-y-3">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingBio(false)} className="px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={() => setEditingBio(false)} className="px-4 py-2.5 text-sm font-semibold text-white bg-gold-500 rounded-xl">Save</button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <p className="text-sm text-gray-600 leading-relaxed pr-8">{bio}</p>
            {isOwner && (
              <button onClick={() => setEditingBio(true)} className="absolute top-0 right-0 w-7 h-7 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition md:opacity-100">
                <Edit3 size={12} className="text-gold-600" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={15} className="flex-shrink-0 text-gray-400" />
          <span>{tailor.location}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {specialties.map(s => (
            <span key={s} className="px-3 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-medium border border-gold-100 flex items-center gap-1.5">
              {s}
              {isOwner && (
                <button onClick={() => setSpecialties(prev => prev.filter(sp => sp !== s))} className="ml-0.5 hover:text-red-500 transition">
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          {isOwner && (
            <div className="flex items-center">
              <input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSpecialty.trim()) {
                    setSpecialties(prev => [...prev, newSpecialty.trim()]);
                    setNewSpecialty('');
                  }
                }}
                placeholder="Add..."
                className="w-20 px-3 py-1.5 text-xs border border-dashed border-gold-300 rounded-full focus:outline-none focus:border-gold-500 bg-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 mt-6 flex gap-3">
        {isOwner ? (
          <>
            <button
              onClick={shareStorefront}
              className="flex-1 py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2 relative"
            >
              <Share2 size={16} />
              Share My Storefront
              {showCopied && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] bg-black/80 text-white px-2.5 py-1 rounded-lg whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (params.get('preview') === 'customer') {
                  navigate(`/tailor/${id}`);
                } else {
                  navigate(`/tailor/${id}?preview=customer`);
                }
              }}
              className="px-5 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate(`/order/new?tailor=${tailor.id}`)}
              className="flex-1 py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Place Order
            </button>
            <button
              onClick={() => navigate(`/messages/${tailor.id}`)}
              className="px-5 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Chat
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2.5 mt-7 px-5">
        {[
          { id: 'portfolio', label: 'Portfolio', icon: Image },
          { id: 'reviews', label: 'Reviews', icon: Star },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-gold-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 mt-5"
          >
            {isOwner && (
              <div className="mb-4">
                {!showAddWork ? (
                  <button
                    onClick={() => setShowAddWork(true)}
                    className="w-full py-3.5 bg-white rounded-xl border-2 border-dashed border-gold-300 text-sm font-medium text-gold-600 hover:bg-gold-50 transition flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add New Work
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-4 border border-gold-200 space-y-3">
                    <h4 className="text-sm font-heading font-semibold text-gray-800">Add Portfolio Work</h4>
                    <input
                      value={newWorkTitle}
                      onChange={(e) => setNewWorkTitle(e.target.value)}
                      placeholder="Work title (e.g. Ankara Gown)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                    />
                    <div className="flex items-center justify-center h-28 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gold-300 transition">
                      <div className="text-center">
                        <Image size={24} className="mx-auto text-gray-300 mb-1.5" />
                        <p className="text-xs text-gray-400">Tap to upload photo</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowAddWork(false); setNewWorkTitle(''); }} className="flex-1 py-2.5 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200">Cancel</button>
                      <button
                        onClick={() => {
                          if (newWorkTitle.trim()) {
                            setPortfolio(prev => [...prev, { id: Date.now(), title: newWorkTitle.trim(), image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=400&h=500&fit=crop', rating: 0 }]);
                            setShowAddWork(false);
                            setNewWorkTitle('');
                          }
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${newWorkTitle.trim() ? 'bg-gold-500 text-white hover:bg-gold-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        Add Work
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolio.map(work => (
                <div key={work.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    <img src={work.image} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    {work.rating > 0 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg">
                        <Star size={10} className="text-yellow-400" fill="currentColor" />
                        <span className="text-[11px] font-bold">{work.rating}</span>
                      </div>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => setPortfolio(prev => prev.filter(p => p.id !== work.id))}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-100 transition"
                      >
                        <Trash2 size={13} className="text-white" />
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{work.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 mt-5 space-y-3"
          >
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-5">
              <div className="text-center">
                <p className="text-3xl font-heading font-bold text-gray-900">{tailor.rating}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={12} className="text-yellow-400" fill={i <= Math.round(tailor.rating) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{tailor.reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(stars => {
                  const count = reviews.filter(r => r.rating === stars).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{stars}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write Review Button / Form — only for non-owners */}
            {!isOwner && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Edit3 size={14} />
                Write a Review
              </button>
            )}
            {!isOwner && showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-xl p-4 border border-gold-200"
              >
                <h4 className="text-sm font-heading font-semibold text-gray-800 mb-3">Your Review</h4>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setReviewRating(i)}>
                      <Star
                        size={24}
                        className={`transition ${i <= reviewRating ? 'text-yellow-400' : 'text-gray-200'}`}
                        fill={i <= reviewRating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && <span className="text-xs text-gray-500 ml-2">{reviewRating}/5</span>}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="Share your experience..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewText(''); }}
                    className="flex-1 py-2.5 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (reviewRating > 0 && reviewText.trim()) {
                        setReviews(prev => [
                          { id: Date.now(), name: 'You', rating: reviewRating, text: reviewText, date: 'Just now' },
                          ...prev,
                        ]);
                        setShowReviewForm(false);
                        setReviewRating(0);
                        setReviewText('');
                      }
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                      reviewRating > 0 && reviewText.trim()
                        ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Submit Review
                  </button>
                </div>
              </motion.div>
            )}

            {reviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 text-sm font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                      <p className="text-xs text-gray-400">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={11} className="text-yellow-400" fill={i <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
