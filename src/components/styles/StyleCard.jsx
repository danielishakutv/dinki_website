import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, MessageCircle } from 'lucide-react';
import SmartImage from '../SmartImage';

export function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(v);
}

function attribution(style) {
  if (style.source_type === 'tailor' && style.tailor_name) return `by ${style.tailor_name}`;
  if (style.source_name) return style.source_name;
  return 'Dinki';
}

/**
 * A single Pinterest-style tile. Image height is intrinsic (masonry); a hover/touch
 * overlay surfaces the title, attribution and quick like/save actions. The whole
 * tile links to the detail page; action buttons stop propagation.
 */
export default function StyleCard({ style, onLike, onSave }) {
  const handle = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.(style);
  };

  return (
    <Link
      to={`/style/${style.id}`}
      className="group relative block mb-3 sm:mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <SmartImage
        src={style.thumb_url || style.image_url}
        fallbackSrc={style.image_url}
        alt={style.title}
        rounded="rounded-2xl"
      />

      {/* Quick actions — always tappable on mobile, fade in on hover for desktop */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={handle(onSave)}
          aria-label={style.saved ? 'Unsave' : 'Save'}
          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition ${
            style.saved ? 'bg-gold-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
          }`}
        >
          <Bookmark size={16} className={style.saved ? 'fill-current' : ''} />
        </button>
        <button
          onClick={handle(onLike)}
          aria-label={style.liked ? 'Unlike' : 'Like'}
          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition ${
            style.liked ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
          }`}
        >
          <Heart size={16} className={style.liked ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Bottom gradient caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{style.title}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-white/80 text-[11px] truncate">{attribution(style)}</span>
          <span className="flex items-center gap-2 text-white/90 text-[11px]">
            <span className="flex items-center gap-0.5"><Heart size={11} /> {formatCount(style.like_count)}</span>
            <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {formatCount(style.comment_count)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
