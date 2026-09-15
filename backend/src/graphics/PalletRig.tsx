import React, { useEffect, useState } from 'react';
import { staticFile, delayRender, continueRender } from 'remotion';

const CANVAS_SIZE = 800;
type PartData = { svgText: string; viewBox: { w: number; h: number }; pivots: Map<string, { x: number; y: number }> };

const parsePallet = (svgText: string): PartData => {
  const svgEl = new DOMParser().parseFromString(svgText, 'image/svg+xml').querySelector('svg');
  if (!svgEl) throw new Error('Invalid SVG for pallet');
  const vb = svgEl.getAttribute('viewBox')?.split(/\s+/).map(Number);
  const viewBox = vb ? { w: vb[2], h: vb[3] } : { w: 500, h: 500 };
  const pivots = new Map<string, { x: number; y: number }>();
  svgEl.querySelectorAll('circle[id*="pivot"]').forEach((el) => {
    const id = el.getAttribute('id')!;
    pivots.set(id, { x: parseFloat(el.getAttribute('cx') ?? '0'), y: parseFloat(el.getAttribute('cy') ?? '0') });
    el.remove();
  });
  if (!pivots.size) pivots.set('pivot_ground', { x: viewBox.w / 2, y: viewBox.h });
  return { svgText: svgEl.innerHTML, viewBox, pivots };
};

export const PalletRig: React.FC<{ x?: number; y?: number; position?: { x?: number; y?: number }; opacity?: number; anchorX?: number; anchorY?: number; scale?: number; rotateDeg?: number; pivotId?: string; palletPath?: string }> = ({ x, y, position, opacity = 1, anchorX = CANVAS_SIZE / 2, anchorY = CANVAS_SIZE / 2, scale = 1, rotateDeg = 0, pivotId = 'pivot_ground', palletPath = 'pallet/pallet.svg' }) => {
  const [pallet, setPallet] = useState<PartData | null>(null);
  useEffect(() => {
    const handle = delayRender('Loading Pallet SVG');
    fetch(staticFile(palletPath)).then((r) => r.text()).then((text) => { setPallet(parsePallet(text)); continueRender(handle); }).catch((err) => { console.error('Failed to load Pallet SVG:', err); continueRender(handle); });
  }, [palletPath]);
  if (!pallet) return null;
  const ax = position?.x ?? x ?? anchorX;
  const ay = position?.y ?? y ?? anchorY;
  const pivot = pallet.pivots.get(pivotId) ?? pallet.pivots.get('pivot_ground') ?? Array.from(pallet.pivots.values())[0] ?? { x: pallet.viewBox.w / 2, y: pallet.viewBox.h / 2 };
  const finalScale = (CANVAS_SIZE * 0.5 * scale) / pallet.viewBox.w;
  return <svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} style={{ overflow: 'visible', opacity }} xmlns="http://www.w3.org/2000/svg"><g transform={`rotate(${rotateDeg}, ${ax}, ${ay})`}><g transform={`translate(${ax - pivot.x * finalScale}, ${ay - pivot.y * finalScale}) scale(${finalScale})`}><g dangerouslySetInnerHTML={{ __html: pallet.svgText }} /></g></g></svg>;
};
