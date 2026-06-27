// src/remotion/MyComp/CityscapeScene.tsx
//
// Example scene using the world layout system.
// Shows how buildWorldLayout + applyDepthScaling + Puppeteer connect.

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Puppeteer }         from '../../puppeteer/Puppeteer';
import { buildWorldLayout, applyDepthScaling, sortByDepth } from '../../core/world/worldLayout';
import { cityscapeLayout }   from '../../core/world/scenes/cityscapeLayout';

// Build entity list once at module level — layout is static, no frame dependency
const rawEntities    = buildWorldLayout(cityscapeLayout);
const depthEntities  = applyDepthScaling(rawEntities, 0.75); // 25% smaller per depth layer
const sceneEntities  = sortByDepth(depthEntities);

// No timeline animations for the static cityscape — add them as needed
// e.g. clouds drifting: { target: 'cloud_1', preset: 'fadeSlide', params: {...} }
const sceneTimeline: any[] = [];
const sceneConstraints: any[] = [];

export const CityscapeScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#e8f0f7' }}>
      <Puppeteer
        entities={sceneEntities}
        timeline={sceneTimeline}
        constraints={sceneConstraints}
      />
    </AbsoluteFill>
  );
};