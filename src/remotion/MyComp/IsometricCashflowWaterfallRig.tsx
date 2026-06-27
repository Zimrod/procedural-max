// src/remotion/MyComp/IsometricCashflowWaterfallRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type WaterfallLevelConfig = {
  key: string;
  label: string;
  allocationText: string;
  subText: string;
  baseColor: string;       // Front-Left structural wall color
  sideColor: string;       // Front-Right structural wall color
  poolColor: string;       // Horizontal liquid pooling deck color
  waterSurgeColor: string; // Color of the cascading stream active over this block
};

export type IsometricCashflowWaterfallProps = {
  // Master Canvas Layout Configuration
  backgroundColor?: string;
  stageScale?: number;
  stageOffsetX?: number;
  stageOffsetY?: number;

  // Isometric Structural Proportions
  blockWidth?: number;         // Isometric width dimension (Left axis)
  blockLength?: number;        // Isometric length dimension (Right axis)
  stepDropHeight?: number;     // Vertical height drop of each waterfall landing step
  layerGap?: number;           // Vertical overhang offset for cascading fluid path (FIXED)
  isometricAngle?: number;     // Skew translation projection factor

  // Physics, Speeds & Timings
  fluidSpeedFrames?: number;   // Full duration loop for the streaming liquid texture
  dropStaggerFrames?: number;  // Stagger gate delay for structural entry
  springDamping?: number;
  springMass?: number;
  springStiffness?: number;

  // Fully programmatic Cashflow Allocation Levels array schema
  levels?: WaterfallLevelConfig[];
};

const defaultLevels: WaterfallLevelConfig[] = [
  {
    key: 'gross-revenue',
    label: '01 / GROSS INFLOWS',
    allocationText: '100%',
    subText: 'Total aggregate receipts and collection accounts',
    baseColor: '#1e3a8a',
    sideColor: '#172554',
    poolColor: '#1e40af',
    waterSurgeColor: '#60a5fa',
  },
  {
    key: 'op-expenses',
    label: '02 / OPEX & FEES',
    allocationText: '-45%',
    subText: 'Direct operating costs, maintenance, and asset management',
    baseColor: '#2563eb',
    sideColor: '#1e40af',
    poolColor: '#2563eb',
    waterSurgeColor: '#93c5fd',
  },
  {
    key: 'debt-service',
    label: '03 / DEBT SERVICE',
    allocationText: '-30%',
    subText: 'Senior lender principal and interest amortization schedules',
    baseColor: '#3b82f6',
    sideColor: '#1d4ed8',
    poolColor: '#3b82f6',
    waterSurgeColor: '#a7f3d0', 
  },
  {
    key: 'equity-distribution',
    label: '04 / EQUITY SPONSORS',
    allocationText: 'REMAINING 25%',
    subText: 'Net distributable cash flow to GP/LPs partners',
    baseColor: '#059669',
    sideColor: '#064e3b',
    poolColor: '#10b981',
    waterSurgeColor: '#34d399',
  },
];

export const IsometricCashflowWaterfallRig: React.FC<IsometricCashflowWaterfallProps> = ({
  backgroundColor = '#05070a', 
  stageScale = 0.95,
  stageOffsetX = -40,
  stageOffsetY = -30,
  blockWidth = 240,
  blockLength = 240,
  stepDropHeight = 110,
  layerGap = 8,                 // Declared parameter mapping the safety margin for the fluid overshoot
  isometricAngle = Math.PI / 6, 
  fluidSpeedFrames = 40,        
  dropStaggerFrames = 14,
  springDamping = 16,
  springMass = 0.9,
  springStiffness = 65,
  levels = defaultLevels,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Angular projection constants
  const cosA = Math.cos(isometricAngle);
  const sinA = Math.sin(isometricAngle);

  // Initial upper starting anchor coordinates (Waterfall origin)
  const startX = 380;
  const startY = 240;

  // Fluid flow looping calculations
  const flowProgress = (frame % fluidSpeedFrames) / fluidSpeedFrames;

  // HUD layout configuration parameters
  const cardPanelX = 1160;
  const cardPanelTopY = 180;
  const cardHeight = 125;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* GLOWS & DYNAMIC TEXTURE GRADIENT CONSOLE */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="fluidGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hudIndicatorGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <svg
        viewBox="0 0 1920 1080"
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${stageScale}) translate(${stageOffsetX}px, ${stageOffsetY}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* SUBTLE HUD VECTOR GRID LINES */}
        <g opacity="0.015">
          {Array.from({ length: 27 }).map((_, i) => (
            <line key={`h-grid-${i}`} x1="0" y1={i * 40} x2="1920" y2={i * 40} stroke="#fff" strokeWidth="1" />
          ))}
          {Array.from({ length: 48 }).map((_, i) => (
            <line key={`v-grid-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="1080" stroke="#fff" strokeWidth="1" />
          ))}
        </g>

        {/* PROCEDURAL RENDER PIPELINE */}
        {levels.map((level, index) => {
          const stepX = startX + index * blockLength * cosA;
          const restingStepY = startY + index * blockLength * sinA + index * stepDropHeight;

          const introDelay = index * dropStaggerFrames;
          const blockSpring = spring({
            frame: Math.max(0, frame - introDelay),
            fps,
            config: { damping: springDamping, mass: springMass, stiffness: springStiffness },
          });

          const stepY = interpolate(blockSpring, [0, 1], [restingStepY - 600, restingStepY]);
          const blockAlpha = interpolate(blockSpring, [0, 0.2], [0, 1]);

          // Precise Corner Coordinate Nodes Maps
          const t_rear_x = stepX;
          const t_rear_y = stepY;
          
          const t_left_x = stepX - blockWidth * cosA;
          const t_left_y = stepY + blockWidth * sinA;
          
          const t_right_x = stepX + blockLength * cosA;
          const t_right_y = stepY + blockLength * sinA;
          
          const t_front_x = stepX + (blockLength - blockWidth) * cosA;
          const t_front_y = stepY + (blockLength + blockWidth) * sinA;

          const b_left_x = t_left_x;
          const b_left_y = t_left_y + stepDropHeight;
          
          const b_front_x = t_front_x;
          const b_front_y = t_front_y + stepDropHeight;
          
          const b_right_x = t_right_x;
          const b_right_y = t_right_y + stepDropHeight;

          // Formulated Polygon Face Patches
          const topPoolPath = `M ${t_rear_x},${t_rear_y} L ${t_left_x},${t_left_y} L ${t_front_x},${t_front_y} L ${t_right_x},${t_right_y} Z`;
          const leftWallPath = `M ${t_left_x},${t_left_y} L ${t_front_x},${t_front_y} L ${b_front_x},${b_front_y} L ${b_left_x},${b_left_y} Z`;
          const rightWallPath = `M ${t_front_x},${t_front_y} L ${t_right_x},${t_right_y} L ${b_right_x},${b_right_y} L ${b_front_x},${b_front_y} Z`;

          // LIQUID STREAM VECTOR PATHS
          const poolLiquidStreamPath = `M ${t_rear_x + (t_left_x - t_rear_x) * 0.5},${t_rear_y + (t_left_y - t_rear_y) * 0.5} 
                                        L ${t_right_x + (t_front_x - t_right_x) * 0.5},${t_right_y + (t_front_y - t_right_y) * 0.5}`;

          const verticalDropCascadePath = `M ${t_right_x + (t_front_x - t_right_x) * 0.5},${t_right_y + (t_front_y - t_right_y) * 0.5}
                                           L ${t_right_x + (t_front_x - t_right_x) * 0.5},${t_right_y + (t_front_y - t_right_y) * 0.5 + stepDropHeight + layerGap}`;

          const targetCardY = cardPanelTopY + index * cardHeight;
          const linePointerTargetY = targetCardY + 45;

          const pointerOriginX = t_front_x;
          const pointerOriginY = t_front_y + stepDropHeight * 0.4;

          return (
            <g key={level.key} opacity={blockAlpha}>
              
              {/* STATIC SOLID STRUCTURAL BRICK BLOCKS */}
              <g id="block-structure">
                <path d={topPoolPath} fill={level.poolColor} stroke={level.baseColor} strokeWidth="0.5" />
                <path d={leftWallPath} fill={level.baseColor} stroke={level.sideColor} strokeWidth="0.5" />
                <path d={rightWallPath} fill={level.sideColor} stroke={level.baseColor} strokeWidth="0.5" />
              </g>

              {/* ACTIVE RUNNING WATERFALL SIMULATION FLUID ENGINE */}
              {blockSpring > 0.9 && (
                <g id="liquid-flow-engine" filter="url(#fluidGlow)">
                  <path d={poolLiquidStreamPath} fill="none" stroke={level.waterSurgeColor} strokeWidth="12" opacity="0.65" strokeLinecap="round" />
                  <path d={verticalDropCascadePath} fill="none" stroke={level.waterSurgeColor} strokeWidth="12" opacity="0.85" strokeLinecap="square" />

                  {[0, 0.33, 0.66].map((particleOffset, pIdx) => {
                    const trackingPos = (flowProgress + particleOffset) % 1;
                    
                    return (
                      <g key={`fluid-particles-${pIdx}`}>
                        <circle cx={0} cy={0} r="3.5" fill="#ffffff">
                          <animateMotion dur={`${fluidSpeedFrames / fps}s`} repeatCount="indefinite" path={poolLiquidStreamPath} keyPoints={`${trackingPos};${Math.min(1, trackingPos + 0.01)}`} keyTimes="0;1" />
                        </circle>
                        <circle cx={0} cy={0} r="4" fill="#ffffff">
                          <animateMotion dur={`${fluidSpeedFrames / fps}s`} repeatCount="indefinite" path={verticalDropCascadePath} keyPoints={`${trackingPos};${Math.min(1, trackingPos + 0.01)}`} keyTimes="0;1" />
                        </circle>
                      </g>
                    );
                  })}

                  <circle 
                    cx={t_right_x + (t_front_x - t_right_x) * 0.5} 
                    cy={t_right_y + (t_front_y - t_right_y) * 0.5 + stepDropHeight} 
                    r={interpolate(frame % 15, [0, 15], [3, 14])} 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth={interpolate(frame % 15, [0, 15], [2, 0])}
                    opacity="0.7" 
                  />
                </g>
              )}

              {/* CONSOLE HUD HARD INTERCONNECTION POINTER LINES */}
              {blockSpring > 0.85 && (
                <g id="hud-routing-links">
                  <path
                    d={`M ${pointerOriginX},${pointerOriginY} L ${pointerOriginX + 60},${pointerOriginY + 30} L ${cardPanelX - 40},${linePointerTargetY}`}
                    fill="none"
                    stroke={level.waterSurgeColor}
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                    opacity={interpolate(blockSpring, [0.85, 1], [0, 0.4])}
                  />
                  <circle
                    cx={pointerOriginX}
                    cy={pointerOriginY}
                    r="4"
                    fill="#ffffff"
                    stroke={level.waterSurgeColor}
                    strokeWidth="1.5"
                    filter="url(#hudIndicatorGlow)"
                    opacity={interpolate(blockSpring, [0.85, 1], [0, 1])}
                  />
                </g>
              )}

              {/* DATA CONSOLE CONTROL READOUT CARDS */}
              <g 
                transform={`translate(${cardPanelX}, ${targetCardY})`} 
                opacity={interpolate(blockSpring, [0.7, 1], [0, 1], { extrapolateLeft: 'clamp' })}
              >
                <rect x="0" y="0" width="640" height="95" rx="8" fill="#0d121a" stroke="#1a2436" strokeWidth="1.5" />
                <rect x="0" y="0" width="6" height="95" rx="2" fill={level.waterSurgeColor} />

                <rect x="520" y="27" width="95" height="40" rx="6" fill="#131c2a" stroke="#22324d" strokeWidth="1" />
                <text x="567" y="52" fill={level.waterSurgeColor} fontSize="15" fontWeight="900" textAnchor="middle">
                  {level.allocationText}
                </text>

                <text x="30" y="40" fill="#ffffff" fontSize="15" fontWeight="800" letterSpacing="0.5">
                  {level.label}
                </text>
                <text x="30" y="64" fill="#718096" fontSize="12" fontWeight="500" width="440">
                  {level.subText}
                </text>
              </g>

            </g>
          );
        })}

        {/* COMPOSITION BLOCK HEADER */}
        <g transform="translate(80, 90)">
          <text x="0" y="0" fill="#ffffff" fontSize="24" fontWeight="900" letterSpacing="1.5">
            CASHFLOW WATERFALL ALLOCATION TRANCHES
          </text>
          <text x="0" y="26" fill="#4a5568" fontSize="12" fontWeight="700" letterSpacing="4">
            AUTOMATED DISTRIBUTABLE CAPITAL CLEARING ENGINE // WF-90
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};