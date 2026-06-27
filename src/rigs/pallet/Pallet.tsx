import React, { useEffect, useState } from "react";
import { staticFile, delayRender, continueRender } from "remotion";

// ─── Pivot constants (from pallet.svg) ───────────────────────────────────────
// Single source of truth — createPalletEntity imports from here.

export const PALLET_PIVOTS = {
  pivot_ground:          { x: 191.27, y: 39.2  },
  pivot_fork_root:       { x: 262.36, y: 10.46 },
  pivot_fork_tip:        { x: 283.02, y: 24.14 },
  pivot_top_left_edge:   { x: 3.25,   y: 3.4   },
  pivot_top_right_edge:  { x: 261.4,  y: 3.25  },
};

export const PALLET_VB = { w: 285.86, h: 45.34 };

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

export const Pallet: React.FC<Props> = ({ x, y, scale = 1 }) => {
  const [part, setPart] = useState<SvgPart | null>(null);

  useEffect(() => {
    const handle = delayRender("Loading pallet SVG");
    fetch(staticFile("pallet/pallet.svg"))
      .then((r) => r.text())
      .then((text) => {
        setPart(parseSvg(text));
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Pallet SVG load failed:", err);
        continueRender(handle);
      });
  }, []);

  if (!part) return null;

  const pivot = PALLET_PIVOTS.pivot_ground;

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