// src/remotion/MyComp/SolarRevenueMultiplier.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type RevenueStream = {
  id: string;
  label: string;
  baseFee: number;
  subtext: string;
};

type Props = {
  title?: string;
  currency?: string;
  accentColor?: string;
  infrastructureColor?: string;
};

export const SolarRevenueMultiplier: React.FC<Props> = ({
  title = "MULTIPLE REVENUE STREAMS PER TRANSACTION",
  currency = "$",
  accentColor = "#ff7b00",
  infrastructureColor = "#2a4365",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. DATA MODELS FOR INDEPENDENT FINANCIAL LAYERS
  const streams: RevenueStream[] = [
    { id: 'arrangement', label: 'Loan Arrangement Fee', baseFee: 175000, subtext: 'Upfront syndication & underwriting margin' },
    { id: 'escrow', label: 'Escrow Account Spread', baseFee: 85000, subtext: 'Cash waterfall operational floating interest' },
    { id: 'fx', label: 'FX Equity Conversion Gate', baseFee: 140000, subtext: 'Cross-border procurement liquidity clearance' },
  ];

  // 2. STAGGERED ACCUMULATION LOGIC OVER TIMELINE GATES
  // Each line item rolls out in sequence every 25 frames
  const staggerInterval = 25;
  const startDelay = 15;

  let cumulativeTally = 0;
  const activeStatusArray = streams.map((stream, idx) => {
    const itemStartFrame = startDelay + idx * staggerInterval;
    const itemFrameNormalized = Math.max(0, frame - itemStartFrame);
    
    const itemSpring = spring({
      frame: itemFrameNormalized,
      fps,
      config: { damping: 14, mass: 0.6, stiffness: 100 },
    });

    // Add to tally if the spring has initiated its movement
    if (frame >= itemStartFrame) {
      cumulativeTally += stream.baseFee * itemSpring;
    }

    return {
      ...stream,
      spring: itemSpring,
      hasStarted: frame >= itemStartFrame,
    };
  });

  // 3. SOLAR TRACKER INFRASTRUCTURE ANIMATION PROPERTIES
  // Solar tracking arrays slowly tilt from early morning angle (-45 deg) to mid-day zenith (0 deg)
  const panelTiltAngle = interpolate(frame, [0, 100], [-45, 5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glow pulse simulating power generation matching active revenue step states
  const gridPowerPulse = interpolate(cumulativeTally, [0, 400000], [0.1, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0d10', fontFamily: 'Ubuntu, sans-serif', padding: 70, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* HEADER COMPONENT TITLE */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 70,
        opacity: interpolate(frame, [0, 15], [0, 1]),
      }}>
        <h1 style={{ color: '#ffffff', fontSize: 40, margin: 0, letterSpacing: 2, fontWeight: 700 }}>
          {title}
        </h1>
        <div style={{ width: 80, height: 4, backgroundColor: accentColor, marginTop: 12, borderRadius: 2 }} />
      </div>

      {/* LEFT SPLIT PANEL: STACKED REVENUE LEDGER */}
      <div style={{
        position: 'absolute',
        left: 70,
        top: 180,
        width: 850,
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {activeStatusArray.map((item, idx) => {
          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#11151d',
                borderRadius: 12,
                border: `2px solid ${item.hasStarted ? 'rgba(255, 123, 0, 0.25)' : '#1e2530'}`,
                padding: '22px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'between',
                opacity: interpolate(item.spring, [0, 1], [0.15, 1]),
                transform: `translateX(${interpolate(item.spring, [0, 1], [-20, 0])}px)`,
                boxShadow: item.hasStarted ? `0 10px 30px rgba(0,0,0,0.3)` : 'none',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ color: '#ffffff', fontSize: 24, margin: 0, fontWeight: 700 }}>{item.label}</h3>
                <p style={{ color: '#718096', fontSize: 15, margin: '4px 0 0 0', fontWeight: 400 }}>{item.subtext}</p>
              </div>
              <div style={{ textAlign: 'right', minWidth: 200 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: item.hasStarted ? accentColor : '#a0aec0', fontVariantNumeric: 'tabular-nums' }}>
                  {currency}{Math.floor(item.baseFee * item.spring).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {/* INTEGRATED TOTALIZER COUNTER RUNNING BOX */}
        <div style={{
          marginTop: 20,
          backgroundColor: '#161d2a',
          borderRadius: 16,
          border: `2px dashed ${accentColor}55`,
          padding: '30px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: interpolate(frame, [startDelay - 5, startDelay + 10], [0, 1], { extrapolateLeft: 'clamp' }),
        }}>
          <div>
            <span style={{ color: '#a0aec0', fontSize: 16, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>CUMULATIVE BANK VALUE</span>
            <h2 style={{ color: '#ffffff', fontSize: 26, margin: '4px 0 0 0', fontWeight: 500 }}>Multi-Touchpoint Capital Return</h2>
          </div>
          <div>
            <span style={{ fontSize: 56, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
              {currency}{Math.floor(cumulativeTally).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: ANIMATED SOLAR INFRASTRUCTURE CANVAS */}
      <div style={{
        position: 'absolute',
        right: 70,
        top: 180,
        width: 840,
        height: 760,
        backgroundColor: '#0d1117',
        borderRadius: 24,
        border: '2px solid #1e2530',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        
        {/* VECTOR TRACKING STAGE */}
        <svg 
          viewBox="0 0 800 700" 
          style={{ width: '100%', height: '100%', padding: 40, boxSizing: 'border-box' }}
        >
          {/* DEFINITIONS FOR GRADIENTS AND FILTERS */}
          <defs>
            <linearGradient id="panelGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentColor} stopOpacity={gridPowerPulse} />
              <stop offset="100%" stopColor={infrastructureColor} />
            </linearGradient>
            <filter id="glowingPulse" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND ENERGY FEED GRID LINES */}
          <g opacity={0.15}>
            <line x1="100" y1="580" x2="700" y2="580" stroke="#ffffff" strokeWidth="2" strokeDasharray="10 10" />
            <line x1="400" y1="200" x2="400" y2="580" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 5" />
          </g>

          {/* PHYSICAL FOUNDATION PILES & TORQUE TUBE SUPPORT STAND */}
          <g id="mounting-rack">
            {/* Ground line anchor */}
            <line x1="150" y1="580" x2="650" y2="580" stroke="#3a4454" strokeWidth="8" strokeLinecap="round" />
            
            {/* Structural Column Leg Footings */}
            <line x1="280" y1="580" x2="280" y2="400" stroke="#1e2530" strokeWidth="16" />
            <line x1="520" y1="580" x2="520" y2="400" stroke="#1e2530" strokeWidth="16" />
            <line x1="400" y1="580" x2="400" y2="360" stroke="#3a4454" strokeWidth="24" strokeLinecap="round" />
            
            {/* Central Axis Drive Torque Pivot Point */}
            <circle cx="400" cy="360" r="18" fill="#11151d" stroke={accentColor} strokeWidth="4" />
          </g>

          {/* DYNAMIC ROTATING TRACKER BAR ASSEMBLIES */}
          {/* Rotates cleanly around center point (400, 360) directly mapped to time frame */}
          <g transform={`rotate(${panelTiltAngle}, 400, 360)`}>
            
            {/* Main Longitudinal C-Channel Support Frame */}
            <rect x="120" y="348" width="560" height="24" rx="6" fill="#2d3748" stroke="#4a5568" strokeWidth="2" />
            
            {/* INDIVIDUAL SOLAR COLLECTOR MODULE CLUSTERS */}
            {/* Module 1 */}
            <rect x="140" y="270" width="110" height="70" rx="4" fill="url(#panelGlow)" stroke={cumulativeTally > 175000 ? accentColor : "#1a202c"} strokeWidth="3" filter={cumulativeTally > 175000 ? "url(#glowingPulse)" : "none"} style={{ transition: 'stroke 0.3s ease' }} />
            <line x1="195" y1="270" x2="195" y2="340" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            
            {/* Module 2 */}
            <rect x="270" y="270" width="110" height="70" rx="4" fill="url(#panelGlow)" stroke={cumulativeTally > 175000 ? accentColor : "#1a202c"} strokeWidth="3" filter={cumulativeTally > 175000 ? "url(#glowingPulse)" : "none"} style={{ transition: 'stroke 0.3s ease' }} />
            <line x1="325" y1="270" x2="325" y2="340" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

            {/* Module 3 */}
            <rect x="420" y="270" width="110" height="70" rx="4" fill="url(#panelGlow)" stroke={cumulativeTally > 260000 ? accentColor : "#1a202c"} strokeWidth="3" filter={cumulativeTally > 260000 ? "url(#glowingPulse)" : "none"} style={{ transition: 'stroke 0.3s ease' }} />
            <line x1="475" y1="270" x2="475" y2="340" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

            {/* Module 4 */}
            <rect x="550" y="270" width="110" height="70" rx="4" fill="url(#panelGlow)" stroke={cumulativeTally > 390000 ? accentColor : "#1a202c"} strokeWidth="3" filter={cumulativeTally > 390000 ? "url(#glowingPulse)" : "none"} style={{ transition: 'stroke 0.3s ease' }} />
            <line x1="605" y1="270" x2="605" y2="340" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

            {/* Internal hardware connector brackets */}
            <rect x="235" y="340" width="10" height="8" fill="#1a202c" />
            <rect x="365" y="340" width="10" height="8" fill="#1a202c" />
            <rect x="425" y="340" width="10" height="8" fill="#1a202c" />
            <rect x="555" y="340" width="10" height="8" fill="#1a202c" />
          </g>

          {/* DOWNSTREAM DC-TO-AC INVERTER VAULT SUBSYSTEM */}
          <g id="inverter-substation" transform="translate(620, 500)">
            <rect x="0" y="0" width="90" height="80" rx="8" fill="#1e2530" stroke="#3a4454" strokeWidth="4" />
            {/* Status Beacon Indicator */}
            <circle cx="25" cy="25" r="6" fill={cumulativeTally > 0 ? "#48bb78" : "#e53e3e"} filter={cumulativeTally > 0 ? "url(#glowingPulse)" : "none"} />
            {/* Cooling Vents Details */}
            <line x1="20" y1="45" x2="70" y2="45" stroke="#0b0d10" strokeWidth="4" strokeLinecap="round" />
            <line x1="20" y1="55" x2="70" y2="55" stroke="#0b0d10" strokeWidth="4" strokeLinecap="round" />
            <line x1="20" y1="65" x2="70" y2="65" stroke="#0b0d10" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};