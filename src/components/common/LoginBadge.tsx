import React from 'react';

export interface LoginBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showCircuits?: boolean;
  className?: string;
}

/**
 * LoginBadge reproduces the custom smart refrigerator icon with the 3D neumorphic
 * embossed circular disk, bevel highlights, subtle concentric rings, and flanking
 * circuit board traces exactly as provided in the reference image.
 */
export const LoginBadge: React.FC<LoginBadgeProps> = ({
  size = 'lg',
  showCircuits = true,
  className = '',
}) => {
  // Dimensions for different sizes
  const dimensions = {
    sm: { width: 160, height: 64, discSize: 48 },
    md: { width: 240, height: 96, discSize: 68 },
    lg: { width: 340, height: 136, discSize: 96 },
  }[size];

  const viewBox = showCircuits ? '0 0 440 180' : '130 0 180 180';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: showCircuits ? `${dimensions.width}px` : `${dimensions.discSize}px`,
        height: showCircuits ? `${dimensions.height}px` : `${dimensions.discSize}px`,
        maxWidth: '100%',
      }}
    >
      <svg
        viewBox={viewBox}
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          {/* Neumorphic Raised Disc Rim Gradient */}
          <linearGradient id="badgeRimGrad" x1="25%" y1="15%" x2="75%" y2="85%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F5F8F7" />
            <stop offset="70%" stopColor="#D5E0DC" />
            <stop offset="100%" stopColor="#BAC8C3" />
          </linearGradient>

          {/* Central Convex Disc Face Gradient */}
          <radialGradient id="badgeFaceGrad" cx="45%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F6F9F8" />
            <stop offset="100%" stopColor="#E2EBE7" />
          </radialGradient>

          {/* Soft 3D Ambient Drop Shadow */}
          <filter id="badgeDiscShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0F2822" floodOpacity="0.16" />
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F2822" floodOpacity="0.08" />
          </filter>

          {/* Rim Inset Bevel */}
          <filter id="badgeInnerBevel" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F2822" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Flanking Circuit Lines */}
        {showCircuits && (
          <g opacity="0.8">
            {/* Left Circuit Traces */}
            <g stroke="#CBD7D2" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M 148 55 L 105 55 L 85 75 L 25 75" />
              <path d="M 142 75 L 115 75 L 95 95 L 45 95" />
              <path d="M 138 105 L 100 105 L 80 125 L 30 125" />
              <path d="M 145 125 L 120 125 L 100 145 L 55 145" />
            </g>

            {/* Left Circuit Nodes & Terminals */}
            <g fill="#CBD7D2">
              <circle cx="25" cy="75" r="4.5" />
              <circle cx="45" cy="95" r="3.5" />
              <circle cx="85" cy="75" r="3" />
              <circle cx="95" cy="95" r="3" />
              <circle cx="30" cy="125" r="4" />
              <circle cx="55" cy="145" r="3.5" />
              {/* Bus connector blocks */}
              <rect x="50" y="71" width="4.5" height="4.5" rx="1" />
              <rect x="58" y="71" width="4.5" height="4.5" rx="1" />
              <rect x="66" y="71" width="4.5" height="4.5" rx="1" />
              <rect x="74" y="71" width="4.5" height="4.5" rx="1" />

              <rect x="40" y="141" width="4" height="4" rx="1" />
              <rect x="47" y="141" width="4" height="4" rx="1" />
            </g>

            {/* Right Circuit Traces */}
            <g stroke="#CBD7D2" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M 292 60 L 335 60 L 355 80 L 415 80" />
              <path d="M 298 85 L 325 85 L 345 105 L 395 105" />
              <path d="M 302 110 L 340 110 L 360 130 L 410 130" />
              <path d="M 295 130 L 320 130 L 340 150 L 385 150" />
            </g>

            {/* Right Circuit Nodes & Terminals */}
            <g fill="#CBD7D2">
              <circle cx="415" cy="80" r="4.5" />
              <circle cx="395" cy="105" r="3.5" />
              <circle cx="355" cy="80" r="3" />
              <circle cx="345" cy="105" r="3" />
              <circle cx="410" cy="130" r="4" />
              <circle cx="385" cy="150" r="3.5" />
              {/* Bus connector blocks */}
              <rect x="375" y="76" width="4.5" height="4.5" rx="1" />
              <rect x="383" y="76" width="4.5" height="4.5" rx="1" />
              <rect x="391" y="76" width="4.5" height="4.5" rx="1" />
              <rect x="399" y="76" width="4.5" height="4.5" rx="1" />
            </g>
          </g>
        )}

        {/* Faint Outer Concentric Orbit Ring */}
        <circle
          cx="220"
          cy="90"
          r="82"
          stroke="#DDE6E2"
          strokeWidth="1.5"
          strokeDasharray="3 6"
          fill="none"
          opacity="0.65"
        />
        <circle
          cx="220"
          cy="90"
          r="86"
          stroke="#E5EEEA"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />

        {/* 3D Neumorphic Raised Disc */}
        <g filter="url(#badgeDiscShadow)">
          {/* Outer Raised Bevel Rim */}
          <circle cx="220" cy="90" r="76" fill="url(#badgeRimGrad)" />

          {/* Top-edge specular highlight */}
          <circle cx="220" cy="90" r="75.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity="0.9" />
          <circle cx="220" cy="90" r="74" stroke="rgba(210, 222, 218, 0.4)" strokeWidth="1" fill="none" />

          {/* Recessed Groove Ring */}
          <circle cx="220" cy="90" r="70" fill="#D8E3DF" />

          {/* Inner Convex Button Face */}
          <circle cx="220" cy="90" r="68.5" fill="url(#badgeFaceGrad)" />

          {/* Subtle Concentric Perimeter Ring */}
          <circle cx="220" cy="90" r="64" stroke="#DCE6E2" strokeWidth="1.2" fill="none" />
          <circle cx="220" cy="90" r="62.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.85" />
        </g>

        {/* Embedded Smart Refrigerator Icon (Black Fridge + Teal Circuit Lines) */}
        <image
          xlinkHref="/Logo_Icon.png"
          x="172"
          y="42"
          width="96"
          height="96"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
};
