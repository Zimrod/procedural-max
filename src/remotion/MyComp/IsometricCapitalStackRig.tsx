// src/remotion/MyComp/IsometricCapitalStackRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type CapitalLayerConfig = {
  key: string;
  label: string;
  percentageText: string;
  subText: string;        // Context description rendered inside the right dashboard cards
  baseColor: string;      // Front-Left face color
  sideColor: string;      // Front-Right face color
  topColor: string;       // Top cap face color and pointer colour
};

export type IsometricCapitalStackProps = {
  backgroundColor?: string;
  stageScale?: number;
  stageOffsetX?: number;
  stageOffsetY?: number;
  
  // Prism Dimensions
  prismWidth?: number;         // Width dimension of the prism base
  prismLength?: number;        // Depth extension dimension running along isometric vector
  layerHeight?: number;        // Thickness profile of individual segments
  layerGap?: number;           // Gap spacing between sections
  isometricAngle?: number;     // Vector projection angle radian modifier
  
  // Dynamics & Timings
  dropStaggerFrames?: number;
  springDamping?: number;
  springMass?: number;
  springStiffness?: number;
  
  layers?: CapitalLayerConfig[];
};

const defaultLayers: CapitalLayerConfig[] = [
  {
    key: 'senior-debt',
    label: 'SENIOR SECURED DEBT',
    percentageText: '55%',
    subText: 'First lien asset backing, priority recovery profile',
    baseColor: '#1e3a8a',
    sideColor: '#172554',
    topColor: '#3b82f6',
  },
  {
    key: 'subordinated-debt',
    label: 'SUBORDINATED DEBT',
    percentageText: '10%',
    subText: 'Maximum growth exposure, residual asset rights',
    baseColor: '#87bbfa',
    sideColor: '#3674fa',
    topColor: '#bfdbfe',
  },
  {
    key: 'mezzanine',
    label: 'MEZZANINE DEBT',
    percentageText: '20%',
    subText: 'Subordinated cash flow tranches, hybrid equity options',
    baseColor: '#2563eb',
    sideColor: '#1e40af',
    topColor: '#60a5fa',
  },
  {
    key: 'preferred-equity',
    label: 'PREFERRED EQUITY',
    percentageText: '15%',
    subText: 'Fixed dividend distribution preference tiers',
    baseColor: '#3b82f6',
    sideColor: '#1d4ed8',
    topColor: '#93c5fd',
  },
  {
    key: 'common-equity',
    label: 'COMMON EQUITY',
    percentageText: '10%',
    subText: 'Maximum growth exposure, residual asset rights',
    baseColor: '#60a5fa',
    sideColor: '#2563eb',
    topColor: '#bfdbfe',
  },
];

export const IsometricCapitalStackRig: React.FC<IsometricCapitalStackProps> = ({
  backgroundColor = '#212121', // Immersive dark background canvas
  stageScale = 1.0,
  stageOffsetX = 0,
  stageOffsetY = 60,
  prismWidth = 420,
  prismLength = 250,
  layerHeight = 70,
  layerGap = 8,
  isometricAngle = Math.PI / 6, // 30-degree standard projection transformation
  dropStaggerFrames = 12,
  springDamping = 15,
  springMass = 0.8,
  springStiffness = 70,
  layers = defaultLayers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cosA = Math.cos(isometricAngle);
  const sinA = Math.sin(isometricAngle);

  // Position the triangular prism on the LEFT side of the screen
  const centerX = 480;
  const centerY = 740;

  // Position layout coordinates for the card deck on the RIGHT side of the screen
  const cardPanelX = 1100;
  const cardPanelTopY = 220;
  const cardHeight = 115;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ATMOSPHERIC RADIAL GLOW DEFINITIONS */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="prismGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="35" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="indicatorGlow" x="-30%" y="-30%" width="160%" height="160%">
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
        {/* TECH REVENUE GRID BACKGROUND ACCENTS */}
        <g opacity="0.015">
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={`h-grid-${i}`} x1="0" y1={i * 40} x2="1920" y2={i * 40} stroke="#fff" strokeWidth="1" />
          ))}
          {Array.from({ length: 48 }).map((_, i) => (
            <line key={`v-grid-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="1080" stroke="#fff" strokeWidth="1" />
          ))}
        </g>

        {/* PRISM BACKDROP VOLUMETRIC GLOW AMBIENCE */}
        <circle cx={centerX} cy={centerY - (layers.length * layerHeight) / 2} r="260" fill="#1e3a8a" opacity="0.18" filter="url(#prismGlow)" />

        {/* ITERATE STRUCTURAL LAYERS (Bottom to Top for proper overlapping arrangement) */}
        {layers.map((layer, index) => {
          // Dynamic scaling factors creating a true tapered triangular wedge structure
          const currentRatio = (layers.length - index) / layers.length;
          const nextRatio = (layers.length - (index + 1)) / layers.length;

          const wStart = prismWidth * currentRatio;
          const wEnd = prismWidth * nextRatio;

          const lStart = prismLength * currentRatio;
          const lEnd = prismLength * nextRatio;

          // Calculate accumulated height metrics tracking layers below
          let accumulatedRestingHeight = 0;
          for (let i = 0; i < index; i++) {
            accumulatedRestingHeight += layerHeight + layerGap;
          }
          const finalRestingY = centerY - accumulatedRestingHeight;

          // Physics Spring Segment tracking drop trajectory mechanics
          const introDelay = index * dropStaggerFrames;
          const dropSpring = spring({
            frame: Math.max(0, frame - introDelay),
            fps,
            config: { damping: springDamping, mass: springMass, stiffness: springStiffness },
          });

          // Drop distance coming from top screen bounds
          const currentY = interpolate(dropSpring, [0, 1], [finalRestingY - 700, finalRestingY]);
          const layerAlpha = interpolate(dropSpring, [0, 0.15], [0, 1]);

          // Mathematical coordinate mesh calculations for an accurate Isometric Triangular Prism
          // Left Profile Coordinates
          const lx1 = centerX - wStart * cosA;
          const ly1 = currentY + wStart * sinA;
          const lx2 = centerX - wEnd * cosA;
          const ly2 = (currentY - layerHeight) + wEnd * sinA;

          // Right Profile Coordinates
          const rx1 = centerX + lStart * cosA;
          const ry1 = currentY + lStart * sinA;
          const rx2 = centerX + lEnd * cosA;
          const ry2 = (currentY - layerHeight) + lEnd * sinA;

          // Vertex Apex Node points tracking the triangle crown line
          const ax1 = centerX;
          const ay1 = currentY;
          const ax2 = centerX;
          const ay2 = currentY - layerHeight;

          // Polypath vector configurations for the prism block faces
          const leftFacePath = `M ${lx1},${ly1} L ${ax1},${ay1} L ${ax2},${ay2} L ${lx2},${ly2} Z`;
          const rightFacePath = `M ${ax1},${ay1} L ${rx1},${ry1} L ${rx2},${ry2} L ${ax2},${ay2} Z`;
          const topFacePath = `M ${lx2},${ly2} L ${ax2},${ay2} L ${rx2},${ry2} L ${centerX},${(currentY - layerHeight) + (wEnd + lEnd) * sinA} Z`;

          // Card layout calculations pinned to the exact matching right-hand positions
          const targetCardY = cardPanelTopY + (layers.length - 1 - index) * cardHeight;
          const linePointerTargetY = targetCardY + 45;

          // Structural mid-point mapping on the prism face to hook connection pointer lines
          const pointerOriginX = ax1 + (rx1 - ax1) * 0.4;
          const pointerOriginY = ay1 + (ry1 - ay1) * 0.4 - (layerHeight / 2);

          return (
            <g key={layer.key} opacity={layerAlpha}>
              
              {/* GEOMETRIC PRISM MESH SECTIONS */}
              <g>
                {/* Front Left Face */}
                <path d={leftFacePath} fill={layer.baseColor} stroke={layer.sideColor} strokeWidth="0.5" />
                {/* Front Right Face */}
                <path d={rightFacePath} fill={layer.sideColor} stroke={layer.baseColor} strokeWidth="0.5" />
                {/* Top Wedge Face Plane (Only render explicitly if it forms the top cap block) */}
                {index === layers.length - 1 && (
                  <path d={topFacePath} fill={layer.topColor} stroke={layer.topColor} strokeWidth="0.5" />
                )}
              </g>

              {/* HUD ALIGNMENT LINE POINTERS WITH STAGGERED DRAWS */}
              {dropSpring > 0.8 && (
                <g>
                  {/* Horizontal routing line path stretching out to right side text modules */}
                  <path
                    d={`M ${pointerOriginX},${pointerOriginY} L ${pointerOriginX + 80},${pointerOriginY} L ${cardPanelX - 40},${linePointerTargetY}`}
                    fill="none"
                    stroke={layer.topColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity={interpolate(dropSpring, [0.8, 1], [0, 0.5])}
                  />
                  
                  {/* Anchored terminal hub node circle */}
                  <circle
                    cx={pointerOriginX}
                    cy={pointerOriginY}
                    r="4"
                    fill="#ffffff"
                    stroke={layer.topColor}
                    strokeWidth="1.5"
                    filter="url(#indicatorGlow)"
                    opacity={interpolate(dropSpring, [0.8, 1], [0, 1])}
                  />
                </g>
              )}

              {/* RIGHT HALF CONFIGURATION DISPLAY MODULES (Dashboard Metadata Cards) */}
              <g 
                transform={`translate(${cardPanelX}, ${targetCardY})`} 
                opacity={interpolate(dropSpring, [0.6, 1], [0, 1], { extrapolateLeft: 'clamp' })}
              >
                {/* Card Background Plate */}
                <rect x="0" y="0" width="680" height="90" rx="8" fill="#0d121a" stroke="#1a2436" strokeWidth="1.5" />
                
                {/* Left Colored Edge Band Indicator */}
                <rect x="0" y="0" width="6" height="90" rx="2" fill={layer.topColor} />

                {/* Percentage Allocator Bubble Badge */}
                <rect x="580" y="25" width="75" height="40" rx="6" fill="#131c2a" stroke="#22324d" strokeWidth="1" />
                <text x="6175" y="0" transform="translate(0,0)">
                  <tspan x="617" y="50" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle">{layer.percentageText}</tspan>
                </text>

                {/* Typography Information Blocks */}
                <text x="30" y="38" fill="#ffffff" fontSize="15" fontWeight="800" letterSpacing="0.5">
                  {layer.label}
                </text>
                <text x="30" y="62" fill="#718096" fontSize="12" fontWeight="500">
                  {layer.subText}
                </text>
              </g>
            </g>
          );
        })}

        {/* OVERLAY HEADER TITLES */}
        <g transform="translate(80, 100)">
          <text x="0" y="0" fill="#ffffff" fontSize="22" fontWeight="900" letterSpacing="1.5">
            STRUCTURAL CAPITAL DECK MODEL
          </text>
          <text x="0" y="26" fill="#4a5568" fontSize="12" fontWeight="700" letterSpacing="4">
            FINANCIAL RISK SEGREGATION GRAPH // RE-04
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};