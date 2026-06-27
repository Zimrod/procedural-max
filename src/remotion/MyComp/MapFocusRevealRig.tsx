// src/remotion/MyComp/MapFocusRevealRig.tsx

import React, { useEffect, useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from 'remotion';

type Pivot = { x: number; y: number };

type PivotSet = {
  pivot_ground?: Pivot;
  pivot_top_world?: Pivot;
  pivot_top_africa?: Pivot;
  pivot_ground_africa?: Pivot;
};

type SvgAsset = {
  inner: string;
  pivots: PivotSet;
};

// -----------------------------
// Pivot extraction
// -----------------------------
const getPivot = (doc: Document, id: string): Pivot | undefined => {
  const el = doc.getElementById(id);
  if (!el) return undefined;
  return {
    x: parseFloat(el.getAttribute('cx') || '0'),
    y: parseFloat(el.getAttribute('cy') || '0'),
  };
};

const extractPivots = (doc: Document): PivotSet => ({
  pivot_ground: getPivot(doc, 'pivot_ground'),
  pivot_top_world: getPivot(doc, 'pivot_top_world'),
  pivot_top_africa: getPivot(doc, 'pivot_top_africa'),
  pivot_ground_africa: getPivot(doc, 'pivot_ground_africa'),
});

// -----------------------------
// Component
// -----------------------------
export const MapFocusRevealRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const [world, setWorld] = useState<SvgAsset | null>(null);
  const [africa, setAfrica] = useState<SvgAsset | null>(null);

  // -----------------------------
  // Load SVGs
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      const [worldRes, africaRes] = await Promise.all([
        fetch(staticFile('world-map-outline/rest_of_world.svg')),
        fetch(staticFile('world-map-outline/africa.svg')),
      ]);

      const [worldText, africaText] = await Promise.all([
        worldRes.text(),
        africaRes.text(),
      ]);

      const parser = new DOMParser();

      const worldDoc = parser.parseFromString(worldText, 'image/svg+xml');
      const africaDoc = parser.parseFromString(africaText, 'image/svg+xml');

      setWorld({
        inner: worldDoc.querySelector('svg')?.innerHTML ?? '',
        pivots: extractPivots(worldDoc),
      });

      setAfrica({
        inner: africaDoc.querySelector('svg')?.innerHTML ?? '',
        pivots: extractPivots(africaDoc),
      });
    };

    load();
  }, []);

  if (!world || !africa) return null;

  // -----------------------------
  // Validate pivots
  // -----------------------------
  const wg = world.pivots.pivot_ground;
  const wt = world.pivots.pivot_top_world;
  const wga = world.pivots.pivot_ground_africa;

  const ag = africa.pivots.pivot_ground_africa;
  const at = africa.pivots.pivot_top_africa;

  if (!wg || !wt || !wga || !ag || !at) {
    console.error('Missing required pivots');
    return null;
  }

  // -----------------------------
  // Normalize heights
  // -----------------------------
  const worldHeight = wt.y - wg.y;

  const TARGET_HEIGHT = height * 0.7;

  // IMPORTANT: same scale for both → keeps alignment stable
  const baseScale = TARGET_HEIGHT / worldHeight;

  // -----------------------------
  // World placement
  // -----------------------------
  const CX = width / 2;
  const GROUND_Y = height * 0.8;

  const worldTX = CX - wg.x * baseScale;
  const worldTY = GROUND_Y - wg.y * baseScale;

  // -----------------------------
  // Africa alignment (relative)
  // -----------------------------
  const africaTX =
    worldTX +
    (wga.x * baseScale - ag.x * baseScale);

  const africaTY =
    worldTY +
    (wga.y * baseScale - ag.y * baseScale);

  // -----------------------------
  // Animation
  // -----------------------------
  const fadeIn = interpolate(frame, [0, 20], [0, 1]);

  const zoom = interpolate(frame, [20, 80], [1, 1.8], {
    extrapolateRight: 'clamp',
  });

  const africaFade = interpolate(frame, [40, 80], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const worldFade = interpolate(frame, [40, 80], [1, 0], {
    extrapolateRight: 'clamp',
  });

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <svg width={width} height={height}>
      {/* WORLD */}
      <g
        transform={`
          translate(${worldTX}, ${worldTY})
          scale(${baseScale * zoom})
        `}
        opacity={fadeIn * worldFade}
      >
        <g dangerouslySetInnerHTML={{ __html: world.inner }} />
      </g>

      {/* AFRICA */}
      <g
        transform={`
          translate(${africaTX}, ${africaTY})
          scale(${baseScale * zoom})
        `}
        opacity={africaFade}
      >
        <g dangerouslySetInnerHTML={{ __html: africa.inner }} />
      </g>
    </svg>
  );
};