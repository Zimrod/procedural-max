// src/MyComp/ProcessFlowRigParent.tsx
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { ProcessFlowRig } from "./ProcessFlowRig";

export const ProcessFlowRigParent = () => {
  const { fps } = useVideoConfig();
  const DURATION_PER_STEP = 2 * fps;
  const pauseBeforeCollapseSec = 7; 

  const stepConfig = [
    { label: "Scripting & Voiceover Recording", durationSec: 1.6 },
    { label: "Building Motion Assets", durationSec: 1.5 },
    { label: "Creating Motion Graphics", durationSec: 1.3 },
    { label: "Syncing Assets & Graphics With Voiceover", durationSec: 2.4 },
    { label: "Costly & Time-Consuming Rendering", durationSec: 6 },
    { label: "Animated Video", durationSec: 6 }, 
  ];

  const steps = stepConfig.map(s => s.label);
  let currentTime = 4;

  return (
    <AbsoluteFill style={{ backgroundColor: 'none' }}>
      {stepConfig.map((step, index) => {
        const sequenceFrom = currentTime * fps;
        const durationInFrames = step.durationSec * fps;
        currentTime += step.durationSec;

        return (
          <Sequence key={`step-${index}`} from={sequenceFrom} durationInFrames={durationInFrames}>
            <ProcessFlowRig 
              steps={steps} 
              activeStepIndex={index} 
              nodeSpacing={150}
              durationPerStep={DURATION_PER_STEP}
              isCollapsed={false}
              parentSequenceFrom={sequenceFrom}
              // Trigger pulse only on the last step, delayed by 1 second (30-60 frames)
              pulse={index === steps.length - 1 ? [0, steps.length - 1] : false}
              pulseDelayFrames={index === steps.length - 1 ? 1 * fps : 0} 
            />
          </Sequence>
        );
      })}

      <Sequence key="collapsed-final" from={currentTime * fps} durationInFrames={fps * 5}>
        <ProcessFlowRig 
          steps={steps} 
          activeStepIndex={steps.length - 1} 
          nodeSpacing={150}
          durationPerStep={DURATION_PER_STEP}
          isCollapsed={true} 
          parentSequenceFrom={currentTime * fps}
          pulse={false} // No pulse after collapse
        />
      </Sequence>
    </AbsoluteFill>
  );
};