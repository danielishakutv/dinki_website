import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, ChevronRight, Trophy, Medal, Award } from 'lucide-react';
import { VerifiedBadge, LevelBadge, getTailorLevel } from '../components/TailorBadges';

const allTailors = [
  { id: '3', name: 'Mama Amara', specialty: 'Luxury Aso Ebi', location: 'Ikeja, Lagos', rating: 4.95, reviews: 412, completedOrders: 1050, verified: true, image: 'https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?w=200&h=200&fit=crop' },
  { id: '4', name: 'Baba Couture', specialty: 'Modern Fusion', location: 'Surulere, Lagos', rating: 4.7, reviews: 198, completedOrders: 720, verified: true, image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=200&h=200&fit=crop' },
  { id: '1', name: 'Aunty Zainab', specialty: 'Traditional Ankara', location: 'Ikoyi, Lagos', rating: 4.9, reviews: 324, completedOrders: 580, verified: true, image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200&h=200&fit=crop' },
  { id: '2', name: 'Master Chukwu', specialty: 'Agbada Expert', location: 'Victoria Island, Lagos', rating: 4.8, reviews: 287, completedOrders: 430, verified: true, image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=200&h=200&fit=crop' },
  { id: '5', name: 'Sister Adaeze', specialty: 'Igbo Traditional', location: 'Lekki, Lagos', rating: 4.6, reviews: 156, completedOrders: 310, verified: true, image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=200&h=200&fit=crop' },
  { id: '6', name: 'Tailor Kwame', specialty: 'Kente Specialist', location: 'Accra, Ghana', rating: 4.5, reviews: 89, completedOrders: 180, verified: false, image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=200&h=200&fit=crop' },
  { id: '7', name: 'Iya Shade', specialty: 'Adire & Batik', location: 'Abeokuta, Ogun', rating: 4.4, reviews: 72, completedOrders: 120, verified: true, image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?w=200&h=200&fit=crop' },
  { id: '8', name: 'Olumide Stitch', specialty: 'Corporate Wear', location: 'Abuja, FCT', rating: 4.3, reviews: 45, completedOrders: 85, verified: false, image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?w=200&h=200&fit=crop' },
];

const filters = ['All', 'Couturier', 'Grand Tailor', 'Master Cutter', 'Seamster'];

function RankIcon({ rank }) {
  if (rank === 1) return <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0"><Trophy size={14} className="text-white" /></div>;
  if (rank === 2) return <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0"><Medal size={14} className="text-white" /></div>;
  if (rank === 3) return <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0"><Award size={14} className="text-white" /></div>;
  return <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{rank}</div>;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? allTailors
    : allTailors.filter(t => getTailorLevel(t.completedOrders).label === activeFilter);

  const top3 = allTailors.slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-heading font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Top tailors ranked by completed orders</p>
      </div>

      {/* Top 3 Podium */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl px-4 py-6 text-white">
          <div className="flex items-end justify-center gap-4 sm:gap-6">
            {/* 2nd place */}
            <motion.div className="flex flex-col items-center w-20 sm:w-24" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <img src={top3[1]?.image} alt={top3[1]?.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-300 mb-2" />
              <div className="bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center mb-1">
                <span className="text-[10px] font-bold text-white">2</span>
              </div>
              <p className="text-xs font-semibold text-center leading-tight">{top3[1]?.name}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{top3[1]?.completedOrders}</p>
            </motion.div>

            {/* 1st place */}
            <motion.div className="flex flex-col items-center w-24 sm:w-28 -mt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <div className="relative mb-2">
                <img src={top3[0]?.image} alt={top3[0]?.name} className="w-[4.5rem] h-[4.5rem] rounded-full object-cover ring-3 ring-yellow-400" />
                <div className="absolute -top-1.5 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Trophy size={10} className="text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-center leading-tight">{top3[0]?.name}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{top3[0]?.completedOrders} orders</p>
              <div className="mt-1">
                <LevelBadge completedOrders={top3[0]?.completedOrders} compact />
              </div>
            </motion.div>

            {/* 3rd place */}
            <motion.div className="flex flex-col items-center w-20 sm:w-24" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <img src={top3[2]?.image} alt={top3[2]?.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-600 mb-2" />
              <div className="bg-amber-600 rounded-full w-5 h-5 flex items-center justify-center mb-1">
                <span className="text-[10px] font-bold text-white">3</span>
              </div>
              <p className="text-xs font-semibold text-center leading-tight">{top3[2]?.name}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{top3[2]?.completedOrders}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
              activeFilter === f
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="px-4 space-y-2">
        {filtered.map((tailor, i) => {
          const globalRank = allTailors.findIndex(t => t.id === tailor.id) + 1;
          return (
            <motion.button
              key={tailor.id}
              onClick={() => navigate(`/${tailor.slug || tailor.id}`)}
              className="w-full flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-100 hover:border-gold-200 transition text-left shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <RankIcon rank={globalRank} />
              <img src={tailor.image} alt={tailor.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900 truncate">{tailor.name}</p>
                  {tailor.verified && <VerifiedBadge size={13} />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <LevelBadge completedOrders={tailor.completedOrders} compact />
                  <span className="text-[11px] text-gray-400 truncate">{tailor.specialty}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-1">
                <p className="text-sm font-bold text-indigo-600">{tailor.completedOrders.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">orders</p>
              </div>
            </motion.button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No tailors at this level yet</p>
          </div>
        )}
      </div>

      {/* Level Guide */}
      <div className="px-4 mt-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Level Guide</h3>
          <div className="space-y-2">
            {[
              { label: 'Apprentice', range: '0 – 99 orders', color: 'bg-gray-200' },
              { label: 'Seamster', range: '100 – 299 orders', color: 'bg-blue-400' },
              { label: 'Master Cutter', range: '300 – 499 orders', color: 'bg-purple-400' },
              { label: 'Grand Tailor', range: '500 – 999 orders', color: 'bg-gold-400' },
              { label: 'Couturier', range: '1,000+ orders', color: 'bg-amber-500' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${l.color} flex-shrink-0`} />
                <span className="text-xs font-semibold text-gray-700 w-24">{l.label}</span>
                <span className="text-xs text-gray-400">{l.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
