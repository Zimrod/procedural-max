// src/remotion/MyComp/ChartSequenceRig.tsx
import React from 'react';
import { Sequence, AbsoluteFill, useVideoConfig } from 'remotion';

export type Scene = {
  component: React.ReactNode;
  durationInFrames: number;   // How long this scene stays on screen (active)
  startOffset?: number;       // Additional gap before this scene (in frames)
};

type Props = {
  scenes: Scene[];
  gapBetweenScenes?: number;  // Frames of empty time between scenes
  startDelay?: number;        // Frames to wait before first scene
};

export const ChartSequenceRig: React.FC<Props> = ({
  scenes,
  gapBetweenScenes = 0,
  startDelay = 0,
}) => {
  let cumulativeFrame = startDelay;
  const sequences = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const start = cumulativeFrame + (scene.startOffset || 0);
    const duration = scene.durationInFrames;

    sequences.push(
      <Sequence key={i} from={start} durationInFrames={duration}>
        {scene.component}
      </Sequence>
    );

    // Move cumulative frame to end of this scene, then add gap
    cumulativeFrame = start + duration + gapBetweenScenes;
  }

  return <AbsoluteFill>{sequences}</AbsoluteFill>;
};