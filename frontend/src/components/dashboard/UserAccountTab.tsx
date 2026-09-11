"use client";

import { useState } from "react";
import {
  Calendar,
  HardDrive,
  Download,
  Play,
  FileVideo,
  User,
  CreditCard,
  Key,
  Settings,
  Coins,
  Clapperboard,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

export type UserAccountSubTab = "videos" | "profile" | "billing" | "api" | "settings";

export interface VideoItem {
  id: string;
  title: string;
  date: string;
  size: string;
  videoUrl: string;
}

const PLACEHOLDER_VIDEOS: VideoItem[] = [
  {
    id: "vid-01",
    title: "AI Explainer - Product Architecture (16:9)",
    date: "2026-09-11 16:40",
    size: "18.4 MB",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "vid-02",
    title: "SaaS Workflow Teaser - Mobile Vertical (9:16)",
    date: "2026-09-09 11:15",
    size: "12.1 MB",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    id: "vid-03",
    title: "Parametric Motion Graphic Reel",
    date: "2026-09-05 08:30",
    size: "24.8 MB",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
];

interface UserAccountTabProps {
  videos?: VideoItem[];
}

export function UserAccountTab({ videos = PLACEHOLDER_VIDEOS }: UserAccountTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<UserAccountSubTab>("videos");
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    videos.length > 0 ? videos[0].id : ""
  );
  const [copiedKey, setCopiedKey] = useState(false);

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || videos[0];

  const handleCopyKey = () => {
    navigator.clipboard.writeText("sk_live_proc_998234a812bcef00192");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PARENT HEADER & SUB-TAB NAVIGATION */}
      <div className="border-b border-slate-200 pb-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">User Account</h2>
          <p className="text-xs text-slate-500">
            Manage your rendered video downloads, view usage quotas, upgrade billing plans, and configure API access.
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar">
          <button
            onClick={() => setActiveSubTab("videos")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === "videos"
                ? "bg-yellow-400 text-black-400 shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileVideo size={14} />
            <span>Downloaded Videos</span>
            {videos.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeSubTab === "videos" ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {videos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("profile")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === "profile"
                ? "bg-yellow-400 text-black-400 shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <User size={14} />
            <span>Profile & Balances</span>
          </button>

          <button
            onClick={() => setActiveSubTab("billing")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === "billing"
                ? "bg-yellow-400 text-black-400 shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CreditCard size={14} />
            <span>Billing & Plan</span>
          </button>

          <button
            onClick={() => setActiveSubTab("api")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === "api"
                ? "bg-yellow-400 text-black-400 shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Key size={14} />
            <span>API & Webhooks</span>
          </button>

          <button
            onClick={() => setActiveSubTab("settings")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === "settings"
                ? "bg-yellow-400 text-black-400 shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* 1. SUB-TAB: VIDEOS */}
      {activeSubTab === "videos" && (
        <div className="space-y-6">
          {videos.length === 0 ? (
            <div className="p-4 max-w-sm mx-auto bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1.5 shadow-sm">
              <div className="w-8 h-8 mx-auto rounded-full bg-slate-200/80 flex items-center justify-center text-slate-700">
                <FileVideo size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No Rendered Videos Found</h4>
              <p className="text-[11px] font-medium text-slate-700 leading-snug">
                Exported videos will be saved here automatically with direct download options.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Numbered Video List */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-800">
                    Rendered History ({videos.length})
                  </span>
                  <span className="text-[11px] text-slate-500">Select a video row to preview</span>
                </div>

                <div className="space-y-2">
                  {videos.map((item, index) => {
                    const isSelected = item.id === selectedVideo?.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedVideoId(item.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-emerald-50/70 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/30"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? "text-slate-950" : "text-slate-800"
                              }`}
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" /> {item.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive size={11} className="text-slate-400" /> {item.size}
                              </span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={item.videoUrl}
                          download={`${item.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0 shadow-sm"
                          title="Download MP4"
                        >
                          <Download size={12} />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Video Player (Height <= 300px) */}
              <div className="lg:col-span-5 border border-slate-200 bg-white rounded-2xl p-4 space-y-3 shadow-sm sticky top-20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Play size={14} className="text-emerald-600 fill-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {selectedVideo?.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                    {selectedVideo?.size}
                  </span>
                </div>

                <div className="relative w-full h-[250px] max-h-[300px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                  {selectedVideo?.videoUrl ? (
                    <video
                      key={selectedVideo.id}
                      src={selectedVideo.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain max-h-[300px]"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Select a video to preview</span>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                  <span>Codec: H.264 / AAC</span>
                  <span>Exported: {selectedVideo?.date}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SUB-TAB: PROFILE & BALANCES */}
      {activeSubTab === "profile" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl max-w-3xl space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Account Quotas & Balance</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track remaining GPU rendering credits and AI script generation tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clapperboard size={16} className="text-emerald-600" /> Render Credits
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
              <div className="text-2xl font-black text-emerald-700">245</div>
              <p className="text-[11px] text-slate-500">1 credit = 1 full HD video export</p>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Coins size={16} className="text-amber-500" /> AI Script Tokens
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
              <div className="text-2xl font-black text-amber-600">12,500</div>
              <p className="text-[11px] text-slate-500">Used for automated prompt creation</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB: BILLING & SUBSCRIPTION */}
      {activeSubTab === "billing" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl max-w-3xl space-y-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Plan & Usage</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage subscription tier and top up render credits.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
              Pro Studio Plan
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">$29.00 / month</div>
              <p className="text-[11px] text-slate-500">Renews on October 1, 2026</p>
            </div>
            <button className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors">
              Manage Subscription
            </button>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: API & INTEGRATIONS */}
      {activeSubTab === "api" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl max-w-3xl space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">API Credentials</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authenticate programmatic render requests to your backend Remotion engine.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Live API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                readOnly
                value="sk_live_proc_998234a812bcef00192"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
              />
              <button
                onClick={handleCopyKey}
                className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: SETTINGS */}
      {activeSubTab === "settings" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl max-w-3xl space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Account Preferences</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure email notifications and default video render aspect ratios.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="font-bold text-slate-800">Render Completion Alerts</div>
                <div className="text-[11px] text-slate-500">Send an email when video rendering completes on Lambda.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}