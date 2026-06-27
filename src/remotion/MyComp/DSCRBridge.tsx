// src/remotion/MyComp/DSCRBridge.tsx
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
  noiValue?: number;         // Net Operating Income (e.g., $1.3M)
  debtServiceValue?: number; // Debt Service Obligation (e.g., $1.0M)
  currency?: string;
  accentColor?: string;      // Color for passing health status
  dangerColor?: string;      // Color if DSCR drops below safety threshold
};

export const DSCRBridge: React.FC<Props> = ({
  title = "DEBT SERVICE COVERAGE RATIO (DSCR)",
  noiValue = 1300000,
  debtServiceValue = 1000000,
  currency = "$",
  accentColor = "#48bb78",    // Light Green for passing debt service
  dangerColor = "#e53e3e",    // Red for covenant breaches
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. CALCULATE CORE METRIC RATIO
  const trueDSCR = noiValue / debtServiceValue;

  // 2. TIMELINE ENTRANCE GATES
  // Phase 1: Upward structural scale assembly spring
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 80 },
  });

  // Phase 2: Weight drop & tilt settling action (staggered by 15 frames)
  const settleSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 12, mass: 1.2, stiffness: 50 }, // Heavier mass for realistic pendulum bounce
  });

  // 3. MECHANICAL BALANCE SCALE GEOMETRY MATH
  // Standard equilibrium is 0 degrees. If DSCR is 1.3, Cash drops down.
  // We cap the physical rotation max tilt at 18 degrees to prevent graphic breakage.
  const maxTiltAngle = 18;
  const targetTiltAngle = interpolate(trueDSCR, [0.5, 1.0, 1.5], [maxTiltAngle, 0, -maxTiltAngle], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  // Apply the bounce spring interpolation to find the active real-time frame angle
  const activeTiltAngle = settleSpring * targetTiltAngle;

  // Track coordinates for the left and right suspension hinges as the main crossbeam pivots
  // Center of crossbeam pivot is at coordinates (400, 280)
  const beamLength = 440;
  const rad = (activeTiltAngle * Math.PI) / 180;
  
  const leftHingeX = 400 - (beamLength / 2) * Math.cos(rad);
  const leftHingeY = 280 - (beamLength / 2) * Math.sin(rad);
  
  const rightHingeX = 400 + (beamLength / 2) * Math.cos(rad);
  const rightHingeY = 280 + (beamLength / 2) * Math.sin(rad);

  const isPassing = trueDSCR >= 1.20; // Standard utility-scale banking covenant threshold

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0d10', fontFamily: 'Ubuntu, sans-serif', padding: 70, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* HEADER SECTION */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 70,
        opacity: interpolate(frame, [0, 15], [0, 1]),
      }}>
        <h1 style={{ color: '#ffffff', fontSize: 40, margin: 0, letterSpacing: 2, fontWeight: 700 }}>
          {title}
        </h1>
        <div style={{ width: 80, height: 4, backgroundColor: isPassing ? accentColor : dangerColor, marginTop: 12, borderRadius: 2 }} />
      </div>

      {/* LEFT SPLIT PANEL: METRIC READOUT FINANCIALS */}
      <div style={{
        position: 'absolute',
        left: 70,
        top: 210,
        width: 650,
        display: 'flex',
        flexDirection: 'column',
        gap: 25
      }}>
        
        {/* LARGE INTERACTIVE RATIO BOX */}
        <div style={{
          backgroundColor: '#11151d',
          padding: '40px 45px',
          borderRadius: 20,
          border: `2px solid ${isPassing ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)'}`,
          boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
          transform: `scale(${interpolate(introSpring, [0, 1], [0.95, 1])})`,
          opacity: introSpring
        }}>
          <span style={{ color: '#a0aec0', fontSize: 14, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>
            CALCULATED COVENANT RATIO
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 110, fontWeight: 900, color: '#ffffff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {interpolate(settleSpring, [0, 1], [1.0, trueDSCR]).toFixed(2)}
            </span>
            <span style={{ fontSize: 48, fontWeight: 800, color: isPassing ? accentColor : dangerColor, marginLeft: 10 }}>x</span>
          </div>
          <div style={{
            marginTop: 20,
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 6,
            backgroundColor: isPassing ? `${accentColor}15` : `${dangerColor}15`,
            border: `1px solid ${isPassing ? accentColor : dangerColor}`,
            color: isPassing ? accentColor : dangerColor,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase'
          }}>
            {isPassing ? "PASSING BANK COVENANT" : "UNDERCOLLATERALIZED RISK"}
          </div>
        </div>

        {/* LEDGER FOOTPRINT DETAILS */}
        <div style={{ display: 'flex', gap: 20, opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: 'clamp' }) }}>
          <div style={{ flex: 1, backgroundColor: '#11151d', padding: 24, borderRadius: 12, border: '1px solid #1e2530' }}>
            <span style={{ color: '#718096', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>[FREE CASH FLOW] NOI</span>
            <h4 style={{ color: '#ffffff', fontSize: 28, margin: '4px 0 0 0', fontWeight: 700 }}>
              {currency}{(noiValue / 1000000).toFixed(1)}M
            </h4>
          </div>
          <div style={{ flex: 1, backgroundColor: '#11151d', padding: 24, borderRadius: 12, border: '1px solid #1e2530' }}>
            <span style={{ color: '#718096', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>DEBT SERVICE TARGET</span>
            <h4 style={{ color: '#ffffff', fontSize: 28, margin: '4px 0 0 0', fontWeight: 700 }}>
              {currency}{(debtServiceValue / 1000000).toFixed(1)}M
            </h4>
          </div>
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: KINETIC MECHANICAL BALANCE SCALE */}
      <div style={{
        position: 'absolute',
        right: 70,
        top: 210,
        width: 1040,
        height: 740,
        backgroundColor: '#0d1117',
        borderRadius: 24,
        border: '2px solid #1e2530',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg viewBox="0 0 800 650" style={{ width: '100%', height: '100%', padding: 30, boxSizing: 'border-box' }}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BASE ANCHOR & VERTICAL PILLAR CENTER MAST */}
          <g id="scale-base" opacity={introSpring}>
            {/* Ground Footing platform */}
            <rect x="300" y="540" width="200" height="24" rx="4" fill="#1e2530" stroke="#2d3748" strokeWidth="2" />
            {/* Main Vertical Cast Iron Support Shaft */}
            <rect x="386" y="280" width="28" height="260" fill="#2d3748" stroke="#4a5568" strokeWidth="2" />
            {/* Center Fulcrum Hub Pin */}
            <circle cx="400" cy="280" r="14" fill="#0b0d10" stroke="#a0aec0" strokeWidth="4" />
          </g>

          {/* DYNAMIC ROTATING SWING COMPONENT GROUP */}
          {/* Pivots fluidly around the main coordinate axis center point (400, 280) */}
          <g id="moving-crossbeam" opacity={introSpring}>
            <line
              x1={leftHingeX}
              y1={leftHingeY}
              x2={rightHingeX}
              y2={rightHingeY}
              stroke="#4a5568"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Left Balance Arm Tip Notch */}
            <circle cx={leftHingeX} cy={leftHingeY} r="6" fill="#ffffff" />
            {/* Right Balance Arm Tip Notch */}
            <circle cx={rightHingeX} cy={rightHingeY} r="6" fill="#ffffff" />
          </g>

          {/* LEFT SIDE SYSTEM LAYER: NET OPERATING INCOME (CASH WEIGHTS) */}
          {/* Self-leveling pan rigging translation coordinates tied directly to leftHinge vector maps */}
          <g id="left-pan-system" opacity={introSpring}>
            {/* Suspension Cables */}
            <line x1={leftHingeX} y1={leftHingeY} x2={leftHingeX - 50} y2={leftHingeY + 160} stroke="#4a5568" strokeWidth="2" />
            <line x1={leftHingeX} y1={leftHingeY} x2={leftHingeX + 50} y2={leftHingeY + 160} stroke="#4a5568" strokeWidth="2" />
            {/* Physical Floating Platform Pan */}
            <rect x={leftHingeX - 70} y={leftHingeY + 160} width="140" height="10" rx="2" fill="#2d3748" />
            
            {/* INDUSTRIAL WEIGHT BLOCKS (CASH GENERATION ASSETS) */}
            {/* Base Block 1 */}
            <rect x={leftHingeX - 45} y={leftHingeY + 120} width="90" height="40" rx="4" fill={accentColor} stroke="#ffffff" strokeWidth="2" opacity={interpolate(settleSpring, [0, 0.7], [0, 1])} />
            <text x={leftHingeX} y={leftHingeY + 145} fill="#000" fontSize="14" fontWeight="900" textAnchor="middle">CASH NOI</text>
            
            {/* Stacked Top Heavy Cushion Weight Block (Only pops if DSCR is substantially positive) */}
            {trueDSCR > 1.2 && (
              <g opacity={interpolate(settleSpring, [0.4, 1], [0, 1])}>
                <polygon points={`${leftHingeX - 30},${leftHingeY + 120} ${leftHingeX + 30},${leftHingeY + 120} ${leftHingeX + 20},${leftHingeY + 90} ${leftHingeX - 20},${leftHingeY + 90}`} fill="#ffffff" />
                <text x={leftHingeX} y={leftHingeY + 112} fill="#000" fontSize="11" fontWeight="900" textAnchor="middle">SURPLUS</text>
              </g>
            )}
          </g>

          {/* RIGHT SIDE SYSTEM LAYER: DEBT SERVICE LIABILITY COUNTERPART */}
          {/* Self-leveling pan rigging translation coordinates tied directly to rightHinge vector maps */}
          <g id="right-pan-system" opacity={introSpring}>
            {/* Suspension Cables */}
            <line x1={rightHingeX} y1={rightHingeY} x2={rightHingeX - 50} y2={rightHingeY + 160} stroke="#4a5568" strokeWidth="2" />
            <line x1={rightHingeX} y1={rightHingeY} x2={rightHingeX + 50} y2={rightHingeY + 160} stroke="#4a5568" strokeWidth="2" />
            {/* Physical Floating Platform Pan */}
            <rect x={rightHingeX - 70} y={rightHingeY + 160} width="140" height="10" rx="2" fill="#2d3748" />
            
            {/* FIXED DEBT REQUIREMENT WEIGHT BULK */}
            <rect x={rightHingeX - 50} y={rightHingeY + 110} width="100" height="50" rx="6" fill="#1e2530" stroke="#e53e3e" strokeWidth="3" />
            <text x={rightHingeX} y={rightHingeY + 140} fill="#ffffff" fontSize="13" fontWeight="700" textAnchor="middle" letterSpacing="0.5">DEBT SERVICE</text>
            
            {/* Internal Danger Core warning light built into the center debt block */}
            <circle cx={rightHingeX} cy={rightHingeY + 122} r="5" fill={isPassing ? "#718096" : dangerColor} filter={isPassing ? "none" : "url(#glow)"} />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};