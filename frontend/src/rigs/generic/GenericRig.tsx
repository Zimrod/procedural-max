// src/rigs/generic/GenericRig.tsx
//
// Renders any static SVG asset from the asset registry.
// This is the "no moving parts" rig — buildings, trees, benches, clouds.
// For assets with animation (forklift, human) use their dedicated rigs.
//
// Puppeteer passes x, y, scale, assetId through entity.transform + entity.props.
// The rig loads the SVG, pins pivot_ground (or the asset's pivotName) to (x, y),
// and renders it. That's all.

import React, { useEffect, useState } from 'react';
import { staticFile, delayRender, continueRender } from 'remotion';
import { assetRegistry } from '../../core/world/assetRegistry';

interface SvgData {
  markup:  string;
  viewBox: { w: number; h: number };
  pivots:  Map<string, { x: number; y: number }>;
}

const parseSvg = (text: string): SvgData => {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(text, 'image/svg+xml');
  const svgEl  = doc.querySelector('svg')!;
  const [, , w, h] = (svgEl.getAttribute('viewBox') ?? '0 0 192 108').split(' ').map(Number);

  const pivots = new Map<string, { x: number; y: number }>();
  svgEl.querySelectorAll('circle[id*="pivot"]').forEach((el) => {
    pivots.set(el.getAttribute('id')!, {
      x: parseFloat(el.getAttribute('cx') ?? '0'),
      y: parseFloat(el.getAttribute('cy') ?? '0'),
    });
    el.remove();
  });

  // Fallback pivot: bottom-centre of viewBox (good default for ground-anchored assets)
  if (pivots.size === 0) {
    pivots.set('pivot_ground', { x: w / 2, y: h });
  }

  return { markup: svgEl.innerHTML, viewBox: { w, h }, pivots };
};

type Props = {
  x:       number;
  y:       number;
  scale?:  number;
  assetId: string;
  flipX?:  boolean;
  zIndex?: number;
};

export const GenericRig: React.FC<Props> = ({
  x,
  y,
  scale = 1,
  assetId,
  flipX = false,
}) => {
  const [svgData, setSvgData] = useState<SvgData | null>(null);

  const asset = (assetRegistry as Record<string, any>)[assetId];

  // ── ADD THIS ──
//   console.log(`[GenericRig] mount`, { assetId, x, y, scale, hasAsset: !!asset });
  // ─────────────

  useEffect(() => {
    if (!asset) {
      console.warn(`[GenericRig] Unknown assetId: "${assetId}"`);
      return;
    }

    const handle = delayRender(`GenericRig: loading ${assetId}`);
    // console.log(`[GenericRig] fetching`, staticFile(asset.path));
    fetch(staticFile(asset.path))
      .then((r) => r.text())
      .then((text) => {
        setSvgData(parseSvg(text));
        // ── ADD THIS ──
        // console.log(`[GenericRig] loaded ${assetId}`, { pivots: [...parseSvg(text).pivots.keys()] });
        // ─────────────
        continueRender(handle);
      })
      .catch((err) => {
        console.error(`[GenericRig] FETCH FAILED for ${assetId}`, {
          path: asset.path,
          fullUrl: staticFile(asset.path),
          err: err.message,
        });
        continueRender(handle);
      });
  }, [assetId]);

  if (!svgData || !asset) return null;

  // Pin the asset's anchor pivot to (x, y)
  const pivot = svgData.pivots.get(asset.pivotName)
    ?? svgData.pivots.get('pivot_ground')
    ?? { x: svgData.viewBox.w / 2, y: svgData.viewBox.h };

  const tx = x - pivot.x * scale;
  const ty = y - pivot.y * scale;

  const flipTransform = flipX
    ? `translate(${x * 2}, 0) scale(-1, 1)`
    : '';

  return (
    <svg
      style={{ position: 'absolute', overflow: 'visible', top: 0, left: 0 }}
      width="100%"
      height="100%"
    >
      <g transform={flipTransform}>
        <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>
          <g vectorEffect="non-scaling-stroke">
            <g dangerouslySetInnerHTML={{ __html: svgData.markup }} />
          </g>
        </g>
      </g>
    </svg>
  );
};