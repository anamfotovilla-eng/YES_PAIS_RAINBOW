import React from "react";

interface YesIndiaLogoProps {
  className?: string;
  height?: number | string;
  withBox?: boolean;
}

export default function YesIndiaLogo({
  className = "",
  height = 44,
  withBox = true,
}: YesIndiaLogoProps) {
  const heightStyle = height
    ? typeof height === "number"
      ? `${height}px`
      : height
    : undefined;

  const content = (
    <img
      src="/images/header-logo.png"
      alt="Iqra Education & Welfare Society & YES India Foundation"
      className="h-full w-auto block select-none object-contain max-h-full"
    />
  );

  if (withBox) {
    return (
      <div
        className={`bg-white px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200/90 shadow-xs inline-flex items-center justify-center shrink-0 ${className}`}
        style={heightStyle ? { height: heightStyle } : undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={heightStyle ? { height: heightStyle } : undefined}
    >
      {content}
    </div>
  );
}
