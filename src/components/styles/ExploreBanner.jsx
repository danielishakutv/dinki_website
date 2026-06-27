import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * Big, friendly "go explore the styles feed" call-to-action for the dashboards.
 */
export default function ExploreBanner() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/explore')}
      className="w-full text-left rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-gold-500 via-gold-500 to-amber-600 text-white relative overflow-hidden group"
    >
      <div className="absolute -top-8 -right-6 w-36 h-36 bg-white/10 rounded-full" />
      <div className="absolute bottom-0 right-16 w-20 h-20 bg-white/10 rounded-full translate-y-8" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Compass size={20} />
            <h2 className="text-lg sm:text-xl font-heading font-bold">Explore Styles</h2>
          </div>
          <p className="text-sm text-white/85 max-w-md">
            Browse thousands of looks, see what's <span className="inline-flex items-center gap-1 font-semibold"><TrendingUp size={13} /> trending</span>, save your favourites and order the exact style — made for you.
          </p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gold-600 rounded-xl text-sm font-bold shadow-sm group-hover:gap-3 transition-all">
          Explore <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}
