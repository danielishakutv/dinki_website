import React, { useState } from 'react';

/**
 * Lightweight, fast image with:
 *  - native lazy-loading + async decode (no JS observer cost)
 *  - a shimmer skeleton until the pixels arrive (no layout shift — the
 *    aspectRatio box reserves space)
 *  - graceful degradation: on error, fall back to `fallbackSrc` once, then to a
 *    branded gradient tile so a dead URL never shows a broken-image icon.
 *
 * Keep images light at the source (request a sized thumb URL for grids); this
 * component just makes them load smoothly.
 */
export default function SmartImage({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  imgClassName = '',
  aspectRatio,            // e.g. '4 / 5' — omit to let the image define height (masonry)
  rounded = 'rounded-2xl',
  eager = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setErrored(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${rounded} bg-gray-100 ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-200/70 to-gray-100" />
      )}

      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-100 via-amber-50 to-teal-50">
          <span className="px-3 text-center text-xs font-medium text-gold-700/70 line-clamp-2">{alt || 'Dinki'}</span>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`block w-full ${aspectRatio ? 'h-full object-cover' : 'h-auto'} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  );
}
