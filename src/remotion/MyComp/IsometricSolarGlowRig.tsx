// src/remotion/MyComp/IsometricSolarGlowRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export const IsometricSolarGlowRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle breathing idle animation for the neon emissive glow layers (over 90 frames)
  const pulse = interpolate(
    Math.sin((frame / 90) * Math.PI * 2),
    [-1, 1],
    [0.6, 0.95]
  );

  // Smooth entrance dynamics for a premium landing effect
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 60 },
  });

  // Global Composition Geometry Anchors
  const centerX = 960;
  const centerY = 540;
  
  // Staggered vertical fall animation for the plate locking down onto the platform
  const panelElevation = interpolate(introSpring, [0, 1], [-500, 0]);

  // UNIFIED ISOMETRIC TRANSFORM PROJECTION MATRIX
  // Ensures perfect mechanical synchronization between stacked components
  const isoTransform = "rotate(-30) skewX(30) scale(1, 0.866)";

  return (
    <AbsoluteFill style={{ backgroundColor: '#090d16', overflow: 'hidden' }}>
      
      {/* ==========================================
          NEON GRAPHICS DEF MATRIX FILTER STATIONS
          ========================================== */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Intense Cyber Cyan/Blue Corona Glow Filter */}
          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur1" />
            <feGaussianBlur stdDeviation="30" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Ambient Platform Drop Shadow */}
          <filter id="deckShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="35" stdDeviation="25" floodColor="#000000" floodOpacity="0.8" />
          </filter>

          {/* Premium Metallic Gradient Shaders */}
          <linearGradient id="cyberSteel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="40%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="neonGlowBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>

          {/* High-Contrast Electric Grid Texture */}
          <pattern id="electricWafer" width="32" height="22" patternUnits="userSpaceOnUse">
            <rect width="32" height="22" fill="#030712" stroke="#1e40af" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="32" y2="22" stroke="#00f2fe" strokeWidth="1" opacity="0.12" />
          </pattern>
        </defs>
      </svg>

      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* BACKGROUND HUD CALIBRATION TARGETS */}
        <g opacity="0.04" stroke="#38bdf8" strokeWidth="1">
          <circle cx={centerX} cy={centerY} r="550" fill="none" strokeDasharray="5 10" />
          <circle cx={centerX} cy={centerY} r="300" fill="none" strokeDasharray="3 6" />
          <line x1={centerX - 700} y1={centerY} x2={centerX + 700} y2={centerY} strokeDasharray="4 8" />
        </g>

        {/* ==========================================
            ISOMETRIC FLOATING SUBSTATION PLATFORM
            ========================================== */}
        <g transform={`translate(${centerX}, ${centerY + 160})`} opacity={introSpring} filter="url(#deckShadow)">
          
          {/* Synchronized Base Platform Geometry */}
          <g transform={isoTransform}>
            {/* Extruded Deep Bottom Profile Trim */}
            <rect x="-300" y="-200" width="600" height="400" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
          </g>
          
          {/* 3D Platform Rim Edge Extrusion */}
          <path d="M -362,-4 L -362,20 L 0,320 L 362,20 L 362,-4 L 0,296 Z" fill="#111827" stroke="#1e293b" strokeWidth="2" />
          
          <g transform={isoTransform}>
            {/* Top Carbon Fiber Surface Deck */}
            <rect x="-296" y="-196" width="592" height="392" rx="2" fill="#1f2937" />

            {/* Cybernetic Energy Pathway Circuit Tracks */}
            <g fill="none" stroke="#00f2fe" strokeLinecap="round" strokeLinejoin="round">
              <rect x="-240" y="-150" width="480" height="300" strokeWidth="1.5" opacity="0.15" />
              <path d="M -150,0 L 0,-80 L 150,0" strokeWidth="2.5" opacity={pulse} filter="url(#cyanGlow)" />
              <line x1="0" y1="-80" x2="0" y2="120" strokeWidth="3" opacity={pulse} filter="url(#cyanGlow)" />
            </g>

            {/* Heavy Concrete Mounting Footing Anchor Block */}
            <rect x="-50" y="-50" width="100" height="100" rx="6" fill="url(#cyberSteel)" stroke="#475569" strokeWidth="2" />
          </g>
        </g>

        {/* ==========================================
            ELEVATED DOUBLED BRIGHT GLOWING SOLAR MODULE
            ========================================== */}
        <g transform={`translate(${centerX}, ${centerY + panelElevation})`} opacity={introSpring}>
          
          {/* Heavy-Duty Industrial Structural Support Frame */}
          <g stroke="#334155" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            {/* Back Struts extending to meet the panel height cleanly */}
            <line x1="-80" y1="120" x2="-120" y2="-80" />
            <line x1="80" y1="120" x2="120" y2="-80" />
            <line x1="-120" y1="-80" x2="120" y2="-80" strokeWidth="6" />
            
            {/* Cross-Bracing Stabilizer Links */}
            <line x1="-80" y1="120" x2="120" y2="-80" strokeWidth="3" opacity="0.4" />
            <line x1="80" y1="120" x2="-120" y2="-80" strokeWidth="3" opacity="0.4" />
          </g>

          {/* DEEP NEON GLOW EMISSION COMPONENT (Behind Double-Sized Panel Face) */}
          <g transform={isoTransform} opacity={pulse * 0.9} filter="url(#cyanGlow)">
            <rect x="-380" y="-250" width="760" height="500" rx="12" fill="url(#neonGlowBase)" />
          </g>

          {/* DOUBLE-SIZED HIGH-CONTRAST SOLAR PANEL LAYER STACK */}
          <g transform={isoTransform}>
            
            {/* Core Rigid Metal Frame Chassis Backing */}
            <rect x="-390" y="-260" width="780" height="520" rx="14" fill="url(#cyberSteel)" stroke="#64748b" strokeWidth="4" />
            
            {/* Doubled Photovoltaic Silicon Wafer Matrix Field */}
            <rect x="-376" y="-246" width="752" height="492" rx="8" fill="url(#electricWafer)" stroke="#00f2fe" strokeWidth="1.5" />

            {/* Glowing Busbar Grid Matrix Overlay Layers */}
            <g stroke="#00f2fe" strokeLinecap="round" fill="none">
              {/* Vertical Structural Collector Lines */}
              {[-326, -261, -196, -131, -65, 0, 65, 131, 196, 261, 326].map((xOffset) => (
                <line 
                  key={`v-bus-large-${xOffset}`} 
                  x1={xOffset} 
                  y1="-246" 
                  x2={xOffset} 
                  y2="246" 
                  strokeWidth="2.5" 
                  opacity={pulse} 
                  filter="url(#cyanGlow)" 
                />
              ))}

              {/* Heavy Horizontal Core Power Distribution Traces */}
              <line x1="-376" y1="-123" x2="376" y2="-123" strokeWidth="4" opacity={pulse} filter="url(#cyanGlow)" />
              <line x1="-376" y1="0" x2="376" y2="0" strokeWidth="5.5" stroke="#ffffff" filter="url(#cyanGlow)" />
              <line x1="-376" y1="123" x2="376" y2="123" strokeWidth="4" opacity={pulse} filter="url(#cyanGlow)" />
            </g>

            {/* Premium Protective Glass Specular Reflection Sheens */}
            <path d="M -376,-246 L 150,-246 L -180,246 L -376,246 Z" fill="#ffffff" opacity="0.03" />
            <path d="M 220,-246 L 310,-246 L 120,246 L 30,246 Z" fill="#ffffff" opacity="0.05" />
          </g>
        </g>

        {/* METADATA SCHEMATIC TEXT HUDS */}
        <g fill="#38bdf8" opacity="0.3" fontclassname="system-ui" fontWeight="600" fontSize="12" letterSpacing="3">
          <text x="100" y="980">SYS STATUS: NOMINAL // 1680V DC HIGH INTEGRATION GENERATION Array</text>
          <text x="1820" y="980" textAnchor="end">ISOMETRIC DOUBLE-SCALE CAPTURE NODE // PV-GLOW_MX18_XL</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};