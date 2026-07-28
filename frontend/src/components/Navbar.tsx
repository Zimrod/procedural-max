// src/components/Navbar.tsx
"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 h-12 w-full border-b border-neutral-800 bg-[#141414]/90 backdrop-blur-md px-4 sm:px-6">
      <div className="mx-auto flex h-full max-w-[1700px] items-center justify-between gap-4">
        
        {/* Left Section: Logo & Studio Badge */}
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-bold text-white hover:opacity-80 transition-opacity"
          >
            {/* Replace SVG or img tag with your official logo */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-black text-white shadow-sm">
              S
            </div>
            <span className="tracking-tight text-sm font-semibold">
              Studio
            </span>
          </Link>
          
          <span className="hidden sm:inline-block rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-800/50">
            Workspace
          </span>
        </div>

        {/* Center / Navigation: Main Site Home Link */}
        <nav className="flex items-center">
          <Link
            href="/"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Return to Main Site</span>
          </Link>
        </nav>

        {/* Right Section: Login Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-200 border border-neutral-700/60 hover:bg-neutral-700 hover:text-white transition-all shadow-sm"
          >
            Log In
          </Link>
        </div>

      </div>
    </header>
  );
}