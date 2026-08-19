// src/remotion/MyComp/TerminalTypingTextRig.tsx
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill, Easing } from "remotion";

type RigProps = {
  readonly textToAnimate: string;
  
  // Custom Typography & Sizing Configuration
  readonly fontSize?: number;
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number; // Total composition lifespan (falls back to useVideoConfig)
  readonly holdDurationInFrames?: number; // Explicit frames to hold card visible after typing
  readonly exitDurationInFrames?: number; // Explicit duration for the scale-out animation
  readonly entranceDurationInFrames?: number; // Explicit duration for scale-in animation

  // Full System Theme Injection Properties
  readonly textColor?: string;
  readonly cursorColor?: string;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly headerBgColor?: string;
  readonly titleColor?: string;
  readonly terminalTitle?: string;
};

export const TerminalTypingTextRig: React.FC<RigProps> = ({
  textToAnimate = "To give the terminal card that high-end, organic floating feel, we use dynamic percentage remapping.", 
  fontSize = 32,
  startFrameOffset = 0,
  durationInFrames: customDurationInFrames,
  holdDurationInFrames,
  exitDurationInFrames,
  entranceDurationInFrames,

  // Modern Dev Theme Fallbacks
  textColor = "#38bdf8",     
  cursorColor = "#38bdf8",   
  backgroundColor = "#0d1117",
  borderColor = "#30363d",
  headerBgColor = "#161b22",
  titleColor = "#8b949e",
  terminalTitle = "bash — main_pipeline.sh",
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames: videoConfigDuration } = useVideoConfig();
  
  // Fallback to video config duration if durationInFrames prop is not passed
  const durationInFrames = customDurationInFrames ?? videoConfigDuration;
  const totalCharacters = textToAnimate.length;

  // CENTRAL FLEXIBLE TIMING ENGINE
  const {
    entranceStart,
    entranceEnd,
    typingStart,
    typingEnd,
    exitStart,
    exitEnd,
  } = useMemo(() => {
    const usableDuration = Math.max(1, durationInFrames - startFrameOffset);

    // Frame durations for entrance and exit transitions
    const entranceFrames = entranceDurationInFrames ?? Math.round(usableDuration * 0.10);
    const exitFrames = exitDurationInFrames ?? Math.round(usableDuration * 0.15); // Extended default exit duration

    let calculatedExitStart: number;
    let calculatedTypingEnd: number;

    if (holdDurationInFrames !== undefined) {
      // Direct hold control: work backwards from exit
      calculatedExitStart = durationInFrames - exitFrames;
      calculatedTypingEnd = Math.max(
        startFrameOffset + entranceFrames,
        calculatedExitStart - holdDurationInFrames
      );
    } else {
      // Proportional fallback with generous hold period
      calculatedExitStart = startFrameOffset + Math.round(usableDuration * 0.82);
      calculatedTypingEnd = startFrameOffset + Math.round(usableDuration * 0.60);
    }

    return {
      entranceStart: startFrameOffset,
      entranceEnd: startFrameOffset + entranceFrames,
      typingStart: startFrameOffset + entranceFrames,
      typingEnd: calculatedTypingEnd,
      exitStart: calculatedExitStart,
      exitEnd: durationInFrames,
    };
  }, [
    durationInFrames,
    startFrameOffset,
    entranceDurationInFrames,
    exitDurationInFrames,
    holdDurationInFrames,
  ]);

  // 1. ENTRANCE TIMELINE
  const entranceScale = interpolate(
    frame,
    [entranceStart, entranceEnd],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1)),
    }
  );

  // 2. CHARACTER TYPING TIMELINE
  const visibleCount = totalCharacters > 0 ? Math.floor(
    interpolate(
      frame,
      [typingStart, typingEnd],
      [0, totalCharacters],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
  ) : 0;

  const visibleText = useMemo(() => {
    return textToAnimate.slice(0, visibleCount);
  }, [textToAnimate, visibleCount]);

  const isTypingFinished = frame >= typingEnd;

  // 3. EXIT TIMELINE (Slower, smoother scale out)
  const exitScale = interpolate(
    frame,
    [exitStart, exitEnd],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const exitTranslateY = interpolate(
    frame,
    [exitStart, exitEnd],
    [0, 30],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const finalCardScale = entranceScale * exitScale;

  // 4. PERIODIC HARMONIC HOVER MOTION
  const waveHoverY = Math.sin(frame / 15) * 12; 
  const waveTiltZ = Math.cos(frame / 20) * 0.5;

  const combinedTranslateY = exitTranslateY + waveHoverY;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          padding: "35px",
          backgroundColor, 
          borderRadius: "16px",
          border: `1px solid ${borderColor}`,
          boxShadow: "0 12px 25px rgba(0, 0, 0, 0.65), 0 30px 60px rgba(0, 0, 0, 0.4)",
          
          fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace", 
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          lineHeight: "1.6",
          letterSpacing: "0.5px",
          textAlign: "left",
          whiteSpace: "pre-wrap", 
          wordBreak: "break-word",
          
          transform: `scale(${finalCardScale}) translateY(${combinedTranslateY}px) rotateZ(${waveTiltZ}deg)`,
          transformOrigin: "center center",
          boxSizing: "border-box",
        }}
      >
        {/* Terminal Header Bar */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center",
            gap: "10px", 
            marginBottom: "25px", 
            borderBottom: `1px solid ${borderColor}`, 
            paddingBottom: "18px",
            backgroundColor: headerBgColor === "transparent" ? "transparent" : headerBgColor,
            margin: "-35px -35px 25px -35px",
            padding: "18px 35px",
            borderRadius: "16px 16px 0 0"
          }}
        >
          <div style={{ width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#ff5f56" }} />
          <div style={{ width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#27c93f" }} />
          <span 
            style={{ 
              color: titleColor, 
              fontSize: "15px", 
              marginLeft: "15px", 
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", 
              fontWeight: 500 
            }}
          >
            {terminalTitle}
          </span>
        </div>

        {/* Code Text Content Output Layer */}
        <span style={{ color: textColor }}>
          {visibleText}
        </span>

        {/* Dynamic Blinking Block Cursor */}
        <span
          style={{
            display: "inline-block",
            width: `${fontSize * 0.55}px`,
            height: `${fontSize * 0.9}px`,
            backgroundColor: cursorColor,
            marginLeft: "6px",
            verticalAlign: "middle",
            opacity: !isTypingFinished || Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};