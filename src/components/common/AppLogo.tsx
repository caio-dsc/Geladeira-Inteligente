import React from 'react';

export interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'horizontal',
  className = '',
  theme = 'dark',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  const subTextSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px] sm:text-xs',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon (Symbol with Refrigerator, Camera and Food Scanner) */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background subtle glow filter */}
          <defs>
            <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.3" />
            </filter>
            <linearGradient id="fridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="cameraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B2B1B" />
              <stop offset="100%" stopColor="#05170E" />
            </linearGradient>
          </defs>

          {/* Refrigerator Body */}
          <rect
            x="32"
            y="20"
            width="82"
            height="120"
            rx="18"
            fill="url(#fridgeGrad)"
          />

          {/* Refrigerator Feet */}
          <rect x="42" y="138" width="12" height="6" rx="3" fill="#059669" />
          <rect x="92" y="138" width="12" height="6" rx="3" fill="#059669" />

          {/* Refrigerator Freezer/Fridge Door Split Line */}
          <line
            x1="32"
            y1="58"
            x2="114"
            y2="58"
            stroke="#047857"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Door Handle Top */}
          <rect x="39" y="32" width="4" height="14" rx="2" fill="#E6FFFA" />
          {/* Door Handle Bottom */}
          <rect x="39" y="70" width="4" height="22" rx="2" fill="#E6FFFA" />

          {/* Scanner Viewfinder Brackets [ ] in Dark Forest Green / Emerald */}
          <g stroke="#04381C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Top-Left Bracket */}
            <path d="M 76 46 L 70 46 A 8 8 0 0 0 62 54 L 62 60" />
            {/* Top-Right Bracket */}
            <path d="M 124 46 L 130 46 A 8 8 0 0 1 138 54 L 138 60" />
            {/* Bottom-Left Bracket */}
            <path d="M 62 108 L 62 114 A 8 8 0 0 0 70 122 L 76 122" />
            {/* Bottom-Right Bracket */}
            <path d="M 138 108 L 138 114 A 8 8 0 0 1 130 122 L 124 122" />
          </g>

          {/* Food Elements inside Scanner Frame */}
          {/* Apple (Top) */}
          <path
            d="M 100 52 C 94 52 91 56 88 56 C 85 56 82 52 76 52 C 70 52 66 58 66 67 C 66 77 75 87 88 87 C 101 87 110 77 110 67 C 110 58 106 52 100 52 Z"
            fill="#22C55E"
            transform="scale(0.52) translate(80, 52)"
          />
          {/* Apple Stem & Leaf */}
          <path
            d="M 100 75 C 99 70 102 67 105 66"
            stroke="#065F46"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Carrot (Diagonal Right) */}
          <g transform="translate(104, 76) rotate(28)">
            {/* Carrot Body */}
            <path
              d="M 0 0 C 4 0 9 2 9 6 C 9 12 4 28 0 34 C -4 28 -9 12 -9 6 C -9 2 -4 0 0 0 Z"
              fill="#10B981"
            />
            {/* Carrot Leaf Sprouts */}
            <path
              d="M -3 -1 C -6 -6 -3 -9 -1 -10 C 0 -7 0 -3 0 0"
              fill="#047857"
            />
            <path
              d="M 0 -1 C 0 -7 3 -11 6 -11 C 5 -7 3 -3 0 0"
              fill="#34D399"
            />
            <path
              d="M 3 -1 C 6 -5 8 -8 10 -7 C 8 -4 5 -1 0 0"
              fill="#059669"
            />
          </g>

          {/* Orange / Citrus (Bottom Left) */}
          <circle cx="86" cy="104" r="10.5" fill="#34D399" />
          <circle cx="86" cy="98" r="1.5" fill="#047857" />

          {/* Fresh Leaf (Bottom Right) */}
          <path
            d="M 118 104 C 118 97 125 93 131 93 C 131 100 125 108 118 104 Z"
            fill="#10B981"
          />

          {/* Camera (Attached on Left Side) */}
          <g transform="translate(18, 62)">
            {/* Camera Body */}
            <rect
              x="0"
              y="4"
              width="36"
              height="26"
              rx="6"
              fill="url(#cameraGrad)"
              stroke="#047857"
              strokeWidth="1.5"
            />
            {/* Flash Bump */}
            <rect x="6" y="0" width="8" height="4" rx="2" fill="#059669" />
            {/* Lens Outer Circle */}
            <circle cx="18" cy="17" r="8" fill="#10B981" />
            {/* Lens Inner Glass */}
            <circle cx="18" cy="17" r="4.5" fill="#042F1A" />
            {/* Lens Reflection Dot */}
            <circle cx="16.5" cy="15.5" r="1.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* Typography: "Geladeira Inteligente" with icon beside */}
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-black tracking-tight ${textSizes[size]} text-white`}
              style={{ letterSpacing: '-0.02em' }}
            >
              Geladeira
            </span>
            <span
              className={`font-black tracking-tight ${textSizes[size]} text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]`}
              style={{ letterSpacing: '-0.02em' }}
            >
              Inteligente
            </span>
          </div>
          <span className={`font-semibold text-emerald-400/80 ${subTextSizes[size]} tracking-wide mt-0.5`}>
            Alimentação & Receitas
          </span>
        </div>
      )}
    </div>
  );
};
