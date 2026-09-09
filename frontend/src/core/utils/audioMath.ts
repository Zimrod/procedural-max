// src/core/utils/audioMath.ts
import { interpolate } from "remotion";

interface BgmVolumeParams {
  frame: number;
  totalFrames: number;
  bgmMasterVolume: number; // 0.0 to 1.0
  duckedVolumeRatio?: number; // Default 0.15 (15% of master volume)
  voStartFrame?: number;
  voEndFrame?: number;
  fadeFrames?: number; // Fade duration in frames (e.g., 30f = 1s at 30fps)
  fadeStartFrame?: number;
  fadeEndFrame?: number;
}

export function getDynamicBgmVolume({
  frame,
  totalFrames,
  bgmMasterVolume,
  duckedVolumeRatio = 0.15,
  voStartFrame,
  voEndFrame,
  fadeFrames = 30,
  fadeStartFrame = 0,
  fadeEndFrame = totalFrames,
}: BgmVolumeParams): number {
  if (bgmMasterVolume <= 0) return 0;

  // 1. Entrance Fade-In (0s -> 1s)
  const fadeIn = interpolate(frame, [fadeStartFrame, fadeStartFrame + fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. Exit Fade-Out (End-1s -> End)
  const fadeOut = interpolate(frame, [Math.max(fadeStartFrame, fadeEndFrame - fadeFrames), fadeEndFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. Audio Ducking during Voiceover
  let duckingFactor = 1.0;
  if (voStartFrame !== undefined && voEndFrame !== undefined && voEndFrame > voStartFrame) {
    const rampFrames = 10; // Smooth 0.33s volume transition
    const isInsideVo = frame >= voStartFrame - rampFrames && frame <= voEndFrame + rampFrames;

    if (isInsideVo) {
      // Transition down when VO starts
      const duckDown = interpolate(frame, [voStartFrame - rampFrames, voStartFrame + rampFrames], [1, duckedVolumeRatio], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      // Transition back up when VO ends
      const duckUp = interpolate(frame, [voEndFrame - rampFrames, voEndFrame + rampFrames], [duckedVolumeRatio, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      duckingFactor = Math.min(duckDown, duckUp);
    }
  }

  return bgmMasterVolume * fadeIn * fadeOut * duckingFactor;
}
