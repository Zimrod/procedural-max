"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User, Coins, Clapperboard } from "lucide-react";
import { useAuth } from "./AuthContext";

const MAIN_SITE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://journey18miles.com";

export function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // Capture current Studio URL for seamless redirect back after main site login
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Point to Main Site root with trigger param + return URL
  const loginRedirectUrl = `${MAIN_SITE}?auth=login&redirect=${encodeURIComponent(
    currentUrl || "https://studio.journey18miles.com"
  )}`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#141414]/90 backdrop-blur-md px-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-[1700px] items-center justify-between gap-4">
        
        {/* Logo */}
        <a href="/" className="font-black text-white tracking-tighter text-xl uppercase">
          Journey<span className="text-zinc-500">18</span>Miles
        </a>

        {/* Desktop Navigation & User Controls */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            href={MAIN_SITE}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
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

          <div className="h-4 w-px bg-neutral-800" />

          {/* User Area */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
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

                {/* Quotas & Balances */}
                <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Coins size={14} className="text-amber-400" />
                      AI Tokens:
                    </span>
                    <span className="font-bold text-amber-400">{user?.tokens ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clapperboard size={14} className="text-emerald-400" />
                      Render Credits:
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

        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden text-white p-1 hover:text-zinc-300 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-neutral-800 bg-[#141414] px-4 py-6">
          <div className="flex flex-col gap-4">
            <Link
              href={MAIN_SITE}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white py-1"
            >
              <svg
                className="h-4 w-4"
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

            <div className="border-t border-neutral-800 pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-white">{user.name || user.email}</p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">AI Tokens:</span>
                        <span className="font-bold text-amber-400">{user?.tokens ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Render Credits:</span>
                        <span className="font-bold text-emerald-400">{user?.credits ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="block w-full text-center py-2.5 rounded-lg bg-red-900/30 text-red-400 border border-red-800/50 text-xs font-medium hover:bg-red-900/50 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <a
                  href={loginRedirectUrl}
                  className="block w-full text-center py-3 rounded-lg bg-emerald-500 text-black font-semibold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                >
                  Log in via Main Site
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}