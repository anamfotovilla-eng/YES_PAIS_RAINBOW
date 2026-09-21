import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Menu, X, Bell, Book, Check, Trash2, Clock, ShieldCheck, Lock } from "lucide-react";
import { AppNotification } from "../types";
import YesIndiaLogo from "./YesIndiaLogo";

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  isAdminLogged?: boolean;
}

export default function Header({
  currentRoute,
  onNavigate,
  notifications = [],
  onMarkAllRead,
  onMarkRead,
  onClearAll,
  isAdminLogged = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { name: "Home", route: "#/" },
    { name: "About Us", route: "#/about" },
    { name: "Contact Us", route: "#/contact" },
  ];

  const handleNavClick = (route: string) => {
    onNavigate(route);
    setIsOpen(false);
    setShowNotifications(false);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    onMarkRead(notif.id);
    setShowNotifications(false);
    setIsOpen(false);
    if (notif.storySlug) {
      onNavigate(`#/story/${notif.storySlug}`);
    } else if (notif.storyId) {
      onNavigate(`#/story/${notif.storyId}`);
    } else {
      onNavigate("#/");
    }
  };

  const isActive = (route: string) => {
    if (route === "#/") {
      return currentRoute === "#/" || currentRoute.startsWith("#/story/");
    }
    return currentRoute === route;
  };

  // Close notifications dropdown when clicking/tapping outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-natural-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Title */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick("#/")}
              className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer py-1"
              aria-label="Go to Home"
            >
              <YesIndiaLogo height={44} withBox={true} />
              <div className="hidden lg:block pl-3 border-l border-slate-200">
                <span className="font-serif font-bold text-lg tracking-tight text-[#322f82] group-hover:text-amber-600 transition-colors block leading-none">
                  Yespaistory Hub
                </span>
                <p className="text-[9px] font-sans font-extrabold text-[#536987] tracking-widest uppercase mt-0.5">
                  Educational Stories
                </p>
              </div>
            </button>
          </div>

          {/* Right Navigation & Utility panel */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 font-medium mr-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.route)}
                  className={`font-sans font-medium text-sm transition-all relative py-1 cursor-pointer ${
                    isActive(item.route)
                      ? "text-natural-primary font-bold"
                      : "text-natural-text hover:text-natural-primary"
                  }`}
                >
                  {item.name}
                  {isActive(item.route) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-natural-primary rounded-full animate-fadeIn" />
                  )}
                </button>
              ))}
            </nav>

            {/* Notification Bell (Desktop & Mobile) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-natural-text hover:text-natural-primary hover:bg-natural-light rounded-xl transition-colors focus:outline-none cursor-pointer relative"
                aria-label="Toggle notifications"
                id="bell-button"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-extrabold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel - Perfectly positioned for mobile & desktop */}
              {showNotifications && (
                <>
                  {/* Backdrop overlay for mobile */}
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-xs sm:hidden z-40"
                    onClick={() => setShowNotifications(false)}
                  />

                  <div className="fixed sm:absolute top-18 sm:top-full left-3 sm:left-auto right-3 sm:right-0 mt-2 sm:mt-2 w-auto sm:w-96 bg-white border border-natural-border rounded-2xl shadow-2xl sm:shadow-xl overflow-hidden z-50 animate-fadeIn max-h-[85vh] sm:max-h-[500px] flex flex-col">
                    <div className="p-4 border-b border-natural-border bg-natural-light/40 flex items-center justify-between shrink-0">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-natural-heading">Story Notifications</h3>
                        <p className="text-[10px] text-natural-sand font-medium mt-0.5">Stay up to date with new reading material</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={onMarkAllRead}
                          className="text-[11px] font-sans font-bold text-natural-primary hover:text-natural-heading transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-natural-border/30">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-natural-light rounded-full flex items-center justify-center text-natural-sand mx-auto mb-3">
                            <Bell className="w-5 h-5 text-natural-sand" />
                          </div>
                          <p className="font-serif font-bold text-sm text-natural-heading">All Caught Up!</p>
                          <p className="text-xs text-natural-sand mt-1">No new notifications at this time.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 transition-colors cursor-pointer text-left ${
                              notif.isRead ? "bg-white hover:bg-natural-light/20" : "bg-amber-50/40 hover:bg-amber-50/70"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                notif.isRead ? "bg-natural-light text-natural-sand" : "bg-amber-100 text-amber-700 font-bold"
                              }`}>
                                <Book className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-bold truncate ${notif.isRead ? "text-natural-heading" : "text-[#322f82]"}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                  )}
                                </div>
                                <p className="text-[11px] text-natural-text line-clamp-2 mt-0.5 leading-relaxed">
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono text-natural-sand">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(notif.createdAt)}</span>
                                  <span className="ml-auto text-[10px] font-sans font-bold text-indigo-600">Open Story &rarr;</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 bg-natural-light/20 border-t border-natural-border/50 text-center flex items-center justify-center shrink-0">
                        <button
                          onClick={onClearAll}
                          className="text-[11px] font-sans font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Clear notification history
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>


            {/* Direct Admin Access Button */}
            <button
              onClick={() => handleNavClick(isAdminLogged ? "#/admin-dashboard" : "#/admin")}
              id="header-admin-btn"
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sans font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                currentRoute.startsWith("#/admin") || currentRoute.startsWith("#/portal")
                  ? "bg-[#24285b] text-white border-[#24285b]"
                  : "bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border-slate-200 hover:border-indigo-200"
              }`}
              title="Administrator Management Portal"
            >
              {isAdminLogged ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Panel</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Portal</span>
                </>
              )}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-natural-text hover:text-natural-primary hover:bg-natural-light focus:outline-none cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-natural-border animate-fadeIn">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.route)}
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-sans font-medium text-base transition-colors cursor-pointer ${
                  isActive(item.route)
                    ? "bg-natural-light text-natural-primary font-bold"
                    : "text-natural-text hover:bg-natural-bg hover:text-natural-primary"
                }`}
              >
                {item.name}
              </button>
            ))}
            <div className="pt-2 border-t border-natural-border/60">
              <button
                onClick={() => handleNavClick(isAdminLogged ? "#/admin-dashboard" : "#/admin")}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-xl font-sans font-bold text-sm bg-indigo-50 text-indigo-900 transition-colors cursor-pointer"
              >
                {isAdminLogged ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-indigo-700" />}
                <span>{isAdminLogged ? "Admin Dashboard" : "Admin Portal Login"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
