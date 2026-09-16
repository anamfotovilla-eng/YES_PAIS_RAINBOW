import React, { useEffect, useState } from "react";
import { getAboutContent } from "../lib/storage";
import { AboutUsContent } from "../types";
import { Award, Compass, Target } from "lucide-react";

export default function AboutUs() {
  const [content, setContent] = useState<AboutUsContent | null>(null);

  useEffect(() => {
    setContent(getAboutContent());
  }, []);

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div id="about-page" className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn text-natural-text">
      {/* Decorative top badge */}
      <div className="flex justify-center mb-4">
        <span className="bg-natural-light border border-natural-border text-natural-primary text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
          Our Story
        </span>
      </div>

      <h1 className="text-4xl font-bold font-serif text-center text-natural-heading mb-6 tracking-tight">
        {content.title}
      </h1>
      
      <p className="text-lg text-natural-muted text-center max-w-2xl mx-auto mb-12 leading-relaxed">
        We believe that a single well-told story can spark a lifetime of curiosity, reading confidence, and scientific discovery.
      </p>

      {/* Main image / illustration block */}
      <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden mb-12 shadow-sm border border-natural-border">
        <img
          src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop"
          alt="Children reading stories"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-natural-heading/80 via-natural-heading/20 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-white max-w-md">
          <p className="text-xs font-sans font-bold uppercase tracking-widest text-natural-light">Inspired Learning</p>
          <p className="font-serif font-semibold text-lg sm:text-xl text-white mt-1">Nurturing imagination, comprehension, and literacy for every grade.</p>
        </div>
      </div>

      {/* Core Narrative */}
      <div className="bg-white rounded-3xl p-8 border border-natural-border shadow-sm mb-12">
        <p className="text-natural-text whitespace-pre-wrap leading-relaxed text-base sm:text-lg font-sans">
          {content.content}
        </p>
      </div>

      {/* Mission & Vision cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-natural-card-border shadow-sm flex gap-4">
          <div className="p-3 bg-[#322f82] rounded-xl text-white h-fit shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-[#322f82] mb-3">Our Mission</h2>
            <div className="text-natural-text/90 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-3 font-sans">
              {content.mission}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-natural-card-border shadow-sm flex gap-4">
          <div className="p-3 bg-[#322f82] rounded-xl text-white h-fit shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-[#322f82] mb-3">Our Vision</h2>
            <div className="text-natural-text/90 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-3 font-sans">
              {content.vision}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
