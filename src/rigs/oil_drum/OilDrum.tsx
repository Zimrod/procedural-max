import React, { useEffect, useState } from "react";
import { staticFile, delayRender, continueRender } from "remotion";

// ─── Pivot constants (from oil_drum.svg) ─────────────────────────────────────
// Single source of truth — createOilDrumEntity imports from here.

export const OIL_DRUM_PIVOTS = {
  pivot_ground:              { x: 57.85,  y: 158.75 },
  pivot_bottom_left_edge:    { x: 2.47,   y: 158.75 },
  pivot_bottom_right_edge:   { x: 131.88, y: 158.75 },
};

export const OIL_DRUM_VB = { w: 134.35, h: 161.22 };

// ─── Types ────────────────────────────────────────────────────────────────────

type SvgPart = {
  markup: string;
  viewBox: { w: number; h: number };
  pivots: Record<string, { x: number; y: number }>;
};

type Props = {
  x: number;
  y: number;
  scale?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseSvg = (text: string): SvgPart => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svgEl = doc.querySelector("svg")!;
  const [, , w, h] = (svgEl.getAttribute("viewBox") ?? "0 0 100 100")
    .split(" ")
    .map(Number);

  const pivots: Record<string, { x: number; y: number }> = {};
  svgEl.querySelectorAll('circle[id*="pivot"]').forEach((el) => {
    pivots[el.getAttribute("id")!] = {
      x: parseFloat(el.getAttribute("cx") ?? "0"),
      y: parseFloat(el.getAttribute("cy") ?? "0"),
    };
    el.remove();
  });

  return { markup: svgEl.innerHTML, viewBox: { w, h }, pivots };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const OilDrum: React.FC<Props> = ({ x, y, scale = 1 }) => {
  const [part, setPart] = useState<SvgPart | null>(null);

  useEffect(() => {
    const handle = delayRender("Loading oil drum SVG");
    fetch(staticFile("oil_drum/oil_drum.svg"))
      .then((r) => r.text())
      .then((text) => {
        setPart(parseSvg(text));
        continueRender(handle);
      })
      .catch((err) => {
        console.error("OilDrum SVG load failed:", err);
        continueRender(handle);
      });
  }, []);

  if (!part) return null;

  const pivot = OIL_DRUM_PIVOTS.pivot_ground;

  return (
    <svg
      style={{ position: "absolute", overflow: "visible", top: 0, left: 0 }}
      width="100%"
      height="100%"
    >
      <g
        transform={`translate(${x - pivot.x * scale}, ${y - pivot.y * scale}) scale(${scale})`}
        dangerouslySetInnerHTML={{ __html: part.markup }}
      />
    </svg>
  );
};