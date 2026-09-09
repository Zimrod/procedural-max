"use client";

import { RefObject, useMemo, useState, useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Main } from "../graphics/Main";
import { VIDEO_FPS } from "../types/constants";
import { CompositionTheme } from "../types/theme";
import { AudioConfig } from "../graphics/AudioLayers";
import { AudioSelectionPanel } from "./AudioSelectionPanel";

interface AspectRatio {
  label: string;
  value: number;
}

interface PreviewPlayerProps {
  playerRef: RefObject<PlayerRef | null>;
  selectedAspect: AspectRatio;
  setSelectedAspect: (aspect: AspectRatio) => void;
  aspectRatios: AspectRatio[];
  sceneConfig: any[];
  inputProps: any;
  totalDurationInFrames?: number;
  themeConfig: CompositionTheme;
  onScenesChange?: (updatedScenes: any[]) => void;
  audioConfig?: AudioConfig;
  onAudioConfigChange?: (updatedAudio: AudioConfig) => void;
}

export function PreviewPlayer({
  playerRef,
  selectedAspect,
  setSelectedAspect,
  aspectRatios,
  sceneConfig = [],
  inputProps,
  totalDurationInFrames,
  themeConfig,
  onScenesChange,
  audioConfig,
  onAudioConfigChange,
}: PreviewPlayerProps) {
  const isVertical = selectedAspect.value < 1;
  const trackRef = useRef<HTMLDivElement>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [draggingJunctionIndex, setDraggingJunctionIndex] = useState<number | null>(null);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"timeline" | "audio">("timeline");
  const [draggingAudioTrack, setDraggingAudioTrack] = useState<"vo" | "bgm" | null>(null);
  const currentFrameRef = useRef(0);

  const endDragRef = useRef<{ startX: number; initialDur: number; pxPerFrame: number } | null>(null);
  const audioDragRef = useRef<{ startX: number; initialStart: number; duration: number; pxPerFrame: number } | null>(null);

  // Fallback state if parent does not manage audioConfig directly
  const [internalAudioConfig, setInternalAudioConfig] = useState<AudioConfig>({
    voUrl: "",
    voVolume: 1.0,
    voStartFrame: 0,
    voDurationFrames: 0,
    bgmUrl: "",
    bgmVolume: 0.3,
    masterVolume: 1,
    autoDucking: true,
  });

  const activeAudioConfig = audioConfig || internalAudioConfig;
  const audioConfigRef = useRef(activeAudioConfig);
  audioConfigRef.current = activeAudioConfig;

  const handleAudioChange = (updated: AudioConfig) => {
    if (onAudioConfigChange) {
      onAudioConfigChange(updated);
    } else {
      setInternalAudioConfig(updated);
    }
  };

  const handleAudioFileSelect = (track: "vo" | "bgm", file: File) => {
    const url = URL.createObjectURL(file);
    handleAudioChange({
      ...activeAudioConfig,
      ...(track === "vo" ? { voUrl: url } : { bgmUrl: url }),
    });
  };

  const compositionDimensions = useMemo(() => {
    const height = 1080;
    return {
      width: Math.round(height * selectedAspect.value),
      height,
    };
  }, [selectedAspect.value]);

  // Calculate total widget frames dynamically across property variations
  const computedTotalFrames = useMemo(() => {
    const sum = sceneConfig.reduce((acc, scene) => {
      const duration =
        scene.durationFrames ??
        scene.durationInFrames ??
        scene.duration ??
        90;
      return acc + duration;
    }, 0);

    return sum > 0 ? sum : totalDurationInFrames || 1;
  }, [sceneConfig, totalDurationInFrames]);

  // Check if voiceover audio exceeds current visual widget duration
  const isAudioOverflowing = useMemo(() => {
    if (!activeAudioConfig.voUrl || !activeAudioConfig.voDurationFrames) return false;
    const voEnd = (activeAudioConfig.voStartFrame || 0) + activeAudioConfig.voDurationFrames;
    return voEnd > computedTotalFrames;
  }, [activeAudioConfig, computedTotalFrames]);

  // Sync current frame with Remotion Player
  useEffect(() => {
    const onFrameUpdate = (e: CustomEvent<{ frame: number }>) => {
      const frame = e.detail.frame;
      if (currentFrameRef.current === frame) return;
      currentFrameRef.current = frame;
      setCurrentFrame(frame);
    };
    let subscribedPlayer: PlayerRef | null = null;
    const poll = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      if (subscribedPlayer !== player) {
        subscribedPlayer?.removeEventListener("frameupdate", onFrameUpdate as any);
        player.addEventListener("frameupdate", onFrameUpdate as any);
        subscribedPlayer = player;
      }
      const frame = player.getCurrentFrame();
      if (currentFrameRef.current !== frame) {
        currentFrameRef.current = frame;
        setCurrentFrame(frame);
      }
    }, 50);
    return () => {
      subscribedPlayer?.removeEventListener("frameupdate", onFrameUpdate as any);
      window.clearInterval(poll);
    };
  }, [playerRef]);

  const formatSeconds = (frames: number) => {
    const sec = frames / VIDEO_FPS;
    return Number.isInteger(sec) ? `${sec}s` : `${sec.toFixed(1)}s`;
  };

  // Dragging Junctions (Resizing adjacent scene durations)
  const handleJunctionMouseDown = (e: React.MouseEvent, junctionIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingJunctionIndex(junctionIdx);
  };

  // Dragging Final Boundary (Resizing total duration via final scene)
  const handleEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!trackRef.current || sceneConfig.length === 0) return;

    const rect = trackRef.current.getBoundingClientRect();
    const trackPadding = 8;
    const timelineWidth = Math.max(1, rect.width - trackPadding * 2);
    const pxPerFrame = timelineWidth / computedTotalFrames;

    const lastScene = sceneConfig[sceneConfig.length - 1];
    const initialDur = lastScene.durationFrames ?? lastScene.durationInFrames ?? lastScene.duration ?? 90;

    endDragRef.current = {
      startX: e.clientX,
      initialDur,
      pxPerFrame: pxPerFrame > 0 ? pxPerFrame : 1,
    };
    setIsDraggingEnd(true);
  };

  const handleAudioMouseDown = (e: React.MouseEvent, track: "vo" | "bgm") => {
    e.preventDefault();
    e.stopPropagation();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const timelineWidth = Math.max(1, rect.width - 16);
    const isVoiceover = track === "vo";
    const initialStart = isVoiceover ? activeAudioConfig.voStartFrame ?? 0 : activeAudioConfig.bgmStartFrame ?? 0;
    const duration = isVoiceover
      ? activeAudioConfig.voDurationFrames || computedTotalFrames - initialStart
      : activeAudioConfig.bgmDurationFrames || computedTotalFrames - initialStart;
    audioDragRef.current = {
      startX: e.clientX,
      initialStart,
      duration: Math.max(1, duration),
      pxPerFrame: timelineWidth / Math.max(1, computedTotalFrames),
    };
    setDraggingAudioTrack(track);
  };

  useEffect(() => {
    if (!draggingAudioTrack) return;
    const handleMouseMove = (e: MouseEvent) => {
      const drag = audioDragRef.current;
      if (!drag) return;
      const deltaFrames = Math.round((e.clientX - drag.startX) / drag.pxPerFrame);
      const nextStart = Math.max(0, Math.min(computedTotalFrames - 1, drag.initialStart + deltaFrames));
      const nextDuration = Math.min(drag.duration, computedTotalFrames - nextStart);
      const currentAudioConfig = audioConfigRef.current;
      handleAudioChange(draggingAudioTrack === "vo"
        ? { ...currentAudioConfig, voStartFrame: nextStart, voDurationFrames: nextDuration }
        : { ...currentAudioConfig, bgmStartFrame: nextStart, bgmDurationFrames: nextDuration });
    };
    const handleMouseUp = () => {
      audioDragRef.current = null;
      setDraggingAudioTrack(null);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingAudioTrack, computedTotalFrames]);

  // Internal Junction Drag Effect
  useEffect(() => {
    if (draggingJunctionIndex === null || !onScenesChange) return;

    const initialScenes = [...sceneConfig];
    const junctionIdx = draggingJunctionIndex;
    const sceneA = initialScenes[junctionIdx];
    const sceneB = initialScenes[junctionIdx + 1];

    const initialDurA = sceneA.durationFrames ?? sceneA.durationInFrames ?? sceneA.duration ?? 90;
    const initialDurB = sceneB.durationFrames ?? sceneB.durationInFrames ?? sceneB.duration ?? 90;
    const combinedDuration = initialDurA + initialDurB;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();

      let startFrameA = 0;
      for (let i = 0; i < junctionIdx; i++) {
        const s = initialScenes[i];
        startFrameA += s.durationFrames ?? s.durationInFrames ?? s.duration ?? 90;
      }

      const trackPadding = 8;
      const timelineWidth = Math.max(1, rect.width - trackPadding * 2);
      const mouseX = Math.max(0, Math.min(e.clientX - rect.left - trackPadding, timelineWidth));
      const currentJunctionFrame = Math.round((mouseX / timelineWidth) * computedTotalFrames);
      let newDurA = currentJunctionFrame - startFrameA;

      const minFrames = 15;
      newDurA = Math.max(minFrames, Math.min(combinedDuration - minFrames, newDurA));
      const newDurB = combinedDuration - newDurA;

      const updated = initialScenes.map((s, idx) => {
        if (idx === junctionIdx) {
          return { ...s, durationFrames: newDurA, durationInFrames: newDurA, duration: newDurA };
        }
        if (idx === junctionIdx + 1) {
          return { ...s, durationFrames: newDurB, durationInFrames: newDurB, duration: newDurB };
        }
        return s;
      });

      onScenesChange(updated);
    };

    const handleMouseUp = () => {
      setDraggingJunctionIndex(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingJunctionIndex, sceneConfig, computedTotalFrames, onScenesChange]);

  // Final Boundary Drag Effect
  useEffect(() => {
    if (!isDraggingEnd || !onScenesChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!endDragRef.current) return;
      const { startX, initialDur, pxPerFrame } = endDragRef.current;
      const deltaX = e.clientX - startX;
      const deltaFrames = Math.round(deltaX / pxPerFrame);

      const minFrames = 15;
      const newDur = Math.max(minFrames, initialDur + deltaFrames);

      const updated = sceneConfig.map((s, idx) => {
        if (idx === sceneConfig.length - 1) {
          return { ...s, durationFrames: newDur, durationInFrames: newDur, duration: newDur };
        }
        return s;
      });

      onScenesChange(updated);
    };

    const handleMouseUp = () => {
      setIsDraggingEnd(false);
      endDragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingEnd, sceneConfig, onScenesChange]);

  const playheadPercent = Math.min(100, Math.max(0, (currentFrame / computedTotalFrames) * 100));

  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="bg-[#1e1e1e] rounded-2xl border border-neutral-800 p-4 shadow-2xl shadow-black/60 space-y-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live Preview</span>
          <div className="flex gap-1">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setSelectedAspect(ratio)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  selectedAspect.label === ratio.label ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport / Player */}
        <div
          className={`bg-black rounded-xl overflow-hidden border border-neutral-800 relative transition-all ${
            isVertical
              ? "max-h-[calc(100vh-18rem)] w-auto mx-auto"
              : "w-full"
          }`}
          style={{ aspectRatio: selectedAspect.value }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-[#121212]">
            {sceneConfig.length > 0 ? (
              <Player
                ref={playerRef}
                component={Main}
                inputProps={{
                  ...inputProps,
                  scenes: sceneConfig,
                  sceneConfig,
                  audioConfig: {
                    ...activeAudioConfig,
                    voUrl: activeAudioConfig.voUrl || inputProps.audioUrl || "",
                  },
                }}
                durationInFrames={computedTotalFrames}
                fps={VIDEO_FPS}
                compositionHeight={compositionDimensions.height}
                compositionWidth={compositionDimensions.width}
                style={{ width: "100%", height: "100%", backgroundColor: themeConfig.backgroundColor }}
                controls
                autoPlay
              />
            ) : (
              <div className="flex flex-col items-center justify-center px-6 text-center text-neutral-500">
                <div className="text-base font-medium text-neutral-300">Animated Video Will Appear Here</div>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
                  Select a tab, prepare your script, then trigger voiceover synthesis to unlock timeline synchronization.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex border border-neutral-800 p-1 bg-[#141414] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveEditorTab("timeline")}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeEditorTab === "timeline" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            Timeline Tracks
          </button>
          <button
            type="button"
            onClick={() => setActiveEditorTab("audio")}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeEditorTab === "audio" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            Audio Control Panel
          </button>
        </div>

        {activeEditorTab === "audio" && (
          <AudioSelectionPanel
            audioConfig={activeAudioConfig}
            onChange={handleAudioChange}
            onAudioFileSelect={handleAudioFileSelect}
            audioOverflowWarning={isAudioOverflowing}
          />
        )}

        {false && (
        <div className="bg-[#18181b] border border-neutral-800 rounded-xl p-3.5 space-y-3 text-xs select-none">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-bold text-neutral-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Audio Master Controls
            </span>
            {isAudioOverflowing && (
              <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-mono animate-pulse">
                ⚠️ Audio extends past visual duration — drag visual timeline end to extend
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Voiceover Track Controls */}
            <div className="bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400 text-[11px]">🎙️ Voiceover Track</span>
                <span className="font-mono text-neutral-400 text-[10px]">
                  {Math.round(activeAudioConfig.voVolume * 100)}%
                </span>
              </div>
              <input
                type="text"
                placeholder="Voiceover Audio URL (.mp3 / .wav)"
                value={activeAudioConfig.voUrl || ""}
                onChange={(e) => handleAudioChange({ ...activeAudioConfig, voUrl: e.target.value })}
                className="w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-[10px] focus:outline-none focus:border-emerald-500 font-mono"
              />
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-neutral-500 uppercase font-mono">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeAudioConfig.voVolume}
                  onChange={(e) => handleAudioChange({ ...activeAudioConfig, voVolume: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Background Music Controls */}
            <div className="bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-400 text-[11px]">🎵 Background Music</span>
                <span className="font-mono text-neutral-400 text-[10px]">
                  {Math.round(activeAudioConfig.bgmVolume * 100)}%
                </span>
              </div>
              <input
                type="text"
                placeholder="BGM Audio URL (.mp3 / .wav)"
                value={activeAudioConfig.bgmUrl || ""}
                onChange={(e) => handleAudioChange({ ...activeAudioConfig, bgmUrl: e.target.value })}
                className="w-full bg-black/60 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-[10px] focus:outline-none focus:border-cyan-500 font-mono"
              />
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-neutral-500 uppercase font-mono">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeAudioConfig.bgmVolume}
                  onChange={(e) => handleAudioChange({ ...activeAudioConfig, bgmVolume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-2 text-[10px] text-neutral-400 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={activeAudioConfig.autoDucking}
                  onChange={(e) => handleAudioChange({ ...activeAudioConfig, autoDucking: e.target.checked })}
                  className="rounded bg-black border-neutral-700 text-emerald-500 focus:ring-0 w-3 h-3"
                />
                Auto-duck BGM volume during voiceover speech
              </label>
            </div>
          </div>
        </div>
        )}

        {/* Stacked Multi-Track Timeline */}
        {activeEditorTab === "timeline" && <div className="pt-2 border-t border-neutral-800/80 space-y-2 select-none">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Timeline Tracks
            </span>
            <span className="font-mono text-emerald-400">
              {formatSeconds(currentFrame)} / {formatSeconds(computedTotalFrames)} ({computedTotalFrames} Frames)
            </span>
          </div>

          <div
            ref={trackRef}
            className="w-full bg-black/80 rounded-xl p-2 pb-8 border border-neutral-800 flex flex-col gap-2 relative cursor-default"
          >
            {/* Master Playhead Line (Spans across all stacked tracks) */}
            <div
              style={{ left: `${playheadPercent}%` }}
              className="pointer-events-none absolute top-0 bottom-0 z-40 flex flex-col items-center"
            >
              <div className="w-3 h-3 bg-amber-400 border-2 border-neutral-900 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] -mt-1" />
              <div className="w-[2px] h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            </div>

            {/* Fixed Start Boundary Marker (0s) */}
            <div className="absolute left-0 top-0 bottom-0 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-[2px] h-full bg-emerald-500/80" />
              <div className="absolute top-full mt-1 bg-neutral-900 border border-emerald-500/60 text-emerald-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transform -translate-x-1/2 whitespace-nowrap">
                0s
              </div>
            </div>

            {/* TRACK 1: Visual Scene Sequence */}
            <div className="w-full flex gap-0 items-center min-h-[40px] relative">
              {sceneConfig.length > 0 ? (
                (() => {
                  let accumulatedFrames = 0;
                  return sceneConfig.map((scene, idx) => {
                    const duration =
                      scene.durationFrames ??
                      scene.durationInFrames ??
                      scene.duration ??
                      90;

                    accumulatedFrames += duration;
                    const endFrame = accumulatedFrames;

                    const widthPercent = (duration / computedTotalFrames) * 100;
                    const widgetName = scene.widget || scene.type || `Scene #${idx + 1}`;
                    const endSec = formatSeconds(endFrame);
                    const durationSec = formatSeconds(duration);
                    const isLast = idx === sceneConfig.length - 1;

                    return (
                      <div
                        key={scene.id || idx}
                        style={{ width: `${widthPercent}%` }}
                        className="group relative h-10 bg-neutral-900 hover:bg-emerald-950/40 border-y border-neutral-800 hover:border-emerald-500/60 p-1.5 flex flex-col justify-between transition-colors flex-shrink-0"
                        title={`Scene #${idx + 1}: ${widgetName} (${durationSec})`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full text-[9px] truncate">
                          <span className="font-bold text-neutral-300 group-hover:text-emerald-300 truncate">
                            #{idx + 1} {widgetName}
                          </span>
                          <span className="font-mono text-neutral-500 group-hover:text-emerald-400 text-[8px] flex-shrink-0">
                            {durationSec}
                          </span>
                        </div>

                        <div className="w-full h-1 bg-neutral-800 group-hover:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-full opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Junction Handle (Draggable between meeting bars) */}
                        {!isLast && (
                          <div
                            onMouseDown={(e) => handleJunctionMouseDown(e, idx)}
                            className="absolute -right-[4px] top-0 bottom-0 w-2 z-30 flex flex-col items-center cursor-col-resize group/junction"
                          >
                            <div className="w-[2px] h-full bg-emerald-500 group-hover/junction:bg-cyan-400 group-hover/junction:w-[3px] shadow-[0_0_6px_rgba(16,185,129,0.8)] transition-all" />
                            <div className="absolute top-full mt-1 bg-neutral-900 border border-emerald-500/60 group-hover/junction:border-cyan-400 text-emerald-400 group-hover/junction:text-cyan-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transform -translate-x-1/2 whitespace-nowrap">
                              {endSec}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="w-full h-10 bg-neutral-900/30 border border-dashed border-neutral-800/80 rounded-lg flex items-center justify-center text-[10px] text-neutral-600 font-medium">
                  Empty Timeline — Add scenes to populate tracks
                </div>
              )}
            </div>

            {/* TRACK 2: Voiceover Track Sub-layer */}
            <div className="w-full h-6 bg-neutral-900/50 border border-neutral-800/80 rounded-md relative overflow-hidden flex items-center px-1">
              {activeAudioConfig.voUrl ? (
                (() => {
                  const voStart = activeAudioConfig.voStartFrame || 0;
                  const voDur = activeAudioConfig.voDurationFrames || computedTotalFrames;
                  const startPercent = (voStart / computedTotalFrames) * 100;
                  const widthPercent = Math.min(100 - startPercent, (voDur / computedTotalFrames) * 100);

                  return (
                    <div
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      onMouseDown={(e) => handleAudioMouseDown(e, "vo")}
                      className={`absolute h-4 border rounded flex items-center justify-between px-2 text-[8px] font-mono transition-colors cursor-grab active:cursor-grabbing ${
                        isAudioOverflowing
                          ? "bg-amber-500/20 border-amber-500/80 text-amber-300"
                          : "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                      }`}
                    >
                      <span className="truncate">🎙️ Voiceover</span>
                      <span className="flex-shrink-0 opacity-80">{formatSeconds(voDur)}</span>
                    </div>
                  );
                })()
              ) : (
                <span className="text-[8px] font-mono text-neutral-600 px-2">🎙️ Voiceover (No Track Loaded)</span>
              )}
            </div>

            {/* TRACK 3: Background Music Track Sub-layer */}
            <div className="w-full h-6 bg-neutral-900/50 border border-neutral-800/80 rounded-md relative overflow-hidden flex items-center px-1">
              {activeAudioConfig.bgmUrl ? (
                <div
                  onMouseDown={(e) => handleAudioMouseDown(e, "bgm")}
                  style={{
                    left: `${((activeAudioConfig.bgmStartFrame ?? 0) / computedTotalFrames) * 100}%`,
                    width: `${Math.min(100 - ((activeAudioConfig.bgmStartFrame ?? 0) / computedTotalFrames) * 100, ((activeAudioConfig.bgmDurationFrames || computedTotalFrames) / computedTotalFrames) * 100)}%`,
                  }}
                  className="absolute h-4 bg-cyan-500/20 border border-cyan-500/60 rounded flex items-center justify-between px-2 text-[8px] font-mono text-cyan-300 cursor-grab active:cursor-grabbing"
                >
                  <span className="truncate">🎵 Background Music</span>
                  {activeAudioConfig.autoDucking && (
                    <span className="text-amber-400/90 text-[7px] uppercase tracking-wider bg-amber-400/10 px-1 rounded border border-amber-400/20">
                      Auto-Ducked
                    </span>
                  )}
                  <span className="opacity-80">Full Length</span>
                </div>
              ) : (
                <span className="text-[8px] font-mono text-neutral-600 px-2">🎵 Background Music (No Track Loaded)</span>
              )}
            </div>

            {/* Draggable End Boundary (Resizes final scene & total composition duration) */}
            {sceneConfig.length > 0 && (
              <div
                onMouseDown={handleEndMouseDown}
                className="absolute right-0 top-0 bottom-0 w-3 z-30 flex flex-col items-center cursor-col-resize group/end translate-x-1/2"
              >
                <div className="w-[2px] h-full bg-emerald-500 group-hover/end:bg-cyan-400 group-hover/end:w-[3px] shadow-[0_0_6px_rgba(16,185,129,0.8)] transition-all" />
                <div className="absolute top-full mt-1 bg-neutral-900 border border-emerald-500/60 group-hover/end:border-cyan-400 text-emerald-400 group-hover/end:text-cyan-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                  {formatSeconds(computedTotalFrames)}
                </div>
              </div>
            )}
          </div>
        </div>}
      </div>
    </div>
  );
}
