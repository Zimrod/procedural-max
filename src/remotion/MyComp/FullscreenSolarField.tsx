// src/remotion/MyComp/FullscreenSolarField.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type Props = {
  glowColor?: string;        // The primary emissive glow color (Light Green)
  basePanelColor?: string;   // Deep industrial silicon foundation color
  gridRows?: number;         // Vertical density
  gridCols?: number;         // Horizontal density
};

export const FullscreenSolarField: React.FC<Props> = ({
  glowColor = "#48bb78",       // Light Green requested for your solar rigs
  basePanelColor = "#0a111a",  // Solid dark silicon backing
  gridRows = 8,                // High density row structure
  gridCols = 10,               // High density column structure
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. MASTER TIMELINE ENTRANCE
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9, stiffness: 60 },
  });

  // 2. CYCLIC WAVE GLOW MATH
  // Dictates the global timing frequency of the power surge ripple
  const waveSpeed = 0.08; 
  const spatialStagger = 0.4; // Controls the tightness of the diagonal wave gradient

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070a', padding: 40, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* HARDWARE-ACCELERATED GLOW FILTRATION DEFS */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="fieldPhotonicGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* FULLSCREEN INDUSTRIAL CANVAS INSULATION MATRIX */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0d131c',
        borderRadius: 20,
        border: '2px solid #1a2332',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 30px 70px rgba(0,0,0,0.6)',
        padding: 24,
        boxSizing: 'border-box',
        transform: `scale(${interpolate(introSpring, [0, 1], [0.96, 1])})`,
        opacity: introSpring,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        gap: 12,
      }}>
        {Array.from({ length: gridRows * gridCols }).map((_, idx) => {
          // Identify 2D spatial coordinates for directional wave calculation
          const row = Math.floor(idx / gridCols);
          const col = idx % gridCols;

          // Trigonometric wave offset pulling from top-left (0,0) down to bottom-right
          const wavePhase = (frame * waveSpeed) - ((row + col) * spatialStagger);
          const rawGlowVal = Math.sin(wavePhase);

          // Map the raw sine output smoothly to opacity fields
          const cellGlowOpacity = interpolate(rawGlowVal, [-1, 1], [0.05, 0.85]);
          const isHighEnergy = cellGlowOpacity > 0.65;

          return (
            <div
              key={`field-cell-${idx}`}
              style={{
                backgroundColor: basePanelColor,
                borderRadius: 6,
                border: `1px solid ${isHighEnergy ? glowColor : '#1a2332'}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isHighEnergy ? `0 0 18px ${glowColor}25` : 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* PHOTONIC SURFACE GLOW OVERLAY */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: glowColor,
                opacity: cellGlowOpacity * 0.3, // Sophisticated, non-blinding intensity balancing
                filter: isHighEnergy ? 'url(#fieldPhotonicGlow)' : 'none',
                transition: 'opacity 0.08s linear',
              }} />

              {/* WAFER ELECTRICAL BUSBAR SYSTEM LINES */}
              <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.12 }}>
                {/* Vertical ultra-thin collector ribbons */}
                <line x1="33%" y1="0" x2="33%" y2="100%" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="66%" y1="0" x2="66%" y2="100%" stroke="#ffffff" strokeWidth="1.5" />
                
                {/* Horizontal mesh grid lines */}
                {Array.from({ length: 4 }).map((_, fIdx) => (
                  <line 
                    key={`mesh-${fIdx}`} 
                    x1="0" 
                    y1={`${fIdx * 25 + 12.5}%`} 
                    x2="100%" 
                    y2={`${fIdx * 25 + 12.5}%`} 
                    stroke="#ffffff" 
                    strokeWidth="0.5" 
                  />
                ))}
              </svg>

              {/* HARDWARE ANCHOR CORNER LEDS */}
              <div style={{
                position: 'absolute',
                width: 3,
                height: 3,
                backgroundColor: '#ffffff',
                opacity: isHighEnergy ? 0.7 : 0.15,
                borderRadius: '50%',
                top: 6,
                left: 6,
                transition: 'opacity 0.15s ease'
              }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};