import React from 'react';

// Tailoring-themed levels based on completed orders
const levels = [
  { min: 0,    label: 'Apprentice',   color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { min: 100,  label: 'Seamster',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { min: 300,  label: 'Master Cutter', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { min: 500,  label: 'Grand Tailor', color: 'bg-gold-50 text-gold-700 border-gold-200' },
  { min: 1000, label: 'Couturier',    color: 'bg-gradient-to-r from-amber-50 to-gold-50 text-amber-800 border-amber-300' },
];

export function getTailorLevel(completedOrders = 0) {
  let level = levels[0];
  for (const l of levels) {
    if (completedOrders >= l.min) level = l;
  }
  return level;
}

export function VerifiedBadge({ size = 14 }) {
  return (
    <div
      className="rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      title="Verified Tailor"
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
        <path d="M2.5 5L4.5 7L7.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function LevelBadge({ completedOrders = 0, compact = false }) {
  const level = getTailorLevel(completedOrders);
  if (compact) {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap flex-shrink-0 ${level.color} leading-none`}>
        {level.label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap flex-shrink-0 ${level.color} leading-tight`}>
      {level.label}
    </span>
  );
}
