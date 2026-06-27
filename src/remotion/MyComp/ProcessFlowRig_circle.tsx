// src/remotion/MyComp/ProcessFlowRig_circle.tsx

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  steps: string[];
  durationPerStep: number;
  nodeRadius: number;
  nodeSpacing: number;
  stepYOffset: number;
  virtualHeight: number;
};

// ── Easing ────────────────────────────────────────────────────────────────────

const easeOutCubic   = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ── Component ─────────────────────────────────────────────────────────────────

export const ProcessFlowRig_circle: React.FC<Props> = ({ steps, durationPerStep, nodeRadius, nodeSpacing, stepYOffset, virtualHeight }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [pathLengths, setPathLengths] = useState<number[]>([]);

  // Split the durationPerStep: 60% for the circle reveal, 40% for the arrow travel
  const circleDuration = Math.floor(durationPerStep * 0.6);
  const arrowDuration  = durationPerStep - circleDuration;

  // Precompute timing for each step based on props
  const { circleStarts, arrowStarts } = useMemo(() => {
    const cStarts: number[] = [];
    const aStarts: number[] = [];
    for (let i = 0; i < steps.length; i++) {
      const cs = i * durationPerStep;
      const as = cs + circleDuration; // Arrow starts ONLY after circle is done
      cStarts.push(cs);
      aStarts.push(as);
    }
    return { circleStarts: cStarts, arrowStarts: aStarts };
  }, [steps.length, durationPerStep, circleDuration]);

  // Helper to calculate Y position (lower index = higher Y value/lower on screen)
  const getPosY = (i: number) => virtualHeight / 2 + (steps.length / 2 - i) * stepYOffset;

  useEffect(() => {
    const lengths = pathRefs.current.map(el => el?.getTotalLength() ?? 400);
    setPathLengths(lengths);
  }, [steps.length]);

  // ── Camera Tracking ──
  // The camera follows the active point of animation
  let cameraTargetX = nodeRadius * 2;
  let cameraTargetY = getPosY(0);

  for (let i = 0; i < steps.length; i++) {
    const nextIdx = i + 1;
    if (nextIdx < steps.length && frame >= arrowStarts[i]) {
      // Camera pans while arrow is drawing
      const arrowRaw = (frame - arrowStarts[i]) / arrowDuration;
      const arrowP   = easeInOutCubic(Math.min(1, Math.max(0, arrowRaw)));
      
      cameraTargetX  = interpolate(arrowP, [0, 1], [nodeRadius * 2 + i * nodeSpacing, nodeRadius * 2 + nextIdx * nodeSpacing]);
      cameraTargetY  = interpolate(arrowP, [0, 1], [getPosY(i), getPosY(nextIdx)]);
    } else if (frame >= circleStarts[i]) {
      // Hold camera on current node while it draws
      cameraTargetX = nodeRadius * 2 + i * nodeSpacing;
      cameraTargetY = getPosY(i);
    }
  }

  const viewBoxX = cameraTargetX - width / 2;
  const viewBoxY = cameraTargetY - height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${viewBoxX} ${viewBoxY} ${width} ${height}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {steps.map((label, i) => {
        const posX = nodeRadius * 2 + i * nodeSpacing;
        const posY = getPosY(i);

        // ── Circle Animation ──
        const circleRaw     = (frame - circleStarts[i]) / circleDuration;
        const circleP       = easeOutCubic(Math.min(1, Math.max(0, circleRaw)));
        const circumference = 2 * Math.PI * nodeRadius;
        const dashOffset    = circumference * (1 - circleP);
        const labelOpacity  = interpolate(circleP, [0.6, 1], [0, 1], { extrapolateLeft: 'clamp' });

        // ── Arrow Animation (to the next node) ──
        const nextIdx = i + 1;
        let linePath = '';
        let arrowDashoffset = 0;
        let arrowLength = nodeSpacing - nodeRadius * 2;

        if (nextIdx < steps.length) {
          const nextX = nodeRadius * 2 + nextIdx * nodeSpacing;
          const nextY = getPosY(nextIdx);
          
          // S-Curve path between nodes
          const cp1x = posX + (nextX - posX) * 0.5;
          const cp2x = posX + (nextX - posX) * 0.5;
          linePath = `M ${posX + nodeRadius} ${posY} C ${cp1x} ${posY}, ${cp2x} ${nextY}, ${nextX - nodeRadius} ${nextY}`;
          
          const currentArrowLen = pathLengths[i] || arrowLength;
          const arrowRaw = (frame - arrowStarts[i]) / arrowDuration;
          const arrowP   = easeInOutCubic(Math.min(1, Math.max(0, arrowRaw)));
          
          arrowDashoffset = currentArrowLen * (1 - Math.max(0, arrowP));
        }

        return (
          <g key={i}>
            {/* Arrow */}
            {nextIdx < steps.length && (
              <path
                ref={el => { pathRefs.current[i] = el; }}
                d={linePath}
                fill="none"
                stroke="#666"
                strokeWidth="4"
                strokeDasharray={pathLengths[i] || arrowLength}
                strokeDashoffset={arrowDashoffset}
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
                opacity={frame >= arrowStarts[i] ? 1 : 0} // Strictly invisible until start
              />
            )}

            {/* Node Circle */}
            <circle
              cx={posX}
              cy={posY}
              r={nodeRadius}
              fill="none"
              stroke="#333"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${posX} ${posY})`}
            />

            {/* Step Label */}
            <text
              x={posX}
              y={posY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="32"
              fontFamily="Poppins, sans-serif"
              fontWeight="600"
              fill="#333"
              opacity={labelOpacity}
            >
              {label}
            </text>
          </g>
        );
      })}

      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L0,10 L10,5 z" fill="#666" />
        </marker>
      </defs>
    </svg>
  );
};