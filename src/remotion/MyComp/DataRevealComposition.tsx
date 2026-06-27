// src/remotion/MyComp/DataRevealComposition.tsx
//
// Remotion composition entry point for the DataRevealScene.
// Import this in your Root.tsx as a <Composition />.
//
// The only thing that changes between videos is which config you import.
// Swap dataRevealConfig for any other config object — same templates, new data.

import React from 'react';
import { Composition } from 'remotion';
import { DataRevealScene, calcSceneDuration } from './DataRevealScene';
import { dataRevealConfig } from '../../core/dataRevealConfig';

const FPS    = 30;
const WIDTH  = 1920;
const HEIGHT = 1080;

// Duration is calculated from the config — never hardcoded
const duration = calcSceneDuration(dataRevealConfig, FPS);

export const DataRevealComposition: React.FC = () => (
  <Composition
    id="DataReveal"
    component={() => <DataRevealScene config={dataRevealConfig} />}
    durationInFrames={duration}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);

// ── How to use in Root.tsx ─────────────────────────────────────────────────────
//
//   import { DataRevealComposition } from './MyComp/DataRevealComposition';
//
//   export const RemotionRoot: React.FC = () => (
//     <>
//       <DataRevealComposition />
//       {/* other compositions */}
//     </>
//   );
//
// ── How to render ──────────────────────────────────────────────────────────────
//
//   npx remotion render src/remotion/index.ts DataReveal out/data-reveal.mp4
//
// ── How to make a new variation ───────────────────────────────────────────────
//
//   1. Duplicate dataRevealConfig.ts → e.g. oilMarketConfig.ts
//   2. Change the stats array — labels, values, chart types
//   3. Import the new config here or in a new composition file
//   4. Render with a new output filename
//
// That's it. No rig files touched. No templates modified.