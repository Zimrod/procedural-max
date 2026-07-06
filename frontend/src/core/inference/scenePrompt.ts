// src/core/inference/scenePrompt.ts
//
// Type definitions for the full inference pipeline.
//
// ScenePrompt  — what the user (or AI) specifies
// SceneIntent  — resolved decisions derived from the prompt
// SceneConfig  — prompt + seed = fully reproducible scene

import { AssetId } from '../world/assetRegistry';

// ── Enumerations ──────────────────────────────────────────────────────────────

export type Environment = 'cityscape' | 'industrial' | 'warehouse';
export type Mood        = 'busy' | 'calm' | 'dramatic';
export type TimeOfDay   = 'day' | 'morning' | 'evening' | 'night';
export type ActorType   = 'car' | 'forklift' | 'human';
export type ActorAction = 'drive' | 'pickup' | 'walk' | 'point' | 'idle';
export type EntryPoint  = 'left' | 'right' | 'already_present';

// ── ScenePrompt ───────────────────────────────────────────────────────────────
// This is the user-facing input. Eventually an LLM will produce this
// from a video script. For now it's authored manually.

export type ActorPrompt = {
  id:      string;        // unique id for this actor in the scene
  type:    ActorType;
  action:  ActorAction;
  entry:   EntryPoint;
  variant?: string;       // e.g. 'car-jeep', 'sedan' — optional specific variant
};

export type ScenePrompt = {
  environment: Environment;
  mood:        Mood;
  timeOfDay:   TimeOfDay;
  actors:      ActorPrompt[];
  duration:    number;    // seconds
};

// ── SceneConfig ───────────────────────────────────────────────────────────────
// Prompt + seed = 100% reproducible render.
// Change seed to get a different layout with the same narrative intent.

export type SceneConfig = {
  prompt: ScenePrompt;
  seed:   number;
};

// ── SceneIntent ───────────────────────────────────────────────────────────────
// Resolved from ScenePrompt by resolveIntent().
// Concrete decisions about what to put in the scene before placement.

export type LayerIntent = {
  depth:      number;             // z-layer (0=foreground, 1=mid, 2=background)
  assetPool:  AssetId[];          // which assets are eligible for this layer
  minCount:   number;
  maxCount:   number;
  allowFlip:  boolean;            // can assets be mirrored?
};

export type SceneIntent = {
  environment:  Environment;
  timeOfDay:    TimeOfDay;
  mood:         Mood;
  layers:       LayerIntent[];
  skyElements:  AssetId[];        // specific sky assets to always include
  groundColor:  string;           // CSS color for the ground strip
  skyColor:     string;           // CSS background color
  actorIntents: ActorIntent[];
};

export type ActorIntent = {
  actorPrompt:  ActorPrompt;
  startFrame:   number;
  endFrame:     number;
  entryX:       number;           // canvas px
  exitX:        number;           // canvas px
  groundY:      number;           // canvas px — which ground line to use
  scale:        number;           // canvas scale derived from world units
};