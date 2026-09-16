import React from "react";

interface YesIndiaLogoProps {
  className?: string;
  height?: number | string;
  withBox?: boolean;
}

export default function YesIndiaLogo({
  className = "",
  height,
  withBox = true,
}: YesIndiaLogoProps) {
  const heightStyle = height
    ? typeof height === "number"
      ? `${height}px`
      : height
    : undefined;

  const svgContent = (
    <svg
      viewBox="0 0 330 84"
      className="h-full w-auto block select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Left Emblem: Iqra Education & Welfare Society Crest */}
      <g id="iqra-emblem" transform="translate(4, 2)">
        {/* Outer Gold Ring */}
        <circle cx="40" cy="40" r="39" fill="#FDFBF7" stroke="#E5A823" strokeWidth="1.5" />
        
        {/* Main Green Ring */}
        <circle cx="40" cy="40" r="36" fill="#1C6B4B" stroke="#B71C1C" strokeWidth="1.2" />
        
        {/* Inner Cream Center */}
        <circle cx="40" cy="40" r="25" fill="#FFFDF8" stroke="#B71C1C" strokeWidth="1.2" />

        {/* Circular Top Text */}
        <defs>
          <path
            id="iqra-circle-path"
            d="M 11,40 A 29,29 0 1,1 69,40"
            fill="none"
          />
        </defs>

        <text fill="#FFFFFF" fontSize="4.6" fontWeight="900" letterSpacing="0.4" fontFamily="system-ui, sans-serif">
          <textPath href="#iqra-circle-path" startOffset="50%" textAnchor="middle">
            IQRA EDUCATION &amp; WELFARE SOCIETY
          </textPath>
        </text>

        {/* Central Open Book & Pen Graphic */}
        <g transform="translate(24, 24) scale(0.32)">
          {/* Book Base */}
          <path
            d="M 50,65 Q 25,60 5,68 L 5,30 Q 25,22 50,28 Q 75,22 95,30 L 95,68 Q 75,60 50,65 Z"
            fill="#FFFFFF"
            stroke="#001D6E"
            strokeWidth="3.5"
          />
          {/* Book Spine */}
          <path d="M 50,28 L 50,65" stroke="#001D6E" strokeWidth="3" />
          
          {/* Book Page Lines */}
          <path d="M 14,38 Q 30,32 46,36" stroke="#1C6B4B" strokeWidth="2" fill="none" />
          <path d="M 14,46 Q 30,40 46,44" stroke="#1C6B4B" strokeWidth="2" fill="none" />
          <path d="M 14,54 Q 30,48 46,52" stroke="#1C6B4B" strokeWidth="2" fill="none" />
          <path d="M 54,36 Q 70,32 86,38" stroke="#1C6B4B" strokeWidth="2" fill="none" />
          <path d="M 54,44 Q 70,40 86,46" stroke="#1C6B4B" strokeWidth="2" fill="none" />
          <path d="M 54,52 Q 70,48 86,54" stroke="#1C6B4B" strokeWidth="2" fill="none" />

          {/* Central Quill / Pen */}
          <path
            d="M 72,10 L 46,48 L 43,53 L 49,50 L 76,13 Q 78,9 72,10 Z"
            fill="#D32F2F"
            stroke="#8B0000"
            strokeWidth="2"
          />
          <circle cx="73" cy="12" r="2.5" fill="#E5A823" />
        </g>

        {/* Bottom Banner Ribbon: HONESTY, HARDWORK, SUCCESS */}
        <path
          d="M 14,64 Q 40,72 66,64 L 68,71 Q 40,80 12,71 Z"
          fill="#FFFFFF"
          stroke="#B71C1C"
          strokeWidth="0.8"
        />
        <text
          x="40"
          y="70"
          textAnchor="middle"
          fill="#001D6E"
          fontSize="3.8"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.2"
        >
          AHMEDNAGAR
        </text>
      </g>

      {/* 2. Middle Section: Yes India Navy Tile with Hand/Dove Motif */}
      <g id="yes-india-tile" transform="translate(94, 6)">
        {/* Navy Blue Box with rounded corners */}
        <rect width="72" height="72" rx="8" fill="#001D6E" />
        
        {/* White Stylized Y / Hand Base */}
        <path
          d="M 28,63 L 44,63 L 44,43 L 57,27 L 47,27 L 36,39 L 25,27 L 15,27 L 28,43 Z"
          fill="#FFFFFF"
        />
        
        {/* Flying doves/pages rising from the open hands */}
        <path
          d="M 22,17 Q 32,12 44,18 Q 36,15 27,20 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 25,23 Q 36,17 50,24 Q 41,21 30,27 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 28,29 Q 41,22 56,31 Q 45,27 34,33 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* 3. Right Section: YES INDIA FOUNDATION Typography */}
      <g id="yes-india-text" transform="translate(180, 0)">
        <text
          x="0"
          y="31"
          fill="#001D6E"
          fontSize="23"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          YES
        </text>
        <text
          x="0"
          y="54"
          fill="#001D6E"
          fontSize="23"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          INDIA
        </text>
        <text
          x="0"
          y="74"
          fill="#001D6E"
          fontSize="14"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1.8"
        >
          FOUNDATION
        </text>
      </g>
    </svg>
  );

  if (withBox) {
    return (
      <div
        className={`bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 shadow-xs inline-flex items-center justify-center shrink-0 ${className}`}
        style={heightStyle ? { height: heightStyle } : undefined}
      >
        {svgContent}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={heightStyle ? { height: heightStyle } : undefined}
    >
      {svgContent}
    </div>
  );
}
