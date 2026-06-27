// src/remotion/MyComp/ElectricGridPerspectiveWhite.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type PylonProps = {
  scale: number;        // Spatial perspective scale (1.0 = foreground, 0.4 = background)
  xAnchor: number;      // Horizontal positioning on canvas
  yBaseline: number;    // Ground seating point coordinate
  introDelay: number;   // Staggered assembly timing fence
  accentColor: string;  // Primary dark surge color
};

// Internal reusable structural asset for a transmission pylon girder tower
const ElectricityPylon: React.FC<PylonProps> = ({
  scale,
  xAnchor,
  yBaseline,
  introDelay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Vertical assembly growth spring
  const towerSpring = spring({
    frame: Math.max(0, frame - introDelay),
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 65 },
  });

  // Dimension scaling matrices
  const h = 480 * scale;
  const w = 140 * scale;
  const topY = yBaseline - h;

  return (
    <g opacity={towerSpring} style={{ transformOrigin: `${xAnchor}px ${yBaseline}px`, transform: `scaleY(${towerSpring})` }}>
      {/* MAIN CHASSIS SUPPORT LEGS */}
      <line x1={xAnchor - w/2} y1={yBaseline} x2={xAnchor - w/6} y2={topY} stroke="#1a202c" strokeWidth={4 * scale} />
      <line x1={xAnchor + w/2} y1={yBaseline} x2={xAnchor + w/6} y2={topY} stroke="#1a202c" strokeWidth={4 * scale} />

      {/* INTERNAL TRUSS LATTICE GIRDER BRACING MAPS */}
      <line x1={xAnchor - w/3} y1={yBaseline - h*0.3} x2={xAnchor + w/3} y2={yBaseline - h*0.3} stroke="#2d3748" strokeWidth={2 * scale} />
      <line x1={xAnchor - w/4} y1={yBaseline - h*0.6} x2={xAnchor + w/4} y2={yBaseline - h*0.6} stroke="#2d3748" strokeWidth={2 * scale} />
      <line x1={xAnchor - w/5} y1={yBaseline - h*0.8} x2={xAnchor + w/5} y2={yBaseline - h*0.8} stroke="#2d3748" strokeWidth={2 * scale} />
      
      {/* Diagonal X-Bracing Lattice */}
      <line x1={xAnchor - w/2} y1={yBaseline} x2={xAnchor + w/3} y2={yBaseline - h*0.3} stroke="#4a5568" strokeWidth={1.5 * scale} />
      <line x1={xAnchor + w/2} y1={yBaseline} x2={xAnchor - w/3} y2={yBaseline - h*0.3} stroke="#4a5568" strokeWidth={1.5 * scale} />
      <line x1={xAnchor - w/3} y1={yBaseline - h*0.3} x2={xAnchor + w/4} y2={yBaseline - h*0.6} stroke="#4a5568" strokeWidth={1.5 * scale} />
      <line x1={xAnchor + w/3} y1={yBaseline - h*0.3} x2={xAnchor - w/4} y2={yBaseline - h*0.6} stroke="#4a5568" strokeWidth={1.5 * scale} />

      {/* THREE HIGH-VOLTAGE TRANSMISSION CROSSARMS (Wire Anchors - Resided Left) */}
      {/* Upper Crossarm */}
      <line x1={xAnchor - w*0.8} y1={topY + h*0.15} x2={xAnchor + w*0.8} y2={topY + h*0.15} stroke="#1a202c" strokeWidth={3 * scale} />
      {/* Middle Crossarm */}
      <line x1={xAnchor - w} y1={topY + h*0.35} x2={xAnchor + w} y2={topY + h*0.35} stroke="#1a202c" strokeWidth={3 * scale} />
      {/* Lower Crossarm */}
      <line x1={xAnchor - w*0.7} y1={topY + h*0.55} x2={xAnchor + w*0.7} y2={topY + h*0.55} stroke="#1a202c" strokeWidth={3 * scale} />

      {/* CORE TOP TERMINAL SPOOL HUB */}
      <circle cx={xAnchor} cy={topY} r={6 * scale} fill="#4a5568" />
    </g>
  );
};

export const ElectricGridPerspectiveWhite: React.FC<{ accentColor?: string }> = ({
  accentColor = "#1a365d", // Signature Deep Dark Blue/Indigo surge hue
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Master timeline entry tracking
  const globalIntro = spring({ frame, fps, config: { damping: 20, stiffness: 60 } });

  // Continuous loop calculation for electric charge surge (60 frames full cycle speed)
  const chargeCycle = 60;
  const currentSurgeProgress = (frame % chargeCycle) / chargeCycle;

  // SPATIAL PERSPECTIVE HOOK COORDINATE MAPS (Expanded Array: 6 Towers)
  const groundY = 880;
  
  const pylons = [
    { x: 1600, y: groundY,        s: 1.0,  delay: 0 },   // P1: Foreground Right
    { x: 1140, y: groundY - 55,   s: 0.74, delay: 10 },  // P2: Midground Right
    { x: 800,  y: groundY - 100,  s: 0.55, delay: 20 },  // P3: Center Right
    { x: 540,  y: groundY - 135,  s: 0.41, delay: 30 },  // P4: Center Left
    { x: 350,  y: groundY - 160,  s: 0.30, delay: 40 },  // P5: Midground Left
    { x: 200,  y: groundY - 180,  s: 0.22, delay: 50 },  // P6: Far Background Left
  ];

  // Dynamic calculations generating explicit transmission arm connection nodes
  const getWireNode = (p: typeof pylons[0], armIndex: number) => {
    const h = 480 * p.s;
    const w = 140 * p.s;
    const topY = p.y - h;
    
    const offsets = [
      { dx: -w * 0.8, dy: h * 0.15 },
      { dx: -w * 1.0, dy: h * 0.35 },
      { dx: -w * 0.7, dy: h * 0.55 }
    ];
    
    return {
      x: p.x + offsets[armIndex].dx,
      y: topY + offsets[armIndex].dy
    };
  };

  // Generates curved pathing vector configurations mapping natural gravity catenary line sag
  const createCatenaryPath = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const midX = (start.x + end.x) / 2;
    const sagFactor = Math.abs(start.x - end.x) * 0.12;
    const midY = Math.max(start.y, end.y) + sagFactor;
    return `M ${start.x},${start.y} Q ${midX},${midY} ${end.x},${end.y}`;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#f7fafc', overflow: 'hidden' }}>
      
      {/* TRANSMISSION GLOW DEF STATIONS - Optimized for white/light screens */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="coronaDischarge" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.6" /> {/* Mutes glow density slightly so it doesn't wash out */}
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* MASTER GRAPHICS INFRASTRUCTURE VIEWBOX */}
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* TECH REVENUE GRID OVERLAYS - High contrast subtle rules */}
        <g opacity="0.06">
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`v-grid-${i}`} x1={i * 140} y1="0" x2={i * 140} y2="1080" stroke="#718096" strokeWidth="1" />
          ))}
        </g>

        {/* TOPOGRAPHY PERSPECTIVE HORIZON MASK */}
        <path
          d={`M 0,${groundY - 210} Q 960,${groundY - 120} 1920,${groundY - 30} L 1920,1080 L 0,1080 Z`}
          fill="#edf2f7"
          stroke="#cbd5e0"
          strokeWidth="3"
        />

        {/* RENDER PHASE 1: INDIVIDUAL CHASSIS STRUCTURAL TOWERS */}
        {[5, 4, 3, 2, 1, 0].map((idx) => (
          <ElectricityPylon 
            key={`pylon-${idx}`}
            scale={pylons[idx].s} 
            xAnchor={pylons[idx].x} 
            yBaseline={pylons[idx].y} 
            introDelay={pylons[idx].delay} 
            accentColor={accentColor} 
          />
        ))}

        {/* RENDER PHASE 2: CONTINUOUS HIGH-VOLTAGE POWER CORE BUSBAR TRANSMISSION LINES */}
        {globalIntro > 0.4 && [0, 1, 2].map((armIdx) => {
          const n1 = getWireNode(pylons[0], armIdx);
          const n2 = getWireNode(pylons[1], armIdx);
          const n3 = getWireNode(pylons[2], armIdx);
          const n4 = getWireNode(pylons[3], armIdx);
          const n5 = getWireNode(pylons[4], armIdx);
          const n6 = getWireNode(pylons[5], armIdx);

          const leftEdgeNode = { x: -150, y: n6.y + (n6.y - n5.y) * 1.1 };
          const rightEdgeNode = { x: 2100, y: n1.y - (n2.y - n1.y) * 0.85 };

          const spans = [
            createCatenaryPath(leftEdgeNode, n6),
            createCatenaryPath(n6, n5),
            createCatenaryPath(n5, n4),
            createCatenaryPath(n4, n3),
            createCatenaryPath(n3, n2),
            createCatenaryPath(n2, n1),
            createCatenaryPath(n1, rightEdgeNode),
          ];

          return (
            <g key={`grid-circuit-${armIdx}`} opacity={globalIntro}>
              {/* Render physical wire path elements across the system array segments */}
              {spans.map((spanPath, sIdx) => {
                const reverseIndex = 6 - sIdx;
                const activeScale = pylons[Math.min(5, Math.max(0, reverseIndex))].s;
                
                return (
                  <path 
                    key={`wire-span-${sIdx}`}
                    d={spanPath} 
                    fill="none" 
                    stroke={sIdx === 0 ? "#718096" : "#2d3748"} 
                    strokeWidth={(4 - armIdx * 0.5) * activeScale} 
                    strokeLinecap="round"
                  />
                );
              })}

              {/* SURGING HIGH-INTENSITY CHARGE PARTICLES */}
              <g filter="url(#coronaDischarge)">
                {spans.map((spanPath, sIdx) => {
                  const currentPos = (currentSurgeProgress + (sIdx * 0.15)) % 1;
                  
                  const reverseIndex = 6 - sIdx;
                  const activeScale = pylons[Math.min(5, Math.max(0, reverseIndex))].s;
                  const radius = (5 - armIdx * 0.5) * activeScale;

                  return (
                    <circle 
                      key={`electron-span-${sIdx}`}
                      r={Math.max(1.5, radius)} 
                      fill="#2b6cb0" /* Core bright electric blue pulse to bounce off the white canvas */
                      stroke={accentColor} /* Deep indigo boundary perimeter edge */
                      strokeWidth={1.5 * activeScale}
                    >
                      <animateMotion
                        dur={`${chargeCycle / fps}s`}
                        repeatCount="indefinite"
                        path={spanPath}
                        keyPoints={`${currentPos};${Math.min(1, currentPos + 0.01)}`}
                        keyTimes="0;1"
                      />
                    </circle>
                  );
                })}
              </g>
            </g>
          );
        })}

        {/* GRID SPECIFICATIONS OVERLAY META TEXT */}
        <text x="1850" y="1020" fill="#718096" fontSize="14" fontWeight="700" textAnchor="end" letterSpacing="4">
          HIGH-VOLTAGE TRANSMISSION SCHEMATIC // TR-09
        </text>
      </svg>
    </AbsoluteFill>
  );
};