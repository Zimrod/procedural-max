// src/components/AudioSelectionPanel.tsx
"use client";

import { AudioConfig } from "../graphics/AudioLayers";

interface AudioPanelProps {
  audioConfig: AudioConfig;
  onChange: (updated: AudioConfig) => void;
  audioOverflowWarning?: boolean;
  onAudioFileSelect?: (track: "vo" | "bgm", file: File) => void;
}

export function AudioSelectionPanel({ audioConfig, onChange, audioOverflowWarning, onAudioFileSelect }: AudioPanelProps) {
  return (
    <div className="bg-[#18181b] border border-neutral-800 rounded-xl p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <span className="font-bold text-neutral-300 uppercase tracking-wider">Audio Control Panel</span>
        {audioOverflowWarning && (
          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
            ⚠️ Audio exceeds widget sequence length
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voiceover Settings */}
        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-400">Voiceover Track</span>
            <span className="font-mono text-neutral-400">{Math.round(audioConfig.voVolume * 100)}%</span>
          </div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files?.[0] && onAudioFileSelect?.("vo", e.target.files[0])}
            className="w-full text-[10px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-emerald-600 file:px-2 file:py-1 file:text-[10px] file:text-white"
          />
          <input
            type="text"
            placeholder="Voiceover Audio URL (.mp3 / .wav)"
            value={audioConfig.voUrl || ""}
            onChange={(e) => onChange({ ...audioConfig, voUrl: e.target.value })}
            className="w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioConfig.voVolume}
              onChange={(e) => onChange({ ...audioConfig, voVolume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-neutral-500">Start frame
              <input type="number" min="0" value={audioConfig.voStartFrame ?? 0}
                onChange={(e) => onChange({ ...audioConfig, voStartFrame: Math.max(0, Number(e.target.value)) })}
                className="mt-1 w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200" />
            </label>
            <label className="text-[10px] text-neutral-500">Duration frames
              <input type="number" min="0" value={audioConfig.voDurationFrames ?? 0}
                onChange={(e) => onChange({ ...audioConfig, voDurationFrames: Math.max(0, Number(e.target.value)) })}
                className="mt-1 w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200" />
            </label>
          </div>
        </div>

        {/* Background Music Settings */}
        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-400">Background Music</span>
            <span className="font-mono text-neutral-400">{Math.round(audioConfig.bgmVolume * 100)}%</span>
          </div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files?.[0] && onAudioFileSelect?.("bgm", e.target.files[0])}
            className="w-full text-[10px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-cyan-600 file:px-2 file:py-1 file:text-[10px] file:text-white"
          />
          <input
            type="text"
            placeholder="BGM Audio URL (.mp3 / .wav)"
            value={audioConfig.bgmUrl || ""}
            onChange={(e) => onChange({ ...audioConfig, bgmUrl: e.target.value })}
            className="w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioConfig.bgmVolume}
              onChange={(e) => onChange({ ...audioConfig, bgmVolume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>
          <label className="flex items-center gap-2 text-[10px] text-neutral-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={audioConfig.autoDucking}
              onChange={(e) => onChange({ ...audioConfig, autoDucking: e.target.checked })}
              className="rounded bg-black border-neutral-700 text-emerald-500 focus:ring-0"
            />
            Auto-Duck BGM during Voiceover speech
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-neutral-500">Start frame
              <input type="number" min="0" value={audioConfig.bgmStartFrame ?? 0}
                onChange={(e) => onChange({ ...audioConfig, bgmStartFrame: Math.max(0, Number(e.target.value)) })}
                className="mt-1 w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200" />
            </label>
            <label className="text-[10px] text-neutral-500">Duration frames
              <input type="number" min="0" value={audioConfig.bgmDurationFrames ?? 0}
                onChange={(e) => onChange({ ...audioConfig, bgmDurationFrames: Math.max(0, Number(e.target.value)) })}
                className="mt-1 w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200" />
            </label>
          </div>
        </div>

        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-400">Master Volume</span>
            <span className="font-mono text-neutral-400">{Math.round(audioConfig.masterVolume * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.05" value={audioConfig.masterVolume}
            onChange={(e) => onChange({ ...audioConfig, masterVolume: parseFloat(e.target.value) })}
            className="w-full accent-amber-500"
          />
          <p className="text-[10px] text-neutral-500">Applies to voiceover and background music.</p>
        </div>
      </div>
    </div>
  );
}
