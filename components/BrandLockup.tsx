import React from 'react';

interface BrandLockupProps {
  className?: string;
  variant?: 'light' | 'dark';
  compact?: boolean;
}

const BrandLockup: React.FC<BrandLockupProps> = ({
  className = '',
  variant = 'dark',
  compact = false,
}) => {
  const isDark = variant === 'dark';
  const textTop = isDark ? '#FAF7F2' : '#1A2821';
  const textBottom = isDark ? '#C8E44A' : '#52796F';
  const centerDot = isDark ? '#FAF7F2' : '#1A2821';

  if (compact) {
    return (
      <svg
        className={className}
        viewBox="0 0 220 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Fit For Cancer"
        role="img"
      >
        <g transform="translate(2,2)">
          <path d="M22 3 A19 19 0 0 1 39.7 27.5" stroke="#52796F" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <path d="M38.3 30.5 A19 19 0 0 1 6.8 37.5" stroke="#C8E44A" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <path d="M4.8 34 A19 19 0 0 1 18.5 3.4" stroke="#4A6FA5" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <circle cx="22" cy="22" r="4" fill={centerDot} />
        </g>
        <text x="58" y="21" fontFamily="Syne, sans-serif" fontSize="14" fontWeight="800" fill={textTop} letterSpacing="-0.3">
          FIT FOR
        </text>
        <text x="58" y="38" fontFamily="Syne, sans-serif" fontSize="14" fontWeight="800" fill={textBottom} letterSpacing="-0.3">
          CANCER
        </text>
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 260 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fit For Cancer evidence-based support"
      role="img"
    >
      <g transform="translate(4,4)">
        <path d="M32 4 A28 28 0 0 1 57.9 39" stroke="#52796F" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M55.5 43 A28 28 0 0 1 10 54" stroke="#C8E44A" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M7 49 A28 28 0 0 1 27 4.8" stroke="#4A6FA5" strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="32" r="5.5" fill={centerDot} />
      </g>
      <text x="84" y="30" fontFamily="Syne, sans-serif" fontSize="17" fontWeight="800" fill={textTop} letterSpacing="-0.4">
        FIT FOR
      </text>
      <text x="84" y="52" fontFamily="Syne, sans-serif" fontSize="17" fontWeight="800" fill={textBottom} letterSpacing="-0.4">
        CANCER
      </text>
      <text
        x="85"
        y="67"
        fontFamily="Instrument Sans, sans-serif"
        fontSize="9"
        fontWeight="500"
        fill={isDark ? 'rgba(255,255,255,0.35)' : '#6B7280'}
        letterSpacing="0.08em"
      >
        EVIDENCE-BASED SUPPORT
      </text>
    </svg>
  );
};

export default BrandLockup;
