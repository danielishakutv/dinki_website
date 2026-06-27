import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Heart, Bookmark, Share2, MessageCircle, ArrowLeft, Loader2, Send,
  Store, ShoppingBag, Check, Eye, Trash2,
} from 'lucide-react';
import FeedShell from '../components/styles/FeedShell';
import StyleCard, { formatCount } from '../components/styles/StyleCard';
import SmartImage from '../components/SmartImage';
import { styles as stylesApi, favourites as favouritesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ name, url, color, initials, size = 36 }) {
  const fallback = initials || (name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?');
  if (url) return <img src={url} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ width: size, height: size, background: color || '#0D9488' }}>
      {fallback}
    </div>
  );
}

export default function StyleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [style, setStyle] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stylesApi.get(id);
      setStyle(res.data);
      setSimilar(res.data.similar || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Style not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [id]);

  useEffect(() => {
    stylesApi.listComments(id, { limit: 50 })
      .then((r) => setComments(r.data?.comments || []))
      .catch(() => {});
  }, [id]);

  const requireAuth = () => {
    if (user) return true;
    navigate(`/?auth=signup&next=${encodeURIComponent(location.pathname)}`);
    return false;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    setStyle((s) => ({ ...s, liked: !s.liked, like_count: s.like_count + (s.liked ? -1 : 1) }));
    try {
      const res = await stylesApi.toggleLike(id);
      setStyle((s) => ({ ...s, liked: res.data.liked, like_count: res.data.like_count }));
    } catch {
      load();
    }
  };

  const toggleSave = async () => {
    if (!requireAuth()) return;
    setStyle((s) => ({ ...s, saved: !s.saved, save_count: s.save_count + (s.saved ? -1 : 1) }));
    try {
      await favouritesApi.toggle('style', id);
    } catch {
      load();
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/style/${id}`;
    const data = { title: style?.title, text: `Check out "${style?.title}" on Dinki Africa`, url };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const postComment = async () => {
    if (!requireAuth()) return;
    const body = commentText.trim();
    if (!body) return;
    setPosting(true);
    try {
      const res = await stylesApi.addComment(id, body);
      setComments((prev) => [res.data, ...prev]);
      setStyle((s) => ({ ...s, comment_count: (s.comment_count || 0) + 1 }));
      setCommentText('');
    } catch { /* ignore */ }
    setPosting(false);
  };

  const deleteComment = async (commentId) => {
    try {
      await stylesApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setStyle((s) => ({ ...s, comment_count: Math.max(0, (s.comment_count || 1) - 1) }));
    } catch { /* ignore */ }
  };

  const contactTailor = () => {
    if (!requireAuth()) return;
    if (style.tailor_id && style.tailor_slug) {
      navigate(`/order/new?tailor=${style.tailor_id}&slug=${style.tailor_slug}&style=${style.id}`);
    } else {
      navigate('/leaderboard'); // browse tailors who can make a similar look
    }
  };

  // --- similar-tile interactions (kept in local `similar` state) ---
  const likeSimilar = async (s) => {
    if (!requireAuth()) return;
    setSimilar((prev) => prev.map((x) => x.id === s.id ? { ...x, liked: !x.liked, like_count: x.like_count + (x.liked ? -1 : 1) } : x));
    try { const r = await stylesApi.toggleLike(s.id); setSimilar((prev) => prev.map((x) => x.id === s.id ? { ...x, liked: r.data.liked, like_count: r.data.like_count } : x)); } catch { /* ignore */ }
  };
  const saveSimilar = async (s) => {
    if (!requireAuth()) return;
    setSimilar((prev) => prev.map((x) => x.id === s.id ? { ...x, saved: !x.saved } : x));
    try { await favouritesApi.toggle('style', s.id); } catch { /* ignore */ }
  };

  if (loading) {
    return <FeedShell><div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-gold-500" /></div></FeedShell>;
  }
  if (error || !style) {
    return (
      <FeedShell>
        <div className="text-center py-24">
          <p className="text-gray-500">{error || 'Style not found.'}</p>
          <Link to="/explore" className="mt-3 inline-block text-gold-600 font-medium text-sm">Back to Explore</Link>
        </div>
      </FeedShell>
    );
  }

  const orderable = style.tailor_id && style.tailor_slug;

  return (
    <FeedShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Image */}
        <div>
          <SmartImage src={style.image_url} fallbackSrc={style.thumb_url} alt={style.title} rounded="rounded-3xl" eager />
        </div>

        {/* Info + actions */}
        <div>
          {style.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-gold-50 text-gold-700 text-xs font-semibold capitalize mb-3">
              {style.category.replace(/-/g, ' ')}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">{style.title}</h1>

          {/* attribution */}
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={style.tailor_name || style.source_name || 'Dinki'} url={style.tailor_avatar} color={style.tailor_avatar_color} initials={style.tailor_initials} />
            <div className="min-w-0">
              {style.tailor_name ? (
                <Link to={`/${style.tailor_slug}`} className="text-sm font-semibold text-gray-900 hover:text-gold-600">{style.tailor_name}</Link>
              ) : (
                <p className="text-sm font-semibold text-gray-900">{style.source_name || 'Dinki Curated'}</p>
              )}
              <p className="text-xs text-gray-400">
                {style.tailor_name ? 'Tailor on Dinki' : style.source_type === 'external' ? 'Inspiration' : 'Curated style'}
                {' · '}<Eye size={11} className="inline -mt-0.5" /> {formatCount(style.view_count)} views
              </p>
            </div>
          </div>

          {style.description && <p className="mt-4 text-sm text-gray-600 leading-relaxed">{style.description}</p>}

          {style.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {style.tags.map((t) => (
                <Link key={t} to={`/explore?tag=${encodeURIComponent(t)}`} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200 transition">#{t}</Link>
              ))}
            </div>
          )}

          {/* engagement actions */}
          <div className="mt-6 flex items-center gap-2">
            <button onClick={toggleLike} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${style.liked ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'}`}>
              <Heart size={16} className={style.liked ? 'fill-current' : ''} /> {formatCount(style.like_count)}
            </button>
            <button onClick={toggleSave} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${style.saved ? 'bg-gold-500 text-white border-gold-500' : 'bg-white text-gray-700 border-gray-200 hover:border-gold-300'}`}>
              <Bookmark size={16} className={style.saved ? 'fill-current' : ''} /> {style.saved ? 'Saved' : 'Save'}
            </button>
            <button onClick={share} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border bg-white text-gray-700 border-gray-200 hover:border-gray-300 transition">
              {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />} {copied ? 'Copied' : 'Share'}
            </button>
          </div>

          {/* contact / order */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button onClick={contactTailor} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 shadow-sm shadow-gold-500/20 transition">
              <ShoppingBag size={16} /> {orderable ? 'Order this style' : 'Find a tailor to make this'}
            </button>
            {orderable && (
              <Link to={`/${style.tailor_slug}`} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-700 text-sm font-semibold border border-gray-200 hover:border-gray-300 transition">
                <Store size={16} /> View storefront
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-10 max-w-2xl">
        <h2 className="flex items-center gap-2 text-lg font-heading font-bold text-gray-900 mb-4">
          <MessageCircle size={18} className="text-gold-500" /> Comments
          <span className="text-sm font-normal text-gray-400">({formatCount(style.comment_count)})</span>
        </h2>

        <div className="flex items-start gap-2.5 mb-5">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && postComment()}
            placeholder={user ? 'Add a comment…' : 'Log in to comment…'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
          />
          <button onClick={postComment} disabled={posting || !commentText.trim()} className="px-4 py-2.5 rounded-xl bg-gold-500 text-white disabled:opacity-50 hover:bg-gold-600 transition">
            {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        <div className="space-y-4">
          {comments.length === 0 && <p className="text-sm text-gray-400">Be the first to comment.</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 group">
              <Avatar name={c.author_name} url={c.author_avatar} color={c.author_avatar_color} initials={c.author_initials} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{c.author_name}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  {user?.id === c.user_id && (
                    <button onClick={() => deleteComment(c.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* More like this */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">More like this</h2>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
            {similar.map((s) => (
              <StyleCard key={s.id} style={s} onLike={likeSimilar} onSave={saveSimilar} />
            ))}
          </div>
        </div>
      )}
    </FeedShell>
  );
}
