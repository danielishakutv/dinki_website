import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Grid3X3, List, Star } from 'lucide-react';

const mockFavourites = [
  {
    id: 'fav-1',
    title: 'Royal Agbada Set',
    designer: 'Dinki Atelier',
    price: 150000,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&h=500&fit=crop',
    rating: 4.9,
    savedAt: '2026-03-28',
  },
  {
    id: 'fav-2',
    title: 'Ankara Blazer Dress',
    designer: 'Nkechi Couture',
    price: 55000,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
    rating: 4.7,
    savedAt: '2026-03-25',
  },
  {
    id: 'fav-3',
    title: 'Senegalese Kaftan',
    designer: 'Dakar Styles',
    price: 85000,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=500&fit=crop',
    rating: 4.8,
    savedAt: '2026-03-20',
  },
  {
    id: 'fav-4',
    title: 'Kente Midi Skirt',
    designer: 'Accra Thread',
    price: 32000,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1590735213408-9d0dceab5b73?w=400&h=500&fit=crop',
    rating: 4.5,
    savedAt: '2026-03-18',
  },
  {
    id: 'fav-5',
    title: 'Dashiki Shirt Premium',
    designer: 'Dinki Atelier',
    price: 28000,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop',
    rating: 4.6,
    savedAt: '2026-03-15',
  },
  {
    id: 'fav-6',
    title: 'Aso-Oke Bridal Gown',
    designer: 'Lagos Bridal Co.',
    price: 250000,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop',
    rating: 5.0,
    savedAt: '2026-03-10',
  },
];

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

export default function Favourites() {
  const [view, setView] = useState('grid');
  const [items, setItems] = useState(mockFavourites);

  const removeItem = (id, e) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart size={22} className="text-gold-500" />
            <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Favourites</h1>
          </div>
          <p className="text-sm text-gray-400">{items.length} saved items</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-gold-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-gold-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Heart size={28} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No favourites yet</p>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group"
            >
              <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-700">
                  {item.category}
                </span>
                <button
                  onClick={(e) => removeItem(item.id, e)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Heart size={14} className="text-red-500 fill-red-500" />
                </button>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h3>
                <p className="text-xs text-gray-400 truncate">{item.designer}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gold-600">{'\u20A6'}{formatPrice(item.price)}</span>
                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    {item.rating}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h3>
                    <p className="text-xs text-gray-400">{item.designer}</p>
                  </div>
                  <button
                    onClick={(e) => removeItem(item.id, e)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Heart size={16} className="text-red-500 fill-red-500" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm font-bold text-gold-600">{'\u20A6'}{formatPrice(item.price)}</span>
                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    {item.rating}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 font-medium">
                    {item.category}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
