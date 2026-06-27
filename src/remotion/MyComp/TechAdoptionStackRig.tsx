// src/remotion/MyComp/TechAdoptionStackRig.tsx
'use client';

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export type TechAdoptionProps = {
  title?: string;
  evLabel?: string;
  evMetric?: string;
  bessLabel?: string;
  bessMetric?: string;
  backgroundColor?: string;
  accentCyan?: string;
  accentGreen?: string;
  panelBgColor?: string;
};

export const TechAdoptionStackRig: React.FC<TechAdoptionProps> = ({
  title = "TECHNOLOGY ADOPTION MATRIX: MULTI-CHANNEL SCALING",
  evLabel = "EV ADOPTION VELOCITY",
  evMetric = "+42% YOY GROWTH",
  bessLabel = "GRID-SCALE STORAGE CAPACITY",
  bessMetric = "84.2 GWh ACTIVE DEPLOYED",
  backgroundColor = "#020617",
  accentCyan = "#06b6d4",
  accentGreen = "#10b981",
  panelBgColor = "#0b1329",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // General Entry Spring Transitions
  const baseEntrance = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 55 },
  });

  // Independent staggered asset animation gates
  const fillProgress = interpolate(frame, [15, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const livePercent = Math.round(interpolate(fillProgress, [0, 1], [0, 84]));
  
  // Grid battery configuration array matching architectural stack heights
  const totalBatteryTiers = 8;
  const targetLitTiers = Math.round(interpolate(fillProgress, [0, 1], [0, 7]));

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily: 'Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* Cybernetic HUD Network Grid Layout */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 * baseEntrance }}>
        <defs>
          <pattern id="hudGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" stroke="#334155" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hudGridPattern)" />
      </svg>

      {/* DASHBOARD CONTAINER SYSTEM */}
      <AbsoluteFill style={{ padding: '80px 100px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Upper Telemetry Heading Row */}
        <div style={{ opacity: baseEntrance, transform: `translateY(${interpolate(baseEntrance, [0, 1], [-25, 0])}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: accentCyan, borderRadius: '2px' }} />
            <span style={{ color: '#475569', fontSize: '15px', fontWeight: 700, letterSpacing: '4px' }}>
              SECTOR ANALYSIS ENGINE
            </span>
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: '40px', fontWeight: 900, marginTop: '6px', letterSpacing: '-1px' }}>
            {title}
          </h1>
        </div>

        {/* DUAL TERMINAL DASHBOARD PANEL LAYOUT */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '70px', 
          height: '640px',
          gap: '50px' 
        }}>
          
          {/* PANEL LEFT: EV Electrification Silhouette Monitor */}
          <div style={{
            flex: 1,
            backgroundColor: panelBgColor,
            borderRadius: '16px',
            border: `1px solid #1e293b`,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            opacity: baseEntrance,
            transform: `translateX(${interpolate(baseEntrance, [0, 1], [-40, 0])}px)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>{evLabel}</span>
                <span style={{ color: accentCyan, fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '4px' }}>LIVE TELEMETRY</span>
              </div>
              <h2 style={{ color: '#f1f5f9', fontSize: '32px', fontWeight: 800, marginTop: '10px', margin: '10px 0 0 0' }}>{evMetric}</h2>
            </div>

            {/* EV Vector Centerpiece Display */}
            <div style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="420" height="160" viewBox="0 0 420 160" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="evFillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(6,182,212,0.05)" />
                    <stop offset={`${fillProgress}`} stopColor="rgba(6,182,212,0.25)" />
                    <stop offset={`${fillProgress}`} stopColor="transparent" />
                  </linearGradient>
                </defs>
                {/* Minimalist EV Car Silhouette Outlines */}
                <path 
                  d="M 20,110 L 60,110 Q 75,75 110,75 L 140,75 Q 180,30 240,30 L 320,30 Q 380,35 400,85 L 410,110 L 370,110 Q 360,85 330,85 Q 300,85 290,110 L 150,110 Q 140,85 110,85 Q 80,85 70,110 Z" 
                  fill="url(#evFillGradient)" 
                  stroke={accentCyan} 
                  strokeWidth="3" 
                  strokeLinejoin="round"
                  style={{ opacity: 0.8 }}
                />
                {/* Active Hub-Chassis Lighting Pulse Rings */}
                <circle cx="110" cy="110" r="24" fill="#020617" stroke="#1e293b" strokeWidth="4" />
                <circle cx="110" cy="110" r="10" fill="none" stroke={accentCyan} strokeWidth="2" style={{ opacity: fillProgress }} />
                
                <circle cx="330" cy="110" r="24" fill="#020617" stroke="#1e293b" strokeWidth="4" />
                <circle cx="330" cy="110" r="10" fill="none" stroke={accentCyan} strokeWidth="2" style={{ opacity: fillProgress }} />
              </svg>
            </div>

            {/* Metrics Percentage Loadbar Assembly */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'baseline' }}>
                <span style={{ color: '#475569', fontSize: '14px', fontWeight: 700 }}>INFRASTRUCTURE PENETRATION</span>
                <span style={{ color: accentCyan, fontSize: '38px', fontWeight: 900, fontFamily: 'monospace' }}>{livePercent}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden', padding: '2px' }}>
                <div style={{ width: `${livePercent}%`, height: '100%', backgroundColor: accentCyan, borderRadius: '4px', transition: 'width 0.1s linear', boxShadow: `0 0 12px ${accentCyan}` }} />
              </div>
            </div>
          </div>

          {/* PANEL RIGHT: Stationary BESS Grid Battery Bank Matrix */}
          <div style={{
            flex: 1,
            backgroundColor: panelBgColor,
            borderRadius: '16px',
            border: `1px solid #1e293b`,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            opacity: baseEntrance,
            transform: `translateX(${interpolate(baseEntrance, [0, 1], [40, 0])}px)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>{bessLabel}</span>
                <span style={{ color: accentGreen, fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '4px' }}>SYS ENERGY FLOW</span>
              </div>
              <h2 style={{ color: '#f1f5f9', fontSize: '32px', fontWeight: 800, marginTop: '10px', margin: '10px 0 0 0' }}>{bessMetric}</h2>
            </div>

            {/* Step-Segment Stack Battery Grid */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column-reverse', 
              gap: '10px', 
              width: '100%', 
              maxHeight: '260px', 
              alignItems: 'center',
              margin: '20px 0' 
            }}>
              {Array.from({ length: totalBatteryTiers }).map((_, idx) => {
                const isLit = idx <= targetLitTiers;
                return (
                  <div 
                    key={`bess-tier-${idx}`}
                    style={{
                      width: '80%',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: isLit ? accentGreen : '#111827',
                      border: `1px solid ${isLit ? accentGreen : '#1e293b'}`,
                      boxShadow: isLit ? `0 0 15px ${accentGreen}aa` : 'none',
                      opacity: isLit ? 1 : 0.3,
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 15px'
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: isLit ? '#020617' : '#475569', fontFamily: 'monospace' }}>
                      TIER MODULE 0{idx + 1}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: isLit ? '#020617' : '#475569', fontFamily: 'monospace' }}>
                      {isLit ? 'ONLINE' : 'STBY'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Telemetry Metadata footer tags */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, backgroundColor: '#090f1e', padding: '15px', borderRadius: '8px', border: '1px solid #172554' }}>
                <span style={{ color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', display: 'block' }}>STORAGE TOPOLOGY</span>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 700, marginTop: '4px', display: 'block' }}>LFP CELL BANKS</span>
              </div>
              <div style={{ flex: 1, backgroundColor: '#090f1e', padding: '15px', borderRadius: '8px', border: '1px solid #172554' }}>
                <span style={{ color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', display: 'block' }}>DISCHARGE DURATION</span>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 700, marginTop: '4px', display: 'block' }}>4-HOUR STANDARD</span>
              </div>
            </div>

          </div>

        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};