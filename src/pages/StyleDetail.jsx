import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Share2, Star, ShoppingBag, Ruler, MessageCircle, Palette } from 'lucide-react';
import { marketplaceStyles } from '../data/mockData';

const styleDetails = {
  'style-1': { description: 'A majestic Royal Agbada Set crafted from premium Guinea brocade with intricate hand-embroidery in gold thread. Perfect for weddings, naming ceremonies, and special occasions.', fabric: 'Guinea Brocade', deliveryTime: '2–3 weeks', sizes: ['S', 'M', 'L', 'XL', 'XXL'], includes: ['Agbada (outer robe)', 'Dashiki (inner shirt)', 'Sokoto (trousers)', 'Fila (cap)'] },
  'style-2': { description: 'A chic Ankara Blazer Dress combining corporate elegance with African heritage. Features a structured blazer silhouette in vibrant Ankara print with gold button accents.', fabric: 'Premium Ankara Wax', deliveryTime: '1–2 weeks', sizes: ['XS', 'S', 'M', 'L', 'XL'], includes: ['Blazer dress', 'Matching belt', 'Fabric swatch'] },
  'style-3': { description: 'An elegant Senegalese Kaftan in rich indigo with golden embroidery. Lightweight and flowing, this kaftan is perfect for formal gatherings and cultural events.', fabric: 'Premium Cotton Bazin', deliveryTime: '2–3 weeks', sizes: ['M', 'L', 'XL', 'XXL'], includes: ['Kaftan', 'Matching trousers', 'Kufi cap'] },
  'style-4': { description: 'A vibrant Kente Midi Skirt handwoven by skilled artisans from Accra, Ghana. Each piece features authentic Kente patterns that celebrate African heritage.', fabric: 'Handwoven Kente', deliveryTime: '3–4 weeks', sizes: ['XS', 'S', 'M', 'L'], includes: ['Midi skirt', 'Matching headwrap'] },
  'style-5': { description: 'A premium Dashiki Shirt featuring bold African patterns with modern tailoring. Made from breathable cotton, ideal for casual outings and celebrations.', fabric: 'African Print Cotton', deliveryTime: '1 week', sizes: ['S', 'M', 'L', 'XL', 'XXL'], includes: ['Dashiki shirt'] },
  'style-6': { description: 'A breathtaking Aso-Oke Bridal Gown that blends traditional Nigerian weaving techniques with modern bridal elegance. Hand-adorned with Swarovski crystals and seed pearls.', fabric: 'Hand-woven Aso-Oke & Organza', deliveryTime: '4–6 weeks', sizes: ['Custom only'], includes: ['Bridal gown', 'Matching gele (headtie)', 'Ipele (shawl)', 'Dress bag'] },
};

export default function StyleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');

  const style = marketplaceStyles.find(s => s.id === id);
  const details = styleDetails[id];

  if (!style) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Style not found.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-gold-600 font-medium text-sm">Go back</button>
      </div>
    );
  }

  const info = details || {
    description: `A beautiful ${style.title} crafted by ${style.designer}. Premium quality with attention to detail.`,
    fabric: 'Premium Fabric',
    deliveryTime: '2–3 weeks',
    sizes: ['S', 'M', 'L', 'XL'],
    includes: [style.title],
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Image */}
      <div className="relative aspect-[3/4] md:aspect-[16/10] bg-gray-100 overflow-hidden">
        <img src={style.image} alt={style.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
            >
              <Heart size={16} className={saved ? 'text-red-400 fill-red-400' : 'text-white'} />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Share2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Category badge */}
        <span className="absolute top-4 left-16 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-sm text-gray-700">
          {style.category}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 -mt-6 relative z-10 space-y-5">
        {/* Title card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-heading font-bold text-gray-900">{style.title}</h1>
              <p className="text-sm text-gray-500">by {style.designer}</p>
            </div>
            <p className="text-xl md:text-2xl font-heading font-bold text-gold-600 flex-shrink-0">
              ₦{style.price.toLocaleString()}
            </p>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2 mt-3">
            <Palette size={14} className="text-gray-400" />
            <div className="flex gap-1.5">
              {style.colors.map(color => (
                <span key={color} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{color}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-heading font-semibold text-gray-800 mb-2">About this Style</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{info.description}</p>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-heading font-semibold text-gray-800">Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Fabric</p>
              <p className="text-gray-700 font-medium">{info.fabric}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Delivery Time</p>
              <p className="text-gray-700 font-medium">{info.deliveryTime}</p>
            </div>
          </div>

          {info.includes.length > 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">This set includes</p>
              <div className="flex flex-wrap gap-1.5">
                {info.includes.map(item => (
                  <span key={item} className="text-xs px-2.5 py-1 rounded-lg bg-gold-50 text-gold-700 border border-gold-100 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Size Selection */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-heading font-semibold text-gray-800 mb-3">Select Size</h3>
          <div className="flex flex-wrap gap-2">
            {info.sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border min-w-[48px] ${
                  selectedSize === size
                    ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gold-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => navigate(`/order/new?style=${style.id}`)}
            className="flex-1 py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Order This Style
          </button>
          <button
            onClick={() => navigate('/messages/1')}
            className="px-5 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
