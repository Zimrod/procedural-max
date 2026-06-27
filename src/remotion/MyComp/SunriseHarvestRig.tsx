// src/remotion/MyComp/SunriseHarvestRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
} from 'remotion';

type Props = {
  glowColor?: string;        // Light Green accent for panel activation
  basePanelColor?: string;   // Dark unactivated silicon color
};

export const SunriseHarvestRig: React.FC<Props> = ({
  glowColor = "#48bb78",
  basePanelColor = "#0d131c",
}) => {
  const frame = useCurrentFrame();

  // 1. TIMELINE INTERPOLATION BREAKPOINTS (Total Duration: ~120 Frames)
  // Dynamic sky background color progression representing dawn breaking
  const skyColor = interpolateColors(
    frame,
    [0, 40, 90],
    ['#04060a', '#1a1025', '#0f2042'] // Midnight -> Early Dawn -> Full Sunrise Sky Blue
  );

  // Vertical Y-axis translation for the rising sun element
  const sunY = interpolate(frame, [15, 75], [750, 280], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scale up the sun's glow expansion as it climbs higher
  const sunGlowScale = interpolate(frame, [30, 90], [1, 2.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // EXTENDED VOLUMETRIC LIGHT RAYS OPACITY
  // Lowered max opacity from 0.45 down to 0.12 to allow the beams to overlay the panels safely
  const rayOpacity = interpolate(frame, [45, 85], [0, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Matrix panel activation sweep progress
  const activationProgress = interpolate(frame, [60, 110], [0, 24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 2. MATRIX GRID SETTINGS FOR GROUND LAYOUT
  const rows = 3;
  const cols = 8;
  const groundHorizonY = 650;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      
      {/* GLOW AND FILTER DEFINITIONS BLOCK */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Solar Panel Photonic Glow */}
          <filter id="panelIgniteGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core Sun Radial Atmosphere Gradient */}
          <radialGradient id="sunAtmosphere" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7e6" stopOpacity="1" />
            <stop offset="30%" stopColor="#ff9900" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#ff4500" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
          </radialGradient>

          {/* Active Panel Fill Gradient */}
          <linearGradient id="panelActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="40%" stopColor={glowColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#05080c" />
          </linearGradient>
        </defs>
      </svg>

      {/* MASTER VECTOR CANVAS */}
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* SKY BACKGROUND LAYER */}
        <rect x="0" y="0" width="1920" height="1080" fill={skyColor} />

        {/* ATMOSPHERIC BACKGROUND STARS (Fade out as dawn arrives) */}
        <g opacity={interpolate(frame, [0, 50], [0.5, 0], { extrapolateRight: 'clamp' })}>
          <circle cx="200" cy="150" r="1.5" fill="#fff" />
          <circle cx="540" cy="220" r="2" fill="#fff" />
          <circle cx="850" cy="100" r="1" fill="#fff" />
          <circle cx="1300" cy="180" r="2" fill="#fff" />
          <circle cx="1750" cy="250" r="1.5" fill="#fff" />
        </g>

        {/* THE RISING SUN ORB */}
        <g transform={`translate(960, ${sunY})`}>
          {/* Outer Blazing Core Glow */}
          <circle cx="0" cy="0" r={160 * sunGlowScale} fill="url(#sunAtmosphere)" />
          {/* Crispy Internal White-Hot Fusion Center */}
          <circle cx="0" cy="0" r="65" fill="#ffffff" />
        </g>

        {/* GROUND TOPOGRAPHY BASELINE */}
        {/* Placed behind the sun rays layer now so the extended rays cast down over the horizon */}
        <path
          d={`M 0,${groundHorizonY} Q 480,${groundHorizonY - 15} 960,${groundHorizonY} T 1920,${groundHorizonY} L 1920,1080 L 0,1080 Z`}
          fill="#06090d"
          stroke="#111823"
          strokeWidth="2"
        />

        {/* HIGH-DENSITY FOREGROUND SOLAR MATRIX COATING */}
        <g id="ground-solar-field" transform="translate(160, 680)">
          {Array.from({ length: rows * cols }).map((_, idx) => {
            const rowIdx = Math.floor(idx / cols);
            const colIdx = idx % cols;

            // Step configuration determining illumination states sequentially from center out
            const distanceFromCenter = Math.abs(colIdx - 3.5) + rowIdx;
            const isActivated = activationProgress > (distanceFromCenter * 2);

            // Spatial positioning matrices matching perspective lines
            const cellX = colIdx * 190 + (rowIdx * -25);
            const cellY = rowIdx * 105;
            const panelWidth = 160 - (rowIdx * 12);
            const panelHeight = 75 - (rowIdx * 6);

            return (
              <g key={`solar-panel-${idx}`} transform={`translate(${cellX}, ${cellY})`}>
                {/* Structural Support Foundation Mounting Stems */}
                <line x1={panelWidth / 2} y1={panelHeight / 2} x2={panelWidth / 2} y2={panelHeight + 25} stroke="#1f293d" strokeWidth="4" />
                
                {/* Individual Solar Panel Frame */}
                <rect
                  x="0"
                  y="0"
                  width={panelWidth}
                  height={panelHeight}
                  rx="6"
                  fill={isActivated ? 'url(#panelActiveGrad)' : basePanelColor}
                  stroke={isActivated ? glowColor : '#1f293d'}
                  strokeWidth="2"
                  filter={isActivated ? 'url(#panelIgniteGlow)' : 'none'}
                  style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                />

                {/* Internal Structural Collector Grid Mesh */}
                <g opacity="0.12">
                  <line x1={panelWidth * 0.25} y1="0" x2={panelWidth * 0.25} y2={panelHeight} stroke="#fff" strokeWidth="1" />
                  <line x1={panelWidth * 0.5} y1="0" x2={panelWidth * 0.5} y2={panelHeight} stroke="#fff" strokeWidth="2" />
                  <line x1={panelWidth * 0.75} y1="0" x2={panelWidth * 0.75} y2={panelHeight} stroke="#fff" strokeWidth="1" />
                  {Array.from({ length: 3 }).map((_, lineIdx) => (
                    <line key={`l-${lineIdx}`} x1="0" y1={(panelHeight / 4) * (lineIdx + 1)} x2={panelWidth} y2={(panelHeight / 4) * (lineIdx + 1)} stroke="#fff" strokeWidth="0.5" />
                  ))}
                </g>
              </g>
            );
          })}
        </g>

        {/* EXTENDED DOWNWARD VOLUMETRIC LIGHT RAYS OVERLAY */}
        {/* Rendered at the very end of the stack so rays elegantly drape across both fields and frames */}
        <g opacity={rayOpacity} style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
          {/* Central Beam Left - Extended Y coordinates out past 1080 canvas bounds */}
          <polygon points={`960,${sunY} -200,1200 400,1200`} fill="url(#sunAtmosphere)" />
          {/* Central Beam Mid-Left */}
          <polygon points={`960,${sunY} 300,1200 900,1200`} fill="url(#sunAtmosphere)" />
          {/* Central Beam Mid-Right */}
          <polygon points={`960,${sunY} 1020,1200 1620,1200`} fill="url(#sunAtmosphere)" />
          {/* Central Beam Right */}
          <polygon points={`960,${sunY} 1500,1200 2120,1200`} fill="url(#sunAtmosphere)" />
        </g>

      </svg>
    </AbsoluteFill>
  );
};