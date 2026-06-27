import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, TrendingUp, Clock, Loader2, Sparkles, Plus } from 'lucide-react';
import { styles as stylesApi, favourites as favouritesApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import StyleCard from './StyleCard';

const PAGE_SIZE = 24;

export default function StyleFeed({ heading = 'Explore Styles', subheading, defaultSort = 'trending' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const sentinelRef = useRef(null);
  const reqIdRef = useRef(0);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Category chips (load once).
  useEffect(() => {
    stylesApi.categories().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const fetchPage = useCallback(async (pageNum, replace) => {
    const reqId = ++reqIdRef.current;
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const res = await stylesApi.list({
        sort, page: pageNum, limit: PAGE_SIZE,
        category: category || undefined,
        q: debouncedQ || undefined,
      });
      // Ignore stale responses (filters changed mid-flight).
      if (reqId !== reqIdRef.current) return;
      const newItems = res.data?.items || [];
      const pagination = res.data?.pagination;
      setItems((prev) => (replace ? newItems : [...prev, ...newItems]));
      setHasMore(pagination ? pageNum < pagination.pages : false);
      setError('');
    } catch (err) {
      if (reqId === reqIdRef.current) setError(err.message || 'Could not load styles.');
    } finally {
      if (reqId === reqIdRef.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [sort, category, debouncedQ]);

  // Reset + load page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPage(1, true);
  }, [fetchPage]);

  // Infinite scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        const next = page + 1;
        setPage(next);
        fetchPage(next, false);
      }
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPage]);

  const requireAuth = () => {
    if (user) return true;
    navigate(`/?auth=signup&next=${encodeURIComponent(location.pathname + location.search)}`);
    return false;
  };

  // Optimistic like — flip immediately, reconcile/revert on the server's word.
  const handleLike = async (style) => {
    if (!requireAuth()) return;
    setItems((prev) => prev.map((s) => s.id === style.id
      ? { ...s, liked: !s.liked, like_count: s.like_count + (s.liked ? -1 : 1) } : s));
    try {
      const res = await stylesApi.toggleLike(style.id);
      setItems((prev) => prev.map((s) => s.id === style.id
        ? { ...s, liked: res.data.liked, like_count: res.data.like_count } : s));
    } catch {
      setItems((prev) => prev.map((s) => s.id === style.id
        ? { ...s, liked: style.liked, like_count: style.like_count } : s));
    }
  };

  const handleSave = async (style) => {
    if (!requireAuth()) return;
    setItems((prev) => prev.map((s) => s.id === style.id
      ? { ...s, saved: !s.saved, save_count: s.save_count + (s.saved ? -1 : 1) } : s));
    try {
      await favouritesApi.toggle('style', style.id);
    } catch {
      setItems((prev) => prev.map((s) => s.id === style.id
        ? { ...s, saved: style.saved, save_count: style.save_count } : s));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          {heading && (
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} className="text-gold-500" />
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">{heading}</h1>
            </div>
          )}
          {subheading && <p className="text-sm text-gray-500">{subheading}</p>}
        </div>
        {(user?.role === 'tailor' || user?.role === 'admin' || user?.role === 'superadmin') && (
          <button
            onClick={() => navigate('/styles/new')}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 shadow-sm shadow-gold-500/20 transition"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Style</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="sticky top-14 md:top-0 z-20 -mx-4 px-4 py-3 bg-cloud/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search styles, categories, tags…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden flex-shrink-0">
            <button
              onClick={() => setSort('trending')}
              className={`flex items-center gap-1 px-3 py-2.5 text-xs font-semibold transition ${sort === 'trending' ? 'bg-gold-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <TrendingUp size={14} /> <span className="hidden sm:inline">Trending</span>
            </button>
            <button
              onClick={() => setSort('recent')}
              className={`flex items-center gap-1 px-3 py-2.5 text-xs font-semibold transition ${sort === 'recent' ? 'bg-gold-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Clock size={14} /> <span className="hidden sm:inline">Recent</span>
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          <button
            onClick={() => setCategory('')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${category === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setCategory(c.category)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border capitalize transition ${category === c.category ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {c.category.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gold-500" /></div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">{error}</p>
            <button onClick={() => fetchPage(1, true)} className="mt-3 text-gold-600 font-medium text-sm">Try again</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No styles found{category ? ` in ${category}` : ''}{debouncedQ ? ` for "${debouncedQ}"` : ''}.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
            {items.map((style) => (
              <StyleCard key={style.id} style={style} onLike={handleLike} onSave={handleSave} />
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel + spinner */}
        {!loading && hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {loadingMore && <Loader2 size={22} className="animate-spin text-gold-400" />}
          </div>
        )}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-8">You've reached the end ✦</p>
        )}
      </div>
    </div>
  );
}
