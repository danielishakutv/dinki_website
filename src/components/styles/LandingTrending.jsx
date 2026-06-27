import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { styles as stylesApi } from '../../lib/api';
import StyleCard from './StyleCard';

/**
 * Live "Trending Styles" preview for the public landing page. Pulls real styles
 * from the feed so the homepage IS the Pinterest experience. Interactions nudge
 * guests to sign up; the CTA opens the full Explore feed.
 */
export default function LandingTrending() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stylesApi.list({ sort: 'trending', limit: 12 })
      .then((r) => setItems(r.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gotoSignup = () => navigate('/?auth=signup&next=/explore');

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={26} className="animate-spin text-gold-500" /></div>;
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <button onClick={() => navigate('/explore')} className="px-6 py-3 bg-gold-500 text-white rounded-xl font-heading font-semibold inline-flex items-center gap-2 hover:bg-gold-600 transition">
          Explore Styles <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="columns-2 md:columns-4 gap-4">
        {items.map((style) => (
          <StyleCard key={style.id} style={style} onLike={gotoSignup} onSave={gotoSignup} />
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <button onClick={() => navigate('/explore')} className="px-8 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition font-heading font-semibold flex items-center gap-2 group shadow-sm shadow-gold-500/20">
          Explore all styles <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
        </button>
      </div>
    </div>
  );
}
