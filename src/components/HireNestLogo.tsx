import React from 'react';

interface HireNestLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  theme?: 'dark' | 'light';
  showTagline?: boolean;
}

export const HireNestLogo: React.FC<HireNestLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'dark',
  showTagline = true,
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', textTitle: 'text-sm', textSub: 'text-[9px]', tag: 'text-[8px]' },
    md: { icon: 'w-12 h-12', textTitle: 'text-lg', textSub: 'text-xs', tag: 'text-[10px]' },
    lg: { icon: 'w-16 h-16', textTitle: 'text-2xl', textSub: 'text-sm', tag: 'text-xs' },
    xl: { icon: 'w-24 h-24', textTitle: 'text-3xl', textSub: 'text-base', tag: 'text-sm' },
  };

  const currentSize = sizeMap[size];
  const isDark = theme === 'dark';

  const logoSvg = (
    <svg
      viewBox="0 0 200 200"
      className={`${currentSize.icon} shrink-0 drop-shadow-md transition-all duration-300`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Bird Wing Gradient */}
        <linearGradient id="birdWing" x1="20" y1="30" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C0FF" />
          <stop offset="50%" stopColor="#0080FF" />
          <stop offset="100%" stopColor="#2E3192" />
        </linearGradient>

        {/* Bird Body Gradient */}
        <linearGradient id="birdBody" x1="90" y1="30" x2="130" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Nest Circuits Gradient */}
        <linearGradient id="nestCircuits" x1="40" y1="110" x2="160" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="50%" stopColor="#0052D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Central Badge Gradient */}
        <linearGradient id="badgeGrad" x1="70" y1="70" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Arrow Accent */}
        <linearGradient id="arrowGrad" x1="95" y1="20" x2="105" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Upward Growth Arrow (Top Center) */}
      <path d="M 100 18 L 108 28 H 104 V 38 H 96 V 28 H 92 Z" fill="url(#arrowGrad)" />
      <path d="M 100 12 L 112 24 H 107 V 32 H 93 V 24 H 88 Z" fill="#00D2FF" opacity="0.8" />

      {/* Left Wing - Flying Bird */}
      <path
        d="M 100 70 C 80 40 45 30 25 45 C 40 60 65 75 88 82 Z"
        fill="url(#birdWing)"
      />
      <path
        d="M 95 72 C 75 48 48 42 32 55 C 48 68 70 78 88 82 Z"
        fill="#00D2FF"
        opacity="0.4"
      />

      {/* Bird Head & Body */}
      <path
        d="M 100 70 C 110 50 125 45 135 55 C 145 60 160 62 168 62 C 152 68 140 72 132 80 C 122 90 115 105 110 115 C 102 100 100 85 100 70 Z"
        fill="url(#birdBody)"
      />
      {/* Beak */}
      <path d="M 148 59 L 168 62 L 145 66 Z" fill="#E11D48" />

      {/* Technology Nest Base (Circuit Network) */}
      <g stroke="url(#nestCircuits)" strokeWidth="3" strokeLinecap="round" fill="none">
        {/* Main Nest Arcs */}
        <path d="M 45 125 C 55 155 85 175 120 170 C 145 165 165 145 170 125" />
        <path d="M 35 135 C 50 168 90 185 130 178 C 158 172 178 148 180 130" />
        <path d="M 60 145 C 75 168 105 178 135 168" />

        {/* Circuit Branch Offshoots */}
        <path d="M 50 148 L 38 160 H 28" />
        <path d="M 65 162 L 55 175 H 42" />
        <path d="M 140 168 L 152 180 H 165" />
        <path d="M 160 145 L 175 155 V 168" />
        <path d="M 85 173 L 80 188 H 70" />
        <path d="M 115 172 L 122 188 H 135" />
      </g>

      {/* Circuit Nodes (Dots) */}
      <circle cx="28" cy="160" r="3.5" fill="#00D2FF" />
      <circle cx="42" cy="175" r="3.5" fill="#10B981" />
      <circle cx="70" cy="188" r="3.5" fill="#00D2FF" />
      <circle cx="135" cy="188" r="3.5" fill="#10B981" />
      <circle cx="165" cy="180" r="3.5" fill="#00D2FF" />
      <circle cx="175" cy="168" r="3.5" fill="#10B981" />
      <circle cx="180" cy="130" r="3" fill="#00D2FF" />
      <circle cx="35" cy="135" r="3" fill="#10B981" />

      {/* Central Blue Badge with 'N' Shield */}
      <circle cx="100" cy="105" r="28" fill="url(#badgeGrad)" stroke="#38BDF8" strokeWidth="2.5" />
      <circle cx="100" cy="105" r="23" stroke="#60A5FA" strokeWidth="1" strokeDasharray="3 2" fill="none" />

      {/* 'N' Tech Letter */}
      <path
        d="M 90 118 V 92 L 108 118 V 92"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="92" r="2" fill="#38BDF8" />
      <circle cx="108" cy="118" r="2" fill="#38BDF8" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{logoSvg}</div>;
  }

  return (
    <div className={`inline-flex flex-col items-center text-center ${className}`}>
      {logoSvg}

      <div className="mt-2 flex flex-col items-center">
        <h1
          className={`font-black tracking-wider uppercase font-mono ${currentSize.textTitle} ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          HIRENEST <span className="text-cyan-400 font-extrabold">WORKFORCE</span>
        </h1>

        <p
          className={`font-semibold tracking-wide uppercase font-sans ${currentSize.textSub} ${
            isDark ? 'text-cyan-200/90' : 'text-indigo-900'
          }`}
        >
          IT Staffing & Vendor Network
        </p>

        {showTagline && (
          <p
            className={`font-medium tracking-normal mt-1 italic ${currentSize.tag} ${
              isDark ? 'text-slate-300 font-sans' : 'text-slate-600'
            }`}
          >
            Hire Faster. Scale Smarter.
          </p>
        )}
      </div>
    </div>
  );
};
