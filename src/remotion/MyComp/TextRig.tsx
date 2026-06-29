// src/remotion/MyComp/TextRig.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion';

type Props = {
  text: string;
  letterSpacing?: number;
  spaceWidth?: number;
  startDelay?: number;
  durationInFrames?: number; // 💡 NEW: Absolute frame window allowed for the entrance animation
  scaleFrom?: 'ground' | 'center';
  baseY?: number;            // only used when scaleFrom='ground'
  letterHeight?: number;
  letterScale?: number;
  color?: string;
  maxLineWidthPercent?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center';
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const TextRig: React.FC<Props> = ({
  text,
  letterSpacing = 10,
  spaceWidth: spaceWidthProp,
  startDelay = 0,
  durationInFrames = 60, // 💡 Default entry animation completes over 2 seconds (at 30fps)
  scaleFrom = 'center',
  baseY = 500,
  letterHeight = 100,
  letterScale = 1,
  color = '#333',
  maxLineWidthPercent = 0.6,
  lineHeight,
  textAlign = 'center',
}) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth, height: canvasHeight } = useVideoConfig();

  const [svgContents, setSvgContents] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  // const spaceWidth = spaceWidthProp ?? letterHeight * 0.5;
  const effectiveLineHeight = lineHeight ?? letterHeight * 1.2;

  // Load SVGs
  useEffect(() => {
    const allLetters = text.toUpperCase().split('').filter(ch => LETTERS.includes(ch));
    const uniqueLetters = allLetters.filter((ch, index) => allLetters.indexOf(ch) === index);

    const handle = delayRender();
    Promise.all(
      uniqueLetters.map(async (letter) => {
        const path = staticFile(`alphabet-stencil/${letter}.svg`);
        const res = await fetch(path);
        const svgText = await res.text();
        return [letter, svgText];
      })
    )
      .then((entries) => {
        setSvgContents(Object.fromEntries(entries));
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Failed to load letters', err);
        continueRender(handle);
      });
  }, [text]);

  // Word wrapping
  const lines = useMemo(() => {
    if (!ready) return [];
    const maxWidth = canvasWidth * maxLineWidthPercent;
    const words = text.toUpperCase().split(' ');
    const result: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const lineWidth = testLine.length * (letterHeight + letterSpacing);
      if (lineWidth > maxWidth && currentLine !== '') {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) result.push(currentLine);
    return result;
  }, [text, canvasWidth, maxLineWidthPercent, letterHeight, letterSpacing, ready]);

  // 💡 TRACK TOTAL VALID RENDERED CHARACTERS BEFORE ASSEMBLY
  const totalCharacters = useMemo(() => {
    let count = 0;
    lines.forEach(line => {
      line.split('').forEach(ch => {
        if (ch !== ' ' && svgContents[ch]) count++;
      });
    });
    return count;
  }, [lines, svgContents]);

  // 💡 CALCULATE PARAMETRIC STAGGER SPEED TO MEET THE TARGET LIFETIME
  const adaptiveStaggerDelay = useMemo(() => {
    if (totalCharacters <= 1) return 0;
    // Spring physics take roughly 15 frames to settle. We isolate that settling window cushion.
    const activeStaggerWindow = Math.max(10, durationInFrames - 15);
    return activeStaggerWindow / (totalCharacters - 1);
  }, [totalCharacters, durationInFrames]);

  if (!ready) return null;

  // Compute line widths
  const lineWidths = lines.map(line => line.length * (letterHeight + letterSpacing) - letterSpacing);
  const maxLineWidth = Math.max(...lineWidths);

  // Horizontal centering: startX for the whole block
  const startX = (canvasWidth - maxLineWidth) / 2;

  // Vertical centering: block start Y (top of first line)
  const blockHeight = lines.length * effectiveLineHeight;
  const startY = (canvasHeight - blockHeight) / 2;

  let renderingCharIndex = 0;
  const elements: React.ReactElement[] = [];

  lines.forEach((line, lineIdx) => {
    const lineY = startY + lineIdx * effectiveLineHeight; // top of this line's bounding box
    let currentX = 0;
    const chars = line.split('');

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const charWidth = letterHeight + letterSpacing;
      const x = startX + currentX;   // left edge of character container
      currentX += charWidth;

      if (ch === ' ') continue;

      const svgContent = svgContents[ch];
      if (!svgContent) continue;

      // 💡 STAGGER ENTRANCE BOUND TO THE TIMELINE BOUNDARY WINDOW
      const charStartFrame = startDelay + (renderingCharIndex * adaptiveStaggerDelay);
      
      const progress = spring({
        frame: frame - charStartFrame,
        fps,
        config: { damping: 14, mass: 0.6, stiffness: 170 }, // Crisp, slightly higher stiffness for snappy alignments
      });

      if (progress > 0) {
        let transformOrigin = 'center';
        let scaleY = progress;
        let translateY = 0;

        if (scaleFrom === 'ground') {
          const groundY = lineY + letterHeight;
          transformOrigin = `center ${groundY}px`;
          translateY = (1 - progress) * letterHeight;
          scaleY = progress;
        } else {
          scaleY = progress;
        }

        const coloredSvg = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);

        elements.push(
          <div
            key={`char-${renderingCharIndex}`}
            style={{
              position: 'absolute',
              left: x,
              top: lineY,                 // top of the character container
              width: letterHeight,
              height: letterHeight,
              transform: `scale(1, ${scaleY}) translateY(${translateY}px)`,
              transformOrigin,
              opacity: Math.min(1, progress * 1.5), // Faster linear alpha fade matching layout entry
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{
                __html: coloredSvg.replace(
                  /<svg/,
                  `<svg width="${letterHeight * letterScale}" height="${letterHeight * letterScale}" viewBox="0 0 ${letterHeight} ${letterHeight}" style="width:auto; height:auto; max-width:100%; max-height:100%; object-fit: contain"`
                ),
              }}
            />
          </div>
        );
      }
      renderingCharIndex++;
    }
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {elements}
      </div>
    </AbsoluteFill>
  );
};