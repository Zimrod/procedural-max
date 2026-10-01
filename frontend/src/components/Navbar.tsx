"use client";

import { useState } from "react";
import {
  Menu,
  X,
  Download,
  Film,
  Clock,
  HardDrive,
  Loader2,
  User,
  Sparkles,
  Clapperboard,
  LogOut,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthModal } from "./AuthModal";

export interface RenderedVideoItem {
  id: string;
  title: string;
  downloadUrl: string;
  createdAt: string;
  fileSize?: string;
  aspectRatio?: number;
  status: "completed" | "rendering" | "failed";
}

interface NavbarProps {
  renders?: RenderedVideoItem[];
}

export function Navbar({ renders = [] }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeRendersCount = renders.filter((r) => r.status === "completed").length;

  const renderCredits = user?.credits ?? (user as Record<string, any>)?.render_credits ?? 0;
  const aiCredits = (user as Record<string, any>)?.ai_tokens ?? (user as Record<string, any>)?.ai_credits ?? 0;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#141414]/90 backdrop-blur-md px-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-[1700px] items-center justify-between gap-4">
          
          {/* Logo */}
          <a href="/" className="font-black text-white tracking-tighter text-xl uppercase">
            Journey<span className="text-zinc-500">18</span>Miles
          </a>

          {/* Desktop Navigation & User Controls */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* DOWNLOADS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setShowDownloads(!showDownloads);
                }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors relative"
              >
                <Download size={14} className="text-emerald-400" />
                <span>Downloads</span>
                {activeRendersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    {activeRendersCount}
                  </span>
                )}
              </button>

              {showDownloads && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800">
                  <div className="px-3.5 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Film size={14} className="text-emerald-600" /> Recent Rendered Videos
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">{renders.length} total</span>
                  </div>

                  <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {renders.length === 0 ? (
                      <div className="p-6 text-center text-xs font-medium text-slate-500">
                        No rendered videos yet.
                      </div>
                    ) : (
                      renders.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                              {item.title || "Untitled Render"}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={10} className="text-slate-400" /> {item.createdAt}
                              </span>
                              {item.fileSize && (
                                <span className="flex items-center gap-1">
                                  <HardDrive size={10} className="text-slate-400" /> {item.fileSize}
                                </span>
                              )}
                            </div>
                          </div>

                          {item.status === "completed" ? (
                            <a
                              href={item.downloadUrl}
                              download={`${item.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex-shrink-0"
                              title="Download MP4"
                            >
                              <Download size={14} />
                            </a>
                          ) : item.status === "rendering" ? (
                            <Loader2 size={14} className="animate-spin text-amber-500 flex-shrink-0" />
                          ) : (
                            <span className="text-[10px] font-semibold text-red-600">Failed</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-zinc-800" />

            {/* USER & CREDITS MENU */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => {
                    setShowDownloads(false);
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800/80 bg-zinc-900/50"
                >
                  <User size={15} className="text-zinc-400" />
                  <span className="font-semibold text-zinc-200">
                    {user.name || user.email?.split("@")[0]}
                  </span>

                  {/* Quick Credit Badges */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      <Sparkles size={10} />
                      {aiCredits} AI
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                      <Clapperboard size={10} />
                      {renderCredits} Renders
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors"
                >
                  <User size={14} />
                  <span>Log in</span>
                </button>
              )}

              {/* User Dropdown */}
              {user && showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden text-zinc-200">
                  <div className="p-3.5 border-b border-zinc-800 bg-zinc-950">
                    <p className="text-xs font-bold text-white truncate">{user.name || "Account User"}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>

                  {/* Credits Dashboard */}
                  <div className="p-3 space-y-2 border-b border-zinc-800 bg-zinc-900/60">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="text-xs font-medium text-zinc-300">AI Tokens</span>
                      </div>
                      <span className="text-xs font-bold text-amber-400">{aiCredits}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Clapperboard size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium text-zinc-300">Render Credits</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{renderCredits}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 p-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden text-white p-1 hover:text-zinc-300 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 py-4 px-4 space-y-4">
            {user ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <p className="text-xs font-bold text-white">{user.name || "User"}</p>
                  <p className="text-[11px] text-zinc-400">{user.email}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800">
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-400" /> AI
                      </span>
                      <span className="text-xs font-bold text-amber-400">{aiCredits}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clapperboard size={10} className="text-emerald-400" /> Renders
                      </span>
                      <span className="text-xs font-bold text-emerald-400">{renderCredits}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-center py-2.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full text-center py-2.5 rounded-lg bg-white text-black text-xs font-bold"
              >
                Log in / Register
              </button>
            )}
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}