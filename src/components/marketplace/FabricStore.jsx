import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, AlertCircle } from 'lucide-react';

export default function FabricStore({ fabrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {fabrics.map((fabric, i) => (
        <motion.div
          key={fabric.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-hover"
        >
          {/* Color Swatch */}
          <div
            className="h-28 md:h-36 relative"
            style={{
              background: `linear-gradient(135deg, ${fabric.color}cc, ${fabric.color}88)`,
            }}
          >
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <pattern
                  id={`pattern-${fabric.id}`}
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  {fabric.pattern === 'Geometric' && (
                    <path d="M10 0L20 10L10 20L0 10Z" fill="white" />
                  )}
                  {fabric.pattern === 'Floral' && (
                    <circle cx="10" cy="10" r="5" fill="white" />
                  )}
                  {fabric.pattern === 'Damask' && (
                    <path d="M0 0h10v10H0zM10 10h10v10H10z" fill="white" />
                  )}
                  {fabric.pattern === 'Stripe' && (
                    <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="3" />
                  )}
                  {fabric.pattern === 'Woven' && (
                    <>
                      <line x1="0" y1="5" x2="20" y2="5" stroke="white" strokeWidth="2" />
                      <line x1="5" y1="0" x2="5" y2="20" stroke="white" strokeWidth="2" />
                    </>
                  )}
                  {fabric.pattern === 'Indigo Dye' && (
                    <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeWidth="1" />
                  )}
                </pattern>
                <rect width="100%" height="100%" fill={`url(#pattern-${fabric.id})`} />
              </svg>
            </div>

            {/* Stock badge */}
            {!fabric.inStock && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                <AlertCircle size={10} />
                Out of Stock
              </div>
            )}

            {/* Pattern label */}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm text-gray-700">
              {fabric.pattern}
            </span>
          </div>

          {/* Info */}
          <div className="p-3.5">
            <p className="text-sm font-semibold text-gray-800 truncate">{fabric.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{fabric.origin}</p>
            <div className="flex items-center justify-between mt-2.5">
              <div>
                <p className="text-sm font-heading font-bold text-gray-800">
                  ₦{fabric.price.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">{fabric.unit}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                disabled={!fabric.inStock}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  fabric.inStock
                    ? 'bg-gold-500 hover:bg-gold-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={14} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
