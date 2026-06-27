// src/remotion/MyComp/GlobalFinancialFlow.tsx
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
  sourceLabel?: string;
  destinationLabel?: string;
  flowColor?: string;
  infrastructureColor?: string;
};

export const GlobalFinancialFlow: React.FC<Props> = ({
  title = "CROSS-BORDER CAPITAL MOVEMENT",
  sourceLabel = "OFFSHORE SPONSOR EQUITY",
  destinationLabel = "EPC HARDWARE PROCUREMENT",
  flowColor = "#48bb78",          // Requested Light Green
  infrastructureColor = "#1a2332", // Industrial Dark Slate Blue
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. TIMELINE MANAGEMENT GATES
  // Phase 1: Global Capital Path Entrance (0 to 1.5 seconds)
  const lineSpring = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 70 },
  });

  // Phase 2: Flow Particle Acceleration Loop (Starts after 20 frames)
  const particleStartFrame = 20;
  const loopDuration = 90; // Loops smoothly over 90 frames
  const particleProgress = ((frame - particleStartFrame) % loopDuration) / loopDuration;

  // 2. INFRASTRUCTURE TRIGGER SECTIONS
  // The solar array steps up row-by-row as international liquidity hits the clearing house
  const rowsCount = 3;
  const colsCount = 4;
  const activePanelsProgress = interpolate(lineSpring, [0.4, 1], [0, rowsCount * colsCount], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundcolor: '#0b0d10', fontFamily: 'Ubuntu, sans-serif', padding: 70, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* HEADER BLOCK */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 70,
        opacity: interpolate(frame, [0, 15], [0, 1]),
      }}>
        <h1 style={{ color: '#ffffff', fontSize: 40, margin: 0, letterSpacing: 2, fontWeight: 700 }}>
          {title}
        </h1>
        <div style={{ width: 80, height: 4, backgroundcolor: flowColor, marginTop: 12, borderRadius: 2 }} />
      </div>

      {/* LEFT PANEL: CONTEXTUAL VALUE METRICS SUMMARY */}
      <div style={{
        position: 'absolute',
        left: 70,
        top: 200,
        width: 650,
        display: 'flex',
        flexDirection: 'column',
        gap: 30
      }}>
        <div style={{ backgroundcolor: '#11151d', padding: 30, borderRadius: 16, border: '2px solid #1e2530' }}>
          <span style={{ color: flowColor, fontSize: 30, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            STAGE 01 // ORIGINATION
          </span>
          <h2 style={{ color: '#ffffff', fontSize: 26, margin: '6px 0 10px 0', fontWeight: 700 }}>{sourceLabel}</h2>
          <p style={{ color: '#718096', fontSize: 18, margin: 0, lineHeight: 1.6 }}>
            International funding structures pool foreign developer allocations into global custody clearance routers.
          </p>
        </div>

        <div style={{ 
          backgroundcolor: '#11151d', 
          padding: 30, 
          borderRadius: 16, 
          border: '2px solid #1e2530',
          opacity: interpolate(lineSpring, [0.5, 1], [0.2, 1])
        }}>
          <span style={{ color: '#a0aec0', fontSize: 30, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            STAGE 02 // CLEARANCE DISBURSEMENT
          </span>
          <h2 style={{ color: '#ffffff', fontSize: 26, margin: '6px 0 10px 0', fontWeight: 700 }}>{destinationLabel}</h2>
          <p style={{ color: '#718096', fontSize: 18, margin: 0, lineHeight: 1.6 }}>
            Currency conversion gates clear liquidity directly downstream into high-capacity supply chain logistics.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: GLOBAL FINANCIAL FLOW STAGE */}
      <div style={{
        position: 'absolute',
        right: 70,
        top: 200,
        width: 1040,
        height: 740,
        backgroundcolor: '#0d1117',
        borderRadius: 24,
        border: '2px solid #1e2530',
        overflow: 'hidden'
      }}>
        <svg viewBox="0 0 1000 700" style={{ width: '100%', height: '100%' }}>
          <defs>
            {/* Soft Green Glow for active nodes and elements */}
            <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND SYSTEM GRID */}
          <g opacity="0.05">
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 150 + 50} y1="0" x2={i * 150 + 50} y2="700" stroke="#fff" strokeWidth="2" />
            ))}
          </g>

          {/* CORE FLOW INFRASTRUCTURE TRAJECTORY */}
          {/* S-Curve Routing Capital from Top Left (Global Capital) to Bottom Right (Physical Site) */}
          <path
            id="capital-path"
            d="M 120,150 C 450,150 200,550 550,550 L 700,550"
            fill="none"
            stroke="#1e2530"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Animated Liquidity Pipeline Tracker */}
          {lineSpring > 0.05 && (
            <path
              d="M 120,150 C 450,150 200,550 550,550 L 700,550"
              fill="none"
              stroke={flowColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="600"
              strokeDashoffset={interpolate(lineSpring, [0, 1], [600, 0])}
            />
          )}

          {/* KINETIC FLOATING CURRENCY PARTICLES */}
          {frame >= particleStartFrame && (
            <g filter="url(#greenGlow)">
              {[0, 0.25, 0.5, 0.75].map((offset, i) => {
                const currentPos = (particleProgress + offset) % 1;
                return (
                  <circle
                    key={`dot-${i}`}
                    r="8"
                    fill="#ffffff"
                    opacity={interpolate(currentPos, [0, 0.1, 0.9, 1], [0, 1, 1, 0])}
                  >
                    {/* Native SVG animations binding positioning maps straight down the layout vector track */}
                    <animateMotion
                      dur={`${loopDuration / fps}s`}
                      repeatCount="indefinite"
                      path="M 120,150 C 450,150 200,550 550,550 L 700,550"
                      keyPoints={`${currentPos};${Math.min(1, currentPos + 0.01)}`} // Hack to ensure continuous flow wrap
                      keyTimes="0;1"
                    />
                  </circle>
                );
              })}
            </g>
          )}

          {/* NODE NODE ANCHOR 1: OFFSHORE BANK GATEWAY */}
          <g transform="translate(120, 150)" opacity={interpolate(frame, [5, 20], [0, 1])}>
            <circle cx="0" cy="0" r="45" fill="#11151d" stroke="#1e2530" strokeWidth="4" />
            <circle cx="0" cy="0" r="30" fill={`${flowColor}15`} stroke={flowColor} strokeWidth="2" filter="url(#greenGlow)" />
            <text x="0" y="8" fill="#fff" fontSize="24" fontWeight="800" textAnchor="middle">$</text>
            <text x="0" y="-60" fill="#a0aec0" fontSize="14" fontWeight="600" textAnchor="middle" letterSpacing="2">GLOBAL POOL</text>
          </g>

          {/* NODE ANCHOR 2: THE FX CONVERSION / INTEGRATION GATEWAY */}
          <g transform="translate(420, 375)" opacity={interpolate(lineSpring, [0.3, 0.8], [0, 1], { extrapolateLeft: 'clamp' })}>
            <circle cx="0" cy="0" r="35" fill="#11151d" stroke="#1e2530" strokeWidth="4" />
            <polygon points="-8,-12 12,0 -8,12" fill={flowColor} filter="url(#greenGlow)" transform="translate(2,0)" />
            <text x="0" y="55" fill="#a0aec0" fontSize="14" fontWeight="600" textAnchor="middle" letterSpacing="1">CLEARING</text>
          </g>

          {/* INLINE SOLAR INFRASTRUCTURE COMPONENT BLOCK */}
          {/* Anchored at terminal vector coordinate points (720, 420) */}
          <g id="solar-farm-array" transform="translate(680, 425)" opacity={interpolate(lineSpring, [0.5, 1], [0.1, 1], { extrapolateLeft: 'clamp' })}>
            
            {/* Ground Perimeter Plate Base */}
            <rect x="0" y="210" width="280" height="12" rx="4" fill="#2d3748" />
            
            {/* ARRAY MATRICES GENERATOR GENERATOR */}
            {Array.from({ length: rowsCount }).map((_, rIdx) => {
              return Array.from({ length: colsCount }).map((_, cIdx) => {
                const elementIndex = rIdx * colsCount + cIdx;
                const isActivated = elementIndex < activePanelsProgress;

                // Staggered 2D spatial positioning offsets
                const panelX = cIdx * 65 + 20;
                const panelY = rIdx * 65 + 20;

                return (
                  <g key={`panel-${rIdx}-${cIdx}`} transform={`translate(${panelX}, ${panelY})`}>
                    {/* Rack Stand Pillar Legs */}
                    <line x1="25" y1="35" x2="25" y2="60" stroke="#4a5568" strokeWidth="4" />
                    
                    {/* Solar Collection Panel Card */}
                    <rect
                      x="0"
                      y="0"
                      width="50"
                      height="35"
                      rx="4"
                      backgroundcolor={isActivated ? flowColor : infrastructureColor}
                      fill={isActivated ? `url(#panelActiveGlow)` : infrastructureColor}
                      stroke={isActivated ? flowColor : '#2d3748'}
                      strokeWidth="2"
                      style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                      filter={isActivated ? "url(#greenGlow)" : "none"}
                    />
                    
                    {/* Internal grid line texturing */}
                    {isActivated && (
                      <line x1="25" y1="0" x2="25" y2="35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    )}
                  </g>
                );
              });
            })}

            {/* HIGH-OUTPUT SHUNT INVERTER STATION CONTAINER */}
            <g transform="translate(200, 135)">
              <rect x="0" y="0" width="60" height="75" rx="6" fill="#11151d" stroke="#2d3748" strokeWidth="3" />
              <circle cx="30" cy="25" r="5" fill={lineSpring > 0.8 ? flowColor : "#e53e3e"} filter={lineSpring > 0.8 ? "url(#greenGlow)" : "none"} />
              <line x1="15" y1="45" x2="45" y2="45" stroke="#2d3748" strokeWidth="3" />
              <line x1="15" y1="55" x2="45" y2="55" stroke="#2d3748" strokeWidth="3" />
            </g>

            <text x="140" y="250" fill="#a0aec0" fontSize="13" fontWeight="600" textAnchor="middle" letterSpacing="2">PROJECT SITE ARRAY</text>
          </g>

          {/* LINEAR ACTIVE COLOR GRADIENT BLUEPRINT DEFINITION */}
          <defs>
            <linearGradient id="panelActiveGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
              <stop offset="30%" stopColor={flowColor} stopOpacity={1} />
              <stop offset="100%" stopColor="#101419" />
            </linearGradient>
          </defs>

        </svg>
      </div>
    </AbsoluteFill>
  );
};