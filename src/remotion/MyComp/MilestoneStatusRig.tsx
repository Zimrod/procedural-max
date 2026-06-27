// src/remotion/MyComp/MilestoneStatusRig.tsx

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

export type MilestoneItem = {
  stageName: string;   // e.g., "MILESTONE 01"
  title: string;       // e.g., "Architecture Setup"
  description: string; // e.g., "Deploying isolated VPC subnets and routing tables."
  metaValue?: string;  // e.g., "COMPLETED" or "ETA: 2 Mins"
};

type Props = {
  milestones?: MilestoneItem[];
  categoryTitle?: string;
  
  // Driving configuration
  durationSeconds?: number;
  
  // Custom theme choices
  accentColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
};

export const MilestoneStatusRig: React.FC<Props> = ({
  milestones = [
    { stageName: "STAGE 01", title: "Core Architecture Blueprint", description: "Configuring server instances, network firewalls, and security credentials.", metaValue: "SUCCESS" },
    { stageName: "STAGE 02", title: "Data Model Pipeline", description: "Spinning up low-latency storage buckets and establishing relational tables.", metaValue: "ACTIVE" },
    { stageName: "STAGE 03", title: "Automated Integration", description: "Linking continuous deployment webhooks to self-healing cloud execution environments.", metaValue: "PENDING" },
  ],
  categoryTitle = "PROJECT DELIVERY ROADMAP",
  durationSeconds = 5,
  accentColor = "#ff7b00", // Signature automated brand accent
  inactiveColor = "#1e2430",
  backgroundColor = "#0b0d10",
  fontFamily = "Inter, Ubuntu, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const totalFrames = durationSeconds * fps;
  const count = milestones.length;

  // Layout Grid Parameters
  const startY = 180;
  const endY = height - 120;
  const lineX = 160;
  const availableHeight = endY - startY;

  // Master Timeline Spring
  const masterDriver = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 40 },
    durationInFrames: totalFrames,
  });

  // Calculate strict vertical coordinates for each node anchor point
  const nodeCoordinates = useMemo(() => {
    return milestones.map((_, idx) => {
      const segments = count > 1 ? count - 1 : 1;
      const y = startY + (idx / segments) * availableHeight;
      return { x: lineX, y };
    });
  }, [milestones, count, startY, availableHeight]);

  // Determine current active node based on pure video timeline frame placement
  const currentProgressIdx = Math.floor((frame / totalFrames) * count);
  const activeIndex = Math.min(Math.max(currentProgressIdx, 0), count - 1);

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily, overflow: "hidden" }}>
      {/* GRID VECTOR OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.8,
        }}
      />

      {/* OVERHEAD TITLE TRACK */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: lineX - 30,
          color: "rgba(255, 255, 255, 0.3)",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
        }}
      >
        {categoryTitle}
      </div>

      {/* CORE VECTOR INFRASTRUCTURE */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* BASE BACKGROUND DISPATCH RAIL */}
        <line
          x1={lineX}
          y1={nodeCoordinates[0]?.y ?? startY}
          x2={lineX}
          y2={nodeCoordinates[count - 1]?.y ?? endY}
          stroke={inactiveColor}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* GLOWING DATA PLULSE ARTERIAL TRACK */}
        {count > 0 && (
          <line
            x1={lineX}
            y1={nodeCoordinates[0].y}
            x2={lineX}
            y2={interpolate(
              masterDriver,
              [0, 1],
              [nodeCoordinates[0].y, nodeCoordinates[count - 1].y]
            )}
            stroke={accentColor}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0px 0px 12px ${accentColor})`,
            }}
          />
        )}

        {/* PROCEDURAL NODE MATRIX DRAW LOOP */}
        {nodeCoordinates.map((node, idx) => {
          const completionThreshold = idx / (count - 1 || 1);
          const isUnlocked = masterDriver >= completionThreshold;
          const isCurrentActive = idx === activeIndex;

          // Individualized node scale spring cascade
          const nodeDelay = idx * (totalFrames / count) * 0.8;
          const nodeSpring = spring({
            frame: frame - nodeDelay,
            fps,
            config: { damping: 14, stiffness: 100 },
            durationInFrames: 25,
          });

          const scale = interpolate(nodeSpring, [0, 1], [0, 1], {
            extrapolateRight: "clamp",
          });
          const contentFade = interpolate(nodeSpring, [0.4, 1], [0, 1], {
            extrapolateRight: "clamp",
          });
          const cardSlideX = interpolate(nodeSpring, [0, 1], [40, 0]);

          return (
            <g key={idx} transform={`translate(${node.x}, ${node.y}) scale(${scale})`}>
              {/* Outer Pulsing Aura Circle */}
              {isCurrentActive && (
                <circle
                  cx="0"
                  cy="0"
                  r="32"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.5"
                  opacity={0.4}
                  style={{
                    transform: `scale(${interpolate(frame % 25, [0, 25], [0.85, 1.4])})`,
                  }}
                />
              )}

              {/* Core Junction Hub Badge */}
              <circle
                cx="0"
                cy="0"
                r="16"
                fill={isUnlocked ? accentColor : "#161b22"}
                stroke={isUnlocked ? "#ffffff" : inactiveColor}
                strokeWidth={isUnlocked ? 4 : 3}
              />

              {/* DOM CONTAINER FOR COMPLEX DATA BOX SLIDES */}
              <foreignObject
                x="45"
                y="-65"
                width={width - lineX - 120}
                height="130"
                style={{ opacity: contentFade, overflow: "visible" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    transform: `translateX(${cardSlideX}px)`,
                    backgroundColor: isCurrentActive ? "rgba(30, 36, 48, 0.45)" : "transparent",
                    border: isCurrentActive ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
                    padding: "15px 25px",
                    borderRadius: 20,
                    boxSizing: "border-box",
                    transition: "background-color 0.25s ease",
                  }}
                >
                  {/* TEXT WRAPPER LAYER */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isUnlocked ? accentColor : "rgba(255,255,255,0.3)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {milestones[idx].stageName}
                      </span>

                      {/* Pill Badge Meta Value Indicator */}
                      {milestones[idx].metaValue && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            backgroundColor: isUnlocked ? "rgba(255,123,0,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isUnlocked ? accentColor : "rgba(255,255,255,0.05)"}`,
                            color: isUnlocked ? accentColor : "rgba(255,255,255,0.3)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {milestones[idx].metaValue}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: isUnlocked ? "#ffffff" : "#4b5260",
                        marginBottom: 6,
                        lineHeight: 1.1,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {milestones[idx].title}
                    </span>

                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: isUnlocked ? "#9ca3af" : "#4b5260",
                        lineHeight: 1.3,
                        maxWidth: "90%",
                      }}
                    >
                      {milestones[idx].description}
                    </span>
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};