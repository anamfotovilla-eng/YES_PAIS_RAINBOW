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
        {/* 1. Shield Emblem on the Left */}
        <g transform="translate(6, 2)">
          {/* Shield Base Fill & Gold Trim */}
          <path
            d="M 12,4 L 56,4 C 60,4 64,8 64,12 L 64,36 C 64,52 42,65 34,69 C 26,65 4,52 4,36 L 4,12 C 4,8 8,4 12,4 Z"
            fill="#1B2256"
            stroke="#D4AF37"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Inner Shield Gold Inset Accent */}
          <path
            d="M 14,8 L 54,8 C 57,8 60,11 60,14 L 60,35 C 60,48 40,60 34,63 C 28,60 8,48 8,35 L 8,14 C 8,11 11,8 14,8 Z"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.6"
          />

          {/* Top "YES" Crest Badge */}
          <rect x="22" y="8" width="24" height="13" rx="6.5" fill="#111638" stroke="#D4AF37" strokeWidth="1" />
          <text
            x="34"
            y="17.5"
            fill="#FFFFFF"
            fontSize="8"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            YES
          </text>

          {/* Connected Atoms / Nodes & Educational Rays */}
          {/* Nodes */}
          <circle cx="18" cy="27" r="3.2" fill="#FFFFFF" />
          <circle cx="50" cy="27" r="3.2" fill="#FFFFFF" />
          <circle cx="34" cy="36" r="4.2" fill="#FFFFFF" />
          <circle cx="34" cy="56" r="2.8" fill="#FFFFFF" />

          {/* Connecting Branches */}
          <line x1="18" y1="27" x2="34" y2="36" stroke="#FFFFFF" strokeWidth="2.2" />
          <line x1="50" y1="27" x2="34" y2="36" stroke="#FFFFFF" strokeWidth="2.2" />
          <line x1="34" y1="36" x2="34" y2="56" stroke="#FFFFFF" strokeWidth="2.2" />

          {/* Open Book Foundation */}
          <path
            d="M 34,44 L 18,40 L 18,52 L 34,55 L 50,52 L 50,40 Z"
            fill="#FFFFFF"
          />
          {/* Book Page Spine and Details */}
          <line x1="26" y1="42" x2="26" y2="51" stroke="#1B2256" strokeWidth="1" />
          <line x1="42" y1="42" x2="42" y2="51" stroke="#1B2256" strokeWidth="1" />
          <line x1="34" y1="44" x2="34" y2="55" stroke="#1B2256" strokeWidth="1.2" />
        </g>

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
