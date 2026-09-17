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
} from "lucide-react";
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
  // Optional prop to pass rendered history dynamically from parent context or state
  renders?: RenderedVideoItem[];
}

export function Navbar({ renders = [] }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);

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
          {/* ---------------- DOWNLOADS DROPDOWN BUTTON ---------------- */}
          <div className="relative">
            <button
              onClick={() => {
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
