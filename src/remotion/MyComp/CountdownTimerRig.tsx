// src/remotion/MyComp/CountdownTimerRig.tsx

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type Props = {
  durationSeconds: number;

  size?: number;
  strokeWidth?: number;

  primaryColor?: string;
  warningColor?: string;
  dangerColor?: string;

  trackColor?: string;
  textColor?: string;

  fontFamily?: string;
  fontSize?: number;

  showMilliseconds?: boolean;
  glowIntensity?: number;
};

export const CountdownTimerRig: React.FC<Props> = ({
  durationSeconds,

  size = 260,
  strokeWidth = 10,

  primaryColor = "#083569",
  warningColor = "#f59e0b",
  dangerColor = "#ef4444",

  trackColor = "rgba(255,255,255,0.08)",
  textColor = "#ffffff",

  fontFamily = "Ubuntu, sans-serif",
  fontSize = 54,

  showMilliseconds = true,
  glowIntensity = 18,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safeFps = fps || 30;

  const totalFrames = Math.max(1, durationSeconds * safeFps);

  const clampedFrame = Math.min(frame, totalFrames);

  // -----------------------------------------
  // TIME
  // -----------------------------------------

  const framesRemaining = Math.max(0, totalFrames - clampedFrame);

  const secondsRemaining = framesRemaining / safeFps;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = Math.floor(secondsRemaining % 60);
  const milliseconds = Math.floor((secondsRemaining % 1) * 100);

  const strMinutes = String(minutes).padStart(2, "0");
  const strSeconds = String(seconds).padStart(2, "0");
  const strMilliseconds = String(milliseconds).padStart(2, "0");

  const timeDisplay = showMilliseconds
    ? `${minutes > 0 ? `${strMinutes}:` : ""}${strSeconds}.${strMilliseconds}`
    : `${minutes > 0 ? `${strMinutes}:` : ""}${strSeconds}`;

  // -----------------------------------------
  // PROGRESS
  // -----------------------------------------

  const progress = framesRemaining / totalFrames;

  const center = size / 2;
  const radius = center - strokeWidth * 2;

  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference * interpolate(progress, [0, 1], [1, 0]);

  // -----------------------------------------
  // COLOR TRANSITIONS
  // -----------------------------------------

  const dynamicColor =
    progress > 0.5
      ? primaryColor
      : progress > 0.2
      ? warningColor
      : dangerColor;

  // -----------------------------------------
  // TICK PULSE
  // -----------------------------------------

  const frameInsideSecond = frame % safeFps;

  const tickSpring = spring({
    frame: frameInsideSecond,
    fps: safeFps,
    config: {
      damping: 12,
      stiffness: 220,
    },
    durationInFrames: 12,
  });

  const pulseScale = interpolate(
    tickSpring,
    [0, 0.5, 1],
    [1, 1.08, 1]
  );

  // -----------------------------------------
  // BREATHING ANIMATION
  // -----------------------------------------

  const breathing =
    1 + Math.sin(frame * 0.04) * 0.01;

  // -----------------------------------------
  // OUTER ROTATION
  // -----------------------------------------

  const rotation = frame * 0.8;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${breathing})`,
      }}
    >
      {/* OUTER DECORATION RING */}
      <svg
        width={size + 20}
        height={size + 20}
        style={{
          position: "absolute",
          transform: `rotate(${rotation}deg)`,
          opacity: 0.25,
        }}
      >
        <circle
          cx={(size + 20) / 2}
          cy={(size + 20) / 2}
          r={radius + 10}
          fill="none"
          stroke={dynamicColor}
          strokeWidth={1.5}
          strokeDasharray="6 12"
        />
      </svg>

      {/* MAIN TIMER */}
      <svg
        width={size}
        height={size}
        style={{
          transform: "rotate(-90deg)",
          overflow: "visible",
        }}
      >
        {/* TRACK */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* ACTIVE RING */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={dynamicColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 ${glowIntensity}px ${dynamicColor})`,
          }}
        />
      </svg>

      {/* CENTER TEXT */}
      <div
        style={{
          position: "absolute",
          color: textColor,
          fontSize,
          fontWeight: 800,
          fontFamily,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${pulseScale})`,
          letterSpacing: "-0.04em",
          textShadow: `0 0 18px ${dynamicColor}`,
        }}
      >
        {timeDisplay}
      </div>
    </div>
  );
};