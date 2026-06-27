// src/remotion/MyComp/RooftopSolarRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type Props = {
  title?: string;
  metricLabel?: string;
  accentColor?: string; // Light Green for panel highlights
  houseStructureColor?: string; // Dark slate blueprint foundation
};

export const RooftopSolarRig: React.FC<Props> = ({
  title = "RESIDENTIAL HARVEST INTERFACE",
  metricLabel = "ANNUAL OFFSET TARGET",
  accentColor = "#48bb78",
  houseStructureColor = "#1a2332",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. TIMELINE INTERPOLATION AND SPRINGS
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 75 },
  });

  // Staggered timeline marker for roof asset activation
  const activationProgress = interpolate(frame, [25, 85], [0, 6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dynamic calculation for metric counting values
  const activeOffsetPercent = interpolate(introSpring, [0, 1], [0, 100]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070a', fontFamily: 'Ubuntu, sans-serif', padding: 70, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* ADVANCED VECTOR GLOW FILTER FILTER */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="rooftopGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* LEFT SPLIT PANEL: METRIC READOUT TELEMETRY */}
      <div style={{
        position: 'absolute',
        left: 70,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 580,
        opacity: introSpring,
      }}>
        <span style={{ color: '#4a5568', fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
          DECENTRALIZED GENERATION
        </span>
        <h1 style={{ color: '#ffffff', fontSize: 36, margin: '6px 0 25px 0', fontWeight: 700, letterSpacing: 0.5 }}>
          {title}
        </h1>
        <div style={{ width: 60, height: 4, backgroundColor: accentColor, borderRadius: 2, marginBottom: 40 }} />

        <div style={{ backgroundColor: '#0d131c', padding: 30, borderRadius: 16, border: '1px solid #1a2332' }}>
          <span style={{ color: accentColor, fontSize: 12, fontWeight: 600, letterSpacing: 2 }}>{metricLabel}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4 }}>
            <span style={{ fontSize: 84, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {Math.floor(activeOffsetPercent)}
            </span>
            <span style={{ fontSize: 36, fontWeight: 800, color: accentColor, marginLeft: 6 }}>%</span>
          </div>
          <p style={{ color: '#4a5568', fontSize: 14, margin: '15px 0 0 0', lineHeight: 1.6 }}>
            Optimizing standard residential structure load vectors with parallel micro-inverter networks.
          </p>
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: ISOMETRIC HOUSE LAYOUT PLATFORM */}
      <div style={{
        position: 'absolute',
        right: 70,
        top: '50%',
        transform: `translateY(-50%) scale(${interpolate(introSpring, [0, 1], [0.94, 1])})`,
        opacity: introSpring,
        width: 1100,
        height: 740,
        backgroundColor: '#0d1117',
        borderRadius: 24,
        border: '2px solid #1e2530',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg viewBox="0 0 1000 700" style={{ width: '100%', height: '100%', padding: 40, boxSizing: 'border-box' }}>
          
          {/* TECHNICAL LAYOUT BACKGROUND GRID */}
          <g opacity="0.04">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`g-x-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="700" stroke="#ffffff" strokeWidth="1.5" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`g-y-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="#ffffff" strokeWidth="1.5" />
            ))}
          </g>

          {/* MAIN STRUCTURE PLOT: ARCHITECTURAL HOUSE VECTOR GRAPHIC */}
          <g id="residential-structure" transform="translate(150, 120)">
            
            {/* Ground Level Foundation Line Block */}
            <line x1="50" y1="460" x2="650" y2="460" stroke="#2d3748" strokeWidth="4" strokeLinecap="round" />

            {/* Main Primary House Body Chassis */}
            <rect x="120" y="240" width="460" height="220" fill="#090d14" stroke={houseStructureColor} strokeWidth="3" />
            
            {/* Front Architectural Window Panes */}
            <rect x="180" y="280" width="70" height="90" rx="4" fill="#0d131c" stroke="#1f293d" strokeWidth="2" />
            <line x1="215" y1="280" x2="215" y2="370" stroke="#1f293d" strokeWidth="1" />
            
            <rect x="450" y="280" width="70" height="90" rx="4" fill="#0d131c" stroke="#1f293d" strokeWidth="2" />
            <line x1="485" y1="280" x2="485" y2="370" stroke="#1f293d" strokeWidth="1" />

            {/* Entrance Door Entry Module */}
            <rect x="315" y="330" width="70" height="130" rx="2" fill="#070a0f" stroke="#1f293d" strokeWidth="2" />
            <circle cx="330" cy="395" r="3" fill="#4a5568" />

            {/* THE ROOF STRUCTURE LAYER */}
            {/* Angled polygon blueprint simulating structural pitching perspective */}
            <polygon 
              points="70,240 350,70 630,240" 
              fill="#0d131c" 
              stroke={houseStructureColor} 
              strokeWidth="4" 
              strokeLinejoin="round" 
            />

            {/* ROOFTOP SOLAR RACKING ARRAY (6 CONFIGURATION GRID Matrix) */}
            {/* Skewed coordinates mapping onto the left roof pitch slant axis */}
            <g id="rooftop-silicon-field" transform="translate(130, 100)">
              {Array.from({ length: 6 }).map((_, idx) => {
                const row = Math.floor(idx / 3);
                const col = idx % 3;

                // Sequentially triggers panels up rows from left to right bounds
                const isActivated = activationProgress > idx;

                // Geometry mapping matrix parameters following roof slope vector angles
                const xOffset = col * 65 + (row * 35);
                const yOffset = row * 55 - (col * 15);

                return (
                  <g key={`roof-panel-${idx}`} transform={`translate(${xOffset}, ${yOffset})`}>
                    {/* Flush Roof Mount Bracket Anchors */}
                    <line x1="5" y1="40" x2="45" y2="15" stroke="#1f293d" strokeWidth="3" />
                    
                    {/* Panel Wafer Geometry Blueprint */}
                    <polygon
                      points="0,35 45,10 55,35 10,60"
                      fill={isActivated ? `url(#roofPanelActiveGrad)` : '#05080c'}
                      stroke={isActivated ? accentColor : '#1f293d'}
                      strokeWidth="1.5"
                      filter={isActivated ? 'url(#rooftopGlow)' : 'none'}
                      style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
                    />

                    {/* Internal collection rib lines */}
                    {isActivated && (
                      <line x1="22" y1="22" x2="32" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </g>

            {/* TEXT BRANDING TAG */}
            <text x="350" y="510" fill="#4a5568" fontSize="13" fontWeight="700" textAnchor="middle" letterSpacing="2">
              EDGE GENERATION POINT M-04
            </text>
          </g>

          {/* INLINE INTERNAL COLOR GRADIENTS DEFS */}
          <defs>
            <linearGradient id="roofPanelActiveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#0d131c" />
            </linearGradient>
          </defs>

        </svg>
      </div>
    </AbsoluteFill>
  );
};