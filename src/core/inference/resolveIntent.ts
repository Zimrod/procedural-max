// src/remotion/core/inference/resolveIntent.ts
//
// Stage 2: ScenePrompt → SceneIntent
//
// Pure rule-based logic — no randomness here, no LLM.
// Same prompt always produces the same intent.
// Randomness is introduced in Stage 3 (generateLayout) via the seed.
//
// Rules answer questions like:
//   - Which asset pools are valid for this environment?
//   - How many background layers does mood 'busy' need vs 'calm'?
//   - What sky elements suit 'morning' vs 'night'?
//   - What ground and sky colors match timeOfDay?

import { AssetId } from '../world/assetRegistry';
import { GROUND_Y_PX, worldXToPx, pxPerWu } from '../world/worldUnits';
import {
  ScenePrompt,
  SceneIntent,
  ActorIntent,
  LayerIntent,
  Environment,
  Mood,
  TimeOfDay,
} from './scenePrompt';

// ── Asset pools per environment ───────────────────────────────────────────────
// Which assets are eligible per environment and depth layer.
// Extend as you add more assets to the registry.

const ENVIRONMENT_POOLS: Record<Environment, {
  background: AssetId[];
  midground:  AssetId[];
  foreground: AssetId[];
}> = {
  cityscape: {
    background: ['building_cbd_a', 'building_cbd_b', 'building_cbd_c', 'building_cbd_d'],
    midground:  ['tree_a', 'tree_b', 'tree_c', 'tree_pine', 'building_cbd_c', 'building_cbd_d'],
    foreground: ['bench_a', 'bin_a', 'bicycle', 'tree_a', 'tree_pine'],
  },
  industrial: {
    background: ['warehouse'],
    midground:  ['warehouse'],
    foreground: ['bin_a'],
  },
  warehouse: {
    background: ['warehouse'],
    midground:  [],
    foreground: ['bin_a'],
  },
};

// ── Sky pools per timeOfDay ───────────────────────────────────────────────────

const SKY_POOLS: Record<TimeOfDay, AssetId[]> = {
  day:     ['sun', 'cloud_little', 'cloud_rainy', 'birds_three'],
  morning: ['sun', 'cloud_little', 'birds_three', 'hot_air_balloon'],
  evening: ['cloud_little', 'cloud_rainy'],
  night:   [],
};

// ── Mood → density rules ──────────────────────────────────────────────────────

const MOOD_DENSITY: Record<Mood, {
  backgroundCount: [number, number];  // [min, max]
  midgroundCount:  [number, number];
  foregroundCount: [number, number];
  skyCount:        [number, number];
}> = {
  busy:     { backgroundCount: [3, 5], midgroundCount: [3, 5], foregroundCount: [2, 4], skyCount: [2, 4] },
  calm:     { backgroundCount: [2, 3], midgroundCount: [1, 3], foregroundCount: [1, 2], skyCount: [1, 3] },
  dramatic: { backgroundCount: [1, 2], midgroundCount: [0, 2], foregroundCount: [0, 1], skyCount: [0, 2] },
};

// ── Color palettes ────────────────────────────────────────────────────────────

const COLORS: Record<TimeOfDay, { sky: string; ground: string }> = {
  day:     { sky: '#c8dff0',  ground: '#8b7355' },
  morning: { sky: '#f5c89a',  ground: '#8b7355' },
  evening: { sky: '#e8734a',  ground: '#6b5340' },
  night:   { sky: '#1a1a2e',  ground: '#2d2d2d' },
};

// ── Actor sizing ──────────────────────────────────────────────────────────────
// Canonical heights in world units per actor type

const ACTOR_HEIGHTS: Record<string, number> = {
  car:      1.8,
  jeep:     1.8,
  sedan:    1.5,
  forklift: 2.2,
  human:    1.75,
};

const ACTOR_SVG_HEIGHTS: Record<string, number> = {
  car:      250,
  jeep:     250,
  sedan:    250,
  forklift: 354.63,
  human:    500,
};

// ── Main resolver ─────────────────────────────────────────────────────────────

export const resolveIntent = (prompt: ScenePrompt): SceneIntent => {
  const { environment, mood, timeOfDay, actors, duration } = prompt;
  const pools   = ENVIRONMENT_POOLS[environment] ?? ENVIRONMENT_POOLS.cityscape;
  const density = MOOD_DENSITY[mood];
  const colors  = COLORS[timeOfDay];
  const skyPool = SKY_POOLS[timeOfDay];
  const fps     = 30;

  // ── Layer intents ─────────────────────────────────────────────────────────
  const layers: LayerIntent[] = [
    {
      depth:     2,
      assetPool: pools.background,
      minCount:  density.backgroundCount[0],
      maxCount:  density.backgroundCount[1],
      allowFlip: false,   // buildings shouldn't flip
    },
    {
      depth:     1,
      assetPool: pools.midground,
      minCount:  density.midgroundCount[0],
      maxCount:  density.midgroundCount[1],
      allowFlip: true,
    },
    {
      depth:     0,
      assetPool: pools.foreground,
      minCount:  density.foregroundCount[0],
      maxCount:  density.foregroundCount[1],
      allowFlip: true,
    },
  ];

  // ── Sky elements (always pick a few from the pool) ────────────────────────
  // The exact selection happens in generateLayout with the seed.
  // Here we just provide the full eligible pool.
  const skyElements = skyPool;

  // ── Actor intents ─────────────────────────────────────────────────────────
  const totalFrames = duration * fps;

  const actorIntents: ActorIntent[] = actors.map((actor, i) => {
    const canonicalH = ACTOR_HEIGHTS[actor.variant ?? actor.type] ?? 1.8;
    const svgH       = ACTOR_SVG_HEIGHTS[actor.variant ?? actor.type] ?? 250;
    const scale      = (canonicalH * pxPerWu) / svgH;

    // Stagger actor start times slightly so they don't all enter simultaneously
    const staggerFrames = i * 20;
    const startFrame    = staggerFrames;
    const endFrame      = totalFrames;

    // Entry and exit positions based on entry direction
    const offscreenLeft  = worldXToPx(-2);
    const offscreenRight = worldXToPx(22);

    const entryX = actor.entry === 'right' ? offscreenRight
                 : actor.entry === 'already_present' ? worldXToPx(10)
                 : offscreenLeft;

    const exitX  = actor.entry === 'right' ? offscreenLeft
                 : actor.entry === 'already_present' ? worldXToPx(10)
                 : offscreenRight;

    return {
      actorPrompt: actor,
      startFrame,
      endFrame,
      entryX,
      exitX,
      groundY: GROUND_Y_PX,
      scale,
    };
  });

  return {
    environment,
    timeOfDay,
    mood,
    layers,
    skyElements,
    groundColor:  colors.ground,
    skyColor:     colors.sky,
    actorIntents,
  };
};