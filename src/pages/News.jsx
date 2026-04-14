import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, BookOpen, TrendingUp, Scissors, ArrowRight } from 'lucide-react';

const categories = ['All', 'Tips & Tricks', 'Business', 'Industry', 'Trends'];

const articles = [
  {
    id: 1,
    title: 'How to Price Your Tailoring Services in 2025',
    excerpt: 'A practical guide to setting competitive prices that reflect your skill level and market demand across Africa.',
    category: 'Business',
    readTime: '5 min read',
    date: 'Jan 15, 2025',
    image: 'https://images.pexels.com/photos/3731857/pexels-photo-3731857.jpeg?w=600&h=400&fit=crop',
    featured: true,
  },
  {
    id: 2,
    title: 'Top 10 Ankara Styles Trending This Season',
    excerpt: 'From corporate elegance to party showstoppers — discover the Ankara designs your clients will be requesting.',
    category: 'Trends',
    readTime: '4 min read',
    date: 'Jan 12, 2025',
    image: 'https://images.pexels.com/photos/3622710/pexels-photo-3622710.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
  {
    id: 3,
    title: 'Mastering Measurements: Common Mistakes to Avoid',
    excerpt: 'Even experienced tailors make these measurement errors. Learn the techniques that ensure perfect fits every time.',
    category: 'Tips & Tricks',
    readTime: '6 min read',
    date: 'Jan 10, 2025',
    image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
  {
    id: 4,
    title: 'Building Your Online Presence as an African Tailor',
    excerpt: 'How to use social media, storefronts, and marketplaces to reach more customers and grow your brand.',
    category: 'Business',
    readTime: '7 min read',
    date: 'Jan 8, 2025',
    image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
  {
    id: 5,
    title: 'The Rise of Sustainable Fashion in West Africa',
    excerpt: 'How local tailors are leading the charge in eco-friendly fashion with traditional techniques and locally sourced fabrics.',
    category: 'Industry',
    readTime: '5 min read',
    date: 'Jan 5, 2025',
    image: 'https://images.pexels.com/photos/3570179/pexels-photo-3570179.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
  {
    id: 6,
    title: '5 Hand-Finishing Techniques Every Tailor Should Know',
    excerpt: 'Elevate your craft with these essential hand-finishing methods that set apart premium garments.',
    category: 'Tips & Tricks',
    readTime: '4 min read',
    date: 'Jan 3, 2025',
    image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
  {
    id: 7,
    title: 'Understanding Fabric Types: A Complete Guide',
    excerpt: 'From Ankara wax prints to damask and lace — know your fabrics to advise clients better and deliver quality.',
    category: 'Tips & Tricks',
    readTime: '8 min read',
    date: 'Dec 28, 2024',
    image: 'https://images.pexels.com/photos/3731897/pexels-photo-3731897.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
  {
    id: 8,
    title: 'Agbada Evolution: From Tradition to Modern Runway',
    excerpt: 'How the iconic Agbada has transformed from ceremonial attire to a global fashion statement.',
    category: 'Trends',
    readTime: '5 min read',
    date: 'Dec 25, 2024',
    image: 'https://images.pexels.com/photos/3622709/pexels-photo-3622709.jpeg?w=600&h=400&fit=crop',
    featured: false,
  },
];

export default function News() {
  const [activeCategory, setActiveCategory] = useState('All');

  const featured = articles.find(a => a.featured);
  const filtered = activeCategory === 'All'
    ? articles.filter(a => !a.featured)
    : articles.filter(a => a.category === activeCategory && !a.featured);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-heading font-bold text-gray-900">News & Articles</h1>
        <p className="text-sm text-gray-500 mt-0.5">Industry insights, tips, and trends</p>
      </div>

      {/* Featured Article */}
      {featured && (
        <div className="px-4 py-3">
          <motion.div
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <img src={featured.image} alt={featured.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="inline-block px-2 py-0.5 bg-gold-500 text-white text-[10px] font-bold rounded-md mb-2">FEATURED</span>
              <h2 className="font-heading font-bold text-white text-lg leading-tight mb-1">{featured.title}</h2>
              <p className="text-white/70 text-xs line-clamp-2">{featured.excerpt}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-white/50 flex items-center gap-1"><Clock size={10} /> {featured.readTime}</span>
                <span className="text-[10px] text-white/50">{featured.date}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Chips */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
              activeCategory === c
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Article List */}
      <div className="px-4 space-y-3">
        {filtered.map((article, i) => (
          <motion.div
            key={article.id}
            className="flex gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm cursor-pointer hover:border-gold-200 transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <img src={article.image} alt={article.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{article.category}</span>
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={9} /> {article.readTime}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{article.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{article.excerpt}</p>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No articles in this category yet</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-indigo-50 to-teal-50 rounded-xl p-4 border border-indigo-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Quick Resources
          </h3>
          <div className="space-y-2">
            {[
              { icon: Scissors, label: 'Measurement Guide', desc: 'Standard body measurement chart' },
              { icon: BookOpen, label: 'Style Dictionary', desc: 'African fashion terminology' },
              { icon: TrendingUp, label: 'Market Insights', desc: 'Monthly pricing & demand trends' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-lg cursor-pointer hover:shadow-sm transition">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <r.icon size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{r.label}</p>
                  <p className="text-[10px] text-gray-400">{r.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
