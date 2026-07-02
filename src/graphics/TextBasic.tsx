// src/remotion/MyComp/TextRig.tsx
// import React, { useMemo } from 'react';
// import {
//   useCurrentFrame,
//   useVideoConfig,
//   interpolate,
//   spring,
//   random,
//   AbsoluteFill,
// } from 'remotion';

// type AnimationPreset =
//   | 'wave'
//   | 'glitch'
//   | 'matrix'
//   | 'particle'
//   | 'morph'
//   | 'typewriter'
//   | 'stagger'
//   | 'mix';

// interface TextRigProps {
//   text: string;
//   preset?: AnimationPreset;
//   mixPresets?: AnimationPreset[]; // used only when preset = 'mix'
//   durationInFrames?: number;
//   delayFrames?: number;
//   loop?: boolean;
//   color?: string;
//   fontSize?: number;
//   fontFamily?: string;
//   fontWeight?: number;
//   letterSpacing?: number;
//   className?: string;
//   // For consistent random distribution across frames
//   seed?: number;
// }

// export const TextRig: React.FC<TextRigProps> = ({
//   text,
//   preset = 'wave',
//   mixPresets = ['wave', 'glitch', 'particle', 'morph', 'typewriter'], // default mix
//   durationInFrames = 90,
//   delayFrames = 0,
//   loop = false,
//   color = '#ffffff',
//   fontSize = 48,
//   fontFamily = 'sans-serif',
//   fontWeight = 700,
//   letterSpacing = 0,
//   className = '',
//   seed = 42,
// }) => {
//   const frame = useCurrentFrame();
//   const { fps } = useVideoConfig();

//   const effectiveFrame = Math.max(0, frame - delayFrames);
//   const progress = interpolate(effectiveFrame, [0, durationInFrames], [0, 1], {
//     extrapolateRight: 'clamp',
//   });

//   const loopedProgress = loop ? progress % 1 : progress;

//   const chars = text.split('');
//   const total = chars.length;

//   // Pre‑assign a random preset per character when mixing
//   const charPreset = useMemo(() => {
//     if (preset !== 'mix') return null;
//     // deterministic but varied per character
//     return chars.map((_, i) => {
//       const r = random(`${seed}-${i}`);
//       const idx = Math.floor(r * mixPresets.length);
//       return mixPresets[idx];
//     });
//   }, [preset, mixPresets, chars, seed]);

//   const getCharStyle = (char: string, index: number): React.CSSProperties => {
//     const phase = (index / total) * Math.PI * 2;
//     const t = loopedProgress;
//     const currentPreset = preset === 'mix' ? charPreset![index] : preset;

//     switch (currentPreset) {
//       case 'wave': {
//         const yOffset = Math.sin(t * Math.PI * 2 * 2 + phase) * 30;
//         const rotateX = Math.sin(t * Math.PI * 2 * 2 + phase) * 20;
//         const opacity = 1 - Math.abs(yOffset) / 50;
//         return {
//           display: 'inline-block',
//           transform: `translateY(${yOffset}px) rotateX(${rotateX}deg)`,
//           opacity,
//           transition: 'transform 0.05s linear',
//         };
//       }
//       case 'glitch': {
//         const glitchX = (random(`${frame}-${index}`) - 0.5) * 12;
//         const glitchY = (random(`${frame+1}-${index}`) - 0.5) * 6;
//         const glitchOpacity = random(`${frame+2}-${index}`) > 0.9 ? 0.5 : 1;
//         return {
//           display: 'inline-block',
//           transform: `translate(${glitchX}px, ${glitchY}px)`,
//           opacity: glitchOpacity,
//           textShadow: `0 0 2px rgba(255,0,0,0.5)`,
//           transition: 'transform 0.05s linear',
//         };
//       }
//       case 'matrix': {
//         const startDelay = index * 0.05; // seconds
//         const startFrame = startDelay * fps;
//         const fallProgress = interpolate(
//           effectiveFrame,
//           [startFrame, startFrame + durationInFrames * 0.8],
//           [0, 1],
//           { extrapolateRight: 'clamp' }
//         );
//         const y = interpolate(fallProgress, [0, 1], [-200, 0]);
//         const matOpacity = fallProgress < 0.1 ? 0 : 1;
//         return {
//           display: 'inline-block',
//           transform: `translateY(${y}px)`,
//           opacity: matOpacity,
//           transition: 'transform 0.05s linear',
//         };
//       }
//       case 'particle': {
//         const r = random(`${index}-${t}`);
//         const scale = 0.5 + Math.sin(t * Math.PI * 4 + index) * 0.5;
//         const rotate = Math.sin(t * Math.PI * 6 + index) * 90;
//         const xOffset = Math.sin(t * Math.PI * 8 + index) * 20;
//         const yOffset = Math.cos(t * Math.PI * 8 + index) * 20;
//         return {
//           display: 'inline-block',
//           transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg) scale(${scale})`,
//           opacity: 0.8,
//           transition: 'transform 0.05s linear',
//         };
//       }
//       case 'morph': {
//         const morphX = Math.sin(t * Math.PI * 2 + phase) * 0.5;
//         const morphY = Math.cos(t * Math.PI * 1.7 + phase) * 0.5;
//         const scaleX = 1 + Math.sin(t * Math.PI * 3 + phase) * 0.3;
//         const scaleY = 1 + Math.cos(t * Math.PI * 2.5 + phase) * 0.3;
//         return {
//           display: 'inline-block',
//           transform: `scale(${scaleX}, ${scaleY}) skew(${morphX * 30}deg, ${morphY * 20}deg)`,
//           transition: 'transform 0.05s linear',
//         };
//       }
//       case 'typewriter': {
//         const delay = index * 3;
//         const appear = interpolate(effectiveFrame, [delay, delay + 5], [0, 1], {
//           extrapolateLeft: 'clamp',
//           extrapolateRight: 'clamp',
//         });
//         const typeScale = spring({ frame: effectiveFrame - delay, fps, from: 0, to: 1, config: { damping: 10 } });
//         return {
//           display: 'inline-block',
//           transform: `scale(${typeScale})`,
//           opacity: appear,
//         };
//       }
//       case 'stagger': {
//         const staggerDelay = index * 4;
//         const tStagger = interpolate(effectiveFrame, [staggerDelay, staggerDelay + 30], [0, 1], { extrapolateRight: 'clamp' });
//         const staggerRotate = Math.sin(tStagger * Math.PI * 2) * 30;
//         const staggerY = (1 - tStagger) * 50;
//         return {
//           display: 'inline-block',
//           transform: `rotate(${staggerRotate}deg) translateY(${staggerY}px)`,
//           opacity: tStagger,
//           transition: 'transform 0.05s linear',
//         };
//       }
//       default:
//         return {};
//     }
//   };

//   const containerStyle: React.CSSProperties = {
//     fontSize,
//     fontFamily,
//     fontWeight,
//     color,
//     letterSpacing: `${letterSpacing}px`,
//     whiteSpace: 'pre-wrap',
//     wordBreak: 'break-word',
//     textAlign: 'center',
//     display: 'inline-block',
//     width: '100%',
//     position: 'relative',
//   };

//   // Add overflow hidden for animations that move outside
//   const overflowStyle = preset === 'matrix' || preset === 'particle' ? { overflow: 'hidden' } : {};

//   return (
//     <div style={{ ...containerStyle, ...overflowStyle }} className={className}>
//       {chars.map((char, i) => (
//         <span key={i} style={getCharStyle(char, i)}>
//           {char === ' ' ? '\u00A0' : char}
//         </span>
//       ))}
//     </div>
//   );
// };


// src/remotion/MyComp/TextRig.tsx
//
// Minimal text display rig.
// Accepts the props shape that scene_config.json generates for text-based widgets:
//   text, durationInFrames, fontSize
// Used as the default fallback rig during workflow authentication.

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

type Props = {
  text:              string;
  fontSize?:         number;
  color?:            string;
  fontFamily?:       string;
  fontWeight?:       number | string;
  background?:       string;
  durationInFrames?: number;
  // Fade in/out
  fadeInFrames?:     number;
  fadeOutFrames?:    number;
};

export const TextRig: React.FC<Props> = ({
  text,
  fontSize         = 32,
  color            = '#1a1a1a',
  fontFamily       = 'Lato, sans-serif',
  fontWeight       = 600,
  background       = 'transparent',
  durationInFrames = 90,
  fadeInFrames     = 15,
  fadeOutFrames    = 15,
}) => {
  const frame = useCurrentFrame();

  // 🛠️ FIX: Ensure fade boundaries never overlap or go backwards on short beats
  const safeFadeIn = Math.min(fadeInFrames, Math.floor(durationInFrames / 2));
  const safeFadeOut = Math.min(fadeOutFrames, Math.floor(durationInFrames / 2));

  const opacity = interpolate(
    frame,
    [
      0,
      safeFadeIn,
      Math.max(safeFadeIn, durationInFrames - safeFadeOut),
      durationInFrames,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '0 80px',
      }}
    >
      <p
        style={{
          fontSize,
          fontFamily,
          fontWeight,
          color,
          opacity,
          textAlign:  'center',
          lineHeight: 1.4,
          margin:     0,
        }}
      >
        {text}
      </p>
    </AbsoluteFill>
  );
};