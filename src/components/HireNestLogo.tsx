import React from 'react';

interface HireNestLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  showTagline?: boolean;
  animated?: boolean;
  className?: string;
  lightMode?: boolean;
}

export const HireNestLogo: React.FC<HireNestLogoProps> = ({
  size = 'md',
  showText = false,
  showTagline = false,
  animated = false,
  className = '',
  lightMode = false,
}) => {
  // Determine numerical pixel size
  let pixelSize = 40;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 28;
        break;
      case 'md':
        pixelSize = 40;
        break;
      case 'lg':
        pixelSize = 64;
        break;
      case 'xl':
        pixelSize = 120;
        break;
    }
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        {/* Glow backdrop if animated */}
        {animated && (
          <div
            className="absolute inset-0 rounded-full blur-md bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-emerald-500/30 animate-pulse pointer-events-none"
            style={{ transform: 'scale(1.2)' }}
          />
        )}

        {/* Vector SVG Emblem */}
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${animated ? 'hover:scale-105' : ''}`}
        >
          <defs>
            {/* Gradients matching the design */}
            <linearGradient id="birdWingGrad" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D2FF" />
              <stop offset="50%" stopColor="#0066FF" />
              <stop offset="100%" stopColor="#0B1953" />
            </linearGradient>

            <linearGradient id="birdBodyGrad" x1="90" y1="50" x2="140" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0052D4" />
              <stop offset="50%" stopColor="#4364F7" />
              <stop offset="100%" stopColor="#6FB1FC" />
            </linearGradient>

            <linearGradient id="nestCircuitGrad" x1="40" y1="100" x2="160" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00C6FF" />
              <stop offset="50%" stopColor="#0072FF" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="greenArrowGrad" x1="90" y1="15" x2="110" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <radialGradient id="centerBadgeGrad" cx="100" cy="110" r="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="70%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Subtle glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Group container with animation option */}
          <g className={animated ? 'animate-pulse [animation-duration:3s]' : ''}>
            {/* UPWARD GREEN CHEVRON (Growth Icon) */}
            <path
              d="M100 16 L112 28 L105 28 L105 38 L95 38 L95 28 L88 28 Z"
              fill="url(#greenArrowGrad)"
              filter="url(#neonGlow)"
            />

            {/* BIRD WING (Cyan/Blue layered feathers) */}
            <path
              d="M100 85 C80 60 55 40 40 42 C50 58 62 70 75 78 C52 62 38 52 28 56 C40 72 58 84 78 90 C58 82 42 78 35 84 C48 98 70 102 90 100 Z"
              fill="url(#birdWingGrad)"
            />

            {/* BIRD HEAD & BODY (Purple-blue hummingbird facing right with sharp beak) */}
            <path
              d="M95 85 C105 60 120 52 135 55 C145 57 155 58 165 59 C152 63 145 66 140 70 C146 76 142 85 132 92 C120 100 110 105 95 100 C90 95 92 88 95 85 Z"
              fill="url(#birdBodyGrad)"
            />
            {/* Eye */}
            <circle cx="138" cy="64" r="2.5" fill="#FFFFFF" />

            {/* CIRCUIT BOARD NEST NETWORK (Branching tech tracks holding the nest) */}
            <g opacity="0.95">
              {/* Circuit Track 1 - Left to bottom */}
              <path
                d="M50 110 L70 110 L80 130 L100 155 L120 155 L130 140"
                stroke="#00C6FF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="50" cy="110" r="4" fill="#00C6FF" />
              <circle cx="70" cy="110" r="3" fill="#00C6FF" />

              {/* Circuit Track 2 - Outer bottom swoop */}
              <path
                d="M42 125 L65 125 L85 145 L110 168 L135 150 L155 135"
                stroke="#0072FF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="42" cy="125" r="4" fill="#0072FF" />

              {/* Circuit Track 3 - Lower Green Base Nest */}
              <path
                d="M60 142 L80 160 L100 175 L125 170 L140 155"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="60" cy="142" r="3.5" fill="#10B981" />
              <circle cx="100" cy="175" r="4" fill="#10B981" />

              {/* Circuit Track 4 - Right Branch */}
              <path
                d="M130 115 L145 115 L160 130 L155 148"
                stroke="#00D2FF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="160" cy="130" r="3.5" fill="#00D2FF" />
              <circle cx="155" cy="148" r="3.5" fill="#00D2FF" />

              {/* Intersecting Nodes */}
              <circle cx="80" cy="130" r="3" fill="#38BDF8" />
              <circle cx="130" cy="140" r="3" fill="#34D399" />
              <circle cx="110" cy="168" r="3.5" fill="#60A5FA" />
            </g>

            {/* CENTRAL SHIELD BADGE ('N' Emblem inside Circle) */}
            <circle cx="100" cy="110" r="26" fill="url(#centerBadgeGrad)" stroke="#38BDF8" strokeWidth="3" />
            <circle cx="100" cy="110" r="22" stroke="#60A5FA" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* Stylized 'N' in Central Emblem */}
            <path
              d="M89 123 L89 97 L95 97 L105 115 L105 97 L111 97 L111 123 L105 123 L95 105 L95 123 Z"
              fill="#FFFFFF"
              filter="url(#neonGlow)"
            />

            {/* Corner Node Dots on the 'N' */}
            <circle cx="89" cy="97" r="1.5" fill="#38BDF8" />
            <circle cx="111" cy="123" r="1.5" fill="#34D399" />
          </g>
        </svg>
      </div>

      {/* Optional Branding Text */}
      {showText && (
        <div className="mt-2 text-center select-none">
          <div
            className={`font-black tracking-tight uppercase leading-tight font-sans ${
              lightMode ? 'text-slate-900' : 'text-slate-100'
            }`}
            style={{ fontSize: pixelSize > 60 ? '1.25rem' : '0.95rem' }}
          >
            HIRENEST <span className="text-cyan-500">WORKFORCE</span>
          </div>

          <div
            className={`font-semibold tracking-wide ${
              lightMode ? 'text-slate-600' : 'text-slate-400'
            }`}
            style={{ fontSize: pixelSize > 60 ? '0.75rem' : '0.65rem' }}
          >
            IT Staffing & Vendor Network
          </div>

          {showTagline && (
            <div className="mt-1 font-bold text-indigo-500 tracking-wider text-[11px]">
              Hire Faster. Scale Smarter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HireNestLogo;
