import React from "react";
import { ShiningStar } from "../types";
import { Star, Award } from "lucide-react";

interface ShiningStarsSectionProps {
  stars: ShiningStar[];
}

export default function ShiningStarsSection({ stars = [] }: ShiningStarsSectionProps) {
  if (!stars || stars.length === 0) {
    return null;
  }

  return (
    <section id="shining-stars-section" className="mb-12 animate-fadeIn">
      {/* Section Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white/90 to-amber-50/50 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-indigo-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-200/60 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs font-sans font-extrabold uppercase tracking-wider mb-2 shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>Hall of Fame</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#322f82] flex items-center gap-2 tracking-tight">
              <span>Shining Stars</span>
              <span className="text-amber-500">⭐</span>
            </h2>
            <p className="text-natural-muted text-xs sm:text-sm font-sans font-medium mt-1">
              Celebrating our students who have written the best stories.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-800 bg-white/80 px-3.5 py-1.5 rounded-xl border border-amber-200">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Top Student Storytellers</span>
          </div>
        </div>

        {/* Responsive Stars Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
          {stars.map((star) => (
            <div
              key={star.id}
              className="group bg-white rounded-2xl p-5 border border-amber-200/90 hover:border-amber-400 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Star corner accent */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-100 rounded-full flex items-end justify-start p-2 pointer-events-none text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              </div>

              <div>
                {/* 1. Student Name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    ⭐
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-[#322f82] group-hover:text-amber-700 transition-colors leading-snug">
                    {star.studentName}
                  </h3>
                </div>

                {/* 2. Class & 3. Division - Only displayed fields */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="flex-1 bg-slate-50/90 rounded-xl px-3 py-2 border border-slate-200/70">
                    <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">
                      Class
                    </span>
                    <span className="block text-xs font-bold text-[#322f82] mt-0.5 truncate">
                      {star.className}
                    </span>
                  </div>

                  <div className="flex-1 bg-amber-50/80 rounded-xl px-3 py-2 border border-amber-200/60">
                    <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-amber-700">
                      Division
                    </span>
                    <span className="block text-xs font-bold text-amber-900 mt-0.5 truncate">
                      {star.division}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
