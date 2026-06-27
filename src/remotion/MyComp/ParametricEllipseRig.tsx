// src/remotion/MyComp/ParametricEllipseRig.tsx
import React, { useEffect, useState } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
  interpolate,
  spring,
} from "remotion";

interface EmojiCircleData {
  svgText: string;
  viewBox: { x: number; y: number; w: number; h: number };
  pivots: {
    top: { x: number; y: number };
    bottom: { x: number; y: number };
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
  center: { x: number; y: number };
}

// Parse the external SVG file, extracting the inner HTML and your 4 explicit pivots
const parseEmojiCircle = (svgText: string): EmojiCircleData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) throw new Error("Invalid SVG asset for Emoji Circle");

  // Extract ViewBox boundaries
  const vb = svgEl.getAttribute("viewBox")?.split(" ").map(Number);
  const viewBox = vb 
    ? { x: vb[0], y: vb[1], w: vb[2], h: vb[3] } 
    : { x: 0, y: 0, w: 500, h: 500 };

  // Helper to extract node coordinates by ID
  const getPivotCoords = (id: string, defaultX: number, defaultY: number) => {
    const el = svgEl.querySelector(`#${id}`);
    if (el) {
      return {
        x: parseFloat(el.getAttribute("cx") ?? String(defaultX)),
        y: parseFloat(el.getAttribute("cy") ?? String(defaultY)),
      };
    }
    console.warn(`Pivot with ID #${id} not found in SVG. Using fallback placement.`);
    return { x: defaultX, y: defaultY };
  };

  // Locate your 4 custom circumference pivots
  const top = getPivotCoords("pivot_top", viewBox.w / 2, viewBox.y);
  const bottom = getPivotCoords("pivot_bottom", viewBox.w / 2, viewBox.y + viewBox.h);
  const left = getPivotCoords("pivot_side_left", viewBox.x, viewBox.h / 2);
  const right = getPivotCoords("pivot_side_right", viewBox.x + viewBox.w, viewBox.h / 2);

  // Calculate the absolute core center point of the shape based on the pivot cross-hairs
  const center = {
    x: (left.x + right.x) / 2,
    y: (top.y + bottom.y) / 2,
  };

  return {
    svgText: svgEl.innerHTML,
    viewBox,
    pivots: { top, bottom, left, right },
    center,
  };
};

export const ParametricEllipseRig: React.FC<{
  svgFilename?: string;      // Defaults to 'emoji_circle.svg'
  squishDurationSeconds?: number;
  minVerticalScale?: number; // Adjusts the minimum gap height (0.1 to 0.9)
  showDebugPivots?: boolean; // Displays the real-time calculated tracking points
}> = ({
  svgFilename = "emoji_circle.svg",
  squishDurationSeconds = 2,
  minVerticalScale = 0.45,   // Stops at 45% of total height, leaving an unbreakable gap
  showDebugPivots = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  const [emojiData, setEmojiData] = useState<EmojiCircleData | null>(null);

  // Asynchronous Asset Asset Resolution Loop (Matching CarDrive.tsx)
  useEffect(() => {
    const handle = delayRender("Loading parametric emoji asset");
    
    // Looks directly into public/emoji-circle/ folder
    fetch(staticFile(`emoji-circle/${svgFilename}`))
      .then((r) => r.text())
      .then((svgText) => {
        setEmojiData(parseEmojiCircle(svgText));
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Failed to load or parse emoji circle SVG:", err);
        continueRender(handle);
      });
  }, [svgFilename]);

  if (!emojiData) return null;

  // --- ANIMATION CONTROLLER ---
  // Loops back and forth smoothly every cycle duration
  const totalLoopFrames = squishDurationSeconds * fps;
  const loopProgress = (frame % totalLoopFrames) / totalLoopFrames;
  
  // Create a continuous wave input (0 -> 1 -> 0)
  const wave = Math.sin(loopProgress * Math.PI);

  // Smoothly interpolate the scale factor from 1.0 down to your custom safe gap threshold
  const scaleY = interpolate(wave, [0, 1], [1.0, minVerticalScale]);

  // --- GEOMETRIC TRANSLATION MATRIX ---
  // To keep the emoji centered in the Remotion video viewport canvas
  const canvasCenterX = videoWidth / 2;
  const canvasCenterY = videoHeight / 2;

  // Offset shifts needed to move the SVG asset center to the video viewport center
  const tx = canvasCenterX - emojiData.center.x;
  const ty = canvasCenterY - emojiData.center.y;

  // --- LIVE PARAMETRIC COORDINATE TRACKING ---
  // Calculate exactly where the pivots are in the world coordinate space during deformation
  const getTransformedWorldCoords = (pivotPt: { x: number; y: number }) => {
    // 1. Get relative distance from asset center
    const dx = pivotPt.x - emojiData.center.x;
    const dy = pivotPt.y - emojiData.center.y;
    // 2. Multiply by our scale matrix and apply canvas center mapping shifts
    return {
      x: canvasCenterX + dx, 
      y: canvasCenterY + (dy * scaleY),
    };
  };

  const livePivotTop = getTransformedWorldCoords(emojiData.pivots.top);
  const livePivotBottom = getTransformedWorldCoords(emojiData.pivots.bottom);
  const livePivotLeft = getTransformedWorldCoords(emojiData.pivots.left);
  const livePivotRight = getTransformedWorldCoords(emojiData.pivots.right);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={videoWidth}
        height={videoHeight}
        viewBox={`0 0 ${videoWidth} ${videoHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* TRANSFORMATION ENGINE:
          1. Translate asset coordinate center to match canvas viewport
          2. Scale non-uniformly along the Y axis around that exact origin point
        */}
        <g transform={`translate(${canvasCenterX}, ${canvasCenterY}) scale(1, ${scaleY}) translate(${-emojiData.center.x}, ${-emojiData.center.y})`}>
          {/* Injecting raw pre-designed SVG layers */}
          <g dangerouslySetInnerHTML={{ __html: emojiData.svgText }} />
        </g>

        {/* VIRTUAL REFERENCE TRACKERS (Confirms coordinate positions match deformation) */}
        {showDebugPivots && (
          <g>
            {/* Top Pivot Tracking Line & Pin */}
            <circle cx={livePivotTop.x} cy={livePivotTop.y} r="10" fill="#ff4a4a" stroke="#fff" strokeWidth="2" />
            
            {/* Bottom Pivot Tracking Line & Pin */}
            <circle cx={livePivotBottom.x} cy={livePivotBottom.y} r="10" fill="#ff4a4a" stroke="#fff" strokeWidth="2" />
            
            {/* Left Pivot Tracker */}
            <circle cx={livePivotLeft.x} cy={livePivotLeft.y} r="8" fill="#00caff" stroke="#fff" strokeWidth="2" />
            
            {/* Right Pivot Tracker */}
            <circle cx={livePivotRight.x} cy={livePivotRight.y} r="8" fill="#00caff" stroke="#fff" strokeWidth="2" />

            {/* Dynamic Connecting Vector Wire */}
            <line 
              x1={livePivotTop.x} y1={livePivotTop.y} 
              x2={livePivotBottom.x} y2={livePivotBottom.y} 
              stroke="rgba(255, 255, 255, 0.25)" 
              strokeDasharray="6 6" 
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
};