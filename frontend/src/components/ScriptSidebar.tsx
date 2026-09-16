"use client";

import { ChangeEvent } from "react";

interface ScriptSidebarProps {
  leftTab: "generate" | "custom-script" | "upload-voiceover";
  setLeftTab: (tab: "generate" | "custom-script" | "upload-voiceover") => void;
  prompt: string;
  setPrompt: (v: string) => void;
  aiScript: string;
  setAiScript: (v: string) => void;
  customScript: string;
  setCustomScript: (v: string) => void;
  uploadedScript: string;
  setUploadedScript: (v: string) => void;
  aiAudioUrl: string;
  aiAudioVersion: number;
  customAudioUrl: string;
  customAudioVersion: number;
  uploadedAudioUrl: string;
  uploadedAudioVersion: number;
  activeLoading: string | null;
  currentJobId: string | null;
  pipelineResult: any;
  currentActiveScript: string;
  handleGenerateScript: () => void;
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleGenerateVoiceover: () => void;
  handleRenderAnimation: () => void;
  onOpenDashboard?: () => void;
}

function Spinner({ colorClass = "text-white" }: { colorClass?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${colorClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function ScriptSidebar({
  leftTab, setLeftTab, prompt, setPrompt, aiScript, setAiScript,
  customScript, setCustomScript, uploadedScript, setUploadedScript,
  aiAudioUrl, aiAudioVersion, customAudioUrl, customAudioVersion,
  uploadedAudioUrl, uploadedAudioVersion, activeLoading, currentJobId,
  pipelineResult, currentActiveScript, handleGenerateScript, handleFileUpload,
  handleGenerateVoiceover, handleRenderAnimation, onOpenDashboard,
}: ScriptSidebarProps) {
  return (
    <div className="w-full bg-[#1e1e1e] rounded-lg border border-neutral-800 p-4 shadow-2xl shadow-black/60">
      {/* Top Bar with Dashboard Icon Button */}
      <div className="flex items-center justify-between mb-3">
        {onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            title="Open Dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
        )}
      </div>

      <div className="flex border border-neutral-800 mb-4 p-1 bg-[#141414] rounded-md text-center">
        {(["generate", "custom-script", "upload-voiceover"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setLeftTab(tab)}
            className={`flex-1 py-1 px-1 text-[10px] font-semibold tracking-tight rounded-sm transition-all ${
              leftTab === tab ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab === "generate" ? "AI Prompt" : tab === "custom-script" ? "Custom Script" : "Upload Audio"}
          </button>
        ))}
      </div>

      {leftTab === "generate" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Conceptual Prompt Idea</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the type of script you want created..."
              className="w-full min-h-[80px] p-3 bg-[#141414] border border-neutral-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-neutral-100 placeholder:text-neutral-600 resize-none transition-all"
            />
          </div>
          <button
            onClick={handleGenerateScript}
            disabled={activeLoading !== null || !prompt.trim()}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900/50 disabled:text-neutral-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 border border-neutral-700/50"
          >
            <span>{activeLoading === "script" ? "Processing Narrative..." : "Step 1: Generate Script"}</span>
            {activeLoading === "script" && <Spinner colorClass="text-emerald-400" />}
          </button>
          {aiScript && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Editable Generated Script</label>
              <textarea
                value={aiScript}
                onChange={(e) => setAiScript(e.target.value)}
                className="w-full min-h-[120px] p-3 bg-[#141414] border border-emerald-900/60 rounded-xl text-xs font-mono focus:outline-none text-neutral-100 transition-all"
              />
            </div>
          )}
          {aiAudioUrl && (
            <div className="rounded-xl border border-neutral-800 bg-[#141414] p-3 mt-2">
              <h3 className="text-[10px] font-bold uppercase text-neutral-400">Co-Pilot Voiceover Preview</h3>
              <audio controls src={`${aiAudioUrl}?v=${aiAudioVersion}`} className="mt-1.5 w-full h-7 accent-emerald-500" />
            </div>
          )}
        </div>
      )}

      {leftTab === "custom-script" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Custom Script Track</label>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Paste your script directly here..."
              className="w-full min-h-[160px] p-3 bg-[#141414] border border-neutral-800 rounded-xl text-xs font-mono text-neutral-100 focus:outline-none transition-all"
            />
          </div>
          {customAudioUrl && (
            <div className="rounded-xl border border-neutral-800 bg-[#141414] p-3 mt-2">
              <h3 className="text-[10px] font-bold uppercase text-neutral-400">Expert Voiceover Preview</h3>
              <audio controls src={`${customAudioUrl}?v=${customAudioVersion}`} className="mt-1.5 w-full h-7 accent-emerald-500" />
            </div>
          )}
        </div>
      )}

      {leftTab === "upload-voiceover" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Upload Audio File (.mp3, .wav, .m4a)</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-xl p-3 bg-[#141414] cursor-pointer transition-all">
              <span className="text-xs text-neutral-400 font-medium">Click to select audio file</span>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" disabled={activeLoading !== null} />
            </label>
          </div>
          {uploadedAudioUrl && (
            <div className="rounded-xl border border-neutral-800 bg-[#141414] p-3">
              <h3 className="text-[10px] font-bold uppercase text-neutral-400">Uploaded Voiceover Track</h3>
              <audio controls src={`${uploadedAudioUrl}?v=${uploadedAudioVersion}`} className="mt-1.5 w-full h-7 accent-emerald-500" />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Editable Auto-Transcript</label>
            <textarea
              value={uploadedScript}
              onChange={(e) => setUploadedScript(e.target.value)}
              className="w-full min-h-[120px] p-3 bg-[#141414] border border-emerald-900/60 rounded-xl text-xs font-mono text-neutral-100 transition-all"
            />
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-neutral-800 space-y-2.5">
        {leftTab !== "upload-voiceover" && (
          <button
            onClick={handleGenerateVoiceover}
            disabled={activeLoading !== null || !currentActiveScript.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <span>
              {activeLoading === "generating_audio" ? "Generating Audio..." : activeLoading === "assembling_scenes" ? "Assembling Scenes..." : currentJobId ? "Step 2: Update Voiceover & Script" : "Step 2: Generate Voiceover"}
            </span>
            {(activeLoading === "generating_audio" || activeLoading === "assembling_scenes") && <Spinner colorClass="text-amber-300" />}
          </button>
        )}
        <button
          onClick={handleRenderAnimation}
          disabled={activeLoading !== null || !pipelineResult}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
        >
          <span>
            {activeLoading === "animation" ? "Rendering Animation..." : activeLoading === "uploading_audio" ? "Transcribing Audio..." : leftTab === "upload-voiceover" ? "Step 2: Render Animation" : "Step 3: Generate Animation"}
          </span>
          {(activeLoading === "animation" || activeLoading === "uploading_audio") && <Spinner colorClass="text-rose-200" />}
        </button>
      </div>
    </div>
  );
}
