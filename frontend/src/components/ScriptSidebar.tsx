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
  const isScriptLoading = activeLoading === "script";
  const isVoiceoverLoading = activeLoading === "generating_audio" || activeLoading === "assembling_scenes" || activeLoading === "voiceover";
  const isUploadLoading = activeLoading === "uploading_audio" || activeLoading === "transcribing";
  const isAnimationLoading = activeLoading === "animation" || activeLoading === "rendering";
  const isSceneCompilationInProgress = activeLoading === "assembling_scenes" || activeLoading === "voiceover";

  // Dynamic progress text helper for the status banner
  const getStatusBannerText = () => {
    switch (activeLoading) {
      case "script":
        return "Generating AI script from prompt...";
      case "generating_audio":
        return "Step 1/2: Synthesizing voiceover audio track...";
      case "assembling_scenes":
        return "Step 2/2: Backend compiling scene layouts & matching widgets...";
      case "uploading_audio":
      case "transcribing":
        return "Transcribing audio track and building timeline...";
      case "animation":
      case "rendering":
        return "Rendering video animation elements...";
      default:
        return null;
    }
  };

  const statusText = getStatusBannerText();

  return (
    <div className="w-full bg-[#1e1e1e] rounded-lg border border-neutral-800 p-4 shadow-2xl shadow-black/60">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3">
        {onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            disabled={activeLoading !== null}
            title="Open Dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border border-neutral-800 mb-4 p-1 bg-[#141414] rounded-md text-center">
        {(["generate", "custom-script", "upload-voiceover"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setLeftTab(tab)}
            disabled={activeLoading !== null}
            className={`flex-1 py-1 px-1 text-[10px] font-semibold tracking-tight rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              leftTab === tab ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab === "generate" ? "AI Prompt" : tab === "custom-script" ? "Custom Script" : "Upload Audio"}
          </button>
        ))}
      </div>

      {/* AI Prompt Tab */}
      {leftTab === "generate" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Conceptual Prompt Idea</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={activeLoading !== null}
              placeholder="Describe the type of script you want created..."
              className="w-full min-h-[80px] p-3 bg-[#141414] border border-neutral-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-neutral-100 placeholder:text-neutral-600 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleGenerateScript}
            disabled={activeLoading !== null || !prompt.trim()}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900/50 disabled:text-neutral-600 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 border border-neutral-700/50"
          >
            {isScriptLoading && <Spinner colorClass="text-emerald-400" />}
            <span>{isScriptLoading ? "Processing Narrative..." : "Step 1: Generate Script"}</span>
          </button>

          {aiScript && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Editable Generated Script</label>
              <textarea
                value={aiScript}
                onChange={(e) => setAiScript(e.target.value)}
                disabled={activeLoading !== null}
                className="w-full min-h-[120px] p-3 bg-[#141414] border border-emerald-900/60 rounded-xl text-xs font-mono focus:outline-none text-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Custom Script Tab */}
      {leftTab === "custom-script" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Custom Script Track</label>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              disabled={activeLoading !== null}
              placeholder="Paste your script directly here..."
              className="w-full min-h-[160px] p-3 bg-[#141414] border border-neutral-800 rounded-xl text-xs font-mono text-neutral-100 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Upload Voiceover Tab */}
      {leftTab === "upload-voiceover" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Upload Audio File (.mp3, .wav, .m4a)</label>
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3 bg-[#141414] transition-all ${
                activeLoading !== null
                  ? "border-neutral-800 opacity-50 cursor-not-allowed"
                  : "border-neutral-800 hover:border-emerald-500/50 cursor-pointer"
              }`}
            >
              {isUploadLoading ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <Spinner colorClass="text-emerald-400" />
                  <span>Transcribing Audio...</span>
                </div>
              ) : (
                <span className="text-xs text-neutral-400 font-medium">Click to select audio file</span>
              )}
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={activeLoading !== null}
              />
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
              disabled={activeLoading !== null}
              className="w-full min-h-[120px] p-3 bg-[#141414] border border-emerald-900/60 rounded-xl text-xs font-mono text-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {/* Action Area & Status Banner */}
      <div className="mt-5 pt-4 border-t border-neutral-800 space-y-2.5">
        {isSceneCompilationInProgress && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 shadow-lg shadow-amber-900/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Scene compilation in progress</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-amber-100/90">
              Your voiceover is ready. We are compiling the final scene layout and matching widgets in the background before Step 3 unlocks.
            </p>
          </div>
        )}

        {/* Background Task Banner */}
        {statusText && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse">
            <Spinner colorClass="text-amber-400 shrink-0" />
            <p className="text-[11px] font-medium leading-tight">{statusText}</p>
          </div>
        )}

        {leftTab !== "upload-voiceover" && (
          <button
            onClick={handleGenerateVoiceover}
            disabled={activeLoading !== null || !currentActiveScript.trim() || isSceneCompilationInProgress}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800/50 disabled:text-neutral-600 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {isVoiceoverLoading && <Spinner colorClass="text-amber-300" />}
            <span>
              {activeLoading === "generating_audio"
                ? "Generating Audio..."
                : activeLoading === "assembling_scenes"
                ? "Assembling Scenes..."
                : currentJobId
                ? "Step 2: Update Voiceover & Script"
                : "Step 2: Generate Voiceover"}
            </span>
          </button>
        )}

        <button
          onClick={handleRenderAnimation}
          disabled={activeLoading !== null || !pipelineResult}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800/50 disabled:text-neutral-600 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
        >
          {isAnimationLoading && <Spinner colorClass="text-rose-200" />}
          <span>
            {isAnimationLoading
              ? "Rendering Animation..."
              : leftTab === "upload-voiceover"
              ? "Step 2: Render Animation"
              : "Step 3: Generate Animation"}
          </span>
        </button>
      </div>
    </div>
  );
}