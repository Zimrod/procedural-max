// src/remotion/Video.tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { Puppeteer } from "../puppeteer/Puppeteer";
import { scene as forkliftScene } from "../core/schema";
import { humanEntity, humanTimeline } from "../core/humanScene.schema";

// combinedScene merges all scene fragments.
// Add new scenes here as you build them.
const combinedScene = {
  entities: [...forkliftScene.entities, humanEntity],
  timeline: [...forkliftScene.timeline, ...humanTimeline],
  constraints: forkliftScene.constraints || [],
};

type VideoProps = {
  title?: string;
  captions?: any[];
  tracks?: any[];
};

export const Video: React.FC<VideoProps> = () => {
  return (
    <AbsoluteFill>
      <Puppeteer
        entities={combinedScene.entities}
        timeline={combinedScene.timeline}
        constraints={combinedScene.constraints}
      />
    </AbsoluteFill>
  );
};