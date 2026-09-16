import React from "react";
import { Lock } from "lucide-react";
import SchoolLogo from "./SchoolLogo";

interface FooterProps {
  onNavigate: (route: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="main-footer" className="bg-white text-natural-text py-12 mt-auto border-t border-natural-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-natural-border">
          <div className="flex items-center justify-center lg:justify-start">
            <SchoolLogo height={48} />
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-sm font-medium">
            <button onClick={() => onNavigate("#/")} className="text-natural-text hover:text-[#322f82] font-sans font-semibold transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => onNavigate("#/about")} className="text-natural-text hover:text-[#322f82] font-sans font-semibold transition-colors cursor-pointer">
              About Us
            </button>
            <button onClick={() => onNavigate("#/contact")} className="text-natural-text hover:text-[#322f82] font-sans font-semibold transition-colors cursor-pointer">
              Contact Us
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-natural-muted">
          <p>@2026 P.A. Inamdar School | All rights reserved.</p>
          <div className="flex items-center gap-3">
            <p className="font-sans font-semibold text-[10px] tracking-wider uppercase text-slate-400">
              A School-Friendly Digital Portal
            </p>
            <span className="text-slate-300">•</span>
            <button
              id="footer-admin-access-btn"
              onClick={() => onNavigate("#/admin")}
              className="text-slate-500 hover:text-[#322f82] font-sans font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Admin Portal Login"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
