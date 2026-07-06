import React, { useEffect, useState } from "react";
import { staticFile, delayRender, continueRender } from "remotion";

// ─── SVG pivot constants ──────────────────────────────────────────────────────

export const BODY_PIVOTS = {
  pivot_ground:      { x: 190.11, y: 348.38 },
  pivot_fork_min:    { x: 7.8,    y: 301.94 },
  pivot_fork_max:    { x: 7.8,    y: 168.94 },
  pivot_wheel_front: { x: 68,     y: 301.94 },
  pivot_wheel_back:  { x: 291.66, y: 310.46 },
};

export const FORK_PIVOTS = {
  pivot_fork_tip:  { x: 1.56,   y: 137.1 },
  pivot_fork_root: { x: 163.05, y: 135.5 },
  pivot_fork_min:  { x: 193.06, y: 135.5 },
  pivot_fork_max:  { x: 193.06, y: 2.5   },
};

export const WHEEL_BACK_PIVOTS  = { pivot_wheel_back:  { x: 39.08, y: 40.03 } };
export const WHEEL_FRONT_PIVOTS = { pivot_wheel_front: { x: 47.19, y: 46.5  } };
export const WHEEL_BACK_VB      = { w: 78.51,  h: 78.51  };
export const WHEEL_FRONT_VB     = { w: 93.63,  h: 93.63  };

// ─── Types ────────────────────────────────────────────────────────────────────

type SvgPart = {
  markup: string;
  viewBox: { w: number; h: number };
  pivots: Record<string, { x: number; y: number }>;
};

type Parts = {
  body: SvgPart;
  fork: SvgPart;
  wheelBack: SvgPart;
  wheelFront: SvgPart;
};

type Props = {
  x: number;
  y: number;
  // Raw carriage Y offset from pivot_ground in world pixels.
  // Falls back to rest position (pivot_fork_min) when absent.
  forkCarriageOffsetY?: number;
  // Individual wheel rotations in degrees.
  // ForkliftScene computes these separately since wheel radii differ.
  wheelBackRotDeg?: number;
  wheelFrontRotDeg?: number;
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

const SvgPart: React.FC<{
  part: SvgPart;
  scale: number;
  anchorX: number;
  anchorY: number;
  pivotId: string;
  rotateDeg?: number;
}> = ({ part, scale, anchorX, anchorY, pivotId, rotateDeg = 0 }) => {
  const pivot = part.pivots[pivotId];
  if (!pivot) return null;
  return (
    <g transform={`rotate(${rotateDeg}, ${anchorX}, ${anchorY})`}>
      <g
        transform={`translate(${anchorX - pivot.x * scale}, ${anchorY - pivot.y * scale}) scale(${scale})`}
        dangerouslySetInnerHTML={{ __html: part.markup }}
      />
    </g>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Forklift: React.FC<Props> = ({
  x,
  y,
  forkCarriageOffsetY,
  wheelBackRotDeg = 0,
  wheelFrontRotDeg = 0,
  scale = 1,
}) => {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const handle = delayRender("Loading forklift SVGs");
    Promise.all([
      fetch(staticFile("forklift/forklift_body.svg")).then((r) => r.text()),
      fetch(staticFile("forklift/forklift_fork.svg")).then((r) => r.text()),
      fetch(staticFile("forklift/forklift_wheel_back.svg")).then((r) => r.text()),
      fetch(staticFile("forklift/forklift_wheel_front.svg")).then((r) => r.text()),
    ])
      .then(([bodyText, forkText, wbText, wfText]) => {
        setParts({
          body:       parseSvg(bodyText),
          fork:       parseSvg(forkText),
          wheelBack:  parseSvg(wbText),
          wheelFront: parseSvg(wfText),
        });
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Forklift SVG load failed:", err);
        continueRender(handle);
      });
  }, []);

  if (!parts) return null;

  const { body, fork, wheelBack, wheelFront } = parts;

  const gx = BODY_PIVOTS.pivot_ground.x;
  const gy = BODY_PIVOTS.pivot_ground.y;
  const worldOffset = (svgX: number, svgY: number) => ({
    x: x + (svgX - gx) * scale,
    y: y + (svgY - gy) * scale,
  });

  // Fork carriage Y — use raw offset from preset when available,
  // otherwise default to rest position (pivot_fork_min).
  const restOffsetY = (BODY_PIVOTS.pivot_fork_min.y - gy) * scale;
  const carriageOffsetY = forkCarriageOffsetY ?? restOffsetY;

  const forkCarriage = {
    x: x + (BODY_PIVOTS.pivot_fork_min.x - gx) * scale,
    y: y + carriageOffsetY,
  };

  const wheelBackPos  = worldOffset(BODY_PIVOTS.pivot_wheel_back.x,  BODY_PIVOTS.pivot_wheel_back.y);
  const wheelFrontPos = worldOffset(BODY_PIVOTS.pivot_wheel_front.x, BODY_PIVOTS.pivot_wheel_front.y);

  return (
    <svg
      style={{ position: "absolute", overflow: "visible", top: 0, left: 0 }}
      width="100%"
      height="100%"
    >
      {/* Wheels — rotate around their own centre pivot */}
      <SvgPart
        part={wheelBack}
        scale={scale}
        anchorX={wheelBackPos.x}
        anchorY={wheelBackPos.y}
        pivotId="pivot_wheel_back"
        rotateDeg={wheelBackRotDeg}
      />
      <SvgPart
        part={wheelFront}
        scale={scale}
        anchorX={wheelFrontPos.x}
        anchorY={wheelFrontPos.y}
        pivotId="pivot_wheel_front"
        rotateDeg={wheelFrontRotDeg}
      />
      {/* Body */}
      <SvgPart
        part={body}
        scale={scale}
        anchorX={x}
        anchorY={y}
        pivotId="pivot_ground"
      />
      {/* Fork — pinned at pivot_fork_min, rides the carriage */}
      <SvgPart
        part={fork}
        scale={scale}
        anchorX={forkCarriage.x}
        anchorY={forkCarriage.y}
        pivotId="pivot_fork_min"
      />
    </svg>
  );
};