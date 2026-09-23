import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StoryCard from "./components/StoryCard";
import StoryDetail from "./components/StoryDetail";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

import { Story, Grade, Module, AppNotification, ShiningStar } from "./types";
import {
  getStories,
  getGrades,
  getModules,
  getNotifications,
  saveNotifications,
  fetchStoriesAsync,
  fetchNotificationsAsync,
  markNotificationReadAsync,
  markAllNotificationsReadAsync,
  clearAllNotificationsAsync,
  getShiningStars,
  fetchShiningStarsAsync,
} from "./lib/storage";
import ShiningStarsSection from "./components/ShiningStarsSection";
import { BookOpen, Search, Sparkles, FilterX, HelpCircle, Layers, ArrowRight } from "lucide-react";

const STORIES_PER_PAGE = 6;

export default function App() {
  // Navigation Routing State
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.hash || "#/");

  // Core Database States
  const [stories, setStories] = useState<Story[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [shiningStars, setShiningStars] = useState<ShiningStar[]>([]);

  // User Interactive States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdminLogged, setIsAdminLogged] = useState(false);

  // Synchronize on mount and monitor URL hash changes
  useEffect(() => {
    // Initial fetch from storage & sync from server API
    refreshAppDatabase();
    fetchStoriesAsync().then((fresh) => {
      if (fresh) {
        setStories(fresh);
      }
    });
    fetchNotificationsAsync().then((freshNotifs) => {
      if (freshNotifs) {
        setNotifications(freshNotifs);
      }
    });
    fetchShiningStarsAsync().then((freshStars) => {
      if (freshStars) {
        setShiningStars(freshStars);
      }
    });

    // Check auth session
    const isLogged =
      sessionStorage.getItem("yespaistory_admin_logged") === "true" ||
      localStorage.getItem("yespaistory_admin_logged") === "true";
    setIsAdminLogged(isLogged);

    const handleHashChange = () => {
      const newHash = window.location.hash || "#/";
      setCurrentRoute(newHash);
      // Reset page when returning or navigating to prevent blank pages
      setCurrentPage(1);
      // Ensure we fetch freshest data if admin edits have occurred
      refreshAppDatabase();
      fetchStoriesAsync().then((fresh) => {
        if (fresh) {
          setStories(fresh);
        }
      });
      fetchNotificationsAsync().then((freshNotifs) => {
        if (freshNotifs) {
          setNotifications(freshNotifs);
        }
      });
      fetchShiningStarsAsync().then((freshStars) => {
        if (freshStars) {
          setShiningStars(freshStars);
        }
      });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const refreshAppDatabase = () => {
    setStories(getStories());
    setGrades(getGrades());
    setModules(getModules());
    setNotifications(getNotifications());
    setShiningStars(getShiningStars());
  };

  const handleMarkAllRead = () => {
    markAllNotificationsReadAsync();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkRead = (id: string) => {
    markNotificationReadAsync(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleClearAll = () => {
    clearAllNotificationsAsync();
    setNotifications([]);
  };

  const handleNavigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdminSuccess = () => {
    localStorage.setItem("yespaistory_admin_logged", "true");
    sessionStorage.setItem("yespaistory_admin_logged", "true");
    setIsAdminLogged(true);
    handleNavigate("#/admin-dashboard");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("yespaistory_admin_logged");
    sessionStorage.removeItem("yespaistory_admin_logged");
    setIsAdminLogged(false);
    handleNavigate("#/");
  };

  // Advanced Search and Filter Logic:
  // "Search stories by: Story title, Module name, Keywords, Grade."
  // Show only published stories on the public homepage.
  const publicPublishedStories = stories.filter((s) => s.isPublished);

  const filteredStories = publicPublishedStories.filter((story) => {
    // 1. Grade Filtering
    if (selectedGradeId !== "all" && story.gradeId !== selectedGradeId) {
      return false;
    }

    // 2. Search Query Matching (title, module name, keywords, grade name)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const storyTitle = story.title.toLowerCase();
      const storyKeywords = story.keywords?.map((k) => k.toLowerCase()) || [];
      
      const storyGrade = grades.find((g) => g.id === story.gradeId);
      const gradeName = storyGrade ? storyGrade.name.toLowerCase() : "";

      const storyMod = modules.find((m) => m.id === story.moduleId);
      const moduleName = storyMod ? storyMod.name.toLowerCase() : "";

      const matchesTitle = storyTitle.includes(query);
      const matchesKeywords = storyKeywords.some((k) => k.includes(query));
      const matchesGrade = gradeName.includes(query);
      const matchesModule = moduleName.includes(query);

      return matchesTitle || matchesKeywords || matchesGrade || matchesModule;
    }

    return true;
  });

  // Pagination Math
  const totalFilteredCount = filteredStories.length;
  const totalPages = Math.ceil(totalFilteredCount / STORIES_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * STORIES_PER_PAGE;
  const paginatedStories = filteredStories.slice(startIndex, startIndex + STORIES_PER_PAGE);

  // Router Parser
  const renderContent = () => {
    // 1. STORY DETAIL ROUTE
    if (currentRoute.startsWith("#/story/")) {
      const slug = currentRoute.replace("#/story/", "");
      const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
      const foundStory = stories.find((s) => {
        const sSlug = String(s.slug || "").trim().toLowerCase();
        const sId = String(s.id || "").trim().toLowerCase();
        return sSlug === cleanSlug || sId === cleanSlug || s.slug === slug || s.id === slug;
      });

      if (foundStory) {
        const gradeObj = grades.find((g) => g.id === foundStory.gradeId);
        const modObj = modules.find((m) => m.id === foundStory.moduleId);

        return (
          <StoryDetail
            story={foundStory}
            grade={gradeObj}
            module={modObj}
            allStories={stories}
            onBack={() => handleNavigate("#/")}
            onNavigateStory={(nextSlug) => handleNavigate(`#/story/${nextSlug}`)}
          />
        );
      } else {
        return (
          <div className="text-center py-20 px-4 animate-scaleIn">
            <h2 className="text-2xl font-extrabold text-slate-800">Story Not Found</h2>
            <p className="text-slate-500 mt-2">The story you are looking for does not exist or has been modified.</p>
            <button
              onClick={() => handleNavigate("#/")}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
            >
              Return Home
            </button>
          </div>
        );
      }
    }

    // 2. ABOUT ROUTE
    if (currentRoute === "#/about") {
      return <AboutUs />;
    }

    // 3. CONTACT ROUTE
    if (currentRoute === "#/contact") {
      return <ContactUs />;
    }

    // 4. DEDICATED ADMIN PORTAL & DASHBOARD ROUTES (Strictly Protected)
    const isAdminRoute =
      currentRoute.startsWith("#/admin") ||
      currentRoute === "#/portal" ||
      currentRoute.startsWith("#/portal/");

    if (isAdminRoute) {
      if (isAdminLogged) {
        return (
          <AdminDashboard
            onLogout={handleAdminLogout}
            onNavigateHome={() => handleNavigate("#/")}
          />
        );
      }
      return (
        <AdminLogin
          onLoginSuccess={handleAdminSuccess}
          onNavigateHome={() => handleNavigate("#/")}
        />
      );
    }

    // 6. DEFAULT HOMEPAGE CATALOG ROUTE
    return (
      <div className="animate-fadeIn">
        {/* Premium Gen Z Hero Banner with Glassmorphism */}
        <section className="glass-card text-natural-text py-16 px-8 sm:px-16 rounded-3xl mb-12 relative overflow-hidden shadow-sm border border-natural-border">
          {/* Ambient high-tech neon glow bubble backgrounds */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#ADD8E6]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-100px] left-[10%] w-80 h-80 bg-[#000080]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl relative z-10 space-y-4">
            <span className="bg-white/80 border border-white text-[#322f82] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-xs">
              ✨ Yespaistory Hub
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-[#322f82] leading-tight">
              A Collection of Stories. <br className="hidden sm:inline" />
              <span className="text-[#322f82] bg-gradient-to-r from-[#322f82] via-[#25226e] to-amber-600 bg-clip-text text-transparent">
                A Hundred Different Imaginations.
              </span>
            </h1>
            <p className="text-natural-muted text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl font-sans font-medium">
              Explore our collection of educational stories designed by students from Grade 1 to Grade 10. Each story brings learning to life through adventure, science, history, and moral lessons.
            </p>
          </div>
        </section>

        {/* Shining Stars Section ⭐ */}
        <ShiningStarsSection stars={shiningStars} />

        {/* Search Bar & Grade Filter Block */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm mb-8 animate-fadeIn border border-natural-border">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-natural-sand w-5 h-5" />
            <input
              type="text"
              placeholder="Search by keywords, title, or student author..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // reset to page 1 on search
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-natural-border rounded-xl text-[#322f82] placeholder-natural-sand font-sans focus:outline-none focus:ring-2 focus:ring-[#322f82] text-base transition-all shadow-xs"
            />
          </div>

          {/* Grade Navigation buttons below search bar */}
          <div className="mt-8">
            <p className="text-xs font-sans font-bold uppercase tracking-widest text-[#322f82] mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#322f82]" /> 
              <span>FILTER BY STUDENT GRADE LEVEL (GRADE 1 - 10)</span>
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setSelectedGradeId("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 text-xs font-sans font-extrabold rounded-full transition-all cursor-pointer border ${
                  selectedGradeId === "all"
                    ? "bg-[#322f82] text-white shadow-md border-[#322f82]"
                    : "bg-white/80 text-[#322f82] hover:bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                All Grades
              </button>
              {grades.map((grade) => (
                <button
                  key={grade.id}
                  onClick={() => {
                    setSelectedGradeId(grade.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2.5 text-xs font-sans font-extrabold rounded-full transition-all cursor-pointer border ${
                    selectedGradeId === grade.id
                      ? "bg-[#322f82] text-white shadow-md border-[#322f82]"
                      : "bg-white/80 text-[#322f82] hover:bg-white hover:text-[#322f82] border-slate-200/80 shadow-xs"
                  }`}
                >
                  {grade.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stories Listing Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-serif text-natural-heading">
            {selectedGradeId === "all" ? "All Stories" : `${grades.find((g) => g.id === selectedGradeId)?.name} Stories`}
            {searchQuery && <span className="text-sm font-sans font-medium text-natural-sand ml-2">({totalFilteredCount} matching results)</span>}
          </h2>
          <span className="text-xs font-sans font-medium text-natural-sand">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Story Grid layout */}
        {paginatedStories.length === 0 ? (
          <div className="bg-white border border-dashed border-natural-border rounded-3xl py-12 px-6 text-center max-w-2xl mx-auto my-6 shadow-xs">
            {publicPublishedStories.length === 0 ? (
              <div className="py-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200/60 shadow-xs">
                  <BookOpen className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#322f82]">
                  Our Student Library is Getting Ready 📚
                </h3>
                <p className="text-natural-muted text-sm sm:text-base max-w-md mx-auto mt-2.5 leading-relaxed font-sans">
                  New stories written by our students will appear here as soon as they are added and published by the administration.
                </p>
              </div>
            ) : (
              <div className="py-6">
                <FilterX className="w-12 h-12 text-natural-sand mx-auto mb-3" />
                <h3 className="text-lg font-bold font-serif text-natural-heading">No Stories Match Your Search</h3>
                <p className="text-natural-muted text-sm max-w-md mx-auto mt-2 font-sans">
                  Try searching for another keyword or select a different class filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedGradeId("all");
                  }}
                  className="mt-5 px-5 py-2.5 bg-[#322f82] hover:bg-[#252267] text-white font-sans font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {paginatedStories.map((story) => {
              const gradeObj = grades.find((g) => g.id === story.gradeId);
              const modObj = modules.find((m) => m.id === story.moduleId);

              return (
                <StoryCard
                  key={story.id}
                  story={story}
                  grade={gradeObj}
                  module={modObj}
                  onReadMore={(slug) => handleNavigate(`#/story/${slug}`)}
                />
              );
            })}
          </div>
        )}

        {/* Responsive Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-natural-border/60 pt-8 mb-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white hover:bg-natural-light disabled:bg-natural-bg disabled:text-natural-sand border border-natural-border text-natural-text font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              Previous
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === p
                      ? "bg-natural-primary text-white shadow-sm"
                      : "bg-white hover:bg-natural-light text-natural-text border border-natural-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white hover:bg-natural-light disabled:bg-natural-bg disabled:text-natural-sand border border-natural-border text-natural-text font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#e1eaf7] flex flex-col font-sans text-natural-text">
      {/* Dynamic Navigation Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
        onClearAll={handleClearAll}
        isAdminLogged={isAdminLogged}
      />

      {/* Primary Layout Wrapper */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Dynamic Layout Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
