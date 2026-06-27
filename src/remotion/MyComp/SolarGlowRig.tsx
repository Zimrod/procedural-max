// src/remotion/MyComp/SolarGlowRig.tsx
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
  metricLabel?: string;
  glowColor?: string;       // The primary emissive glow color (e.g., bright electric cyan/green)
  basePanelColor?: string;  // Solid silicon backglass foundation color
};

export const SolarGlowRig: React.FC<Props> = ({
  title = "PHOTOMECHANICAL ENERGY INGRESS",
  metricLabel = "ACTIVE POWER HARVEST",
  glowColor = "#00ffcc",      // High-contrast electric cyan glow
  basePanelColor = "#0a111a", // Deep industrial dark blue-gray
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. TIMELINE STRUCTURAL ENTRANCE
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 90 },
  });

  // 2. KINETIC GLOW MATH
  // Creates a wave loop that cycles smoothly using a sine wave bound to the timeline frame
  const glowFrequency = (frame * 2 * Math.PI) / 45; // Complete peak cycle every 45 frames
  const baseGlowIntensity = Math.sin(glowFrequency);
  
  // Interpolates the raw sine wave (-1 to 1) safely into opacity/blur scales (0.25 to 1.0)
  const pulseOpacity = interpolate(baseGlowIntensity, [-1, 1], [0.25, 1.0]);
  const pulseBlurRadius = interpolate(baseGlowIntensity, [-1, 1], [4, 12]);

  // Generates a live counting metric for power generation matching the core glow intensity
  const activeKilowatts = interpolate(introSpring, [0, 1], [0, 480]) + (baseGlowIntensity * 12);

  // Layout parameters for the internal solar panel wafer grid cells
  const rows = 4;
  const cols = 5;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070a', fontFamily: 'Ubuntu, sans-serif', padding: 80, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* GLOW ENHANCEMENT DEFS LAYER */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Dynamic SVG Filter holding real-time bound blur radius parameters */}
          <filter id="photonicGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={pulseBlurRadius} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* LEFT PANEL: ENERGETIC VALUE COUNTER */}
      <div style={{
        position: 'absolute',
        left: 80,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 600,
        opacity: introSpring,
      }}>
        <span style={{ color: '#718096', fontSize: 16, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' }}>
          {metricLabel}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10, lineHeight: 1 }}>
          <span style={{ fontSize: 130, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
            {Math.max(0, Math.floor(activeKilowatts))}
          </span>
          <span style={{ fontSize: 44, fontWeight: 800, color: glowColor, marginLeft: 12, letterSpacing: 1 }}>
            kW/h
          </span>
        </div>

        <div style={{ width: '100%', height: 4, backgroundColor: '#141a24', marginTop: 35, position: 'relative', borderRadius: 2 }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${interpolate(pulseOpacity, [0.25, 1], [40, 100])}%`,
            backgroundColor: glowColor,
            boxShadow: `0 0 10px ${glowColor}`,
            transition: 'width 0.1s linear'
          }} />
        </div>
        
        <p style={{ color: '#4a5568', fontSize: 18, marginTop: 25, lineHeight: 1.6 }}>
          Monitoring quantum silicon surface excitation levels under direct high-flux radiance variables.
        </p>
      </div>

      {/* RIGHT PANEL: CORE EMISSIVE SOLAR GRID INDUSTRIAL PANEL */}
      <div style={{
        position: 'absolute',
        right: 80,
        top: '50%',
        transform: `translateY(-50%) scale(${interpolate(introSpring, [0, 1], [0.92, 1])})`,
        opacity: introSpring,
        width: 900,
        height: 720,
        backgroundColor: '#0d131c',
        borderRadius: 24,
        border: '2px solid #1a2332',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        padding: 45,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        {/* PANEL BRANDING FRAME HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2332', paddingBottom: 20 }}>
          <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: glowColor,
              opacity: pulseOpacity,
              boxShadow: `0 0 8px ${glowColor}`,
            }} />
            <span style={{ color: '#4a5568', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>EMISSIVE BUS ACTIVE</span>
          </div>
        </div>

        {/* PHYSICAL GRID MATRIX RECTANGLES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: 16,
          flexGrow: 1,
          marginTop: 25,
        }}>
          {Array.from({ length: rows * cols }).map((_, idx) => {
            // Generate distinct, alternating micro-staggering phases based on coordinates 
            // to make individual cells look organic rather than blinding uniformly
            const cellRow = Math.floor(idx / cols);
            const cellCol = idx % cols;
            const uniqueCellPhase = Math.sin((frame * 2 * Math.PI / 60) + (cellRow * 0.5) + (cellCol * 0.3));
            
            const cellGlowOpacity = interpolate(uniqueCellPhase, [-1, 1], [0.1, 0.95]);
            const isPeakGlow = cellGlowOpacity > 0.75;

            return (
              <div
                key={`cell-${idx}`}
                style={{
                  backgroundColor: basePanelColor,
                  borderRadius: 10,
                  border: `2px solid ${isPeakGlow ? glowColor : '#1a2332'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isPeakGlow ? `0 0 25px ${glowColor}33` : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* HIGH-INTENSITY SILICON EMISSIVE COATING OVERLAY */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: glowColor,
                  opacity: cellGlowOpacity * 0.22, // Keeps glow sophisticated instead of blowing out highlights
                  filter: isPeakGlow ? 'url(#photonicGlow)' : 'none',
                  transition: 'opacity 0.1s linear',
                }} />

                {/* INTERNAL METALLIC COLLECTOR RIBBON BUSBAR WIRES */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }}>
                  <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#ffffff" strokeWidth="2" />
                  <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Grid fingers horizontal layout */}
                  {Array.from({ length: 6 }).map((_, fIdx) => (
                    <line key={`f-${fIdx}`} x1="0" y1={`${fIdx * 20 + 10}%`} x2="100%" y2={`${fIdx * 20 + 10}%`} stroke="#ffffff" strokeWidth="0.5" />
                  ))}
                </svg>

                {/* CORNER PHOTOVOLTAIC CORNER DOT INDICATORS */}
                <div style={{
                  position: 'absolute',
                  width: 4,
                  height: 4,
                  backgroundColor: '#ffffff',
                  opacity: isPeakGlow ? 0.8 : 0.2,
                  borderRadius: '50%',
                  top: 8,
                  left: 8
                }} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};