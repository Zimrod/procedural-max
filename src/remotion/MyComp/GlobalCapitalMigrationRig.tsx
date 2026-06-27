// src/remotion/MyComp/GlobalCapitalMigrationRig.tsx
'use client';

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type CapitalMigrationProps = {
  title?: string;
  sourceLabel?: string;
  destinationLabel?: string;
  legacyAmount?: string;
  renewableAmount?: string;
  backgroundColor?: string;
  accentGreen?: string;
  legacyCarbonColor?: string;
  particleDensity?: number;
};

// =========================================================================
// EMBEDDED MICRO-ANIMATION COMPONENTS
// =========================================================================

/**
 * Inline Programmatic Pumpjack Machine Component
 */
const MicroPumpjack: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  // Continuous mechanical timing cycle (roughly 4 seconds per pump)
  const cycle = (frame % 120) / 120;
  const angleRad = cycle * Math.PI * 2;
  
  // Crank arm angle
  const crankAngle = angleRad * (180 / Math.PI);
  
  // Calculate walking beam seesaw oscillation via a clean sine wave offset
  const beamRotDeg = Math.sin(angleRad) * 12;

  // Static positions matching structural rigging layout
  const samsonPostX = 60;
  const samsonPostY = 70;
  const crankCenterX = 110;
  const crankCenterY = 85;

  return (
    <div style={{ width: '100%', height: '110px', display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
      <svg width="160" height="110" viewBox="0 0 160 110" fill="none">
        {/* Ground Baseline platform */}
        <line x1="10" y1="100" x2="150" y2="100" stroke={color} strokeWidth="3" strokeLinecap="round" style={{ opacity: 0.4 }} />
        
        {/* Rigid Samson Post (A-Frame Anchor Support) */}
        <line x1={samsonPostX} y1={70} x2={samsonPostX - 25} y2="100" stroke={color} strokeWidth="3.5" />
        <line x1={samsonPostX} y1={70} x2={samsonPostX + 25} y2="100" stroke={color} strokeWidth="3.5" />
        <line x1={samsonPostX} y1={35} x2={samsonPostX} y2="70" stroke={color} strokeWidth="4" />

        {/* Rotational Counterweight Motor Mechanism */}
        <circle cx={crankCenterX} cy={crankCenterY} r="6" fill="none" stroke={color} strokeWidth="2" />
        <g transform={`translate(${crankCenterX}, ${crankCenterY}) rotate(${crankAngle})`}>
          <line x1="0" y1="0" x2="22" y2="0" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <circle cx="22" cy="0" r="5" fill={color} />
        </g>

        {/* Seesaw Walking Beam Assembly */}
        <g transform={`translate(${samsonPostX}, ${samsonPostY - 35}) rotate(${beamRotDeg})`}>
          {/* Main Beam Structural Steel */}
          <line x1="-50" y1="0" x2="55" y2="0" stroke={color} strokeWidth="6" strokeLinecap="round" />
          {/* Horse Head Node Curvature profile */}
          <path d="M -50,-12 Q -62,0 -50,12 Z" fill={color} />
        </g>

        {/* Connected Pitman Arm & Polished Rod linkage pins */}
        {/* Left Vertical Wellhead Rod */}
        <line 
          x1="8" 
          y1={70 + Math.sin(angleRad) * 11} 
          x2="8" 
          y2="100" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        {/* Right Driving Pitman Linkage between crank pin and beam trail edge */}
        <line 
          x1={crankCenterX + Math.cos(angleRad) * 22} 
          y1={crankCenterY + Math.sin(angleRad) * 22} 
          x2={samsonPostX + 55} 
          y2={(samsonPostY - 35) + Math.sin(angleRad) * 10} 
          stroke={color} 
          strokeWidth="2" 
          style={{ opacity: 0.7 }}
        />
      </svg>
    </div>
  );
};

/**
 * Inline Programmatic Solar Array Panel Component
 */
const MicroSolarPanel: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  // Continuous diagonal sweeping shine overlay framework
  const sweepProgress = (frame % 90) / 90;
  const gradientOffset = interpolate(sweepProgress, [0, 1], [-100, 200]);

  return (
    <div style={{ width: '100%', height: '110px', display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
      <svg width="160" height="110" viewBox="0 0 160 110" fill="none">
        <defs>
          {/* Solar cell face texture gradient mapping */}
          <linearGradient id="solarGlint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset={`${sweepProgress - 0.15}`} stopColor="#0f172a" />
            <stop offset={`${sweepProgress}`} stopColor="#a7f3d0" stopOpacity={0.4} />
            <stop offset={`${sweepProgress + 0.15}`} stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Ground Stand mounts */}
        <path d="M 50,100 L 80,75 L 110,100 M 80,75 L 80,45" stroke={color} strokeWidth="3" strokeLinecap="round" style={{ opacity: 0.6 }} />

        {/* Angled PV Photovoltaic Collector Bed Grid */}
        <g transform="translate(30, 15)">
          {/* Main Backing collector plate bed */}
          <rect width="100" height="55" rx="4" fill="url(#solarGlint)" stroke={color} strokeWidth="3.5" />
          
          {/* Internal Silicon Wafer Grid string lines */}
          <line x1="25" y1="0" x2="25" y2="55" stroke={color} strokeWidth="1" style={{ opacity: 0.5 }} />
          <line x1="50" y1="0" x2="50" y2="55" stroke={color} strokeWidth="1" style={{ opacity: 0.5 }} />
          <line x1="75" y1="0" x2="75" y2="55" stroke={color} strokeWidth="1" style={{ opacity: 0.5 }} />
          
          <line x1="0" y1="18" x2="100" y2="18" stroke={color} strokeWidth="1" style={{ opacity: 0.5 }} />
          <line x1="0" y1="36" x2="100" y2="36" stroke={color} strokeWidth="1" style={{ opacity: 0.5 }} />
        </g>
      </svg>
    </div>
  );
};

// =========================================================================
// MAIN CORE RIG EXPORT
// =========================================================================
export const GlobalCapitalMigrationRig: React.FC<CapitalMigrationProps> = ({
  title = "GLOBAL CAPITAL MIGRATION MATRIX",
  sourceLabel = "LEGACY CARBON SECTOR",
  destinationLabel = "RENEWABLES & GRID CAPEX",
  legacyAmount = "$1.1T",
  renewableAmount = "$2.3T",
  backgroundColor = "#070a12",
  accentGreen = "#10b981",
  legacyCarbonColor = "#4b5563",
  particleDensity = 12,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Global entry animations via Spring physics
  const baseEntrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 55 },
  });

  const contentFade = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Setup predictable curved SVG flow pathways from Left nodes to Right nodes
  const particleTracks = Array.from({ length: particleDensity }).map((_, i) => {
    const yOffsetLeft = 320 + (i * 450) / particleDensity;
    const yOffsetRight = 280 + (i * 520) / particleDensity;
    
    const pathD = `M 350 ${yOffsetLeft} C 750 ${yOffsetLeft - 60}, 1170 ${yOffsetRight + 60}, 1570 ${yOffsetRight}`;
    const speedFactor = 0.008 + (i % 3) * 0.004;
    const pathProgress = (frame * speedFactor + (i * 0.15)) % 1;
    
    return { pathD, pathProgress, index: i };
  });

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily: 'Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* Structural Network Grid Lines background */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 * baseEntrance }}>
        <defs>
          <pattern id="migrationGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#334155" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#migrationGrid)" />
      </svg>

      {/* Main Vector Layer */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" fill="none">
        <defs>
          {/* Neon Glow filters for active clean energy pipelines */}
          <filter id="cleanEnergyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <linearGradient id="migrationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={legacyCarbonColor} stopOpacity={0.4} />
            <stop offset="50%" stopColor="#6366f1" stopOpacity={0.8} />
            <stop offset="100%" stopColor={accentGreen} stopOpacity={0.9} />
          </linearGradient>
        </defs>

        {/* Static Base Pathway Tracks */}
        {particleTracks.map((track) => (
          <path
            key={`track-${track.index}`}
            d={track.pathD}
            fill="none"
            stroke="url(#migrationGradient)"
            strokeWidth={interpolate(baseEntrance, [0, 1], [0, 2])}
            style={{ opacity: 0.4 }}
          />
        ))}

        {/* Moving Capital Flow Particles */}
        {particleTracks.map((track) => {
          const rSize = 4 + (track.index % 3) * 2;
          return (
            <g key={`particle-group-${track.index}`} style={{ opacity: contentFade }}>
              <circle r={rSize} fill={accentGreen} filter="url(#cleanEnergyGlow)">
                <animateMotion
                  path={track.pathD}
                  dur={`${4 - (track.index % 2) * 1.5}s`}
                  repeatCount="indefinite"
                  begin={`${track.index * -0.3}s`}
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Dashboard Text Overlays Layout */}
      <AbsoluteFill style={{ opacity: contentFade, padding: '80px 100px' }}>
        
        {/* Header Module */}
        <div style={{ transform: `translateY(${interpolate(baseEntrance, [0, 1], [-30, 0])}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '4px', height: '24px', backgroundColor: accentGreen }} />
            <span style={{ color: '#64748b', fontSize: '18px', fontWeight: 700, letterSpacing: '4px' }}>
              MACRO CAPITAL ALLOCATION TRACKER
            </span>
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: '48px', fontWeight: 800, marginTop: '8px', letterSpacing: '-1px' }}>
            {title}
          </h1>
        </div>

        {/* Nodes Infrastructure Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '140px', height: '580px' }}>
          
          {/* Outbound Target Node (Legacy Carbon) */}
          <div style={{ 
            width: '380px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            transform: `translateX(${interpolate(baseEntrance, [0, 1], [-50, 0])}px)`
          }}>
            <div style={{ backgroundColor: '#111827', border: `2px solid ${legacyCarbonColor}`, padding: '30px', borderRadius: '12px' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>{sourceLabel}</p>
              <h2 style={{ color: '#f3f4f6', fontSize: '56px', fontWeight: 800, marginTop: '10px', marginBottom: '5px' }}>{legacyAmount}</h2>
              
              {/* INSERTED: Programmatic Mechanical Pumpjack */}
              <MicroPumpjack frame={frame} color={legacyCarbonColor} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
                <span>9909; DECLINING FOCUS</span>
              </div>
            </div>
          </div>

          {/* Central Intersection Nexus Terminal */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            transform: `scale(${baseEntrance})`
          }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '60px', 
              backgroundColor: '#1e1b4b', 
              border: '2px solid #6366f1',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
            }}>
              <span style={{ color: '#818cf8', fontSize: '28px', fontWeight: 800 }}>MIG</span>
            </div>
            <div style={{ color: '#4f46e5', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', marginTop: '12px' }}>
              NEXUS CORE
            </div>
          </div>

          {/* Inbound Dest Node (Renewables) */}
          <div style={{ 
            width: '380px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            transform: `translateX(${interpolate(baseEntrance, [0, 1], [50, 0])}px)`
          }}>
            <div style={{ 
              backgroundColor: '#0f172a', 
              border: `2px solid ${accentGreen}`, 
              padding: '30px', 
              borderRadius: '12px',
              boxShadow: `0 0 40px rgba(16, 185, 129, 0.15)`
            }}>
              <p style={{ color: '#a7f3d0', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>{destinationLabel}</p>
              <h2 style={{ color: '#10b981', fontSize: '56px', fontWeight: 800, marginTop: '10px', marginBottom: '5px', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))' }}>{renewableAmount}</h2>
              
              {/* INSERTED: Animated Photovoltaic Panel Array */}
              <MicroSolarPanel frame={frame} color={accentGreen} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
                <span>9650; OVERTAKING DOMINANCE</span>
              </div>
            </div>
          </div>

        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};