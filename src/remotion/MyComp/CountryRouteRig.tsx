// src/remotion/MyComp/CountryRouteRig.tsx
import React, {useEffect, useMemo, useState} from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Point = {
  x: number;
  y: number;
};

type ViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ParsedSvgAsset = {
  viewBox: ViewBox;
  innerMarkup: string;
  pivots: Record<string, Point>;
};

type Props = {
  fromCountry?: string;
  toCountry?: string;

  routeStartFrame?: number;
  routeDurationFrames?: number;
  routeLineDelayFrames?: number;
  labelRevealDurationFrames?: number;

  lineColor?: string;
  lineWidth?: number;

  arcHeight?: number;

  backgroundColor?: string;

  width?: number;
  height?: number;

  showDots?: boolean;
  showLabels?: boolean;

  worldOpacity?: number;

  startScale?: number;
};

const COUNTRY_PIVOT_KEYS: Record<string, string> = {
  zimbabwe: "zim",
  botswana: "bots",
  mali: "mali",
  kenya: "kenya",
  zambia: "zambia",
};

const parseViewBox = (raw: string | null): ViewBox => {
  const values = raw?.split(/[\s,]+/).map(Number) ?? [];

  if (values.length === 4 && values.every((v) => Number.isFinite(v))) {
    return {
      x: values[0],
      y: values[1],
      width: values[2],
      height: values[3],
    };
  }

  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };
};

const parseSvgAsset = (svgText: string): ParsedSvgAsset => {
  const parser = new DOMParser();

  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const svg = doc.querySelector("svg");

  if (!svg) {
    throw new Error("Invalid SVG.");
  }

  const pivots: Record<string, Point> = {};

  svg.querySelectorAll("[id^='pivot_']").forEach((el) => {
    const id = el.getAttribute("id");

    if (!id) {
      return;
    }

    pivots[id] = {
      x: Number.parseFloat(el.getAttribute("cx") ?? "0"),
      y: Number.parseFloat(el.getAttribute("cy") ?? "0"),
    };
  });

  return {
    viewBox: parseViewBox(svg.getAttribute("viewBox")),
    innerMarkup: svg.innerHTML,
    pivots,
  };
};

const requirePivot = (
  asset: ParsedSvgAsset,
  id: string,
): Point => {
  const pivot = asset.pivots[id];

  if (!pivot) {
    throw new Error(`Missing pivot "${id}"`);
  }

  return pivot;
};

const getCountryPivotKey = (country: string) => {
  const normalized = country.trim().toLowerCase();

  return (
    COUNTRY_PIVOT_KEYS[normalized] ??
    normalized.replace(/\s+/g, "_")
  );
};

const getQuadraticPoint = (
  p0: Point,
  p1: Point,
  p2: Point,
  t: number,
): Point => {
  const inv = 1 - t;

  return {
    x:
      inv * inv * p0.x +
      2 * inv * t * p1.x +
      t * t * p2.x,

    y:
      inv * inv * p0.y +
      2 * inv * t * p1.y +
      t * t * p2.y,
  };
};

export const CountryRouteRig: React.FC<Props> = ({
  fromCountry = "zimbabwe",
  toCountry = "kenya",

  routeStartFrame = 15,
  routeDurationFrames = 90,
  routeLineDelayFrames = 0,
  labelRevealDurationFrames = 12,

  lineColor = "#3b82f6",
  lineWidth = 6,

  arcHeight = 180,

  backgroundColor = "#081018",

  width = 1920,
  height = 1080,

  showDots = true,
  showLabels = true,

  worldOpacity = 0.28,

  startScale = 1,
}) => {
  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  const [world, setWorld] =
    useState<ParsedSvgAsset | null>(null);

  useEffect(() => {
    const handle = delayRender(
      "Loading CountryRouteRig assets",
    );

    fetch(staticFile("world-map-pin/world.svg"))
      .then((r) => r.text())
      .then((svgText) => {
        setWorld(parseSvgAsset(svgText));
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, []);

  const routeDriver = spring({
    fps,
    frame: Math.max(
      0,
      frame - routeStartFrame - routeLineDelayFrames,
    ),

    durationInFrames: routeDurationFrames,

    config: {
      stiffness: 70,
      damping: 18,
      mass: 1,
    },
  });

  const routeProgress = interpolate(
    routeDriver,
    [0, 1],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const labelRevealStartFrame =
    routeStartFrame + routeLineDelayFrames + routeDurationFrames;
  const labelOpacity = interpolate(
    frame,
    [
      labelRevealStartFrame,
      labelRevealStartFrame + labelRevealDurationFrames,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const labelOffsetY = interpolate(
    frame,
    [
      labelRevealStartFrame,
      labelRevealStartFrame + labelRevealDurationFrames,
    ],
    [14, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const geometry = useMemo(() => {
    if (!world) {
      return null;
    }

    const fromKey = getCountryPivotKey(fromCountry);

    const toKey = getCountryPivotKey(toCountry);

    const fromPivot = requirePivot(
      world,
      `pivot_world_${fromKey}`,
    );

    const toPivot = requirePivot(
      world,
      `pivot_world_${toKey}`,
    );

    // ---------------------------------------------------
    // INITIAL FULL-WORLD CAMERA
    // ---------------------------------------------------

    const initialScale =
      Math.min(
        width / world.viewBox.width,
        height / world.viewBox.height,
      ) * startScale;

    const initialTranslate = {
      x:
        width / 2 -
        (world.viewBox.x + world.viewBox.width / 2) *
          initialScale,

      y:
        height / 2 -
        (world.viewBox.y + world.viewBox.height / 2) *
          initialScale,
    };

    // ---------------------------------------------------
    // ROUTE REGION BOUNDS
    // ---------------------------------------------------

    const routeMinX = Math.min(fromPivot.x, toPivot.x);
    const routeMaxX = Math.max(fromPivot.x, toPivot.x);

    const routeMinY = Math.min(fromPivot.y, toPivot.y);
    const routeMaxY = Math.max(fromPivot.y, toPivot.y);

    const routeWidth = Math.max(1, routeMaxX - routeMinX);
    const routeHeight = Math.max(1, routeMaxY - routeMinY);

    // padding around countries
    const paddedWidth = routeWidth * 2.2;
    const paddedHeight = routeHeight * 2.4;

    const targetScale = Math.min(
      width / paddedWidth,
      height / paddedHeight,
    );

    const routeCenter = {
      x: (routeMinX + routeMaxX) / 2,
      y: (routeMinY + routeMaxY) / 2,
    };

    const targetTranslate = {
      x: width / 2 - routeCenter.x * targetScale,
      y: height / 2 - routeCenter.y * targetScale,
    };

    // ---------------------------------------------------
    // ANIMATED CAMERA
    // ---------------------------------------------------

    const lerp = (
      from: number,
      to: number,
      t: number,
    ) => {
      return from + (to - from) * t;
    };

    const lerpPoint = (
      from: Point,
      to: Point,
      t: number,
    ): Point => {
      return {
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
      };
    };

    const animatedScale = lerp(
      initialScale,
      targetScale,
      routeProgress,
    );

    const animatedTranslate = lerpPoint(
      initialTranslate,
      targetTranslate,
      routeProgress,
    );

    // ---------------------------------------------------
    // SCREEN POSITIONS
    // ---------------------------------------------------

    const start = {
      x:
        animatedTranslate.x +
        fromPivot.x * animatedScale,

      y:
        animatedTranslate.y +
        fromPivot.y * animatedScale,
    };

    const end = {
      x:
        animatedTranslate.x +
        toPivot.x * animatedScale,

      y:
        animatedTranslate.y +
        toPivot.y * animatedScale,
    };

    // ---------------------------------------------------
    // ARC CONTROL POINT
    // ---------------------------------------------------

    const midpoint = {
      x: (start.x + end.x) / 2,

      y:
        (start.y + end.y) / 2 -
        arcHeight,
    };

    const routePath = `
      M ${start.x} ${start.y}
      Q ${midpoint.x} ${midpoint.y}
      ${end.x} ${end.y}
    `;

    return {
      scale: animatedScale,
      translate: animatedTranslate,

      start,
      end,
      midpoint,

      routePath,
    };
  }, [
    world,
    fromCountry,
    toCountry,
    width,
    height,
    arcHeight,
    startScale,
    routeProgress,
  ]);

  if (!world || !geometry) {
    return null;
  }

  const airplanePoint = getQuadraticPoint(
    geometry.start,
    geometry.midpoint,
    geometry.end,
    routeProgress,
  );

  const tangentAhead = getQuadraticPoint(
    geometry.start,
    geometry.midpoint,
    geometry.end,
    Math.min(routeProgress + 0.01, 1),
  );

  const airplaneRotation =
    (Math.atan2(
      tangentAhead.y - airplanePoint.y,
      tangentAhead.x - airplanePoint.x,
    ) *
      180) /
    Math.PI;

  const formatCountryName = (value: string) => {
    if (!value) {
      return "";
    }

    return value.charAt(0).toUpperCase() +
      value.slice(1).toLowerCase();
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      <style>{`
        circle[id*="pivot_"] {
          display: none !important;
        }
      `}</style>

      {/* ------------------------------------------------ */}
      {/* WORLD                                            */}
      {/* ------------------------------------------------ */}

      <AbsoluteFill
        style={{
          opacity: 1,

          transform: `
            translate(${geometry.translate.x}px, ${geometry.translate.y}px)
            scale(${geometry.scale})
          `,

          transformOrigin: "0 0",
        }}
      >
        <svg
          width={world.viewBox.width}
          height={world.viewBox.height}
          viewBox={`
            ${world.viewBox.x}
            ${world.viewBox.y}
            ${world.viewBox.width}
            ${world.viewBox.height}
          `}
          style={{
            overflow: "visible",
          }}
        >
          <g
            dangerouslySetInnerHTML={{
              __html: world.innerMarkup,
            }}
          />
        </svg>
      </AbsoluteFill>

      {/* ------------------------------------------------ */}
      {/* ROUTE PATH                                       */}
      {/* ------------------------------------------------ */}

      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient
            id="routeGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor={lineColor}
              stopOpacity="0.2"
            />

            <stop
              offset="50%"
              stopColor={lineColor}
              stopOpacity="1"
            />

            <stop
              offset="100%"
              stopColor={lineColor}
              stopOpacity="0.2"
            />
          </linearGradient>

          <filter id="routeGlow">
            <feGaussianBlur
              stdDeviation="6"
              result="blur"
            />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* SOFT GLOW */}
        <path
          d={geometry.routePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={lineWidth * 2.5}
          opacity={0.2}
          filter="url(#routeGlow)"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - routeProgress}
        />

        {/* MAIN ROUTE */}
        <path
          d={geometry.routePath}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth={lineWidth}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - routeProgress}
        />
      </svg>

      {/* ------------------------------------------------ */}
      {/* ENDPOINT DOTS                                   */}
      {/* ------------------------------------------------ */}

      {showDots && (
        <>
          <div
            style={{
              position: "absolute",

              left: geometry.start.x,
              top: geometry.start.y,

              width: 18,
              height: 18,

              borderRadius: 9999,

              background: lineColor,

              transform: "translate(-50%, -50%)",

              boxShadow: `
                0 0 12px ${lineColor},
                0 0 28px ${lineColor}
              `,
            }}
          />

          <div
            style={{
              position: "absolute",

              left: geometry.end.x,
              top: geometry.end.y,

              width: 18,
              height: 18,

              borderRadius: 9999,

              background: lineColor,

              transform: "translate(-50%, -50%)",

              boxShadow: `
                0 0 12px ${lineColor},
                0 0 28px ${lineColor}
              `,
            }}
          />
        </>
      )}

      {/* ------------------------------------------------ */}
      {/* AIRPLANE / MOVING NODE                           */}
      {/* ------------------------------------------------ */}

      <div
        style={{
          position: "absolute",

          left: airplanePoint.x,
          top: airplanePoint.y,

          transform: `
            translate(-50%, -50%)
            rotate(${airplaneRotation}deg)
          `,

          color: "#ffffff",

          fontSize: 34,

          filter: `
            drop-shadow(0 0 10px rgba(255,255,255,0.8))
          `,
        }}
      >
        ✈
      </div>

      {/* ------------------------------------------------ */}
      {/* LABELS                                           */}
      {/* ------------------------------------------------ */}

      {showLabels && (
        <>
          <div
            style={{
              position: "absolute",

              left: geometry.start.x + 22,
              top: geometry.start.y - 18,

              color: "#201c34",

              fontSize: 44,
              fontWeight: 700,

              fontFamily:
                "Lato",

              letterSpacing: "-0.03em",
              opacity: labelOpacity,
              transform: `translateY(${labelOffsetY}px)`,
            }}
          >
            {formatCountryName(fromCountry)}
          </div>

          <div
            style={{
              position: "absolute",

              left: geometry.end.x + 22,
              top: geometry.end.y - 18,

              color: "#201c34",

              fontSize: 44,
              fontWeight: 700,

              fontFamily:
                "Lato",

              letterSpacing: "-0.03em",
              opacity: labelOpacity,
              transform: `translateY(${labelOffsetY}px)`,
            }}
          >
            {formatCountryName(toCountry)}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
