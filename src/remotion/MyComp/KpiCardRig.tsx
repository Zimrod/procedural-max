// src/remotion/MyComp/KpiCardRig.tsx
import React, { useId, useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type Props = {
  title?: string;
  targetValue?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  
  // Trend Metrics
  percentageChange?: number; // e.g., 14.5 or -3.2
  trendLabel?: string;      // e.g., "vs last month"
  
  // Historical Sparkline points (Expects an array of 6-10 numeric values)
  sparklineData?: number[];

  // Styling Adjustments
  width?: number;
  fontFamily?: string;
};

export const KpiCardRig: React.FC<Props> = ({
  title = "Revenue",
  targetValue = 128400,
  valuePrefix = "",
  valueSuffix = "",
  percentageChange = 14.5,
  trendLabel = "vs last period",
  sparklineData = [30, 45, 35, 60, 49, 72, 85],
  width = 600,
  fontFamily = "Ubuntu, -apple-system, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const uniqueId = useId().replace(/:/g, "");
  const sparklineWidth = 240;
  const sparklineHeight = 45;

  // 1. Core Physics Drivers
  const entrySpring = spring({
    frame,
    fps,
    config: { stiffness: 90, damping: 15 },
  });

  const countSpring = spring({
    frame,
    fps,
    config: { stiffness: 60, damping: 16 },
    delay: 10, // Starts rolling shortly after the card enters
  });

  // 2. Format & Value Interpolations
  // Safely cast targetValue to a number and provide a zero fallback to prevent crash
  const safeTargetValue = Number.isFinite(targetValue) ? Number(targetValue) : 0;
  const safePercentageChange = Number.isFinite(percentageChange)
    ? Number(percentageChange)
    : 0;

  const liveValue = interpolate(countSpring, [0, 1], [0, safeTargetValue]);
  const formattedValue = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(liveValue));

  const isPositive = safePercentageChange >= 0;
  const trendColor = isPositive ? "#10b981" : "#ef4444"; // Tailwind green-500 vs red-500
  const trendBg = isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)";

  // 3. Procedural SVG Sparkline Geometry Engine
  const { pathD, areaD } = useMemo(() => {
    if (sparklineData.length < 2) return { pathD: "", areaD: "" };
    
    const svgW = sparklineWidth;
    const svgH = sparklineHeight;
    const minX = 0;
    const maxX = svgW;
    
    const minVal = Math.min(...sparklineData);
    const maxVal = Math.max(...sparklineData);
    const valRange = maxVal - minVal || 1;

    // Calculate normalized point arrays
    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * (maxX - minX) + minX;
      // Invert Y because SVG coordinates start from top-left (0,0)
      const y = svgH - ((val - minVal) / valRange) * (svgH - 4) - 2;
      return { x, y };
    });

    // Build the structural open path line
    let lineStr = `M ${points[0].x} ${points[0].y} `;
    for (let i = 1; i < points.length; i++) {
      lineStr += `L ${points[i].x} ${points[i].y} `;
    }

    // Close the path geometry downward to form a valid color gradient fill boundary area
    const areaStr = `${lineStr} L ${points[points.length - 1].x} ${svgH} L ${points[0].x} ${svgH} Z`;

    return { pathD: lineStr, areaD: areaStr };
  }, [sparklineData, sparklineHeight, sparklineWidth]);

  // Card reveals cleanly via subtle upward translation matrix and scaling interpolation
  const cardOffsetY = interpolate(entrySpring, [0, 1], [40, 0]);
  const cardOpacity = interpolate(entrySpring, [0, 1], [0, 1]);
  
  // Sparkline mask drawing progression animation
  const sparklineRevealWidth = interpolate(countSpring, [0, 1], [0, sparklineWidth]);

  return (
    <div
      style={{
        width,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: "28px 32px",
        fontFamily,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
        transform: `translateY(${cardOffsetY}px)`,
        opacity: cardOpacity,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* CARD TOP LAYER: METRIC LABELS */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#6b7280", // Muted neutral gray text
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      {/* MID LAYER: PRIMARY METRIC & CHIP HOOK */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 20,
        }}
      >
        {/* BIG COUNT DIGIT */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "baseline",
            gap: 2,
            fontVariantNumeric: "tabular-nums lining-nums",
          }}
        >
          {valuePrefix ? (
            <span style={{ fontSize: 42, fontWeight: 700 }}>{valuePrefix}</span>
          ) : null}
          <span>{formattedValue}</span>
          {valueSuffix ? (
            <span style={{ fontSize: 36, fontWeight: 600 }}>{valueSuffix}</span>
          ) : null}
        </div>

        {/* TREND BADGE CHIP */}
        <div
          style={{
            backgroundColor: trendBg,
            color: trendColor,
            padding: "6px 12px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 6,
          }}
        >
          {/* Dynamic Vector Arrows */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {isPositive ? (
              <>
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </>
            ) : (
              <>
                <line x1="7" y1="7" x2="17" y2="17" />
                <polyline points="17 7 17 17 7 17" />
              </>
            )}
          </svg>
          {Math.abs(safePercentageChange).toFixed(1)}%
        </div>
      </div>

      {/* LOWER FOOTER: HISTORICAL DATA SECTION */}
      <div
        style={{
          borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#9ca3af",
          }}
        >
          {trendLabel}
        </div>

        {/* SPARKLINE CANVAS COMPONENT */}
        <div 
          style={{
            width: sparklineWidth,
            height: sparklineHeight,
            position: "relative",
            alignSelf: "flex-end",
            flexShrink: 0,
          }}
        >
          <svg
            width={sparklineWidth}
            height={sparklineHeight}
            viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
            fill="none"
            style={{ overflow: "hidden", display: "block" }}
          >
            <defs>
              {/* Soft Area fill gradient under data graph points */}
              <linearGradient id={`${uniqueId}-sparklineGrad`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={trendColor} stopOpacity="0.00" />
              </linearGradient>

              {/* Sequential Stroke reveal clip mask setup */}
              <clipPath id={`${uniqueId}-revealClip`} clipPathUnits="userSpaceOnUse">
                <rect x="0" y="0" width={sparklineRevealWidth} height={sparklineHeight} />
              </clipPath>
            </defs>

            <g clipPath={`url(#${uniqueId}-revealClip)`}>
              {/* Gradient Shading Path */}
              <path d={areaD} fill={`url(#${uniqueId}-sparklineGrad)`} />
              {/* Core Solid Line Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={trendColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
