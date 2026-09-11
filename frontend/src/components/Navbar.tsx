"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  User,
  Coins,
  Clapperboard,
  Download,
  Film,
  Clock,
  HardDrive,
  Loader2,
} from "lucide-react";
import { useAuth } from "./AuthContext";

const MAIN_SITE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://journey18miles.com";

export interface RenderedVideoItem {
  id: string;
  title: string;
  downloadUrl: string;
  createdAt: string;
  fileSize?: string;
  status: "completed" | "rendering" | "failed";
}

interface NavbarProps {
  // Optional prop to pass rendered history dynamically from parent context or state
  renders?: RenderedVideoItem[];
}

export function Navbar({ renders = [] }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const loginRedirectUrl = `${MAIN_SITE}?auth=login&redirect=${encodeURIComponent(
    currentUrl || "https://studio.journey18miles.com"
  )}`;

  const activeRendersCount = renders.filter((r) => r.status === "completed").length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#141414]/90 backdrop-blur-md px-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-[1700px] items-center justify-between gap-4">
        
        {/* Logo */}
        <a href="/" className="font-black text-white tracking-tighter text-xl uppercase">
          Journey<span className="text-zinc-500">18</span>Miles
        </a>

        {/* Desktop Navigation & User Controls */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href={MAIN_SITE}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Main Site</span>
          </Link>

          {/* ---------------- DOWNLOADS DROPDOWN BUTTON ---------------- */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDownloads(!showDownloads);
                setShowUserMenu(false);
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

            {/* Dropdown Container */}
            {showDownloads && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800">
                <div className="px-3.5 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Film size={14} className="text-emerald-600" /> Recent Rendered Videos
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">{renders.length} total</span>
                </div>

                {/* Dynamic Height List: max 5 visible (~340px), scrolls beyond */}
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

          <div className="h-4 w-px bg-neutral-800" />

          {/* User Area */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowDownloads(false);
                }}
                className="flex items-center gap-2 text-white hover:text-zinc-300 transition-colors"
              >
                <User size={18} />
                <span className="text-xs font-medium">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>
            ) : (
              <a
                href={loginRedirectUrl}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
              >
                <User size={16} />
                <span>Log in</span>
              </a>
            )}

            {/* User Dropdown */}
            {user && showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-2 z-50 text-zinc-100">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>

                <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Coins size={14} className="text-amber-400" /> AI Tokens:
                    </span>
                    <span className="font-bold text-amber-400">{user?.ai_tokens ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clapperboard size={14} className="text-emerald-400" /> Render Credits:
                    </span>
                    <span className="font-bold text-emerald-400">{user?.credits ?? 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-zinc-800 transition-colors mt-1"
                >
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
    </nav>
  );
}