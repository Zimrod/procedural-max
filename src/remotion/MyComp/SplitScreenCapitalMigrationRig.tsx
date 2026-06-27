// src/remotion/MyComp/SplitScreenCapitalMigrationRig.tsx
'use client';

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type SplitScreenMigrationProps = {
  title?: string;
  sourceLabel?: string;
  destinationLabel?: string;
  legacyAmount?: string;
  renewableAmount?: string;
  backgroundColor?: string;
  accentGreen?: string;
  legacyCarbonColor?: string;
  slashColor?: string;
};

// =========================================================================
// EMBEDDED HIGH-SCALE MECHANICAL ANIMATIONS
// =========================================================================

/**
 * High-Visibility Programmatic Pumpjack Machine
 */
const LargePumpjack: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const cycle = (frame % 130) / 130; // Clean mechanical timing
  const angleRad = cycle * Math.PI * 2;
  const crankAngle = angleRad * (180 / Math.PI);
  const beamRotDeg = Math.sin(angleRad) * 11;

  const samsonX = 110;
  const samsonY = 130;
  const crankCenterX = 200;
  const crankCenterY = 150;

  return (
    <div style={{ width: '100%', height: '190px', display: 'flex', justifyContent: 'center', margin: '25px 0' }}>
      <svg width="280" height="190" viewBox="0 0 280 190" fill="none">
        {/* Foundation Platform */}
        <line x1="15" y1="175" x2="265" y2="175" stroke={color} strokeWidth="4" strokeLinecap="round" style={{ opacity: 0.3 }} />
        
        {/* Samson Post Support Structure */}
        <line x1={samsonX} y1={samsonY} x2={samsonX - 45} y2="175" stroke={color} strokeWidth="5" />
        <line x1={samsonX} y1={samsonY} x2={samsonX + 45} y2="175" stroke={color} strokeWidth="5" />
        <line x1={samsonX} y1={65} x2={samsonX} y2={samsonY} stroke={color} strokeWidth="6" />

        {/* Counterweight Motor Hub */}
        <circle cx={crankCenterX} cy={crankCenterY} r="9" fill="none" stroke={color} strokeWidth="3" />
        <g transform={`translate(${crankCenterX}, ${crankCenterY}) rotate(${crankAngle})`}>
          <line x1="0" y1="0" x2="38" y2="0" stroke={color} strokeWidth="6" strokeLinecap="round" />
          <circle cx="38" cy="0" r="9" fill={color} />
        </g>

        {/* Oscillating Walking Beam */}
        <g transform={`translate(${samsonX}, ${samsonY - 65}) rotate(${beamRotDeg})`}>
          <line x1="-85" y1="0" x2="95" y2="0" stroke={color} strokeWidth="10" strokeLinecap="round" />
          <path d="M -85,-18 Q -105,0 -85,18 Z" fill={color} />
        </g>

        {/* Wellhead Linkages */}
        <line x1="14" y1={120 + Math.sin(angleRad) * 18} x2="14" y2="175" stroke={color} strokeWidth="3" />
        <line 
          x1={crankCenterX + Math.cos(angleRad) * 38} 
          y1={crankCenterY + Math.sin(angleRad) * 38} 
          x2={samsonX + 95} 
          y2={(samsonY - 65) + Math.sin(angleRad) * 16} 
          stroke={color} 
          strokeWidth="3.5" 
          style={{ opacity: 0.8 }}
        />
      </svg>
    </div>
  );
};

/**
 * High-Visibility Photovoltaic Solar Array Unit
 */
const LargeSolarPanel: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const sweepProgress = (frame % 100) / 100;

  return (
    <div style={{ width: '100%', height: '190px', display: 'flex', justifyContent: 'center', margin: '25px 0' }}>
      <svg width="280" height="190" viewBox="0 0 280 190" fill="none">
        <defs>
          <linearGradient id="splitSolarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset={`${sweepProgress - 0.2}`} stopColor="#020617" />
            <stop offset={`${sweepProgress}`} stopColor="#34d399" stopOpacity={0.5} />
            <stop offset={`${sweepProgress + 0.2}`} stopColor="#020617" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* Heavy Fixed Ground Mount Frame */}
        <path d="M 80,170 L 140,125 L 200,170 M 140,125 L 140,75" stroke={color} strokeWidth="5" strokeLinecap="round" style={{ opacity: 0.5 }} />

        {/* Monocrystalline Silicon Cell Cluster Layout */}
        <g transform="translate(40, 20)">
          <rect width="200" height="100" rx="6" fill="url(#splitSolarSweep)" stroke={color} strokeWidth="5" />
          
          {/* Multi-busbar String Infrastructure grids */}
          <line x1="40" y1="0" x2="40" y2="100" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
          <line x1="80" y1="0" x2="80" y2="100" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
          <line x1="120" y1="0" x2="120" y2="100" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
          <line x1="160" y1="0" x2="160" y2="100" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
          
          <line x1="0" y1="25" x2="200" y2="25" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
          <line x1="0" y1="50" x2="200" y2="50" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
          <line x1="0" y1="75" x2="200" y2="75" stroke={color} strokeWidth="1.5" style={{ opacity: 0.4 }} />
        </g>
      </svg>
    </div>
  );
};

// =========================================================================
// SPLIT SCREEN MAIN CANVAS EXPORT
// =========================================================================
export const SplitScreenCapitalMigrationRig: React.FC<SplitScreenMigrationProps> = ({
  title = "GLOBAL CAPITAL MIGRATION MATRIX",
  sourceLabel = "LEGACY CARBON SECTOR",
  destinationLabel = "RENEWABLES & GRID CAPEX",
  legacyAmount = "$1.1T",
  renewableAmount = "$2.3T",
  backgroundColor = "#030712",
  accentGreen = "#10b981",
  legacyCarbonColor = "#6b7280",
  slashColor = "#6366f1",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screen entrance animations via Spring curves
  const leftEntrance = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 45 },
  });

  const rightEntrance = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 45 },
    delay: 4,
  });

  // Dynamic geometric clipping paths for custom split screen canvas logic
  // Creates an elegant diagonal line divide running from Top-Center to Bottom-Center
  const slashWidth = interpolate(spring({ frame, fps, config: { damping: 12, stiffness: 60 } }), [0, 1], [0, 8]);
  const leftClip = "polygon(0 0, 53% 0, 47% 100%, 0 100%)";
  const rightClip = "polygon(53% 0, 100% 0, 100% 100%, 47% 100%)";

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily: 'Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* LEFT CANVAS HALF: Legacy Assets */}
      <AbsoluteFill style={{ clipPath: leftClip, backgroundColor: '#090d16' }}>
        <div style={{
          position: 'absolute',
          left: '12%',
          top: '25%',
          width: '500px',
          opacity: leftEntrance,
          transform: `translateX(${interpolate(leftEntrance, [0, 1], [-60, 0])}px)`,
        }}>
          <span style={{ color: legacyCarbonColor, fontSize: '15px', fontWeight: 700, letterSpacing: '3px' }}>
            {sourceLabel}
          </span>
          <h2 style={{ color: '#e5e7eb', fontSize: '80px', fontWeight: 900, margin: '10px 0 0 0', letterSpacing: '-2px' }}>
            {legacyAmount}
          </h2>
          
          <LargePumpjack frame={frame} color={legacyCarbonColor} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontSize: '16px', fontWeight: 700 }}>
            <span style={{ fontSize: '20px' }}>▼</span>
            <span>DIVESTMENT PIPELINE TRACKING</span>
          </div>
        </div>
      </AbsoluteFill>

      {/* RIGHT CANVAS HALF: Renewable Assets */}
      <AbsoluteFill style={{ clipPath: rightClip, backgroundColor: '#050c14' }}>
        <div style={{
          position: 'absolute',
          right: '12%',
          top: '25%',
          width: '500px',
          opacity: rightEntrance,
          transform: `translateX(${interpolate(rightEntrance, [0, 1], [60, 0])}px)`,
          textAlign: 'right',
        }}>
          <span style={{ color: accentGreen, fontSize: '15px', fontWeight: 700, letterSpacing: '3px' }}>
            {destinationLabel}
          </span>
          <h2 style={{ color: accentGreen, fontSize: '80px', fontWeight: 900, margin: '10px 0 0 0', letterSpacing: '-2px', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.2))' }}>
            {renewableAmount}
          </h2>

          <LargeSolarPanel frame={frame} color={accentGreen} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: accentGreen, fontSize: '16px', fontWeight: 700, justifyContent: 'flex-end' }}>
            <span>ACCELERATING DECARBONIZATION TARGETS</span>
            <span style={{ fontSize: '20px' }}>▲</span>
          </div>
        </div>
      </AbsoluteFill>

      {/* THE BIG SLASH: High Contrast Separator Matrix Wall */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080">
        <defs>
          <filter id="slashNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <line 
          x1={interpolate(slashWidth, [0, 8], [1017, 1017])} 
          y1="0" 
          x2={interpolate(slashWidth, [0, 8], [902, 902])} 
          y2="1080" 
          stroke={slashColor} 
          strokeWidth={slashWidth} 
          filter="url(#slashNeonGlow)"
          style={{ opacity: interpolate(slashWidth, [0, 8], [0, 0.85]) }}
        />
      </svg>

      {/* FIXED TITLE HEADER HUB */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '0',
        width: '100%',
        textAlign: 'center',
        opacity: interpolate(frame, [10, 25], [0, 1]),
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', backgroundColor: '#0f172a', padding: '12px 30px', borderRadius: '30px', border: '1px solid #1e293b' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: accentGreen }} />
          <h1 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: 800, letterSpacing: '2px', margin: 0 }}>
            {title}
          </h1>
        </div>
      </div>

    </AbsoluteFill>
  );
};