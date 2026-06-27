// src/remotion/MyComp/CountryFocusRig.tsx
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

type Point = {x: number; y: number};

type ViewBox = {x: number; y: number; width: number; height: number};

type ParsedSvgAsset = {
  viewBox: ViewBox;
  innerMarkup: string;
  pivots: Record<string, Point>;
};

type Props = {
  country?: string;
  zoomStartFrame?: number;
  zoomDurationFrames?: number;
  startScale?: number;
  endScale?: number;
  backgroundColor?: string;
  worldOpacity?: number;
  focusedCountryOpacity?: number;
  width?: number;
  height?: number;
};

const COUNTRY_PIVOT_KEYS: Record<string, string> = {
  // Add more countries here for appending pivot names
  zimbabwe: "zim", // endscale={23}
  botswana: "bots", // endscale={17}
  mali: "mali", // endscale={10}
  kenya: "kenya", // endscale={17.4}
  zambia: "zambia", // endscale={18}
};

const parseViewBox = (raw: string | null): ViewBox => {
  const values = raw?.split(/[\s,]+/).map(Number) ?? [];
  if (values.length === 4 && values.every((value) => Number.isFinite(value))) {
    return {
      x: values[0],
      y: values[1],
      width: values[2],
      height: values[3],
    };
  }

  return {x: 0, y: 0, width: 100, height: 100};
};

const parseSvgAsset = (svgText: string): ParsedSvgAsset => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) {
    throw new Error("Invalid SVG asset: missing <svg> root.");
  }

  const viewBox = parseViewBox(svg.getAttribute("viewBox"));
  const pivots: Record<string, Point> = {};

  svg.querySelectorAll("[id^='pivot_']").forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    pivots[id] = {
      x: Number.parseFloat(el.getAttribute("cx") ?? "0"),
      y: Number.parseFloat(el.getAttribute("cy") ?? "0"),
    };
  });

  return {
    viewBox,
    innerMarkup: svg.innerHTML,
    pivots,
  };
};

const requirePivot = (asset: ParsedSvgAsset, id: string) => {
  const pivot = asset.pivots[id];
  if (!pivot) {
    throw new Error(`Missing required pivot "${id}" in SVG asset.`);
  }
  return pivot;
};

const getCountryPivotKey = (country: string) => {
  const normalized = country.trim().toLowerCase();
  return COUNTRY_PIVOT_KEYS[normalized] ?? normalized.replace(/\s+/g, "_");
};

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const lerpPoint = (from: Point, to: Point, t: number): Point => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
});

export const CountryFocusRig: React.FC<Props> = ({
  country = "zimbabwe",
  zoomStartFrame = 20,
  zoomDurationFrames = 90,
  startScale = 1,
  endScale = 22,
  backgroundColor = "#07111a",
  worldOpacity = 0.98,
  focusedCountryOpacity = 1,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [assets, setAssets] = useState<{
    world: ParsedSvgAsset;
    country: ParsedSvgAsset;
  } | null>(null);

  useEffect(() => {
    const handle = delayRender("Loading country focus map assets");
    const normalizedCountry = country.trim().toLowerCase();

    Promise.all([
      fetch(staticFile("world-map/world.svg")).then((r) => r.text()),
      fetch(staticFile(`world-map/${normalizedCountry}.svg`)).then((r) => r.text()),
    ])
      .then(([worldSvg, countrySvg]) => {
        setAssets({
          world: parseSvgAsset(worldSvg),
          country: parseSvgAsset(countrySvg),
        });
        continueRender(handle);
      })
      .catch((error) => {
        console.error("Failed to load CountryFocusRig assets:", error);
        continueRender(handle);
      });
  }, [country]);

  const zoomDriver = spring({
    fps,
    frame: Math.max(0, frame - zoomStartFrame),
    durationInFrames: zoomDurationFrames,
    config: {
      stiffness: 80,
      damping: 18,
      mass: 0.9,
    },
  });

  const zoomProgress = interpolate(zoomDriver, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const geometry = useMemo(() => {
    if (!assets) return null;

    const pivotKey = getCountryPivotKey(country);

    const worldAnchor = requirePivot(assets.world, `pivot_world_${pivotKey}`);
    const countryAnchor = requirePivot(assets.country, `pivot_world_${pivotKey}`);
    const countryNorth = requirePivot(assets.country, `pivot_north_${pivotKey}`);
    const countrySouth = requirePivot(assets.country, `pivot_south_${pivotKey}`);
    const countryEast = requirePivot(assets.country, `pivot_east_${pivotKey}`);
    const countryWest = requirePivot(assets.country, `pivot_west_${pivotKey}`);

    const worldViewBox = assets.world.viewBox;
    const countryViewBox = assets.country.viewBox;

    const fitWorldScale =
      Math.min(width / worldViewBox.width, height / worldViewBox.height) * startScale;

    const worldInitialTranslate = {
      x: width / 2 - (worldViewBox.x + worldViewBox.width / 2) * fitWorldScale,
      y: height / 2 - (worldViewBox.y + worldViewBox.height / 2) * fitWorldScale,
    };

    const worldFinalScale = fitWorldScale * (endScale / startScale);

    const countryBoundsHeight = Math.max(1, countrySouth.y - countryNorth.y);
    const countryBoundsCenter = {
      x: (countryWest.x + countryEast.x) / 2,
      y: (countryNorth.y + countrySouth.y) / 2,
    };

    const countryFinalScale = (height * 0.8) / countryBoundsHeight;
    const countryStartScale = countryFinalScale / Math.max(endScale, 1);

    const worldAnchorScreenAtStart = {
      x: worldInitialTranslate.x + worldAnchor.x * fitWorldScale,
      y: worldInitialTranslate.y + worldAnchor.y * fitWorldScale,
    };

    const countryStartTranslate = {
      x: worldAnchorScreenAtStart.x - countryAnchor.x * countryStartScale,
      y: worldAnchorScreenAtStart.y - countryAnchor.y * countryStartScale,
    };

    const countryFinalTranslate = {
      x: width / 2 - countryBoundsCenter.x * countryFinalScale,
      y: height / 2 - countryBoundsCenter.y * countryFinalScale,
    };

    // Keep the country centered by its bounds, but derive the final
    // world camera from the shared anchor so both Zimbabwe shapes align.
    const finalAnchorScreen = {
      x: countryFinalTranslate.x + countryAnchor.x * countryFinalScale,
      y: countryFinalTranslate.y + countryAnchor.y * countryFinalScale,
    };

    const worldFinalTranslate = {
      x: finalAnchorScreen.x - worldAnchor.x * worldFinalScale,
      y: finalAnchorScreen.y - worldAnchor.y * worldFinalScale,
    };

    return {
      worldViewBox,
      countryViewBox,
      worldInitialTranslate,
      worldFinalTranslate,
      fitWorldScale,
      worldFinalScale,
      countryStartScale,
      countryFinalScale,
      countryStartTranslate,
      countryFinalTranslate,
    };
  }, [assets, country, endScale, height, startScale, width]);

  if (!assets || !geometry) return null;

  const worldScale = lerp(geometry.fitWorldScale, geometry.worldFinalScale, zoomProgress);
  const worldTranslate = lerpPoint(
    geometry.worldInitialTranslate,
    geometry.worldFinalTranslate,
    zoomProgress,
  );

  const countryScale = lerp(
    geometry.countryStartScale,
    geometry.countryFinalScale,
    zoomProgress,
  );
  const countryTranslate = lerpPoint(
    geometry.countryStartTranslate,
    geometry.countryFinalTranslate,
    zoomProgress,
  );

  const countryOpacity = interpolate(zoomProgress, [0, 0.45, 0.8, 1], [0, 0, 0.65, focusedCountryOpacity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const worldLayerOpacity = interpolate(zoomProgress, [0, 0.55, 1], [worldOpacity, worldOpacity * 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(zoomProgress, [0.55, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOffsetY = interpolate(zoomProgress, [0, 1], [32, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          opacity: worldLayerOpacity,
          transform: `translate(${worldTranslate.x}px, ${worldTranslate.y}px) scale(${worldScale})`,
          transformOrigin: "0 0",
        }}
      >
        <svg
          width={geometry.worldViewBox.width}
          height={geometry.worldViewBox.height}
          viewBox={`${geometry.worldViewBox.x} ${geometry.worldViewBox.y} ${geometry.worldViewBox.width} ${geometry.worldViewBox.height}`}
          style={{overflow: "visible"}}
        >
          <g dangerouslySetInnerHTML={{__html: assets.world.innerMarkup}} />
        </svg>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          opacity: countryOpacity,
          transform: `translate(${countryTranslate.x}px, ${countryTranslate.y}px) scale(${countryScale})`,
          transformOrigin: "0 0",
          filter: `
            drop-shadow(0 0 16px rgba(92, 231, 206, 0.35))
            drop-shadow(0 0 56px rgba(92, 231, 206, 0.18))
          `,
        }}
      >
        <svg
          width={geometry.countryViewBox.width}
          height={geometry.countryViewBox.height}
          viewBox={`${geometry.countryViewBox.x} ${geometry.countryViewBox.y} ${geometry.countryViewBox.width} ${geometry.countryViewBox.height}`}
          style={{overflow: "visible"}}
        >
          <g dangerouslySetInnerHTML={{__html: assets.country.innerMarkup}} />
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 56,
          color: "#f5fffd",
          fontFamily: "Aptos, Inter, sans-serif",
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          textTransform: "capitalize",
          opacity: labelOpacity,
          transform: `translateY(${labelOffsetY}px)`,
        }}
      >
        {country}
      </div>
    </AbsoluteFill>
  );
};
