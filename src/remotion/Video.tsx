// src/remotion/Video.tsx
//
// The entire scene compiles from a SceneConfig — prompt + seed.
// Change seed → different layout. Change prompt → different scene.

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Puppeteer }    from '../puppeteer/Puppeteer';
import { compileScene } from '../core/inference/compileScene';
import { SceneConfig }  from '../core/inference/scenePrompt';

const sceneConfig: SceneConfig = {
  seed: 9,
  prompt: {
    environment: 'cityscape',
    mood:        'calm',
    timeOfDay:   'morning',
    duration:    10,
    actors: [
      {
        id:      'car1',
        type:    'car',
        action:  'drive',
        entry:   'left',
        variant: 'car-jeep',
      },
    ],
  },
};

const compiled = compileScene(sceneConfig);

type VideoProps = { title?: string; captions?: any[] };

export const Video: React.FC<VideoProps> = () => {
  return (
    <AbsoluteFill style={{ background: compiled.skyColor }}>
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     `${(1 - 0.82) * 100}%`,
        background: compiled.groundColor,
      }} />
      <Puppeteer
        entities={compiled.entities}
        timeline={compiled.timeline}
        constraints={compiled.constraints}
      />
    </AbsoluteFill>
  );
};