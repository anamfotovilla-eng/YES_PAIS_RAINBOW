import React from "react";

interface SchoolLogoProps {
  className?: string;
  height?: number | string;
}

export default function SchoolLogo({ className = "", height = 48 }: SchoolLogoProps) {
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      id="school-footer-logo-card"
      className={`inline-flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs shrink-0 select-none ${className}`}
      style={{ height: heightStyle }}
    >
      <svg
        viewBox="0 0 460 76"
        className="h-full w-auto block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Official School Shield Emblem on the Left */}
        <image
          id="school-shield-emblem"
          href="/images/school-shield-logo.png"
          xlinkHref="/images/school-shield-logo.png"
          x="6"
          y="2"
          width="64"
          height="72"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 2. Top "YES" curved tab badge */}
        <g transform="translate(82, 5)">
          <path
            d="M 0,16 L 0,3 Q 0,0 3,0 L 38,0 Q 46,0 46,16 Z"
            fill="#1B2256"
          />
          <text
            x="21"
            y="12"
            fill="#FFFFFF"
            fontSize="11.5"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            YES
          </text>
        </g>

        {/* 3. Primary Institution Typography in Navy Blue / Charcoal */}
        <g transform="translate(82, 23)">
          <text
            x="0"
            y="20"
            fill="#1B2256"
            fontSize="19"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Arial Black', Impact, sans-serif"
            letterSpacing="0.3"
          >
            P.A. INAMDAR ENGLISH MEDIUM
          </text>
          <text
            x="0"
            y="43"
            fill="#1B2256"
            fontSize="19"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Arial Black', Impact, sans-serif"
            letterSpacing="0.3"
          >
            SCHOOL &amp; JUNIOR COLLEGE
          </text>
        </g>
      </svg>
    </div>
  );
}
