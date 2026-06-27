// src/remotion/MyComp/SolarCapacityRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type Props = {
  targetCapacity?: number; // e.g., 100
  unit?: string;           // e.g., "MW"
  label?: string;          // e.g., "PROJECT SCALE"
  accentColor?: string;
  panelColor?: string;
  emptyPanelColor?: string;
};

export const SolarCapacityRig: React.FC<Props> = ({
  targetCapacity = 63,
  unit = "MW",
  label = "TOTAL SYSTEM CAPACITY",
  accentColor = "#ff7b00",
  panelColor = "#2a4365",
  emptyPanelColor = "#1a202c",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. TIMELINE DESIGN CONSTANTS (2 Seconds for Blinking Calibration)
  const introDelayFrames = fps * 2; 
  
  // 2. BLINKING FIRST PANEL CALCULATION (0 to 2 seconds)
  // Generates an on/off cycle every 15 frames for a clean beacon effect
  const isBlinkingPhase = frame < introDelayFrames;
  const isBlinkOn = Math.floor(frame / 15) % 2 === 0;

  // 3. MAIN RUNTIME SCALING COUNTER (Starts exactly after 2 seconds)
  const counterFrame = Math.max(0, frame - introDelayFrames);
  const counterSpring = spring({
    frame: counterFrame,
    fps,
    config: { damping: 20, mass: 1.1, stiffness: 65 },
  });
  
  // Calculate megawatts directly tied to the timeline progression
  const currentDisplayedCapacity = isBlinkingPhase 
    ? 0 
    : interpolate(counterSpring, [0, 1], [0, targetCapacity]);

  // 4. PRECISE CAPACITY RIG TO GRID MATCHING
  const totalGridItems = 100;
  const columns = 10;
  
  // Edge-case logic: If capacity climbs past 99MW, force illuminate all 100 panels
  let activePanelsCount = 0;
  if (!isBlinkingPhase) {
    if (currentDisplayedCapacity > 99) {
      activePanelsCount = totalGridItems;
    } else {
      activePanelsCount = Math.floor((currentDisplayedCapacity / targetCapacity) * totalGridItems);
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0d10', fontFamily: 'Ubuntu, sans-serif', padding: 60, boxSizing: 'border-box' }}>
      
      {/* LEFT PANEL: DATA DISPLAY COMPONENT */}
      <div style={{
        position: 'absolute',
        left: 100,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 600,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <span style={{
          color: '#a0aec0',
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        
        {/* TABULAR METRIC COUNTER */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          marginTop: 10,
          lineHeight: 1,
        }}>
          <span style={{
            fontSize: 160,
            fontWeight: 800,
            color: '#ffffff',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(currentDisplayedCapacity)}
          </span>
          <span style={{
            fontSize: 64,
            fontWeight: 700,
            color: accentColor,
            marginLeft: 15,
            letterSpacing: 1
          }}>
            {unit}
          </span>
        </div>

        {/* LOADING ANCHOR SLIDER TRACK */}
        <div style={{
          marginTop: 30,
          width: '100%',
          backgroundColor: '#1e2530',
          height: 6,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: isBlinkingPhase ? '0%' : `${(currentDisplayedCapacity / targetCapacity) * 100}%`,
            backgroundColor: accentColor,
          }} />
        </div>
        
        <p style={{ color: '#718096', fontSize: 20, marginTop: 20, lineHeight: 1.6, fontWeight: 400 }}>
          {isBlinkingPhase 
            ? "Calibrating target grid footprint arrays..." 
            : "Streaming real-time megawatt capacity variables across active collector matrices."}
        </p>
      </div>

      {/* RIGHT PANEL: STATIC GRID LAYOUT ENGINE */}
      <div style={{
        position: 'absolute',
        right: 100,
        top: '50%',
        transform: 'translateY(-50%',
        width: 800,
        height: 800,
        backgroundColor: '#11151d',
        borderRadius: 24,
        padding: 40,
        boxSizing: 'border-box',
        border: '2px solid #1e2530',
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 12,
      }}>
        {Array.from({ length: totalGridItems }).map((_, idx) => {
          const isFirstPanel = idx === 0;
          
          // Determine active status: True if index sits inside the exact calculated capacity threshold
          // Or if it is the first panel mimicking a beacon signal during the introductory phase
          const isActive = (isFirstPanel && isBlinkingPhase && isBlinkOn) || (!isBlinkingPhase && idx < activePanelsCount);

          return (
            <div
              key={`panel-${idx}`}
              style={{
                borderRadius: 6,
                // Layout background swaps state dynamically while keeping an established frame footprint
                backgroundColor: isActive ? panelColor : emptyPanelColor,
                border: isActive 
                  ? `2px solid ${accentColor}` 
                  : '2px solid rgba(255,255,255,0.03)',
                boxShadow: isActive 
                  ? `0 0 15px ${accentColor}44, inset 0 0 10px rgba(255,255,255,0.1)` 
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.1s ease-out, border-color 0.1s ease-out, box-shadow 0.1s ease-out',
              }}
            >
              {/* Internal Silicon Solar Textures */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.25,
                  background: `
                    linear-gradient(90deg, transparent 45%, #fff 50%, transparent 55%),
                    linear-gradient(0deg, transparent 45%, #fff 50%, transparent 55%)
                  `,
                  backgroundSize: '33% 33%'
                }} />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};