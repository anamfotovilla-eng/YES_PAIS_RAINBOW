import React from "react";
import { Story, Grade, Module } from "../types";
import { BookOpen, User } from "lucide-react";

interface StoryCardProps {
  key?: string;
  story: Story;
  grade: Grade | undefined;
  module: Module | undefined;
  onReadMore: (slug: string) => void;
}

export default function StoryCard({ story, grade, module, onReadMore }: StoryCardProps) {
  // Determine if there is a primary tag to show in the top right, e.g. first keyword, or fallback to "Tales"
  const tagText = story.keywords && story.keywords[0] ? story.keywords[0] : "Story";

  return (
    <article
      id={`story-card-${story.id}`}
      className="glass-card rounded-3xl p-5 shadow-sm border border-natural-border flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#322f82] via-[#ADD8E6] to-[#322f82] opacity-80" />

      {/* Thumbnail Block */}
      <div className="w-full aspect-[4/3] bg-white rounded-2xl overflow-hidden relative shadow-inner">
        <img
          src={story.imageUrl || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop"}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {/* Subtle decorative grade indicator on image */}
        <div className="absolute top-3 left-3 bg-[#322f82]/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-wider uppercase border border-[#ADD8E6]/25">
          {grade ? grade.name : "All Grades"}
        </div>
      </div>

      {/* Narrative Info */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-natural-muted">
              {module ? module.name : "Module"}
            </span>
            <span className="text-[10px] font-bold bg-[#cbdbee]/60 text-[#322f82] px-2.5 py-0.5 rounded-full border border-[#cbdbee] capitalize tracking-wide">
              {tagText}
            </span>
          </div>

          <h3 className="text-lg font-bold font-serif leading-tight text-[#322f82] group-hover:text-amber-600 transition-colors line-clamp-2">
            {story.title}
          </h3>

          {/* Student Author Tag - Mandatory display */}
          <div className="flex items-center gap-1.5 py-1 text-xs text-natural-muted">
            <User className="w-3.5 h-3.5 text-[#322f82]" />
            <span>By</span>
            <span className="font-bold text-[#322f82] bg-white/80 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/80">
              {story.studentName || "Student Author"}
            </span>
          </div>
          
          <p className="text-sm text-natural-muted leading-relaxed line-clamp-3">
            {story.description}
          </p>
        </div>

        <div className="pt-3.5 border-t border-natural-border/60 flex items-center justify-between mt-auto">
          {/* Keyword tags */}
          <div className="flex gap-1 overflow-hidden max-w-[55%]">
            {story.keywords?.slice(0, 2).map((word) => (
              <span key={word} className="text-[10px] font-sans font-semibold text-natural-sand truncate">
                #{word}
              </span>
            ))}
          </div>

          <button
            onClick={() => onReadMore(story.slug)}
            className="px-4 py-2 genz-button font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            Read More
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </article>
  );
}
