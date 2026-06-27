// src/remotion/MyComp/CaptioningDemo-primitives.tsx
import React, { useMemo, useEffect, useState, useRef  } from "react";
import { ClockRig } from "./ClockRig";
import { WalkCycle } from "./WalkCycle";
import { CarDrive } from "./CarDrive";
import { PumpJack } from "./PumpJack";
import { TextRig } from "./TextRig";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import Lottie from "lottie-react";
import { tonesMap } from "../../constants/tonesMap";

const MAX_LINE_WIDTH = 0.7;

const estimateTextWidth = (word: string, fontSize: number) => {
  return word?.length * fontSize * 0.6;
};

// Updated groupWordsIntoSegments function in CaptioningDemo.tsx
const groupWordsIntoSegments = (
  words: { word: string; isSentenceEnd: boolean }[],
  fontSize: number,
  videoWidth: number
) => {
  const maxWidth = videoWidth * MAX_LINE_WIDTH;
  const segments: string[][] = [];
  let currentSegment: string[] = [];
  let currentLineWidth = 0;
  let lineCount = 1;

  for (let i = 0; i < words?.length; i++) {
    const { word, isSentenceEnd } = words[i];
    // Clean word for width estimation (remove dots/commas)
    const cleanWord = word.replace(/[.,!?]/g, "");
    const wordWidth = estimateTextWidth(cleanWord, fontSize);
    const spaceWidth = estimateTextWidth(" ", fontSize);

    // If we are at the start of a NEW sentence and the current segment isn't empty,
    // we MUST push the current segment and start fresh.
    const isNewSentenceStart = i > 0 && words[i - 1].isSentenceEnd;

    if (isNewSentenceStart && currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [word];
      currentLineWidth = wordWidth + spaceWidth;
      lineCount = 1;
      continue;
    }

    // Standard line wrapping logic
    if (currentLineWidth + wordWidth > maxWidth && currentSegment.length > 0) {
      if (lineCount >= 4) { // Max 4 lines
        segments.push(currentSegment);
        currentSegment = [word];
        currentLineWidth = wordWidth + spaceWidth;
        lineCount = 1;
      } else {
        currentSegment.push(word);
        currentLineWidth = wordWidth + spaceWidth;
        lineCount++;
      }
    } else {
      currentSegment.push(word);
      currentLineWidth += wordWidth + spaceWidth;
    }

    // If THIS word ends a sentence, and we've reached a decent amount of text,
    // or if you want every sentence on a fresh screen, push it here.
    if (isSentenceEnd && currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [];
      currentLineWidth = 0;
      lineCount = 1;
    }
  }

  if (currentSegment.length > 0) segments.push(currentSegment);
  return segments;
};

export const CaptioningDemo: React.FC<{
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | string;
  color: string;
  highlightColor?: string;
  nonHighlightColor?: string;
  captions: {
    word: string;
    start: number;
    end: number;
  }[];
  tone?: string;
  clockSettings?: { hour: number; minute: number };
}> = ({
  fontSize,
  fontFamily,
  fontWeight = 700,
  color,
  highlightColor = "#083569",
  nonHighlightColor = "#fff",
  captions,
  tone = "serious",
  clockSettings = { hour: 12, minute: 0 },
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  
  const [highlightStyle, setHighlightStyle] = useState({
    width: 0,
    height: 0,
    transform: "translate(0px, 0px)",
    opacity: 0,
  });

  const wordsWithFrames = useMemo(() => captions?.map((w) => ({
    ...w,
    startFrame: Math.floor(w.start * fps),
    endFrame: Math.floor(w.end * fps),
  })), [captions, fps]);
  
  const [metadata, setMetadata] = useState<Record<string, { duration: number; frameRate: number }>>({});
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/metadata`)
      .then(res => res.json())
      .then(setMetadata)
      .catch(err => console.error("Failed to load Lottie metadata", err));
  }, []);

  const segments = useMemo(
    () =>
      groupWordsIntoSegments(
        wordsWithFrames?.map((w) => ({
          word: w.word,
          // Enforce break on actual punctuation
          isSentenceEnd: /[.!?]$/.test(w.word) 
        })),
        fontSize,
        width
      ),
    [wordsWithFrames, fontSize, width]
  );

  // Find the word being spoken, or the one that just finished
  const currentWordIndex = useMemo(() => {
    const index = wordsWithFrames?.findIndex(
      (w) => frame >= w.startFrame && frame <= w.endFrame
    );

    if (index !== -1) return index;

    // If we are in a pause, find the most recent word
    const lastSpokenIndex = [...(wordsWithFrames || [])]
      .reverse()
      .findIndex((w) => frame >= w.endFrame);
      
    if (lastSpokenIndex !== -1) {
      const actualIndex = wordsWithFrames.length - 1 - lastSpokenIndex;
      
      // Logic: If the last word spoken ended a sentence, return -1 (clear screen)
      // If it was in the middle of a sentence, keep it on screen
      if (wordsWithFrames[actualIndex].word.match(/[.!?]$/)) {
        return -1; 
      }
      return actualIndex;
    }

    return -1;
  }, [frame, wordsWithFrames]);

  const currentSegmentIndex = segments?.findIndex((segment, index) => {
    const start = segments
      .slice(0, index)
      .reduce((acc, seg) => acc + seg?.length, 0);
    const end = start + segment?.length;
    return currentWordIndex >= start && currentWordIndex < end;
  });

  const currentSegment = segments[currentSegmentIndex] || [];
  const startIndexForSegment = segments
    .slice(0, currentSegmentIndex)
    .reduce((acc, seg) => acc + seg?.length, 0);

    const rawEntries = tonesMap[tone] || [];
    const lottieEntries = useMemo(() => rawEntries?.map(entry => {
      const meta = metadata[entry.name];
      return {
        ...entry,
        duration: meta?.duration ?? 6, // Fallback to 6 seconds if no metadata
        frameRate: meta?.frameRate ?? 30, // Fallback to 30fps if no metadata
      };
    }), [rawEntries, metadata]);
    
    // Calculate total duration of all animations
    const totalDurationFrames = useMemo(() => {
      return lottieEntries.reduce((sum, entry) => sum + (entry.duration * fps), 0);
    }, [lottieEntries, fps]);
    
    // Find current animation based on frame position
    const { currentAnimation, localFrame } = useMemo(() => {
      if (lottieEntries?.length === 0) return { currentAnimation: null, localFrame: 0 };
    
      let accumulatedFrames = 0;
      const normalizedFrame = frame % totalDurationFrames;
      
      for (const entry of lottieEntries) {
        const entryFrames = entry.duration * fps;
        if (normalizedFrame < accumulatedFrames + entryFrames) {
          return {
            currentAnimation: entry,
            localFrame: normalizedFrame - accumulatedFrames
          };
        }
        accumulatedFrames += entryFrames;
      }
    
      return { currentAnimation: lottieEntries[0], localFrame: 0 };
    }, [frame, lottieEntries, fps, totalDurationFrames]);

    useEffect(() => {
      const activeWordEl = wordRefs.current.get(currentWordIndex);
      if (activeWordEl) {
        setHighlightStyle({
          width: activeWordEl.offsetWidth,
          height: activeWordEl.offsetHeight,
          transform: `translate(${activeWordEl.offsetLeft}px, ${activeWordEl.offsetTop}px)`,
          opacity: 1,
        });
      } else {
        setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    }, [currentWordIndex, currentSegmentIndex]);

    // --- Clock transition logic (updated) ---
    const CLOCK_DELAY = 3;          // seconds before clock appears
    const CLOCK_VISIBLE = 15;       // seconds it stays visible after delay

    const delayStartFrame = CLOCK_DELAY * fps;
    const visibleEndFrame = delayStartFrame + CLOCK_VISIBLE * fps;
    const isVisible = frame >= delayStartFrame && frame < visibleEndFrame;

    const entranceDurationFrames = fps * 0.5;   // 0.5s entrance
    const exitDurationFrames = fps * 0.5;       // 0.5s exit

    let clockScale = 1;

    if (isVisible) {
      const relativeFrame = frame - delayStartFrame; // frames since appearance

      if (relativeFrame < entranceDurationFrames) {
        // Entrance bounce: 0 → 1.1 → 0.95 → 1
        const progress = relativeFrame / entranceDurationFrames;
        clockScale = interpolate(progress, [0, 0.6, 0.8, 1], [0, 1.1, 0.95, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      } else if (relativeFrame >= CLOCK_VISIBLE * fps - exitDurationFrames) {
        // Exit bounce: 1 → 1.05 → 0.9 → 1.02 → 0.95 → 0
        const progress = (relativeFrame - (CLOCK_VISIBLE * fps - exitDurationFrames)) / exitDurationFrames;
        clockScale = interpolate(progress, [0, 0.2, 0.4, 0.6, 0.8, 1], [1, 1.05, 0.9, 1.02, 0.95, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      } else {
        clockScale = 1; // fully visible
      }
    }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontSize,
        fontWeight,
        color,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Captions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignContent: 'center',
            maxWidth: width * MAX_LINE_WIDTH,
            gap: 8,
            position: 'relative',
          }}
        >
          {/* Highlight pill */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: highlightStyle.width,
              height: highlightStyle.height,
              backgroundColor: highlightColor,
              borderRadius: '12px',
              transform: highlightStyle.transform,
              opacity: highlightStyle.opacity,
              transition: 'all 0.15s ease-in-out',
              zIndex: 0,
            }}
          />

          {currentSegment?.map((word, i) => {
            const absoluteIndex = startIndexForSegment + i;
            const isHighlighted = absoluteIndex === currentWordIndex;

            return (
              <span
                key={absoluteIndex}
                ref={(el) => {
                  if (el) wordRefs.current.set(absoluteIndex, el);
                  else wordRefs.current.delete(absoluteIndex);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  letterSpacing: '4px',
                  margin: '10px',
                  whiteSpace: 'pre',
                  color: isHighlighted ? '#fff' : color,
                  zIndex: 1,
                  position: 'relative',
                  transform: isHighlighted ? 'scale(1.1)' : 'scale(1.0)',
                  transition: 'transform 0.1s ease-in-out, color 0.1s ease',
                }}
              >
                {word.toUpperCase()}
              </span>
            );
          })}
        </div>

        {/* Clock (now anchored relative to captions) */}
        {/* {isVisible && (
          <div
            style={{
              marginTop: 20, // 👈 controlled spacing
              transform: `scale(${clockScale})`,
              transformOrigin: 'center',
              transition: 'transform 0.05s linear',
            }}
          >
            <ClockRig
              startHour={clockSettings.hour}
              startMinute={clockSettings.minute}
              durationInSeconds={durationInFrames / fps}
            />
          </div>
        )} */}
        {/* <div style={{ marginTop: 24 }}>
          <WalkCycle
            cycleDurationSeconds={1}
            characterScale={1}
          />
        </div> */}
        <CarDrive preset="tractor" />
        {/* <div style={{ width: 800, height: 800, marginTop: 16 }}>
          <PumpJack
            cycleDurationSeconds={2}
            scale={1}
            positionX={width * 0.5}   // center — maps to 400 in 800px canvas
            positionY={height * 0.75} // maps proportionally into 800px canvas
            svgFolder="pumpjack"
          />
        </div> */}
      </div>
    </AbsoluteFill>
  );
};