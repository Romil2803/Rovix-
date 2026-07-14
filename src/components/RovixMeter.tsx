import React, { useEffect, useState } from 'react';

interface RovixMeterProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function RovixMeter({ score, size = 64, strokeWidth = 5, showLabel = true }: RovixMeterProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const progressOffset = circumference - (score / 100) * circumference;
    const t = setTimeout(() => {
      setOffset(progressOffset);
    }, 150);
    return () => clearTimeout(t);
  }, [score, circumference]);

  return (
    <div className="flex flex-col items-center justify-center font-mono">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#rovixMeterGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          {/* Define gradient for high fidelity feel */}
          <defs>
            <linearGradient id="rovixMeterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5C518" />
              <stop offset="100%" stopColor="#FF9000" />
            </linearGradient>
          </defs>
        </svg>
        {/* Percentage text centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold" style={{ fontSize: size * 0.24 }}>
          <span>{score}%</span>
        </div>
      </div>
      {showLabel && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1 mt-1.5 font-sans">
          🔥 Rovix Meter™
        </span>
      )}
    </div>
  );
}

// Deterministic scorer for media based on ratings and interaction counts
export function getRovixMeterScore(movieId: string, communityRating: number, totalRatings: number): number {
  // Let's calculate a stable percentage score out of 100
  const ratingFactor = communityRating * 20; // e.g. 4.8 * 20 = 96%
  const popFactor = Math.min(3, Math.floor(totalRatings / 500)); // boost of up to 3% for high traction
  const stableHash = movieId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rewatchFactor = (stableHash % 4) + 1; // 1% to 4% rewatch rate boost
  
  const score = Math.min(99, Math.max(45, Math.round(ratingFactor + popFactor + rewatchFactor)));
  return score;
}
