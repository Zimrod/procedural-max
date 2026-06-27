// src/remotion/MyComp/WindTurbinesRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type TurbineProps = {
  xPos: number;         // Horizontal anchor position on the canvas
  yBaseline: number;    // Vertical ground level anchor
  scale: number;        // Scaling factor for depth perspective
  spinSpeed: number;    // Degrees of rotation per frame
  introDelay: number;   // Frame stagger delay for assembly
  accentColor: string;
};

// Internal reusable component for an individual wind turbine
const WindTurbine: React.FC<TurbineProps> = ({
  xPos,
  yBaseline,
  scale,
  spinSpeed,
  introDelay,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Structural entrance spring (tower growing from ground baseline)
  const towerSpring = spring({
    frame: Math.max(0, frame - introDelay),
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 70 },
  });

  // 2. Blade rotation angle calculation based on frame progression
  const currentRotation = frame * spinSpeed;

  // Geometry dimensions scaled by perspective factor
  const towerHeight = 320 * scale;
  const rotorRadius = 110 * scale;

  // Center coordinate of the rotor hub engine base
  const hubX = xPos;
  const hubY = yBaseline - towerHeight;

  return (
    <g style={{ opacity: towerSpring }}>
      {/* TURBINE VERTICAL TAPERED TOWER STRUCTURE */}
      <polygon
        points={`
          ${xPos - 12 * scale},${yBaseline} 
          ${xPos + 12 * scale},${yBaseline} 
          ${xPos + 5 * scale},${hubY} 
          ${xPos - 5 * scale},${hubY}
        `}
        fill="#1e2530"
        stroke="#2d3748"
        strokeWidth={2 * scale}
        style={{
          transformOrigin: `${xPos}px ${yBaseline}px`,
          transform: `scaleY(${towerSpring})`,
        }}
      />

      {/* ROTOR HUB BACKGLASS NACELLE HOUSING */}
      <rect
        x={hubX - 14 * scale}
        y={hubY - 14 * scale}
        width={34 * scale}
        height={24 * scale}
        rx={6 * scale}
        fill="#2d3748"
        stroke="#4a5568"
        strokeWidth={1.5 * scale}
      />

      {/* THREE-BLADE ROTATING ROTOR ASSEMBLY */}
      {/* Pivots around center coordinates (hubX, hubY) */}
      <g transform={`rotate(${currentRotation}, ${hubX}, ${hubY})`}>
        {/* Blade 1 (Pointing strictly vertical up at 0 deg baseline) */}
        <path
          d={`M ${hubX - 4 * scale},${hubY} Q ${hubX},${hubY - rotorRadius} ${hubX},${hubY - rotorRadius} Q ${hubX + 4 * scale},${hubY} ${hubX},${hubY}`}
          fill="#ffffff"
          opacity="0.9"
          stroke="#e2e8f0"
          strokeWidth={0.5 * scale}
        />
        
        {/* Blade 2 (Rotated 120 degrees offset) */}
        <g transform={`rotate(120, ${hubX}, ${hubY})`}>
          <path
            d={`M ${hubX - 4 * scale},${hubY} Q ${hubX},${hubY - rotorRadius} ${hubX},${hubY - rotorRadius} Q ${hubX + 4 * scale},${hubY} ${hubX},${hubY}`}
            fill="#ffffff"
            opacity="0.9"
            stroke="#e2e8f0"
            strokeWidth={0.5 * scale}
          />
        </g>

        {/* Blade 3 (Rotated 240 degrees offset) */}
        <g transform={`rotate(240, ${hubX}, ${hubY})`}>
          <path
            d={`M ${hubX - 4 * scale},${hubY} Q ${hubX},${hubY - rotorRadius} ${hubX},${hubY - rotorRadius} Q ${hubX + 4 * scale},${hubY} ${hubX},${hubY}`}
            fill="#ffffff"
            opacity="0.9"
            stroke="#e2e8f0"
            strokeWidth={0.5 * scale}
          />
        </g>

        {/* FRONT RETAINING HUB CAP NOSE CONE */}
        <circle cx={hubX} cy={hubY} r={10 * scale} fill={accentColor} />
        <circle cx={hubX} cy={hubY} r={4 * scale} fill="#ffffff" />
      </g>
    </g>
  );
};

type MainProps = {
  accentColor?: string;
};

export const WindTurbinesRig: React.FC<MainProps> = ({
  accentColor = "#48bb78", // Light Green theme identifier
}) => {
  const frame = useCurrentFrame();

  // Baseline floor coordinate matching landscape design parameters
  const groundLevelY = 800;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0d10', padding: 60, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* FULLSCREEN VECTOR COMPONENT STAGE */}
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* BACKGROUND TOPOLOGICAL POWER FEED HORIZON DASH LINES */}
        <g opacity="0.08">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`grid-${i}`} x1="0" y1={i * 90} x2="1920" y2={i * 90} stroke="#ffffff" strokeWidth="1" />
          ))}
        </g>

        {/* STRUCTURAL HORIZON LANDSCAPE PLATES */}
        <path
          d={`M 0,${groundLevelY} Q 480,${groundLevelY - 30} 960,${groundLevelY} T 1920,${groundLevelY} L 1920,1080 L 0,1080 Z`}
          fill="#0d131c"
          stroke="#1a2332"
          strokeWidth="3"
        />

        {/* TURBINE 01: LEFT DEPTH PERSPECTIVE (Smaller Background Layer) */}
        <WindTurbine
          xPos={450}
          yBaseline={groundLevelY - 15}
          scale={0.75}
          spinSpeed={1.8}     // Marginally slower rotation mimicking perspective inertia
          introDelay={12}     // Staggered entry timing gate
          accentColor={accentColor}
        />

        {/* TURBINE 02: RIGHT MIDDLE LAYER */}
        <WindTurbine
          xPos={1450}
          yBaseline={groundLevelY - 5}
          scale={0.85}
          spinSpeed={2.2}
          introDelay={24}
          accentColor={accentColor}
        />

        {/* TURBINE 03: FOREGROUND FOCUS ANCHOR (Largest Center Element) */}
        <WindTurbine
          xPos={960}
          yBaseline={groundLevelY + 10}
          scale={1.1}
          spinSpeed={2.6}     // Snappier angular velocity for foreground emphasis
          introDelay={0}      // Mounts instantly on frame 0
          accentColor={accentColor}
        />

        {/* SUBSTATION INTERFACE CONNECTIONS GROUND SYSTEM */}
        <g opacity={interpolate(frame, [20, 40], [0, 0.4], { extrapolateLeft: 'clamp' })}>
          {/* Substation collection path footprints bridging the pillars */}
          <path d="M 450,785 L 960,810 L 1450,795" fill="none" stroke={accentColor} strokeWidth="2" strokeDasharray="6 6" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};