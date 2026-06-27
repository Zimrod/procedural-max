// src/remotion/MyComp/ClockRig.tsx
import React, { useEffect, useState } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, staticFile, delayRender, continueRender, spring } from 'remotion';

const CLOCK_SIZE = 340;
const CX = CLOCK_SIZE / 2;
const CY = CLOCK_SIZE / 2;
const FACE_ORIGINAL_SIZE = 490.77;
const uniformScale = CLOCK_SIZE / FACE_ORIGINAL_SIZE;

interface HandData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivot: { x: number; y: number };
}

const parseHand = (svgText: string): HandData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  const vb = svgEl?.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, 500, 500];
  const viewBox = { w: vb[2], h: vb[3] };
  const pivotEl = doc.querySelector('#pivot');
  const pivot = {
    x: parseFloat(pivotEl?.getAttribute('cx') ?? String(viewBox.w / 2)),
    y: parseFloat(pivotEl?.getAttribute('cy') ?? String(viewBox.h)),
  };
  const inner = svgEl?.innerHTML ?? '';
  return { svgText: inner, viewBox, pivot };
};

export const ClockRig: React.FC<{
  startHour: number;
  startMinute: number;
  durationInSeconds: number; // real video seconds over which 3 hours will elapse
}> = ({ startHour, startMinute, durationInSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [hourData,   setHourData]   = useState<HandData | null>(null);
  const [minuteData, setMinuteData] = useState<HandData | null>(null);
  const [faceText,   setFaceText]   = useState<string>('');

  useEffect(() => {
    const handle = delayRender('Loading clock SVGs');
    const load = async () => {
      const [faceRes, hourRes, minuteRes] = await Promise.all([
        fetch(staticFile('face.svg')),
        fetch(staticFile('hour.svg')),
        fetch(staticFile('minute.svg')),
      ]);
      const [faceSvg, hourSvg, minuteSvg] = await Promise.all([
        faceRes.text(),
        hourRes.text(),
        minuteRes.text(),
      ]);
      const faceDoc = new DOMParser().parseFromString(faceSvg, 'image/svg+xml');
      setFaceText(faceDoc.querySelector('svg')?.innerHTML ?? '');
      setHourData(parseHand(hourSvg));
      setMinuteData(parseHand(minuteSvg));
      continueRender(handle);
    };
    load().catch(() => continueRender(handle));
  }, []);

  // Total minutes to simulate — 3 hours = 180 minutes
  const TOTAL_MINUTES = 180;

  // How many frames per tick (one tick = one minute advance)
  const framesPerTick = (durationInSeconds * fps) / TOTAL_MINUTES;

  // Which tick are we on — discrete, snapped
  const currentTick = Math.floor(frame / framesPerTick);

  // Frame position within the current tick (0 to framesPerTick)
  const frameInTick = frame - currentTick * framesPerTick;
  const tickProgress = frameInTick / framesPerTick; // 0→1 within each tick

  // Tick easing — snaps forward quickly then holds
  // Feels like a real clock: fast snap on the beat, then still
  const tickEase = interpolate(tickProgress, [0, 0.12, 0.22, 1], [0, 1.08, 1, 1], {
    extrapolateRight: 'clamp',
  });

  // Total elapsed minutes including the eased sub-tick progress
  const elapsedMinutes = currentTick + tickEase;

  // Minute hand: 6° per minute, wraps every 60
  const minuteDeg = ((startMinute + elapsedMinutes) % 60) * 6;

  // Hour hand: 0.5° per minute, starts from startHour position
  const hourStartDeg = (startHour % 12) * 30 + startMinute * 0.5;
  const hourDeg = hourStartDeg + elapsedMinutes * 0.5;

  if (!hourData || !minuteData) return null;

  const hourPivotX   = hourData.pivot.x   * uniformScale;
  const hourPivotY   = hourData.pivot.y   * uniformScale;
  const minutePivotX = minuteData.pivot.x * uniformScale;
  const minutePivotY = minuteData.pivot.y * uniformScale;

  const hourTX   = CX - hourPivotX;
  const hourTY   = CY - hourPivotY;
  const minuteTX = CX - minutePivotX;
  const minuteTY = CY - minutePivotY;

  return (
    <svg
      width={CLOCK_SIZE}
      height={CLOCK_SIZE}
      viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Face */}
      <g
        transform={`scale(${uniformScale})`}
        dangerouslySetInnerHTML={{ __html: faceText }}
      />

      {/* 2. Hour hand */}
      <g transform={`rotate(${hourDeg}, ${CX}, ${CY})`}>
        <g transform={`translate(${hourTX}, ${hourTY}) scale(${uniformScale})`}>
          <g dangerouslySetInnerHTML={{ __html: hourData.svgText }} />
        </g>
      </g>

      {/* 3. Minute hand */}
      <g transform={`rotate(${minuteDeg}, ${CX}, ${CY})`}>
        <g transform={`translate(${minuteTX}, ${minuteTY}) scale(${uniformScale})`}>
          <g dangerouslySetInnerHTML={{ __html: minuteData.svgText }} />
        </g>
      </g>

      {/* 4. Center pivot */}
      <circle cx={CX} cy={CY} r={8} fill="#be1e2d" stroke="#fff" strokeWidth={2.5}/>
    </svg>
  );
};