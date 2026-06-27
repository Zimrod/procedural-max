// src/remotion/MyComp/SolarStorageBessRig.tsx
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
  solarMetricLabel?: string;
  storageMetricLabel?: string;
  accentColor?: string; // Battery/solar charging state color (Light Green)
  chassisColor?: string; // Industrial dark slate enclosure
};

export const SolarStorageBessRig: React.FC<Props> = ({
  title = "SATELLITE BESS INFRASTRUCTURE",
  solarMetricLabel = "ARRAY GENERATION",
  storageMetricLabel = "SYSTEM STATE OF CHARGE",
  accentColor = "#48bb78",
  chassisColor = "#1a2332",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. MASTER TIMELINE TIMING GATES
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 75 },
  });

  // Flow Particle Loop Speed (Calculates continuous movement down the busbar wire)
  const loopDuration = 60;
  const flowProgress = (frame % loopDuration) / loopDuration;

  // Battery filling progression (rises from 12% to 94% over the timeline window)
  const stateOfCharge = interpolate(frame, [10, 100], [12, 94], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070a', fontFamily: 'Ubuntu, sans-serif', padding: 70, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* FILTER SYSTEM CONFIGURATION */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="bessGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* LEFT SPLIT PANEL: OPERATIONAL TELEMETRY METRICS */}
      <div style={{
        position: 'absolute',
        left: 70,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 580,
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
        opacity: introSpring,
      }}>
        <div>
          <span style={{ color: '#4a5568', fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
            SYSTEM METRIC // 01
          </span>
          <h2 style={{ color: '#ffffff', fontSize: 24, margin: '4px 0 0 0', fontWeight: 500 }}>{solarMetricLabel}</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(interpolate(introSpring, [0, 1], [0, 1240]))}
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, color: accentColor, marginLeft: 8 }}>kW</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#0d131c', height: 2, width: '100%' }} />

        <div>
          <span style={{ color: accentColor, fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
            SYSTEM METRIC // 02
          </span>
          <h2 style={{ color: '#ffffff', fontSize: 24, margin: '4px 0 0 0', fontWeight: 500 }}>{storageMetricLabel}</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}>
            <span style={{ fontSize: 94, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(stateOfCharge)}
            </span>
            <span style={{ fontSize: 36, fontWeight: 800, color: accentColor, marginLeft: 6 }}>%</span>
          </div>
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: CHARGING HARVEST MAP CANVAS */}
      <div style={{
        position: 'absolute',
        right: 70,
        top: '50%',
        transform: `translateY(-50%) scale(${interpolate(introSpring, [0, 1], [0.95, 1])})`,
        opacity: introSpring,
        width: 1100,
        height: 740,
        backgroundColor: '#0d1117',
        borderRadius: 24,
        border: '2px solid #1e2530',
        overflow: 'hidden',
      }}>
        <svg viewBox="0 0 1100 740" style={{ width: '100%', height: '100%' }}>
          
          {/* HEADER LAYER SUBTEXT */}
          <text x="50" y="60" fill="#ffffff" fontSize="16" fontWeight="700" letterSpacing="2">{title}</text>
          <line x1="50" y1="78" x2="120" y2="78" stroke={accentColor} strokeWidth="3" />

          {/* ASSET ELEMENT 1: GROUNDED SOLAR COLLECTOR PANEL */}
          <g id="solar-array-source" transform="translate(80, 290)">
            {/* Mounting rack backframe legs */}
            <line x1="40" y1="110" x2="40" y2="180" stroke="#2d3748" strokeWidth="6" />
            <line x1="160" y1="110" x2="160" y2="180" stroke="#2d3748" strokeWidth="6" />
            <polygon points="10,110 190,110 210,130 -10,130" fill="#141a24" />
            
            {/* Silicon wafer faceplate */}
            <polygon points="0,20 200,20 170,110 30,110" fill="#0a111a" stroke="#2d3748" strokeWidth="3" />
            
            {/* Internal solar matrix cell cross lines */}
            <line x1="65" y1="20" x2="65" y2="110" stroke="#2d3748" strokeWidth="1" />
            <line x1="100" y1="20" x2="100" y2="110" stroke="#2d3748" strokeWidth="2" />
            <line x1="135" y1="20" x2="135" y2="110" stroke="#2d3748" strokeWidth="1" />
            <line x1="45" y1="65" x2="155" y2="65" stroke="#2d3748" strokeWidth="1" />

            <text x="100" y="215" fill="#4a5568" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="1">PV FIELD</text>
          </g>

          {/* INTERCONNECTING MAIN DISTRIBUTION BUSBAR CABLE */}
          <g id="power-conduit">
            {/* Static background wire layout pipeline path */}
            <path
              id="distribution-wire"
              d="M 280,370 L 520,370 L 520,370 L 680,370"
              fill="none"
              stroke="#1e2530"
              strokeWidth="6"
              strokeLinecap="round"
            />
            
            {/* KINETIC ENERGY PARTICLES FLOW LAYER */}
            {/* Moves seamlessly down the line mapping coordinate vectors based on timeline frame loops */}
            {[0, 0.33, 0.66].map((offset, pIdx) => {
              const currentPosition = (flowProgress + offset) % 1;
              const particleX = interpolate(currentPosition, [0, 1], [280, 680]);
              return (
                <circle
                  key={`electron-${pIdx}`}
                  cx={particleX}
                  cy={370}
                  r="6"
                  fill="#ffffff"
                  stroke={accentColor}
                  strokeWidth="2"
                  filter="url(#bessGlow)"
                />
              );
            })}
          </g>

          {/* ASSET ELEMENT 2: INDUSTRIAL BESS ENCLOSURE CONTAINER CABINET */}
          <g id="bess-enclosure" transform="translate(680, 180)">
            {/* Main Outer Steel Container Body Shield */}
            <rect x="0" y="0" width="340" height="380" rx="12" fill="#0d131c" stroke={chassisColor} strokeWidth="6" />
            <rect x="-1" y="-1" width="342" height="382" rx="13" fill="none" stroke="#2d3748" strokeWidth="1.5" />
            
            {/* Front Intake HVAC Cooling Air Exhaust Vent Louvers */}
            <rect x="30" y="30" width="80" height="40" rx="4" fill="#05070a" />
            {Array.from({ length: 4 }).map((_, vIdx) => (
              <line key={`vent-${vIdx}`} x1="40" y1={40 + vIdx * 6} x2="100" y2={40 + vIdx * 6} stroke="#1e2530" strokeWidth="2.5" />
            ))}

            {/* Safety Indicator System Warning Beacon Lights */}
            <circle cx="285" cy="45" r="7" fill={accentColor} filter="url(#bessGlow)" />
            <circle cx="285" cy="45" r="3" fill="#ffffff" />
            <text x="265" y="49" fill="#4a5568" fontSize="11" fontWeight="700" textAnchor="end" letterSpacing="1">SYS OK</text>

            {/* INNER LI-ION STORAGE STACK BLOCK CORE CHARGING METER */}
            <g id="battery-accumulator-core" transform="translate(30, 110)">
              {/* Core Battery Tank Container Frame Hull */}
              <rect x="0" y="0" width="280" height="210" rx="14" fill="#05070a" stroke="#1e2530" strokeWidth="3" />
              
              {/* Dynamic Filling Fluid Volume Mask */}
              {/* Height maps straight to stateOfCharge interpolation ranges */}
              <rect
                x="6"
                y={interpolate(stateOfCharge, [0, 100], [204, 6])}
                width="268"
                height={interpolate(stateOfCharge, [0, 100], [0, 198])}
                rx="10"
                fill={accentColor}
                opacity="0.25"
                style={{ transition: 'y 0.1s linear, height 0.1s linear' }}
              />

              {/* LIT STEPPED LI-ION ENERGY MODULE CELLS */}
              {/* Rows ignite progressively as stateOfCharge increases thresholds */}
              {Array.from({ length: 5 }).map((_, bIdx) => {
                // Reverse index ordering so battery builds structural volume from baseline up
                const cellThreshold = (5 - bIdx) * 20 - 10;
                const isCellCharged = stateOfCharge >= cellThreshold;

                return (
                  <rect
                    key={`cell-block-${bIdx}`}
                    x="16"
                    y="14"
                    width="248"
                    height="32"
                    rx="4"
                    fill={isCellCharged ? accentColor : "#0d131c"}
                    stroke={isCellCharged ? "#ffffff" : "#141a24"}
                    strokeWidth={isCellCharged ? 1.5 : 2}
                    opacity={isCellCharged ? 0.95 : 0.3}
                    filter={isCellCharged ? "url(#bessGlow)" : "none"}
                    style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
                    transform={`translate(0, ${bIdx * 38})`}
                  />
                );
              })}
            </g>

            <text x="170" y="350" fill="#4a5568" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="2">BESS CELL MATRIX STORAGE</text>
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};