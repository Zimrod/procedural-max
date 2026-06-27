// src/remotion/MyComp/ProcessFlowRig.tsx

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type ProcessFlowRigProps = {
  steps: string[];

  durationPerStep?: number;

  nodeRadius?: number;

  nodeSpacing?: number;

  stepYOffset?: number;

  virtualHeight?: number;
};

export const ProcessFlowRig: React.FC<ProcessFlowRigProps> = ({
  steps,

  durationPerStep = 60,

  nodeRadius = 180,

  nodeSpacing = 750,

  stepYOffset = 150,

  virtualHeight = 1000,
}) => {
  const frame = useCurrentFrame();

  const { fps, width, height } = useVideoConfig();

  //
  // --------------------------------------------------------
  // WORLD SIZE
  // --------------------------------------------------------
  //

  const totalWidth =
    Math.max(steps.length - 1, 0) * nodeSpacing +
    width;

  const centerY = height / 2 + stepYOffset;

  //
  // --------------------------------------------------------
  // CAMERA FOLLOW
  // --------------------------------------------------------
  //

  const activeStepIndex = Math.min(
    Math.floor(frame / durationPerStep),
    steps.length - 1
  );

  const cameraX = activeStepIndex * nodeSpacing;

  //
  // --------------------------------------------------------
  // COLORS
  // --------------------------------------------------------
  //

  const bgColor = '#050816';

  const lineColor = '#2dd4bf';

  const activeNodeColor = '#4ade80';

  const inactiveNodeColor = '#1e293b';

  const textColor = '#f8fafc';

  //
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  //

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* WORLD */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: totalWidth,
          height,

          transform: `translateX(${
            width * 0.35 - cameraX
          }px)`,

          willChange: 'transform',
        }}
      >
        {/* CONNECTION LINES */}
        {steps.map((_, i) => {
          if (i === steps.length - 1) return null;

          const lineRevealFrame =
            i * durationPerStep;

          const lineProgress = spring({
            frame: frame - lineRevealFrame,
            fps,
            config: {
              damping: 18,
              stiffness: 100,
            },
          });

          const lineWidth =
            nodeSpacing - nodeRadius * 2;

          return (
            <div
              key={`line-${i}`}
              style={{
                position: 'absolute',

                left:
                  i * nodeSpacing + nodeRadius,

                top: centerY - 6,

                width:
                  lineWidth * lineProgress,

                height: 12,

                borderRadius: 999,

                backgroundColor: lineColor,

                transformOrigin: 'left center',

                boxShadow:
                  '0 0 24px rgba(45,212,191,0.6)',
              }}
            />
          );
        })}

        {/* NODES */}
        {steps.map((step, i) => {
          const stepStart =
            i * durationPerStep;

          const localFrame =
            frame - stepStart;

          const entrance = spring({
            frame: localFrame,
            fps,
            config: {
              damping: 12,
              stiffness: 120,
              mass: 0.8,
            },
          });

          const pulse =
            activeStepIndex === i
              ? interpolate(
                  Math.sin(frame * 0.08),
                  [-1, 1],
                  [0.96, 1.06]
                )
              : 1;

          const isActive =
            activeStepIndex >= i;

          const yOffset = 0;

          const x =
            i * nodeSpacing;

          const y =
            centerY + yOffset;

          return (
            <React.Fragment
              key={`step-${i}`}
            >
              {/* NODE */}
              <div
                style={{
                  position: 'absolute',

                  left: x - nodeRadius,

                  top: y - nodeRadius,

                  width: nodeRadius * 2,

                  height: nodeRadius * 2,

                  borderRadius: '50%',

                  backgroundColor: isActive
                    ? activeNodeColor
                    : inactiveNodeColor,

                  border:
                    '10px solid rgba(255,255,255,0.08)',

                  display: 'flex',

                  justifyContent: 'center',

                  alignItems: 'center',

                  transform: `
                    scale(${entrance * pulse})
                  `,

                  boxShadow: isActive
                    ? `
                      0 0 60px rgba(74,222,128,0.5),
                      0 0 120px rgba(74,222,128,0.25)
                    `
                    : `
                      0 0 30px rgba(0,0,0,0.3)
                    `,

                  willChange: 'transform',
                }}
              >
                {/* STEP NUMBER */}
                <div
                  style={{
                    position: 'absolute',

                    top: 32,

                    fontSize: 54,

                    fontWeight: 700,

                    color: 'rgba(255,255,255,0.45)',

                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* STEP LABEL */}
                <div
                  style={{
                    width: '75%',

                    textAlign: 'center',

                    color: textColor,

                    fontSize: 48,

                    fontWeight: 700,

                    lineHeight: 1.15,

                    fontFamily:
                      'Inter, sans-serif',

                    textTransform: 'uppercase',

                    letterSpacing: 1.5,
                  }}
                >
                  {step}
                </div>
              </div>

              {/* GLOW BACKDROP */}
              <div
                style={{
                  position: 'absolute',

                  left:
                    x - nodeRadius * 0.4,

                  top:
                    y - nodeRadius * 1.4,

                  width:
                    nodeRadius * 2.8,

                  height:
                    nodeRadius * 2.8,

                  borderRadius: '50%',

                  background:
                    'radial-gradient(circle, rgba(74,222,128,0.16), transparent)',

                  filter: 'blur(50px)',

                  opacity: isActive
                    ? 1
                    : 0.2,

                  pointerEvents: 'none',
                }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
