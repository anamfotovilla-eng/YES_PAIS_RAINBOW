import React, { useState } from "react";
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { verifyAdminLoginAsync } from "../lib/storage";

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigateHome }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter your registered email and password.");
      return;
    }

    setLoading(true);

    try {
      const isValid = await verifyAdminLoginAsync(cleanEmail, cleanPassword);
      if (isValid) {
        localStorage.setItem("yespaistory_admin_logged", "true");
        sessionStorage.setItem("yespaistory_admin_logged", "true");
        onLoginSuccess();
      } else {
        setError("Access denied: Invalid administrator credentials.");
      }
    } catch {
      setError("Authentication failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-page" className="max-w-md mx-auto px-4 py-12 sm:py-16 animate-scaleIn text-natural-text">
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-sm">
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-900 rounded-2xl mb-4 shadow-xs">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="font-bold text-2xl text-slate-900 tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 uppercase font-bold tracking-wider">
            RESTRICTED MANAGEMENT AREA
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex gap-2.5 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              ADMIN USERNAME OR EMAIL
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="login-email"
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter administrator username or email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent text-slate-900 text-sm placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              ADMIN PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent text-slate-900 text-sm placeholder:text-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#24285b] hover:bg-[#1a1e48] disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Unlock Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onNavigateHome}
            className="text-[#24285b] hover:underline text-xs font-sans font-bold cursor-pointer"
          >
            Return to Public Home Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
