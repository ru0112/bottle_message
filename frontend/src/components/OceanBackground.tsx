import React, { useMemo } from 'react';

export const OceanBackground: React.FC = () => {
  // Generate random stars
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 65}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2.5 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#0b132b] to-[#1c2541]" />

      {/* Moon and Glow */}
      <div className="absolute top-10 right-14 sm:top-14 sm:right-28 w-24 h-24 rounded-full bg-amber-100/90 shadow-[0_0_60px_rgba(254,243,199,0.35)] flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-50 to-amber-200/95" />
      </div>

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            ['--duration' as string]: star.duration,
          }}
        />
      ))}

      {/* Distant horizon glow */}
      <div className="absolute top-[48%] left-0 right-0 h-40 bg-gradient-to-t from-cyan-950/40 via-blue-900/20 to-transparent" />

      {/* Layer 3 Deep Wave */}
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-56 opacity-40 wave-layer-3">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-blue-950">
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Layer 2 Mid Wave */}
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-44 opacity-60 wave-layer-2">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#0a2540]">
          <path d="M0,30 C200,100 450,10 600,60 C750,110 1000,20 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Layer 1 Foreground Wave */}
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-32 opacity-90 wave-layer-1">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#05192d]">
          <path d="M0,40 C180,10 380,80 600,30 C820,-20 1020,70 1200,30 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Ambient water reflection shine */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cyan-900/20 to-transparent" />
    </div>
  );
};
