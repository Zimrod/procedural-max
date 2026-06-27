// src/remotion/MyComp/MarketOvertakeChartRig.tsx
'use client';

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type OvertakeChartProps = {
  title?: string;
  greenLabel?: string;
  greyLabel?: string;
  targetYear?: string;
  backgroundColor?: string;
  accentGreen?: string;
  fossilGrey?: string;
};

export const MarketOvertakeChartRig: React.FC<OvertakeChartProps> = ({
  title = "ENERGY INSIGHTS: THE CAPEX CROSSOVER",
  greenLabel = "RENEWABLES & GRID",
  greyLabel = "OIL & GAS EXTRACTION",
  targetYear = "2026",
  backgroundColor = "#040712",
  accentGreen = "#10b981",
  fossilGrey = "#6b7280",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Core layout metrics for drawing inside the canvas bounds
  const chartWidth = 1300;
  const chartHeight = 550;
  const originX = 310;
  const originY = 800;

  // Global Entry Springs
  const baseEntrance = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 50 },
  });

  // Timeline sweep indicator tracking along the horizontal axis
  const graphProgress = interpolate(frame, [20, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Data coordinate curves for multi-point resolution graphs
  // Year indices map 0 to 4 (e.g. 2022, 2024, 2026, 2028, 2030)
  const fossilData = [1.6, 1.45, 1.25, 1.15, 1.05];  // Trillions down
  const greenData = [0.9, 1.15, 1.35, 1.75, 2.15];  // Trillions up

  // Helper function to map financial data models into SVG coordinate paths
  const getCoordinatesForIndex = (index: number, dataArray: number[]) => {
    const x = originX + (index / (dataArray.length - 1)) * chartWidth;
    // Normalize maximum graph cap scale at $2.5T max headroom
    const y = originY - (dataArray[index] / 2.5) * chartHeight;
    return { x, y };
  };

  // Compile dynamic SVG path coordinates along time progression vector
  const buildSvgPath = (dataArray: number[], currentProgress: number) => {
    let path = "";
    const totalPoints = dataArray.length;
    const maxIndexToRender = currentProgress * (totalPoints - 1);

    for (let i = 0; i < totalPoints; i++) {
      const pt = getCoordinatesForIndex(i, dataArray);
      
      if (i === 0) {
        path += `M ${pt.x} ${pt.y}`;
      } else {
        const prevPt = getCoordinatesForIndex(i - 1, dataArray);
        
        if (i <= maxIndexToRender) {
          path += ` L ${pt.x} ${pt.y}`;
        } else {
          // Linear interpolation for current rendering frame step segment
          const segmentProgress = maxIndexToRender - (i - 1);
          if (segmentProgress > 0) {
            const interX = interpolate(segmentProgress, [0, 1], [prevPt.x, pt.x]);
            const strokeY = interpolate(segmentProgress, [0, 1], [prevPt.y, pt.y]);
            path += ` L ${interX} ${strokeY}`;
          }
          break;
        }
      }
    }
    return path;
  };

  const fossilPath = buildSvgPath(fossilData, graphProgress);
  const greenPath = buildSvgPath(greenData, graphProgress);

  // Derive running value strings dynamically based on graph progress matrix
  const currentFossilVal = interpolate(graphProgress, [0, 1], [fossilData[0], fossilData[fossilData.length - 1]]).toFixed(2);
  const currentGreenVal = interpolate(graphProgress, [0, 1], [greenData[0], greenData[greenData.length - 1]]).toFixed(2);

  // Extract precise pixel positioning for crossover timeline marker intersection point (Index 2 = 2026)
  const crossoverPoint = getCoordinatesForIndex(2, greenData);

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily: 'Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* Background Matrix Grid */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 * baseEntrance }}>
        <defs>
          <pattern id="chartGridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#475569" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chartGridPattern)" />
      </svg>

      {/* Main Dynamic Vector Board */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" fill="none">
        <defs>
          <filter id="neonGlowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Axis Structural Foundations */}
        <g stroke="#334155" strokeWidth="2" style={{ opacity: baseEntrance }}>
          {/* Baseline Base horizontal X-axis */}
          <line x1={originX} y1={originY} x2={originX + chartWidth} y2={originY} />
          {/* Vertical Y-axis bounds */}
          <line x1={originX} y1={originY} x2={originX} y2={originY - chartHeight} />
        </g>

        {/* Dynamic Area Underlay Stacks */}
        {graphProgress > 0 && (
          <>
            {/* Renewable Fill Area */}
            <path
              d={`${greenPath} L ${originX + (graphProgress * chartWidth)} ${originY} L ${originX} ${originY} Z`}
              fill={accentGreen}
              style={{ opacity: 0.04 }}
            />
          </>
        )}

        {/* Graph Line Vectors */}
        <path d={fossilPath} fill="none" stroke={fossilGrey} strokeWidth="5" strokeLinecap="round" style={{ opacity: 0.6 }} />
        <path d={greenPath} fill="none" stroke={accentGreen} strokeWidth="6" strokeLinecap="round" filter="url(#neonGlowGreen)" />

        {/* INTERSECTION MATRIX CRITICAL OVERLAY: 2026 Overtake Point */}
        {graphProgress >= 0.5 && (
          <g style={{ opacity: interpolate(graphProgress, [0.5, 0.58], [0, 1]) }}>
            {/* Vertical Crossover Grid Intersect Indicator */}
            <line
              x1={crossoverPoint.x}
              y1={originY}
              x2={crossoverPoint.x}
              y2={originY - chartHeight}
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="6,4"
            />
            {/* Pulse Node Target Intersect Ring */}
            <circle cx={crossoverPoint.x} cy={crossoverPoint.y} r="8" fill="#6366f1" />
            <circle cx={crossoverPoint.x} cy={crossoverPoint.y} r="16" fill="none" stroke="#6366f1" strokeWidth="2">
              <animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>

      {/* DASHBOARD GRAPH LABELS AND TELEMETRY INFO PANELS */}
      <AbsoluteFill style={{ padding: '80px 100px', pointerEvents: 'none' }}>
        
        {/* Dynamic Header Block */}
        <div style={{ opacity: baseEntrance, transform: `translateY(${interpolate(baseEntrance, [0, 1], [-20, 0])}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ backgroundColor: accentGreen, width: '12px', height: '12px', borderRadius: '2px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 700, letterSpacing: '3px', margin: 0 }}>
              SECTOR CAPEX REBALANCING STUDY
            </p>
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: '44px', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px' }}>
            {title}
          </h1>
        </div>

        {/* Dynamic Real-time HUD Values Panel Side Deck */}
        <div style={{ 
          position: 'absolute', 
          left: '100px', 
          top: '280px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '30px',
          opacity: baseEntrance 
        }}>
          {/* Green Metrics Tracker Card */}
          <div style={{ borderLeft: `4px solid ${accentGreen}`, paddingLeft: '15px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>{greenLabel}</span>
            <h3 style={{ color: accentGreen, fontSize: '40px', fontWeight: 800, margin: '5px 0 0 0' }}>
              ${currentGreenVal}T
            </h3>
          </div>

          {/* Grey Metrics Tracker Card */}
          <div style={{ borderLeft: `4px solid ${fossilGrey}`, paddingLeft: '15px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>{greyLabel}</span>
            <h3 style={{ color: '#cbd5e1', fontSize: '40px', fontWeight: 800, margin: '5px 0 0 0' }}>
              ${currentFossilVal}T
            </h3>
          </div>
        </div>

        {/* HORIZONTAL TIME SCALE AXIS LABEL TICKS (2022 - 2030) */}
        <div style={{ 
          position: 'absolute', 
          left: `${originX}px`, 
          top: `${originY + 20}px`, 
          width: `${chartWidth}px`, 
          display: 'flex', 
          justifyContent: 'space-between',
          color: '#475569',
          fontSize: '15px',
          fontWeight: 700,
          opacity: baseEntrance
        }}>
          {['2022 BASE', '2024', `CROSSOVER (${targetYear})`, '2028', '2030 FORECAST'].map((year, idx) => {
            const isTarget = idx === 2;
            return (
              <span 
                key={year} 
                style={{ 
                  color: isTarget && graphProgress >= 0.5 ? '#818cf8' : undefined,
                  transition: 'color 0.3s ease',
                  transform: isTarget ? 'translateX(-15px)' : undefined
                }}
              >
                {year}
              </span>
            );
          })}
        </div>

        {/* CRITICAL CROSSOVER HUD HIGHLIGHT MESSAGE BALLOON */}
        {graphProgress >= 0.52 && (
          <div style={{
            position: 'absolute',
            left: `${crossoverPoint.x - 170}px`,
            top: `${crossoverPoint.y - 120}px`,
            width: '340px',
            backgroundColor: '#0b1329',
            border: '1px solid #4f46e5',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            opacity: interpolate(graphProgress, [0.52, 0.6], [0, 1]),
            transform: `translateY(${interpolate(graphProgress, [0.52, 0.6], [15, 0])}px)`
          }}>
            <p style={{ color: '#818cf8', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', margin: '0 0 4px 0' }}>
              MARKET INVERSION POINT
            </p>
            <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500, margin: 0, lineHeight: '1.4' }}>
              Clean Energy Capex officially outpaces legacy hydrocarbon exploration focus.
            </p>
          </div>
        )}

      </AbsoluteFill>
    </AbsoluteFill>
  );
};