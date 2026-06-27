import React, {useEffect, useMemo, useState} from "react";
import {
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Point = {x: number; y: number};

type CubicSegment = {
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
};

type MorphNode = {
  anchor: Point;
  inHandle: Point;
  outHandle: Point;
};

interface MorphShapeData {
  nodes: MorphNode[];
  pivots: Point[];
  fill: string;
  stroke: string;
  strokeWidth: number;
}

const TARGET_NODE_COUNT = 8;

const add = (a: Point, b: Point): Point => ({x: a.x + b.x, y: a.y + b.y});
const sub = (a: Point, b: Point): Point => ({x: a.x - b.x, y: a.y - b.y});
const scale = (p: Point, factor: number): Point => ({x: p.x * factor, y: p.y * factor});
const lerpPoint = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const distanceSq = (a: Point, b: Point) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

const parseNumber = (value: string | null | undefined, fallback = 0) => {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getSelectorsForPivot = (index: number) => [
  `#pivot_${index}`,
  `#pivot_x5F_${index}`,
  `[id="pivot_${index}_1_"]`,
  `[id="pivot_x5F_${index}_1_"]`,
];

const parsePivots = (doc: Document) => {
  const pivots: Point[] = [];

  for (let i = 1; i <= TARGET_NODE_COUNT; i++) {
    let pivotEl: Element | null = null;

    for (const selector of getSelectorsForPivot(i)) {
      pivotEl = doc.querySelector(selector);
      if (pivotEl) break;
    }

    if (!pivotEl) {
      throw new Error(`Missing pivot_${i} marker in morph SVG.`);
    }

    pivots.push({
      x: parseNumber(pivotEl.getAttribute("cx")),
      y: parseNumber(pivotEl.getAttribute("cy")),
    });
  }

  return pivots;
};

const parseTranslate = (transform: string | null) => {
  if (!transform) return {x: 0, y: 0};

  const match = transform.match(/translate\(\s*([^\s,)]+)(?:[\s,]+([^\s,)]+))?\s*\)/i);
  if (!match) return {x: 0, y: 0};

  return {
    x: parseNumber(match[1]),
    y: parseNumber(match[2], 0),
  };
};

const getStyleValue = (el: Element, key: string) => {
  const inline = el.getAttribute(key);
  if (inline) return inline;

  const style = el.getAttribute("style");
  if (!style) return null;

  const rule = style
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}:`));

  return rule ? rule.split(":").slice(1).join(":").trim() : null;
};

const parseShapeStyle = (el: Element) => ({
  fill: getStyleValue(el, "fill") ?? "#754C29",
  stroke: getStyleValue(el, "stroke") ?? "#543315",
  strokeWidth: parseNumber(getStyleValue(el, "stroke-width"), 4),
});

const tokenizePathData = (d: string) => d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];

const cubicFromLine = (start: Point, end: Point): CubicSegment => ({
  p0: start,
  c1: lerpPoint(start, end, 1 / 3),
  c2: lerpPoint(start, end, 2 / 3),
  p3: end,
});

const pathToCubicSegments = (d: string) => {
  const tokens = tokenizePathData(d);
  const segments: CubicSegment[] = [];

  let i = 0;
  let command = "";
  let current: Point = {x: 0, y: 0};
  let subpathStart: Point = {x: 0, y: 0};
  let previousControl: Point | null = null;
  let previousCommand = "";

  const hasNumber = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]);
  const read = () => Number.parseFloat(tokens[i++]);

  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) {
      command = tokens[i++];
    }

    switch (command) {
      case "M":
      case "m": {
        const isRelative = command === "m";
        const first = {
          x: read(),
          y: read(),
        };
        current = isRelative ? add(current, first) : first;
        subpathStart = current;
        previousControl = null;
        previousCommand = command;

        while (hasNumber()) {
          const point = {x: read(), y: read()};
          const absolutePoint = isRelative ? add(current, point) : point;
          segments.push(cubicFromLine(current, absolutePoint));
          current = absolutePoint;
          previousCommand = isRelative ? "l" : "L";
        }
        break;
      }
      case "L":
      case "l": {
        const isRelative = command === "l";
        while (hasNumber()) {
          const point = {x: read(), y: read()};
          const absolutePoint = isRelative ? add(current, point) : point;
          segments.push(cubicFromLine(current, absolutePoint));
          current = absolutePoint;
        }
        previousControl = null;
        previousCommand = command;
        break;
      }
      case "H":
      case "h": {
        const isRelative = command === "h";
        while (hasNumber()) {
          const x = read();
          const end = {x: isRelative ? current.x + x : x, y: current.y};
          segments.push(cubicFromLine(current, end));
          current = end;
        }
        previousControl = null;
        previousCommand = command;
        break;
      }
      case "V":
      case "v": {
        const isRelative = command === "v";
        while (hasNumber()) {
          const y = read();
          const end = {x: current.x, y: isRelative ? current.y + y : y};
          segments.push(cubicFromLine(current, end));
          current = end;
        }
        previousControl = null;
        previousCommand = command;
        break;
      }
      case "C":
      case "c": {
        const isRelative = command === "c";
        while (hasNumber()) {
          const c1 = {x: read(), y: read()};
          const c2 = {x: read(), y: read()};
          const end = {x: read(), y: read()};
          const segment: CubicSegment = {
            p0: current,
            c1: isRelative ? add(current, c1) : c1,
            c2: isRelative ? add(current, c2) : c2,
            p3: isRelative ? add(current, end) : end,
          };
          segments.push(segment);
          current = segment.p3;
          previousControl = segment.c2;
        }
        previousCommand = command;
        break;
      }
      case "S":
      case "s": {
        const isRelative = command === "s";
        while (hasNumber()) {
          const c2 = {x: read(), y: read()};
          const end = {x: read(), y: read()};
          const c1 =
            previousCommand.toLowerCase() === "c" || previousCommand.toLowerCase() === "s"
              ? add(current, sub(current, previousControl ?? current))
              : current;

          const segment: CubicSegment = {
            p0: current,
            c1,
            c2: isRelative ? add(current, c2) : c2,
            p3: isRelative ? add(current, end) : end,
          };
          segments.push(segment);
          current = segment.p3;
          previousControl = segment.c2;
        }
        previousCommand = command;
        break;
      }
      case "Z":
      case "z": {
        if (distanceSq(current, subpathStart) > 0.0001) {
          segments.push(cubicFromLine(current, subpathStart));
        }
        current = subpathStart;
        previousControl = null;
        previousCommand = command;
        break;
      }
      default:
        throw new Error(`Unsupported SVG path command "${command}" in morph asset.`);
    }
  }

  return segments;
};

const splitCubic = (segment: CubicSegment): [CubicSegment, CubicSegment] => {
  const p01 = lerpPoint(segment.p0, segment.c1, 0.5);
  const p12 = lerpPoint(segment.c1, segment.c2, 0.5);
  const p23 = lerpPoint(segment.c2, segment.p3, 0.5);
  const p012 = lerpPoint(p01, p12, 0.5);
  const p123 = lerpPoint(p12, p23, 0.5);
  const pMid = lerpPoint(p012, p123, 0.5);

  return [
    {
      p0: segment.p0,
      c1: p01,
      c2: p012,
      p3: pMid,
    },
    {
      p0: pMid,
      c1: p123,
      c2: p23,
      p3: segment.p3,
    },
  ];
};

const subdivideSegmentsToCount = (segments: CubicSegment[], targetCount: number) => {
  let current = [...segments];

  while (current.length < targetCount) {
    if (targetCount % current.length !== 0) {
      throw new Error(`Cannot normalize ${current.length} path segments to ${targetCount} nodes.`);
    }

    current = current.flatMap((segment) => splitCubic(segment));
  }

  if (current.length !== targetCount) {
    throw new Error(`Expected ${targetCount} segments after subdivision, found ${current.length}.`);
  }

  return current;
};

const applyOffsetToSegments = (segments: CubicSegment[], offset: Point) =>
  segments.map((segment) => ({
    p0: add(segment.p0, offset),
    c1: add(segment.c1, offset),
    c2: add(segment.c2, offset),
    p3: add(segment.p3, offset),
  }));

const circleToCubicSegments = (cx: number, cy: number, r: number) => {
  const k = (4 / 3) * Math.tan(Math.PI / 8);

  return [
    {
      p0: {x: cx + r, y: cy},
      c1: {x: cx + r, y: cy + k * r},
      c2: {x: cx + k * r, y: cy + r},
      p3: {x: cx, y: cy + r},
    },
    {
      p0: {x: cx, y: cy + r},
      c1: {x: cx - k * r, y: cy + r},
      c2: {x: cx - r, y: cy + k * r},
      p3: {x: cx - r, y: cy},
    },
    {
      p0: {x: cx - r, y: cy},
      c1: {x: cx - r, y: cy - k * r},
      c2: {x: cx - k * r, y: cy - r},
      p3: {x: cx, y: cy - r},
    },
    {
      p0: {x: cx, y: cy - r},
      c1: {x: cx + k * r, y: cy - r},
      c2: {x: cx + r, y: cy - k * r},
      p3: {x: cx + r, y: cy},
    },
  ];
};

const segmentsToNodes = (segments: CubicSegment[]) =>
  segments.map((segment, index) => {
    const previousSegment = segments[(index - 1 + segments.length) % segments.length];
    return {
      anchor: segment.p0,
      inHandle: previousSegment.c2,
      outHandle: segment.c1,
    };
  });

const nodesToSegments = (nodes: MorphNode[]) =>
  nodes.map((node, index) => {
    const nextNode = nodes[(index + 1) % nodes.length];
    return {
      p0: node.anchor,
      c1: node.outHandle,
      c2: nextNode.inHandle,
      p3: nextNode.anchor,
    };
  });

const reverseNodes = (nodes: MorphNode[]) => {
  const reversedSegments = nodesToSegments(nodes)
    .map((segment) => ({
      p0: segment.p3,
      c1: segment.c2,
      c2: segment.c1,
      p3: segment.p0,
    }))
    .reverse();

  return segmentsToNodes(reversedSegments);
};

const rotateNodes = (nodes: MorphNode[], offset: number) =>
  nodes.map((_, index) => nodes[(index + offset) % nodes.length]);

const scoreNodeAlignment = (nodes: MorphNode[], pivots: Point[]) =>
  nodes.reduce((sum, node, index) => sum + distanceSq(node.anchor, pivots[index]), 0);

const alignNodesToPivots = (nodes: MorphNode[], pivots: Point[]) => {
  const orientations = [nodes, reverseNodes(nodes)];
  let bestNodes = nodes;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const orientation of orientations) {
    for (let offset = 0; offset < orientation.length; offset++) {
      const rotated = rotateNodes(orientation, offset);
      const score = scoreNodeAlignment(rotated, pivots);
      if (score < bestScore) {
        bestScore = score;
        bestNodes = rotated;
      }
    }
  }

  return bestNodes;
};

const getPrimaryShapeElement = (doc: Document) => {
  const candidates = Array.from(doc.querySelectorAll("path, circle, ellipse"));
  const shape = candidates.find((el) => {
    const id = el.getAttribute("id") ?? "";
    const fill = getStyleValue(el, "fill");
    return !id.startsWith("pivot_") && fill !== "none";
  });

  if (!shape) {
    throw new Error("No renderable path/circle/ellipse found in morph SVG.");
  }

  return shape;
};

const ellipseToCubicSegments = (cx: number, cy: number, rx: number, ry: number) => {
  const k = (4 / 3) * Math.tan(Math.PI / 8);

  return [
    {
      p0: {x: cx + rx, y: cy},
      c1: {x: cx + rx, y: cy + k * ry},
      c2: {x: cx + k * rx, y: cy + ry},
      p3: {x: cx, y: cy + ry},
    },
    {
      p0: {x: cx, y: cy + ry},
      c1: {x: cx - k * rx, y: cy + ry},
      c2: {x: cx - rx, y: cy + k * ry},
      p3: {x: cx - rx, y: cy},
    },
    {
      p0: {x: cx - rx, y: cy},
      c1: {x: cx - rx, y: cy - k * ry},
      c2: {x: cx - k * rx, y: cy - ry},
      p3: {x: cx, y: cy - ry},
    },
    {
      p0: {x: cx, y: cy - ry},
      c1: {x: cx + k * rx, y: cy - ry},
      c2: {x: cx + rx, y: cy - k * ry},
      p3: {x: cx + rx, y: cy},
    },
  ];
};

const parseMorphSvg = (svgText: string): MorphShapeData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const pivots = parsePivots(doc);
  const shapeEl = getPrimaryShapeElement(doc);
  const style = parseShapeStyle(shapeEl);
  const offset = parseTranslate(shapeEl.getAttribute("transform"));

  let segments: CubicSegment[];

  if (shapeEl.tagName === "path") {
    const d = shapeEl.getAttribute("d");
    if (!d) throw new Error("Path morph source is missing a d attribute.");
    segments = applyOffsetToSegments(pathToCubicSegments(d), offset);
  } else if (shapeEl.tagName === "circle") {
    const cx = parseNumber(shapeEl.getAttribute("cx"));
    const cy = parseNumber(shapeEl.getAttribute("cy"));
    const r = parseNumber(shapeEl.getAttribute("r"));
    segments = applyOffsetToSegments(circleToCubicSegments(cx, cy, r), offset);
  } else if (shapeEl.tagName === "ellipse") {
    const cx = parseNumber(shapeEl.getAttribute("cx"));
    const cy = parseNumber(shapeEl.getAttribute("cy"));
    const rx = parseNumber(shapeEl.getAttribute("rx"));
    const ry = parseNumber(shapeEl.getAttribute("ry"));
    segments = applyOffsetToSegments(ellipseToCubicSegments(cx, cy, rx, ry), offset);
  } else {
    throw new Error(`Unsupported SVG element "${shapeEl.tagName}" in morph asset.`);
  }

  const normalizedSegments = subdivideSegmentsToCount(segments, TARGET_NODE_COUNT);
  const alignedNodes = alignNodesToPivots(segmentsToNodes(normalizedSegments), pivots);

  return {
    nodes: alignedNodes,
    pivots,
    ...style,
  };
};

const pointToSvgString = (point: Point) => `${point.x} ${point.y}`;

export const PathMorphRig: React.FC<{
  circleFilename?: string;
  smileFilename?: string;
  cycleDurationSeconds?: number;
  showDebugPivots?: boolean;
}> = ({
  circleFilename = "emoji_circle.svg",
  smileFilename = "smile_ellipse.svg",
  cycleDurationSeconds = 2.5,
  showDebugPivots = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const [shapes, setShapes] = useState<{
    circle: MorphShapeData;
    smile: MorphShapeData;
  } | null>(null);

  useEffect(() => {
    const handle = delayRender("Synchronizing vector morph layers...");

    Promise.all([
      fetch(staticFile(`emoji-circle/${circleFilename}`)).then((r) => r.text()),
      fetch(staticFile(`emoji-circle/${smileFilename}`)).then((r) => r.text()),
    ])
      .then(([circleText, smileText]) => {
        setShapes({
          circle: parseMorphSvg(circleText),
          smile: parseMorphSvg(smileText),
        });
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Initialization fault on structural data loading:", err);
        continueRender(handle);
      });
  }, [circleFilename, smileFilename]);

  const totalFrames = cycleDurationSeconds * fps;
  const waveDriver = spring({
    frame: frame % totalFrames,
    fps,
    config: {stiffness: 80, damping: 14},
  });

  const progress = interpolate(waveDriver, [0, 0.5, 1], [0, 1, 0]);

  const liveNodes = useMemo(() => {
    if (!shapes) return [];

    return shapes.circle.nodes.map((startNode, index) => {
      const endNode = shapes.smile.nodes[index] ?? startNode;
      return {
        anchor: lerpPoint(startNode.anchor, endNode.anchor, progress),
        inHandle: lerpPoint(startNode.inHandle, endNode.inHandle, progress),
        outHandle: lerpPoint(startNode.outHandle, endNode.outHandle, progress),
      };
    });
  }, [progress, shapes]);

  const livePathString = useMemo(() => {
    if (liveNodes.length !== TARGET_NODE_COUNT) return "";

    let d = `M ${pointToSvgString(liveNodes[0].anchor)} `;

    for (let i = 0; i < liveNodes.length; i++) {
      const current = liveNodes[i];
      const next = liveNodes[(i + 1) % liveNodes.length];
      d += `C ${pointToSvgString(current.outHandle)}, ${pointToSvgString(next.inHandle)}, ${pointToSvgString(next.anchor)} `;
    }

    return `${d}Z`;
  }, [liveNodes]);

  if (!shapes) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#7a7a7a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 500 500"
        style={{overflow: "visible", width: "70%", height: "70%"}}
      >
        <path
          d={livePathString}
          fill={shapes.circle.fill}
          stroke={shapes.circle.stroke}
          strokeWidth={shapes.circle.strokeWidth}
        />

        {showDebugPivots && (
          <g>
            {liveNodes.map((node, index) => (
              <g key={index}>
                <line
                  x1={node.anchor.x}
                  y1={node.anchor.y}
                  x2={node.inHandle.x}
                  y2={node.inHandle.y}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
                <line
                  x1={node.anchor.x}
                  y1={node.anchor.y}
                  x2={node.outHandle.x}
                  y2={node.outHandle.y}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
                <circle cx={node.inHandle.x} cy={node.inHandle.y} r="3" fill="#6fe7ff" />
                <circle cx={node.outHandle.x} cy={node.outHandle.y} r="3" fill="#ffd166" />
                <circle
                  cx={node.anchor.x}
                  cy={node.anchor.y}
                  r="6"
                  fill="#ff4a4a"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <text
                  x={node.anchor.x + 10}
                  y={node.anchor.y + 4}
                  fill="#fff"
                  fontSize="10"
                  fontWeight="bold"
                  style={{fontFamily: "monospace"}}
                >
                  {index + 1}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
