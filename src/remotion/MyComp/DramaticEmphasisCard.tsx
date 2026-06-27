// src/remotion/MyComp/DramaticEmphasisCard.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type Props = {
  emphasisText?: string;   // e.g., "BUT HERE’S THE KICKER:" or "BUT THE REAL VALUE?"
  subtext?: string;        // e.g., "Each role means a separate revenue stream."
  accentColor?: string;
  flashColor?: string;
};

export const DramaticEmphasisCard: React.FC<Props> = ({
  emphasisText = "BUT THE REAL VALUE?",
  subtext = "It goes far beyond a simple project loan.",
  accentColor = "#ff7b00",
  flashColor = "rgba(255, 123, 0, 0.15)",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. TIMELINE PATTERN CONSTANTS (Dramatic Pause Holding State)
  // We explicitly hold an empty frame for 12 frames (~0.4 seconds) to create tension
  const strikeDelayFrames = 12;
  const subtextDelayFrames = strikeDelayFrames + 20;

  // 2. MAIN TEXT HIT ANTIMATION (Spring Physics)
  const strikeFrameNormalized = Math.max(0, frame - strikeDelayFrames);
  const textStrikeSpring = spring({
    frame: strikeFrameNormalized,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 140 }, // High snap, low mass for an impactful pop
  });

  // 3. SUBTEXT COMPONENT ANCHOR (Smooth upward reveal fade)
  const subtextFrameNormalized = Math.max(0, frame - subtextDelayFrames);
  const subtextOpacity = interpolate(subtextFrameNormalized, [0, 15], [0, 1], { extrapolateLeft: 'clamp' });
  const subtextTranslateY = interpolate(subtextFrameNormalized, [0, 15], [20, 0], { extrapolateLeft: 'clamp' });

  // 4. EMBOSSED BACKGROUND FLASH EFFECT
  // A subtle radial lightning bloom behind the text right at the split second of the impact frame
  const flashOpacity = interpolate(
    strikeFrameNormalized,
    [0, 2, 12],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const flashScale = interpolate(strikeFrameNormalized, [0, 12], [0.8, 1.4], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#07080a', fontFamily: 'Ubuntu, sans-serif', overflow: 'hidden' }}>
      
      {/* KINETIC LIGHT FLASH EMISSION BACKDROP */}
      {strikeFrameNormalized > 0 && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${flashScale})`,
          width: 900,
          height: 900,
          background: `radial-gradient(circle, ${flashColor} 0%, transparent 70%)`,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }} />
      )}

      {/* STAGE FRAME CONTAINER */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 100px',
        boxSizing: 'border-box'
      }}>
        
        {/* CORE CRITICAL TEXT CONTAINER */}
        {frame >= strikeDelayFrames && (
          <div style={{
            transform: `scale(${interpolate(textStrikeSpring, [0, 1], [0.85, 1])})`,
            opacity: textStrikeSpring,
            textAlign: 'center',
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: 72,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 4,
              lineHeight: 1.15,
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              {emphasisText.split(' ').map((word, i) => {
                // Check if the word contains a punctuation mark to light up our system accent color
                const isAccent = word.includes('?') || word.includes(':') || word === 'REAL' || word === 'KICKER';
                return (
                  <span key={`word-${i}`} style={{ color: isAccent ? accentColor : '#ffffff' }}>
                    {word}{' '}
                  </span>
                );
              })}
            </h2>
          </div>
        )}

        {/* SUBTEXT REVEAL ELEMENT FOOTER */}
        <div style={{
          marginTop: 40,
          opacity: subtextOpacity,
          transform: `translateY(${subtextTranslateY}px)`,
          textAlign: 'center',
          maxWidth: 800,
        }}>
          <p style={{
            color: '#a0aec0',
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.5,
            margin: 0,
            letterSpacing: 0.5
          }}>
            {subtext}
          </p>
        </div>
      </div>

      {/* GRAPHIC FRAME OVERLAYS (Industrial Accent Corners to lock focus) */}
      <div style={{
        position: 'absolute',
        inset: 40,
        border: '1px solid rgba(255,255,255,0.03)',
        pointerEvents: 'none',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {/* Top-Left Corner Bracket */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        
        {/* Bottom-Right Corner Bracket */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      </div>

    </AbsoluteFill>
  );
};