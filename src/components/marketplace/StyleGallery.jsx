import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';

export default function StyleGallery({ styles }) {
  return (
    <div className="columns-2 md:columns-3 gap-3 space-y-3">
      {styles.map((style, i) => (
        <motion.div
          key={style.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="break-inside-avoid bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-hover group"
        >
          {/* Image */}
          <div className="relative aspect-[3/4] bg-gradient-to-br from-gold-100 to-amber-50 overflow-hidden">
            <img
              src={style.image}
              alt={style.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Favorite Button */}
            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <Heart size={14} className="text-gray-600" />
            </button>

            {/* Category */}
            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 backdrop-blur-sm text-gray-700">
              {style.category}
            </span>
          </div>

          {/* Info */}
          <div className="p-3.5">
            <p className="text-sm font-semibold text-gray-800 truncate">{style.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{style.designer}</p>
            <div className="flex items-center justify-between mt-2.5">
              <p className="text-sm font-heading font-bold text-gold-600">
                ₦{style.price.toLocaleString()}
              </p>
              <div className="flex gap-1">
                {style.colors.map((color) => (
                  <span
                    key={color}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
