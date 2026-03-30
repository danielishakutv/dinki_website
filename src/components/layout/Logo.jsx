import React from 'react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { wrapper: 'h-8', icon: 'w-8 h-8', text: 'text-lg' },
    md: { wrapper: 'h-10', icon: 'w-10 h-10', text: 'text-xl' },
    lg: { wrapper: 'h-14', icon: 'w-14 h-14', text: 'text-3xl' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${s.wrapper}`}>
      {/* Needle/Thread "D" logo */}
      <div className={`relative ${s.icon}`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Circular thread path */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#D4AF37"
            strokeWidth="2.5"
            strokeDasharray="5 3"
            fill="none"
          />
          {/* D letter body */}
          <path
            d="M16 12h8c7.732 0 14 6.268 14 12s-6.268 12-14 12h-8V12z"
            fill="#1B1F3B"
            opacity="0.9"
          />
          {/* Inner D cutout */}
          <path
            d="M20 17h4c4.97 0 9 4.03 9 7s-4.03 7-9 7h-4V17z"
            fill="#D4AF37"
          />
          {/* Needle */}
          <line
            x1="10"
            y1="8"
            x2="18"
            y2="16"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Needle eye */}
          <circle cx="9" cy="7" r="2" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-heading font-bold ${s.text} text-gray-900`}>
          Dinki
          <span className="text-gold-500">.africa</span>
        </span>
        {size === 'lg' && (
          <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mt-0.5">
            Fashion Management
          </span>
        )}
      </div>
    </div>
  );
}
