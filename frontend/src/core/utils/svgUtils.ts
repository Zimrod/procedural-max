// src/core/utils/svgUtils.ts

export interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

export const parsePart = (svgText: string, partName: string): PartData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error(`Invalid SVG for ${partName}`);

  const viewBoxAttr = svgEl.getAttribute('viewBox') || '0 0 100 100';
  const [,, w, h] = viewBoxAttr.split(' ').map(Number);

  const pivotMap = new Map<string, { x: number; y: number }>();
  // Find circles used as pivot markers in the SVG
  doc.querySelectorAll('circle[id^="pivot_"]').forEach((el) => {
    const id = el.getAttribute('id')!;
    const x = parseFloat(el.getAttribute('cx') || '0');
    const y = parseFloat(el.getAttribute('cy') || '0');
    pivotMap.set(id, { x, y });
  });

  return { svgText, viewBox: { w, h }, pivots: pivotMap };
};

export const getPivot = (data: PartData, id: string) => {
  const p = data.pivots.get(id);
  if (!p) throw new Error(`Missing pivot ${id}`);
  return p;
};