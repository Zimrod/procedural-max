// src/rigs/car/CarDriveRig.tsx
//
// Parametric rig for a driving vehicle.
// Receives x, y, scale from Puppeteer — x/y are the pivot_ground world position.
// pivot_ground sits at the bottom of the front wheel in the body SVG.
//
// Unlike the standalone CarDrive.tsx, this rig:
//   - Does NOT own its own frame/position logic (Puppeteer drives that via presets)
//   - Derives wheel positions from SVG pivots (pivot_back, pivot_front on body)
//   - Uses the world unit scale from assetRegistry
//   - Works at 1920×1080

import React, { useEffect, useState } from 'react';
import { staticFile, delayRender, continueRender } from 'remotion';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PartData {
  markup:  string;
  viewBox: { w: number; h: number };
  pivots:  Map<string, { x: number; y: number }>;
}

type Props = {
  x:       number;   // canvas px — pivot_ground world position
  y:       number;   // canvas px — ground line
  scale?:  number;   // from assetRegistry scaleForAsset()
  // Which SVG files to load — passed from schema entity props
  bodySvg:       string;
  wheelBackSvg:  string;
  wheelFrontSvg: string;
  // Animation values from presets
  wheelRotDeg?:  number;   // back wheel rotation (degrees)
  shakePx?:      number;   // vertical shake offset
  flipX?:        boolean;  // mirror for right-to-left
};

// ── SVG helpers ───────────────────────────────────────────────────────────────

const parseSvg = (text: string): PartData => {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(text, 'image/svg+xml');
  const svgEl  = doc.querySelector('svg')!;
  const [, , w, h] = (svgEl.getAttribute('viewBox') ?? '0 0 500 500').split(' ').map(Number);

  const pivots = new Map<string, { x: number; y: number }>();
  svgEl.querySelectorAll('circle[id*="pivot"]').forEach((el) => {
    pivots.set(el.getAttribute('id')!, {
      x: parseFloat(el.getAttribute('cx') ?? '0'),
      y: parseFloat(el.getAttribute('cy') ?? '0'),
    });
    el.remove();
  });

  // Apply non-scaling-stroke so strokes don't balloon at high scale
  svgEl.querySelectorAll('path,rect,circle,line,polyline,ellipse,polygon').forEach((el) => {
    el.setAttribute('vector-effect', 'non-scaling-stroke');
  });

  // Fallback pivots if SVG has none
  if (!pivots.has('pivot_ground')) pivots.set('pivot_ground', { x: w / 2, y: h });
  if (!pivots.has('pivot'))        pivots.set('pivot',        { x: w / 2, y: h / 2 });

  return { markup: svgEl.innerHTML, viewBox: { w, h }, pivots };
};

// ── Part renderer ─────────────────────────────────────────────────────────────

const renderPart = (
  data: PartData,
  scale: number,
  anchorX: number,
  anchorY: number,
  rotateDeg: number,
  pivotId: string
): React.ReactElement | null => {
  const pivot = data.pivots.get(pivotId) ?? data.pivots.get('pivot') ?? { x: data.viewBox.w / 2, y: data.viewBox.h / 2 };
  const tx = anchorX - pivot.x * scale;
  const ty = anchorY - pivot.y * scale;

  return (
    <g transform={`rotate(${rotateDeg}, ${anchorX}, ${anchorY})`}>
      <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>
        <g dangerouslySetInnerHTML={{ __html: data.markup }} />
      </g>
    </g>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

export const CarDriveRig: React.FC<Props> = ({
  x,
  y,
  scale = 1,
  bodySvg,
  wheelBackSvg,
  wheelFrontSvg,
  wheelRotDeg = 0,
  shakePx = 0,
  flipX = false,
}) => {
  const [body,  setBody]  = useState<PartData | null>(null);
  const [wBack, setWBack] = useState<PartData | null>(null);
  const [wFront,setWFront]= useState<PartData | null>(null);

  useEffect(() => {
    const handle = delayRender('CarDriveRig: loading SVGs');
    Promise.all([
      fetch(staticFile(bodySvg)).then(r => r.text()),
      fetch(staticFile(wheelBackSvg)).then(r => r.text()),
      fetch(staticFile(wheelFrontSvg)).then(r => r.text()),
    ])
      .then(([bText, wbText, wfText]) => {
        setBody(parseSvg(bText));
        setWBack(parseSvg(wbText));
        setWFront(parseSvg(wfText));
        continueRender(handle);
      })
      .catch(err => {
        console.error('CarDriveRig: SVG load failed', err);
        continueRender(handle);
      });
  }, [bodySvg, wheelBackSvg, wheelFrontSvg]);

  if (!body || !wBack || !wFront) return null;

  // pivot_ground on the body SVG is the anchor — pinned to (x, y)
  const groundPivot  = body.pivots.get('pivot_ground')!;
  const backPivot    = body.pivots.get('pivot_back')
    ?? body.pivots.get('pivot_wheel_back')
    ?? groundPivot;
  const frontPivot   = body.pivots.get('pivot_front')
    ?? body.pivots.get('pivot_wheel_front')
    ?? groundPivot;

  // Body offset: translate so pivot_ground lands at (x, y + shakePx)
  const bodyAnchorX = x;
  const bodyAnchorY = y + shakePx;

  // Wheel world positions derived from body pivots
  const backWheelX  = x + (backPivot.x  - groundPivot.x) * scale;
  const backWheelY  = y + (backPivot.y  - groundPivot.y) * scale;
  const frontWheelX = x + (frontPivot.x - groundPivot.x) * scale;
  const frontWheelY = y + (frontPivot.y - groundPivot.y) * scale;

  const flipTransform = flipX
    ? `scale(-1,1) translate(${-2 * x}, 0)`
    : '';

  return (
    <svg
      style={{ position: 'absolute', overflow: 'visible', top: 0, left: 0 }}
      width="100%"
      height="100%"
    >
      <g transform={flipTransform}>
        {/* Wheels behind body */}
        {renderPart(wBack,  scale, backWheelX,  backWheelY,  wheelRotDeg, 'pivot')}
        {renderPart(wFront, scale, frontWheelX, frontWheelY, wheelRotDeg, 'pivot')}
        {/* Body */}
        {renderPart(body, scale, bodyAnchorX, bodyAnchorY, 0, 'pivot_ground')}
      </g>
    </svg>
  );
};