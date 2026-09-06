"use client";

import { RefObject, useMemo } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Main } from "../graphics/Main";
import { VIDEO_FPS } from "../types/constants";
import { CompositionTheme } from "../types/theme";

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
}: PreviewPlayerProps) {
  const isVertical = selectedAspect.value < 1;
  const compositionDimensions = useMemo(() => {
    const height = 1080;
    return {
      width: Math.round(height * selectedAspect.value),
      height,
    };
  }, [selectedAspect.value]);

  // Calculate total frames dynamically across property variations
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
                // Main renders the `scenes` prop; keep it authoritative when callers pass legacy props.
                inputProps={{ ...inputProps, scenes: sceneConfig, sceneConfig }}
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

        {/* Scene Config Timeline Track */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Scene Sequence Timeline
            </span>
            <span className="font-mono text-emerald-400">
              {computedTotalFrames} Frames ({Math.round((computedTotalFrames / VIDEO_FPS) * 10) / 10}s)
            </span>
          </div>

          <div className="w-full bg-black/80 rounded-xl p-1.5 border border-neutral-800 flex gap-1 overflow-hidden min-h-[52px] items-center">
            {sceneConfig.length > 0 ? (
              sceneConfig.map((scene, idx) => {
                const duration =
                  scene.durationFrames ??
                  scene.durationInFrames ??
                  scene.duration ??
                  90;
                const widthPercent = (duration / computedTotalFrames) * 100;
                const widgetName = scene.widget || scene.type || `Scene #${idx + 1}`;

                return (
                  <div
                    key={scene.id || idx}
                    style={{ width: `${widthPercent}%` }}
                    className="group relative h-10 bg-neutral-900 hover:bg-emerald-950/40 border border-neutral-800 hover:border-emerald-500/60 rounded-lg p-1.5 flex flex-col justify-between transition-all cursor-pointer overflow-hidden flex-shrink-0"
                    title={`Scene #${idx + 1}: ${widgetName} (${duration} frames)`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full text-[9px] truncate">
                      <span className="font-bold text-neutral-300 group-hover:text-emerald-300 truncate">
                        #{idx + 1} {widgetName}
                      </span>
                      <span className="font-mono text-neutral-500 group-hover:text-emerald-400 text-[8px] flex-shrink-0">
                        {duration}f
                      </span>
                    </div>

                    <div className="w-full h-1 bg-neutral-800 group-hover:bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-10 bg-neutral-900/30 border border-dashed border-neutral-800/80 rounded-lg flex items-center justify-center text-[10px] text-neutral-600 font-medium">
                Empty Timeline — Add scenes to populate tracks
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
