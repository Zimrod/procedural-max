// src/remotion/MyComp/IsometricDebtEquityPieRig.tsx
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type PieSliceConfig = {
  key: string;
  label: string;
  percentage: number;       // Value from 0 to 100 (Must sum up to 100)
  baseColor: string;        // Upright flat front face color
  sideColor: string;        // Extruded 3D rim edge color
  legendTextColor: string;  // Explicit color mapping for the side legend metrics
};

export type IsometricDebtEquityPieProps = {
  backgroundColor?: string;
  stageScale?: number;
  stageOffsetX?: number;
  stageOffsetY?: number;

  // Exact geometric configurations for the upright disc match
  pieRadiusX?: number;
  pieRadiusY?: number;
  pieThickness?: number;
  globalRotationOffset?: number; // Adjusts where the 60% slice begins its rotation

  introDelayFrames?: number;
  springDamping?: number;
  springMass?: number;
  springStiffness?: number;

  slices?: PieSliceConfig[];
};

const defaultSlices: PieSliceConfig[] = [
  {
    key: 'senior-debt',
    label: 'SENIOR DEBT',
    percentage: 60,
    baseColor: '#1d63d3', // Deep Royal Blue
    sideColor: '#114192', // Shadow Rim Blue
    legendTextColor: '#3b82f6',
  },
  {
    key: 'equity',
    label: 'EQUITY',
    percentage: 20,
    baseColor: '#ff7a00', // Vibrant Industrial Orange
    sideColor: '#b85400', // Shadow Rim Orange
    legendTextColor: '#ff7a00',
  },
  {
    key: 'mezzanine-debt',
    label: 'MEZZANINE DEBT',
    percentage: 20,
    baseColor: '#4cb623', // Bright Lime/Green
    sideColor: '#327c14', // Shadow Rim Green
    legendTextColor: '#4cb623',
  },
];

export const IsometricDebtEquityPieRig: React.FC<IsometricDebtEquityPieProps> = ({
  backgroundColor = '#0b0e14', // Rich dark slate matching image background
  stageScale = 1.0,
  stageOffsetX = 0,
  stageOffsetY = 0,
  pieRadiusX = 265,
  pieRadiusY = 265,            // Circular face maintains near 1:1 ratio prior to perspective transform
  pieThickness = 45,           // Clean, premium modern token extrusion depth
  globalRotationOffset = -Math.PI / 2, // Starts slice drawing straight up at 12 o'clock
  introDelayFrames = 12,
  springDamping = 18,
  springMass = 0.8,
  springStiffness = 50,
  slices = defaultSlices,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shift pie center rightward to mirror the image composition layout
  const centerX = 1260;
  const centerY = 500;

  // Assembly cutting spring
  const splitSpring = spring({
    frame: Math.max(0, frame - introDelayFrames),
    fps,
    config: { damping: springDamping, mass: springMass, stiffness: springStiffness },
  });

  let accumulatedAngle = globalRotationOffset;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* FILTER CONSOLE DEFINITIONS */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="textDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feOffset dx="0" dy="4" result="offset" />
            <feComponentTransfer in="offset" result="shadowAlpha">
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadowAlpha" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pedestalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="25" result="blur" />
          </feMerge>
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
        {/* COMPOSITION HEADER BLOCK (Left-Aligned) */}
        <g transform="translate(140, 220)">
          <text x="0" y="0" fill="#ffffff" fontSize="64" fontWeight="800" letterSpacing="0.5">
            DEBT <tspan fill="#94a3b8" fontWeight="400">vs</tspan> EQUITY SPLIT
          </text>
          <text x="0" y="52" fill="#64748b" fontSize="20" fontWeight="600" letterSpacing="1.5">
            CAPITAL STRUCTURE OVERVIEW
          </text>
          {/* Subtle Orange Accent Baseline Rule */}
          <line x1="0" y1="90" x2="70" y2="90" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* SIDE DATA LEGEND PANEL CONTROL */}
        <g transform="translate(140, 440)">
          {/* Main Panel Boundary Box */}
          <rect x="0" y="0" width="500" height="340" rx="16" fill="#0d111a" opacity="0.4" stroke="#1e293b" strokeWidth="1" />

          {slices.map((slice, idx) => {
            const rowY = 55 + idx * 95;

            return (
              <g key={`legend-row-${slice.key}`} transform={`translate(45, ${rowY})`}>
                {/* Square Rounded Accent Icon Badge */}
                <rect x="0" y="0" width="45" height="45" rx="8" fill={slice.baseColor} />
                
                {/* Slice Structural Identification Text */}
                <text x="75" y="28" fill="#e2e8f0" fontSize="18" fontWeight="700" letterSpacing="0.5">
                  {slice.label}
                </text>

                {/* Percentage Data Readout (Right-Aligned inside row bounds) */}
                <text x="410" y="29" fill={slice.legendTextColor} fontSize="24" fontWeight="700" textAnchor="end">
                  {slice.percentage}%
                </text>

                {/* Separator rule line drawn between legend items */}
                {idx < slices.length - 1 && (
                  <line x1="0" y1={70} x2="410" y2={70} stroke="#1e293b" strokeWidth="1" opacity="0.5" />
                )}
              </g>
            );
          })}
        </g>

        {/* PERSPECTIVE TRANSFORM CAPTURING UPRIGHT DISPLAY PROFILE */}
        <g transform={`rotate(16, ${centerX}, ${centerY}) scale(1.0, 0.88)`}>
          
          {/* DARK CYLINDRICAL PEDESTAL STAND BASE */}
          <g id="pedestal-base" transform={`translate(0, ${pieRadiusY + 10})`}>
            {/* Dark contact floor ambient glow */}
            <ellipse cx={centerX} cy={centerY + 40} rx={pieRadiusX * 1.2} ry="45" fill="#000" filter="url(#pedestalGlow)" opacity="0.8" />
            
            {/* Lower core shadow base profile */}
            <ellipse cx={centerX} cy={centerY + 40} rx={pieRadiusX * 1.15} ry="40" fill="#111622" />
            <path d={`M ${centerX - pieRadiusX * 1.15},${centerY} A ${pieRadiusX * 1.15},40 0 0 0 ${centerX + pieRadiusX * 1.15},${centerY} L ${centerX + pieRadiusX * 1.15},${centerY + 40} A ${pieRadiusX * 1.15},40 0 0 1 ${centerX - pieRadiusX * 1.15},${centerY + 40} Z`} fill="#151b29" />
            <ellipse cx={centerX} cy={centerY} rx={pieRadiusX * 1.15} ry="40" fill="#20293a" stroke="#2e3d56" strokeWidth="1.5" />
          </g>

          {/* RENDER STAGE: CORE SLICE 3D CHASSIS ASSEMBLIES */}
          {slices.map((slice, index) => {
            const trueSweep = (slice.percentage / 100) * (Math.PI * 2);
            // Counter-clockwise sweep calculation interpolator rules
            const baseSweep = index === 0 ? Math.PI * 2 : 0;
            const currentSweep = interpolate(splitSpring, [0, 1], [baseSweep, trueSweep]);

            const startAngle = accumulatedAngle;
            const endAngle = startAngle - currentSweep; // Decrement angle to run counter-clockwise

            accumulatedAngle = endAngle;

            if (currentSweep <= 0.001) return null;

            // Mapping geometry points for front surface flats
            const sxTopX = centerX + Math.cos(startAngle) * pieRadiusX;
            const sxTopY = centerY + Math.sin(startAngle) * pieRadiusY;
            const exTopX = centerX + Math.cos(endAngle) * pieRadiusX;
            const exTopY = centerY + Math.sin(endAngle) * pieRadiusY;

            // Receding 3D edge offset vectors creating orthographic thickness depth
            const depthX = 0;
            const depthY = pieThickness;

            const sxBotX = sxTopX + depthX;
            const sxBotY = sxTopY + depthY;
            const exBotX = exTopX + depthX;
            const exBotY = exTopY + depthY;
            const centerBotX = centerX + depthX;
            const centerBotY = centerY + depthY;

            const largeArcFlag = currentSweep > Math.PI ? 1 : 0;

            // Generate Path Coordinates
            const frontFacePath = `M ${centerX},${centerY} L ${sxTopX},${sxTopY} A ${pieRadiusX},${pieRadiusY} 0 ${largeArcFlag} 0 ${exTopX},${exTopY} Z`;
            const outerRimPath = `M ${sxTopX},${sxTopY} A ${pieRadiusX},${pieRadiusY} 0 ${largeArcFlag} 0 ${exTopX},${exTopY} L ${exBotX},${exBotY} A ${pieRadiusX},${pieRadiusY} 0 ${largeArcFlag} 1 ${sxBotX},${sxBotY} Z`;
            const startCutPath = `M ${centerX},${centerY} L ${sxTopX},${sxTopY} L ${sxBotX},${sxBotY} L ${centerBotX},${centerBotY} Z`;
            const endCutPath = `M ${centerX},${centerY} L ${exTopX},${exTopY} L ${exBotX},${exBotY} L ${centerBotX},${centerBotY} Z`;

            // Text Typography placement vector mapping centers
            const textAngle = startAngle - currentSweep * 0.5;
            const textX = centerX + Math.cos(textAngle) * (pieRadiusX * 0.58);
            const textY = centerY + Math.sin(textAngle) * (pieRadiusY * 0.58) + 12;

            const labelAlpha = interpolate(splitSpring, [0.35, 0.9], [0, 1], { extrapolateLeft: 'clamp' });

            // Evaluate edge normal vectors to see if internal cuts face the isometric camera profile
            const isStartWallVisible = Math.sin(startAngle) > 0;
            const isEndWallVisible = Math.sin(endAngle) > 0;

            return (
              <g key={slice.key}>
                {/* 3D BLOCK PIECE ARCHITECTURE */}
                <g>
                  {/* Outer edge thickness skirt */}
                  <path d={outerRimPath} fill={slice.sideColor} />
                  
                  {/* Internal slice cuts */}
                  {isStartWallVisible && <path d={startCutPath} fill={slice.sideColor} opacity="0.6" />}
                  {isEndWallVisible && <path d={endCutPath} fill={slice.sideColor} opacity="0.4" />}
                  
                  {/* Clean flat top plate display */}
                  <path d={frontFacePath} fill={slice.baseColor} stroke={slice.sideColor} strokeWidth="0.7" />
                </g>

                {/* OVERLAID PERCENTAGE VALUE STRINGS */}
                {index === 0 && splitSpring < 0.15 ? (
                  <text x={centerX} y={centerY + 14} fill="#ffffff" fontSize="48" fontWeight="800" textAnchor="middle" filter="url(#textDropShadow)">
                    100%
                  </text>
                ) : (
                  <g opacity={labelAlpha}>
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="44"
                      fontWeight="700"
                      textAnchor="middle"
                      filter="url(#textDropShadow)"
                      // Reverse rotation matrix to prevent numerical text values from twisting sideways
                      transform={`rotate(-16, ${textX}, ${textY}) scale(1.0, 1.14)`}
                    >
                      {slice.percentage}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};