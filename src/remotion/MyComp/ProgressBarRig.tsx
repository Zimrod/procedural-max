// src/remotion/MyComp/ProgressBarRig.tsx
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

type Props = {
  progress?: number; // optional manual override (0–1)
  width?: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  delay?: number;
  borderRadius?: number;
};

export const ProgressBarRig: React.FC<Props> = ({
  width = 800,
  height = 45,
  backgroundColor = "rgba(0,0,0,0.12)",
  fillColor = "#29f401",
  // delay = 20,
  borderRadius = 8,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const durationInSeconds = 2;
  const durationInFrames = durationInSeconds * fps;

  const delayFrames = 30;

  const start = delayFrames;
  const end = delayFrames + durationInFrames;

  const rawProgress = interpolate(
    frame,
    [start, end],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const progress = frame < start ? 0 : rawProgress;

  const fillWidth = progress * width;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        borderRadius,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Fill */}
      <div
        style={{
          height: "100%",
          width: fillWidth,
          backgroundColor: fillColor,
          borderRadius,
          transition: "none",
        }}
      />

      {/* Optional subtle shine overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
          transform: `translateX(${progress * 100}%)`,
        }}
      />
    </div>
  );
};