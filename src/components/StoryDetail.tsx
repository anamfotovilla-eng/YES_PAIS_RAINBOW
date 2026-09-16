import React from "react";
import { Story, Grade, Module } from "../types";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Clock, Tag } from "lucide-react";

interface StoryDetailProps {
  story: Story;
  grade: Grade | undefined;
  module: Module | undefined;
  allStories: Story[];
  onBack: () => void;
  onNavigateStory: (slug: string) => void;
}

export default function StoryDetail({
  story,
  grade,
  module,
  allStories,
  onBack,
  onNavigateStory,
}: StoryDetailProps) {
  // Find published stories to calculate next and previous buttons
  const publishedStories = allStories.filter((s) => s.isPublished);
  const currentIndex = publishedStories.findIndex((s) => s.id === story.id);
  
  const prevStory = currentIndex > 0 ? publishedStories[currentIndex - 1] : null;
  const nextStory = currentIndex < publishedStories.length - 1 ? publishedStories[currentIndex + 1] : null;

  return (
    <article id={`story-page-${story.slug}`} className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-natural-sand hover:text-natural-primary font-sans font-bold text-sm mb-6 sm:mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Stories
      </button>

      {/* Story Header */}
      <header className="mb-6 sm:mb-8 text-center sm:text-left">
        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5 mb-4">
          {grade && (
            <span className="px-3 py-1 bg-natural-light text-natural-heading text-xs font-bold rounded-full uppercase tracking-wider border border-natural-border">
              {grade.name}
            </span>
          )}
          {module && (
            <span className="px-3 py-1 bg-natural-bg text-natural-primary text-xs font-bold rounded-full uppercase tracking-wider border border-natural-border">
              {module.name}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-natural-sand text-xs font-sans font-medium">
            <Clock className="w-3.5 h-3.5" />
            5 min read
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#322f82] tracking-tight leading-tight">
          {story.title}
        </h1>
        
        {/* Student Author Badge */}
        <div className="mt-4 flex items-center justify-center sm:justify-start gap-2.5 text-sm text-natural-muted">
          <span className="font-sans font-semibold text-slate-500">Story crafted by:</span>
          <span className="px-3 py-1 bg-[#cbdbee]/60 text-[#322f82] font-extrabold rounded-lg border border-[#cbdbee] tracking-wide text-xs">
            👤 {story.studentName || "Student Author"}
          </span>
        </div>

        <p className="text-natural-muted mt-4 text-lg leading-relaxed max-w-3xl italic">
          "{story.description}"
        </p>
      </header>

      {/* Featured Image */}
      <div className="relative h-64 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden mb-8 sm:mb-12 shadow-sm border border-natural-border">
        <img
          src={story.imageUrl || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop"}
          alt={story.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Full Content Block with Cozy Kid-Friendly Typography */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-natural-border shadow-sm mb-12">
        <div className="prose max-w-none">
          {story.content.split("\n\n").map((paragraph, idx) => (
            <p
              key={idx}
              className="text-natural-text text-base sm:text-lg leading-loose font-serif mb-6 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Keyword tags */}
        {story.keywords && story.keywords.length > 0 && (
          <div className="mt-10 pt-6 border-t border-natural-border/60 flex flex-wrap gap-2">
            <span className="text-xs font-bold text-natural-sand flex items-center gap-1 mr-2">
              <Tag className="w-3.5 h-3.5" /> Keywords:
            </span>
            {story.keywords.map((word) => (
              <span
                key={word}
                className="px-2.5 py-1 bg-natural-bg hover:bg-natural-light text-natural-text hover:text-natural-heading text-xs font-sans rounded-lg transition-colors border border-natural-border/60"
              >
                #{word}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Footer (Prev & Next) */}
      <div className="border-t border-natural-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {prevStory ? (
          <button
            onClick={() => onNavigateStory(prevStory.slug)}
            className="w-full sm:w-auto flex items-center gap-3 p-4 bg-white hover:bg-natural-light border border-natural-border rounded-xl text-left transition-all group cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-natural-primary group-hover:-translate-x-1 transition-transform shrink-0" />
            <div className="overflow-hidden">
              <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-natural-sand">Previous Story</span>
              <span className="block font-serif font-bold text-natural-heading text-sm truncate max-w-[200px]">
                {prevStory.title}
              </span>
            </div>
          </button>
        ) : (
          <div className="hidden sm:block w-[1px]" />
        )}

        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-natural-light hover:bg-natural-border text-natural-text font-sans font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer border border-natural-border"
        >
          Portal Catalog
        </button>

        {nextStory ? (
          <button
            onClick={() => onNavigateStory(nextStory.slug)}
            className="w-full sm:w-auto flex items-center justify-between gap-3 p-4 bg-white hover:bg-natural-light border border-natural-border rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="overflow-hidden text-left sm:text-right">
              <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-natural-sand">Next Story</span>
              <span className="block font-serif font-bold text-natural-heading text-sm truncate max-w-[200px]">
                {nextStory.title}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-natural-primary group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        ) : (
          <div className="hidden sm:block w-[1px]" />
        )}
      </div>
    </article>
  );
}
