// src/remotion/MyComp/TerminalTypingTextRig.tsx
import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, AbsoluteFill, Easing } from "remotion";

type RigProps = {
  readonly textToAnimate: string;
  
  // Custom Typography & Sizing Configuration
  readonly fontSize?: number;
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number; // 💡 MASTER TIMELINE LIMIT CONTROLLER

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
  durationInFrames = 90, // Bound directly to internal lifespans below

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
  // const { width, height } = useVideoConfig();
  const totalCharacters = textToAnimate.length;

  // 💡 CENTRAL FIXED PERCENTAGE TIMING ENGINE
  // All sequence components are completely relative to durationInFrames
  const {
    entranceStart,
    entranceEnd,
    typingStart,
    typingEnd,
    exitStart,
    exitEnd,
  } = useMemo(() => {
    const usableDuration = durationInFrames - startFrameOffset;
    
    return {
      entranceStart: startFrameOffset,
      entranceEnd: startFrameOffset + Math.round(usableDuration * 0.10), // First 10% Pop-In
      typingStart: startFrameOffset + Math.round(usableDuration * 0.10),
      typingEnd: startFrameOffset + Math.round(usableDuration * 0.70),   // Next 60% Typing Out
      exitStart: startFrameOffset + Math.round(usableDuration * 0.90),   // Holds 20%, exits at 90%
      exitEnd: durationInFrames,                                         // Last 10% Pop-Out
    };
  }, [durationInFrames, startFrameOffset]);

  // 1. ENTRANCE TIMELINE
  const entranceScale = interpolate(
    frame,
    [entranceStart, entranceEnd],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1)), // Organic spring-like overshoot
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

  // 3. EXIT TIMELINE
  const exitScale = interpolate(
    frame,
    [exitStart, exitEnd],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.bezier(0.36, 0, 0.66, -0.56)), // Anticipatory snap exit
    }
  );

  const exitTranslateY = interpolate(
    frame,
    [exitStart, exitEnd],
    [0, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Combine scaling behaviors safely
  const finalCardScale = entranceScale * exitScale;

  // 4. PERIODIC HARMONIC HOVER MOTION
  // Frequencies scale to match frame constraints natively
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