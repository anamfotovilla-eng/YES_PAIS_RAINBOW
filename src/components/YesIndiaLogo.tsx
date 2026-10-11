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
      {/* 1. Left Emblem: Official Iqra Education & Welfare Society Crest */}
      <image
        id="iqra-emblem"
        href="/images/circular-logo.png"
        xlinkHref="/images/circular-logo.png"
        x="4"
        y="2"
        width="80"
        height="80"
        preserveAspectRatio="xMidYMid meet"
      />

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
