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
  const [timelineTotalFrames, setTimelineTotalFrames] = useState<number | null>(null);
  const [draggingSceneIndex, setDraggingSceneIndex] = useState<number | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<"timeline" | "audio">("timeline");
  const [draggingAudioTrack, setDraggingAudioTrack] = useState<"vo" | "bgm" | null>(null);
  const currentFrameRef = useRef(0);

  const sceneDragRef = useRef<{
    startX: number;
    initialStart: number;
    initialDuration: number;
    pxPerFrame: number;
    dragType: "move" | "resize-start" | "resize-end";
  } | null>(null);

  const audioDragRef = useRef<{
    startX: number;
    initialStart: number;
    duration: number;
    pxPerFrame: number;
  } | null>(null);

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

  // Calculate total composition duration based on the highest end frame across all independent widgets
  const computedTotalFrames = useMemo(() => {
    let maxFrame = 0;
    sceneConfig.forEach((scene) => {
      const start = scene.startFrame ?? scene.start ?? 0;
      const duration = scene.durationFrames ?? scene.durationInFrames ?? scene.duration ?? 90;
      const end = scene.endFrame ?? scene.end ?? start + duration;
      if (end > maxFrame) maxFrame = end;
    });

    if (totalDurationInFrames && totalDurationInFrames > maxFrame) {
      maxFrame = totalDurationInFrames;
    }

    return maxFrame > 0 ? maxFrame : 150;
  }, [sceneConfig, totalDurationInFrames]);

  const effectiveTotalFrames = timelineTotalFrames ?? computedTotalFrames;

  const seekToFrame = (frame: number) => {
    const nextFrame = Math.max(0, Math.min(effectiveTotalFrames, Math.round(Number.isFinite(frame) ? frame : 0)));
    currentFrameRef.current = nextFrame;
    setCurrentFrame(nextFrame);
    playerRef.current?.seekTo(nextFrame);
  };

  const updateTimelineTotalFrames = (frames: number) => {
    const nextTotalFrames = Math.max(1, Math.round(Number.isFinite(frames) ? frames : effectiveTotalFrames));
    setTimelineTotalFrames(nextTotalFrames);
    if (currentFrame > nextTotalFrames) {
      currentFrameRef.current = nextTotalFrames;
      setCurrentFrame(nextTotalFrames);
      playerRef.current?.seekTo(nextTotalFrames);
    }
  };

  // Check if voiceover audio extends beyond overall visual workspace
  const isAudioOverflowing = useMemo(() => {
    if (!activeAudioConfig.voUrl || !activeAudioConfig.voDurationFrames) return false;
    const voEnd = (activeAudioConfig.voStartFrame || 0) + activeAudioConfig.voDurationFrames;
    return voEnd > effectiveTotalFrames;
  }, [activeAudioConfig, effectiveTotalFrames]);

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

  // Independent Widget Mouse Down Handler (Move / Resize Start / Resize End)
  const handleWidgetMouseDown = (
    e: React.MouseEvent,
    index: number,
    dragType: "move" | "resize-start" | "resize-end"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const trackPadding = 16;
    const timelineWidth = Math.max(1, rect.width - trackPadding);
    const pxPerFrame = timelineWidth / effectiveTotalFrames;

    const scene = sceneConfig[index];
    const initialStart = scene.startFrame ?? scene.start ?? 0;
    const initialDuration = scene.durationFrames ?? scene.durationInFrames ?? scene.duration ?? 90;

    sceneDragRef.current = {
      startX: e.clientX,
      initialStart,
      initialDuration,
      pxPerFrame: pxPerFrame > 0 ? pxPerFrame : 1,
      dragType,
    };
    setDraggingSceneIndex(index);
  };

  // Fully Decoupled Drag / Resize Event Listener
  useEffect(() => {
    if (draggingSceneIndex === null || !onScenesChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = sceneDragRef.current;
      if (!drag || !trackRef.current) return;

      const deltaFrames = Math.round((e.clientX - drag.startX) / drag.pxPerFrame);
      const sceneIndex = draggingSceneIndex;
      const minFrames = 15;

      const updated = sceneConfig.map((s, idx) => {
        if (idx !== sceneIndex) return s;

        let newStart = s.startFrame ?? s.start ?? 0;
        let newDuration = s.durationFrames ?? s.durationInFrames ?? s.duration ?? 90;

        if (drag.dragType === "move") {
          newStart = Math.max(0, drag.initialStart + deltaFrames);
        } else if (drag.dragType === "resize-start") {
          const proposedStart = Math.max(0, drag.initialStart + deltaFrames);
          const maxStart = drag.initialStart + drag.initialDuration - minFrames;
          newStart = Math.min(proposedStart, maxStart);
          newDuration = drag.initialDuration + (drag.initialStart - newStart);
        } else if (drag.dragType === "resize-end") {
          newDuration = Math.max(minFrames, drag.initialDuration + deltaFrames);
        }

        const newEnd = newStart + newDuration;

        return {
          ...s,
          startFrame: newStart,
          start: newStart,
          durationFrames: newDuration,
          durationInFrames: newDuration,
          duration: newDuration,
          endFrame: newEnd,
          end: newEnd,
        };
      });

      onScenesChange(updated);
    };

    const handleMouseUp = () => {
      setDraggingSceneIndex(null);
      sceneDragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingSceneIndex, sceneConfig, effectiveTotalFrames, onScenesChange]);

  const handleAudioMouseDown = (e: React.MouseEvent, track: "vo" | "bgm") => {
    e.preventDefault();
    e.stopPropagation();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const timelineWidth = Math.max(1, rect.width - 16);
    const isVoiceover = track === "vo";
    const initialStart = isVoiceover ? activeAudioConfig.voStartFrame ?? 0 : activeAudioConfig.bgmStartFrame ?? 0;
    const duration = isVoiceover
      ? activeAudioConfig.voDurationFrames || effectiveTotalFrames - initialStart
      : activeAudioConfig.bgmDurationFrames || effectiveTotalFrames - initialStart;
    audioDragRef.current = {
      startX: e.clientX,
      initialStart,
      duration: Math.max(1, duration),
      pxPerFrame: timelineWidth / Math.max(1, effectiveTotalFrames),
    };
    setDraggingAudioTrack(track);
  };

  useEffect(() => {
    if (!draggingAudioTrack) return;
    const handleMouseMove = (e: MouseEvent) => {
      const drag = audioDragRef.current;
      if (!drag) return;
      const deltaFrames = Math.round((e.clientX - drag.startX) / drag.pxPerFrame);
      const nextStart = Math.max(0, Math.min(effectiveTotalFrames - 1, drag.initialStart + deltaFrames));
      const nextDuration = Math.min(drag.duration, effectiveTotalFrames - nextStart);
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
  }, [draggingAudioTrack, effectiveTotalFrames]);

  const playheadPercent = Math.min(100, Math.max(0, (currentFrame / effectiveTotalFrames) * 100));

  const playerInputProps = useMemo(() => ({
    ...inputProps,
    scenes: sceneConfig,
    sceneConfig,
    audioConfig: {
      ...activeAudioConfig,
      voUrl: activeAudioConfig.voUrl || inputProps.audioUrl || "",
    },
  }), [inputProps, sceneConfig, activeAudioConfig]);

  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="bg-[#1e1e1e] rounded-lg border border-neutral-800 p-4 shadow-2xl shadow-black/60 space-y-2">
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
          className={`bg-black rounded-md overflow-hidden border border-neutral-800 relative transition-all ${
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
                inputProps={playerInputProps}
                durationInFrames={effectiveTotalFrames}
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

        <div className="flex border border-neutral-800 p-1 bg-[#141414] rounded-md">
          <button
            type="button"
            onClick={() => setActiveEditorTab("timeline")}
            className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${activeEditorTab === "timeline" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            Stacked Tracks
          </button>
          <button
            type="button"
            onClick={() => setActiveEditorTab("audio")}
            className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${activeEditorTab === "audio" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "text-neutral-400 hover:text-neutral-200"}`}
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

        {/* Stacked Multi-Track Concurrent Timeline */}
        {activeEditorTab === "timeline" && (
          <div className="pt-1 border-t border-neutral-800/80 space-y-1 select-none">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Independent Widget Tracks
              </span>
              <div className="flex flex-wrap items-center justify-end gap-1.5 font-normal normal-case">
                <label className="flex items-center gap-1 text-neutral-500">
                  <span>Seconds</span>
                  <input type="number" min="0" step="0.1" value={(currentFrame / VIDEO_FPS).toFixed(1)} onChange={(event) => seekToFrame(Number(event.target.value) * VIDEO_FPS)} aria-label="Elapsed seconds" className="w-16 rounded border border-neutral-700 bg-[#141414] px-1.5 py-0.5 text-right font-mono text-[10px] text-emerald-400 focus:border-emerald-500 focus:outline-none" />
                  <span>/</span>
                  <input type="number" min="0.1" step="0.1" value={(effectiveTotalFrames / VIDEO_FPS).toFixed(1)} onChange={(event) => updateTimelineTotalFrames(Number(event.target.value) * VIDEO_FPS)} aria-label="Total duration seconds" className="w-16 rounded border border-neutral-700 bg-[#141414] px-1.5 py-0.5 text-right font-mono text-[10px] text-neutral-300 focus:border-emerald-500 focus:outline-none" />
                  <span>s</span>
                </label>
                <label className="flex items-center gap-1 text-neutral-500">
                  <span>Frames</span>
                  <input type="number" min="0" step="1" value={currentFrame} onChange={(event) => seekToFrame(Number(event.target.value))} aria-label="Elapsed frames" className="w-16 rounded border border-neutral-700 bg-[#141414] px-1.5 py-0.5 text-right font-mono text-[10px] text-emerald-400 focus:border-emerald-500 focus:outline-none" />
                  <span>/</span>
                  <input type="number" min="1" step="1" value={effectiveTotalFrames} onChange={(event) => updateTimelineTotalFrames(Number(event.target.value))} aria-label="Total frames" className="w-16 rounded border border-neutral-700 bg-[#141414] px-1.5 py-0.5 text-right font-mono text-[10px] text-neutral-300 focus:border-emerald-500 focus:outline-none" />
                </label>
              </div>
            </div>

            <div
              ref={trackRef}
              className="w-full bg-black/80 rounded-xl p-2.5 border border-neutral-800 flex flex-col gap-1.5 relative cursor-default"
            >
              {/* Playhead Line */}
              <div
                style={{ left: `${playheadPercent}%` }}
                className="pointer-events-none absolute top-0 bottom-0 z-40 flex flex-col items-center"
              >
                <div className="w-2.5 h-2.5 bg-amber-400 border-2 border-neutral-900 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] -mt-0.5" />
                <div className="w-[2px] h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </div>

              {/* Start Boundary Marker (0s) */}
              <div className="absolute left-0 top-0 bottom-0 z-20 flex flex-col items-center pointer-events-none">
                <div className="w-[2px] h-full bg-emerald-500/80" />
              </div>

              {/* INDEPENDENT WIDGET TRACKS */}
              <div className="w-full flex flex-col gap-1 relative min-h-[40px]">
                {sceneConfig.length > 0 ? (
                  sceneConfig.map((scene, idx) => {
                    const startFrame = scene.startFrame ?? scene.start ?? 0;
                    const duration = scene.durationFrames ?? scene.durationInFrames ?? scene.duration ?? 90;
                    const endFrame = scene.endFrame ?? scene.end ?? startFrame + duration;

                    const leftPercent = (startFrame / effectiveTotalFrames) * 100;
                    const widthPercent = (duration / effectiveTotalFrames) * 100;
                    const widgetName = scene.widget || scene.type || `Widget #${idx + 1}`;
                    const durationSec = formatSeconds(duration);

                    return (
                      <div
                        key={scene.id || idx}
                        className="w-full h-6 bg-neutral-900/60 rounded-md relative overflow-hidden border border-neutral-800/80 flex items-center"
                      >
                        <div
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          onMouseDown={(e) => handleWidgetMouseDown(e, idx, "move")}
                          className="group absolute h-[18px] bg-neutral-800 hover:bg-emerald-950/70 border border-neutral-700 hover:border-emerald-500/80 rounded px-1.5 flex items-center justify-between text-[8px] cursor-grab active:cursor-grabbing transition-colors"
                        >
                          {/* Left Resize Handle */}
                          <div
                            onMouseDown={(e) => handleWidgetMouseDown(e, idx, "resize-start")}
                            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-400/80 rounded-l"
                          />

                          <div className="flex items-center gap-1 truncate pointer-events-none">
                            <span className="font-bold text-neutral-200 group-hover:text-emerald-300 truncate">
                              #{idx + 1} {widgetName}
                            </span>
                          </div>

                          <span className="font-mono text-neutral-400 group-hover:text-emerald-400 text-[7.5px] flex-shrink-0 pointer-events-none">
                            f:{startFrame}–{endFrame} ({durationSec})
                          </span>

                          {/* Right Resize Handle */}
                          <div
                            onMouseDown={(e) => handleWidgetMouseDown(e, idx, "resize-end")}
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-400/80 rounded-r"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-7 bg-neutral-900/30 border border-dashed border-neutral-800/80 rounded-lg flex items-center justify-center text-[9px] text-neutral-600 font-medium">
                    Empty Timeline — Add scenes to populate tracks
                  </div>
                )}
              </div>

              {/* VOICE OVER TRACK */}
              <div className="w-full h-4 bg-neutral-900/50 border border-neutral-800/80 rounded relative overflow-hidden flex items-center px-1">
                {activeAudioConfig.voUrl ? (
                  (() => {
                    const voStart = activeAudioConfig.voStartFrame || 0;
                    const voDur = activeAudioConfig.voDurationFrames || effectiveTotalFrames;
                    const startPercent = (voStart / effectiveTotalFrames) * 100;
                    const widthPercent = Math.min(100 - startPercent, (voDur / effectiveTotalFrames) * 100);

                    return (
                      <div
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        onMouseDown={(e) => handleAudioMouseDown(e, "vo")}
                        className={`absolute h-3 border rounded flex items-center justify-between px-1.5 text-[7.5px] font-mono transition-colors cursor-grab active:cursor-grabbing ${
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
                  <span className="text-[7.5px] font-mono text-neutral-600 px-1">🎙️ Voiceover (No Track Loaded)</span>
                )}
              </div>

              {/* BACKGROUND MUSIC TRACK */}
              <div className="w-full h-4 bg-neutral-900/50 border border-neutral-800/80 rounded relative overflow-hidden flex items-center px-1">
                {activeAudioConfig.bgmUrl ? (
                  <div
                    onMouseDown={(e) => handleAudioMouseDown(e, "bgm")}
                    style={{
                      left: `${((activeAudioConfig.bgmStartFrame ?? 0) / effectiveTotalFrames) * 100}%`,
                      width: `${Math.min(100 - ((activeAudioConfig.bgmStartFrame ?? 0) / effectiveTotalFrames) * 100, ((activeAudioConfig.bgmDurationFrames || effectiveTotalFrames) / effectiveTotalFrames) * 100)}%`,
                    }}
                    className="absolute h-3 bg-cyan-500/20 border border-cyan-500/60 rounded flex items-center justify-between px-1.5 text-[7.5px] font-mono text-cyan-300 cursor-grab active:cursor-grabbing"
                  >
                    <span className="truncate">🎵 Background Music</span>
                    <span className="opacity-80">Full Length</span>
                  </div>
                ) : (
                  <span className="text-[7.5px] font-mono text-neutral-600 px-1">🎵 Background Music (No Track Loaded)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
