// src/remotion/MyComp/WebPageWidget.tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring } from 'remotion';

export const WebPageWidget: React.FC<{ 
  title?: string;
  accentColor?: string;
}> = ({ title = "Dashboard", accentColor = "#3b82f6" }) => {
  const frame = useCurrentFrame();

  // 1. Define the positions of the 4 cards (relative to the grid)
  const cardPositions = [
    { x: 250, y: 150 }, // Top Left
    { x: 500, y: 150 }, // Top Right
    { x: 500, y: 300 }, // Bottom Right
    { x: 250, y: 300 }, // Bottom Left
  ];

  // 2. Interpolate the cursor position across the cards
  // It rests for 30 frames on each card
  const cursorX = interpolate(frame, [20, 50, 80, 110, 140, 170], [0, 250, 250, 500, 500, 250], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [20, 50, 80, 110, 140, 170], [0, 150, 150, 150, 300, 300], { extrapolateRight: 'clamp' });

  // 3. Helper to detect if a card is currently "hovered" by the cursor logic
  const getHoverState = (cardIdx: number) => {
    // Logic: Is the cursor currently resting on this card's coordinates?
    if (cardIdx === 0 && frame >= 50 && frame < 80) return true;
    if (cardIdx === 1 && frame >= 110 && frame < 140) return true;
    // ... and so on
    return false;
  };

  // Animation: Entry spring for the whole window
  const entry = spring({
    frame,
    fps: 30,
    config: { damping: 12 },
  });

  // Animation: Staggered "loading" for inner cards
  const cardOpacity = (delay: number) => interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      transform: `scale(${entry})`,
    }}>
      {/* Browser Frame */}
      <div style={{
        width: 700,
        height: 450,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Bar / Header */}
        <div style={{
          height: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px',
          gap: 6
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#9ca3af', fontFamily: 'sans-serif' }}>
            {title}.app
          </div>
        </div>

        {/* Content Area */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <div style={{ width: 120, borderRight: '1px solid #e5e7eb', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 8, backgroundColor: i === 1 ? accentColor : '#e5e7eb', borderRadius: 4, width: i === 4 ? '50%' : '100%' }} />
            ))}
          </div>

          {/* Main Grid */}
          <div style={{ flex: 1, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 15 }}>
            {[0, 5, 10, 15].map((delay, idx) => (
              <div key={idx} style={{ 
                backgroundColor: 'white', 
                borderRadius: 8, 
                border: '1px solid #e5e7eb',
                padding: 10,
                opacity: cardOpacity(delay),
                transform: `translateY(${interpolate(frame - delay, [0, 10], [10, 0], { extrapolateRight: 'clamp' })}px)`
              }}>
                <div style={{ height: 10, width: '40%', backgroundColor: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 30, width: '100%', backgroundColor: '#f9fafb', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ flex: 1, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 15 }}>
          {[0, 1, 2, 3].map((idx) => {
            const isHovered = getHoverState(idx);
            
            // Smooth transition for the hover effect
            const hoverSpring = spring({
              frame: isHovered ? frame - (idx * 30) : 0, // Simplified for brevity
              fps: 30,
              config: { damping: 10 }
            });

            return (
              <div key={idx} style={{ 
                backgroundColor: 'white', 
                borderRadius: 8, 
                border: '1px solid #e5e7eb',
                padding: 10,
                // THE HOVER EFFECTS:
                transform: `scale(${isHovered ? 1.05 : 1})`,
                boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease-out', // Standard CSS transition works well here
                zIndex: isHovered ? 10 : 1,
              }}>
                <div style={{ height: 10, width: '40%', backgroundColor: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 30, width: '100%', backgroundColor: '#f9fafb', borderRadius: 4 }} />
              </div>
            );
          })}
        </div>

        {/* THE FLOATING CURSOR */}
        <div style={{
          position: 'absolute',
          left: cursorX,
          top: cursorY,
          pointerEvents: 'none',
          zIndex: 100,
          transition: 'all 0.1s linear'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.65376 12.3822L19.5459 19.2235C20.1221 19.5073 20.7533 18.913 20.4695 18.3368L13.6282 4.44469C13.3444 3.86854 12.5316 3.86854 12.2478 4.44469L5.65376 12.3822Z" fill="black" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};