// src/remotion/MyComp/BankRolesInfographic.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type RoleNode = {
  id: string;
  label: string;
  subtext: string;
  x: number; // Offset from center
  y: number; // Offset from center
};

type Props = {
  title?: string;
  bankLabel?: string;
  accentColor?: string;
  nodeBgColor?: string;
  textColor?: string;
  lineColor?: string;
};

export const BankRolesInfographic: React.FC<Props> = ({
  title = "MULTIFACETED BANK ROLES IN SOLAR FINANCE",
  bankLabel = "COMMERCIAL BANK HUB",
  accentColor = "#ff7b00",
  nodeBgColor = "#1e2530",
  textColor = "#ffffff",
  lineColor = "#3a4454",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Define explicit 2D spatial nodes for the spokes surrounding the central hub
  const roles: RoleNode[] = [
    { id: 'structuring', label: 'Loan Structuring', subtext: 'Debt Engineering', x: -380, y: -180 },
    { id: 'escrow', label: 'Escrow Accounts', subtext: 'Cash Waterfall Control', x: 380, y: -180 },
    { id: 'fx', label: 'FX Conversion', subtext: 'Foreign Equity Gates', x: -380, y: 180 },
    { id: 'epc', label: 'EPC Mobilization', subtext: 'Contractor Credit Lines', x: 380, y: 180 },
  ];

  // Base canvas resolution settings
  const cx = 1920 / 2;
  const cy = 1080 / 2 + 50; // slightly offset downwards to clear title space

  // 1. Central Hub Entrance Animation Physics
  const hubSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 100 },
    delay: 0,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0d10', fontFamily: 'Ubuntu, sans-serif', overflow: 'hidden' }}>
      
      {/* HEADER SECTION */}
      {/* HEADER SECTION - REVEAL FROM LEFT TO RIGHT */}
      <div style={{
        position: 'absolute',
        top: 80,
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{ 
          color: textColor, 
          fontSize: 44, 
          margin: 0, 
          letterSpacing: 3, 
          fontWeight: 700,
          // Animates a clipping mask from left (0%) to right (100%) over the first 20 frames
          clipPath: `polygon(0% 0%, ${interpolate(frame, [0, 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}% 0%, ${interpolate(frame, [0, 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}% 100%, 0% 100%)`
        }}>
          {title}
        </h1>
        <div style={{ 
          width: 120, 
          height: 5, 
          backgroundColor: accentColor, 
          margin: '20px auto 0 auto', 
          borderRadius: 2,
          // Staggers the accent line's left-to-right expansion slightly behind the text
          transformOrigin: 'left',
          transform: `scaleX(${interpolate(frame, [5, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`
        }} />
      </div>

      {/* SVG NETWORK CONNECTIONS LAYER */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {roles.map((role, idx) => {
          // Stagger each connection line entrance by 8 frames consecutively
          const lineSpring = spring({
            frame,
            fps,
            config: { damping: 15, mass: 0.5, stiffness: 90 },
            delay: 10 + idx * 8,
          });

          // Calculate current animated tip positions of the vector lines out from the hub center
          const targetX = cx + (role.x * lineSpring);
          const targetY = cy + (role.y * lineSpring);

          return (
            <g key={`line-${role.id}`}>
              {/* Underlying Track Path */}
              <line
                x1={cx}
                y1={cy}
                x2={targetX}
                y2={targetY}
                stroke={lineColor}
                strokeWidth={4}
                strokeDasharray="8 6"
              />
              {/* Dynamic Overlay Glowing Pulse Line */}
              {lineSpring > 0.1 && (
                <line
                  x1={cx}
                  y1={cy}
                  x2={targetX}
                  y2={targetY}
                  stroke={accentColor}
                  strokeWidth={4}
                  opacity={interpolate(lineSpring, [0, 1], [0, 0.6])}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* NODE COMPONENT OBJECTS LAYER */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2 }}>
        
        {/* CENTRAL BANK HUB */}
        <div style={{
          position: 'absolute',
          left: cx - 160,
          top: cy - 80,
          width: 320,
          height: 160,
          backgroundColor: accentColor,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(255, 123, 0, 0.25)',
          transform: `scale(${hubSpring})`,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.6)', letterSpacing: 2 }}>CORE ENGINE</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#000000', marginTop: 4, textAlign: 'center', padding: '0 10px' }}>
            {bankLabel}
          </span>
        </div>

        {/* OUTLYING SPOKE ROLE NODES */}
        {roles.map((role, idx) => {
          // Stagger the node appearances to align exactly with the tip of their completing lines
          const nodeSpring = spring({
            frame,
            fps,
            config: { damping: 12, mass: 0.7, stiffness: 110 },
            delay: 18 + idx * 8,
          });

          return (
            <div
              key={`node-${role.id}`}
              style={{
                position: 'absolute',
                left: cx + role.x - 190, // Center alignment offset (width / 2)
                top: cy + role.y - 55,  // Center alignment offset (height / 2)
                width: 380,
                height: 110,
                backgroundColor: nodeBgColor,
                borderRadius: 12,
                border: `2px solid ${lineColor}`,
                boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transform: `scale(${nodeSpring})`,
                opacity: nodeSpring,
              }}
            >
              {/* Label Title */}
              <span style={{
                color: textColor,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}>
                {role.label}
              </span>
              
              {/* Domain Subtext */}
              <span style={{
                color: accentColor,
                fontSize: 15,
                fontWeight: 600,
                marginTop: 6,
                letterSpacing: 1,
                textTransform: 'uppercase',
                opacity: 0.9
              }}>
                {role.subtext}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};