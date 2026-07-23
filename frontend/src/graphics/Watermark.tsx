// src/graphics/Watermark.tsx
import React from "react";
import { AbsoluteFill, useRemotionEnvironment } from "remotion";

export const Watermark: React.FC = () => {
  const { isRendering } = useRemotionEnvironment();

  // Hide watermark during production renders on AWS Lambda / CLI
  if (isRendering) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: "rotate(-32deg)",
          color: "rgba(255, 255, 255, 0.38)", // Semi-transparent overlay so scenes stay readable
          fontSize: 110,
          fontWeight: 900,
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          userSelect: "none",
          textShadow: "0 0 30px rgba(0, 0, 0, 0.3)",
          borderTop: "4px dashed rgba(255, 255, 255, 0.15)",
          borderBottom: "4px dashed rgba(255, 255, 255, 0.15)",
          padding: "20px 100px",
        }}
      >
        PREVIEW MODE
      </div>
    </AbsoluteFill>
  );
};