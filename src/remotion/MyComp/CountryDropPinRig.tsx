// src/remotion/MyComp/CountryDropPinRig.tsx
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
  pinDropDelayFrames?: number;
  startScale?: number;
  endScale?: number;
  pinHeightRatio?: number;
  backgroundColor?: string;
  worldOpacity?: number;
  focusedCountryOpacity?: number;
  labelPosition?: "above" | "below" | "left" | "right";
  labelOffset?: number;
  width?: number;
  height?: number;
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
  if (values.length === 4 && values.every((value) => Number.isFinite(value))) {
    return {x: values[0], y: values[1], width: values[2], height: values[3]};
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
    if (!id) {
      return;
    }

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

const formatCountryName = (value: string) => {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const CountryDropPinRig: React.FC<Props> = ({
  country = "zimbabwe",
  zoomStartFrame = 20,
  zoomDurationFrames = 90,
  pinDropDelayFrames = 15,
  startScale = 1,
  endScale = 1,
  pinHeightRatio = 0.05,
  backgroundColor = "#eff7ff",
  worldOpacity = 1,
  labelPosition = "right",
  labelOffset = 28,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [assets, setAssets] = useState<{
    world: ParsedSvgAsset;
    country: ParsedSvgAsset;
    pin: ParsedSvgAsset;
  } | null>(null);

  useEffect(() => {
    const handle = delayRender("Loading country drop pin map assets");
    const normalizedCountry = country.trim().toLowerCase();

    Promise.all([
      fetch(staticFile("world-map-pin/world.svg")).then((r) => r.text()),
      fetch(staticFile(`world-map-pin/${normalizedCountry}.svg`)).then((r) => r.text()),
      fetch(staticFile("world-map-pin/map_pin.svg")).then((r) => r.text()),
    ])
      .then(([worldSvg, countrySvg, pinSvg]) => {
        setAssets({
          world: parseSvgAsset(worldSvg),
          country: parseSvgAsset(countrySvg),
          pin: parseSvgAsset(pinSvg),
        });
        continueRender(handle);
      })
      .catch((error) => {
        console.error("Failed to load CountryDropPinRig assets:", error);
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

  const pinDriver = spring({
    fps,
    frame: Math.max(0, frame - (zoomStartFrame + pinDropDelayFrames)),
    durationInFrames: 35,
    config: {
      stiffness: 140,
      damping: 12,
      mass: 1,
    },
  });

  const zoomProgress = interpolate(zoomDriver, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const geometry = useMemo(() => {
    if (!assets) {
      return null;
    }

    const pivotKey = getCountryPivotKey(country);

    const worldAnchor = requirePivot(assets.world, `pivot_world_${pivotKey}`);
    const countryAnchor = requirePivot(assets.country, `pivot_world_${pivotKey}`);
    const countryNorth = requirePivot(assets.country, `pivot_north_${pivotKey}`);
    const countrySouth = requirePivot(assets.country, `pivot_south_${pivotKey}`);
    const countryEast = requirePivot(assets.country, `pivot_east_${pivotKey}`);
    const countryWest = requirePivot(assets.country, `pivot_west_${pivotKey}`);
    const pinBottom = requirePivot(assets.pin, "pivot_bottom");
    const pinTop = requirePivot(assets.pin, "pivot_top");

    const worldViewBox = assets.world.viewBox;
    const pinViewBox = assets.pin.viewBox;

    const fitWorldScale =
      Math.min(width / worldViewBox.width, height / worldViewBox.height) * startScale;

    const worldInitialTranslate = {
      x: width / 2 - (worldViewBox.x + worldViewBox.width / 2) * fitWorldScale,
      y: height / 2 - (worldViewBox.y + worldViewBox.height / 2) * fitWorldScale,
    };

    const countryBoundsWidth = Math.max(1, countryEast.x - countryWest.x);
    const countryBoundsHeight = Math.max(1, countrySouth.y - countryNorth.y);
    const countryBoundsCenterLocal = {
      x: (countryWest.x + countryEast.x) / 2,
      y: (countryNorth.y + countrySouth.y) / 2,
    };

    const worldCountryCenter = {
      x: worldAnchor.x + (countryBoundsCenterLocal.x - countryAnchor.x),
      y: worldAnchor.y + (countryBoundsCenterLocal.y - countryAnchor.y),
    };

    const targetCountryWidth = width * 0.5;
    const targetCountryHeight = height * 0.5;
    const boundsFitScale = Math.min(
      targetCountryWidth / countryBoundsWidth,
      targetCountryHeight / countryBoundsHeight,
    );

    // `endScale` remains as an optional extra clamp for call sites that still pass it,
    // but the country bounds fit now defines the maximum intended zoom level.
    const worldFinalScale = boundsFitScale * Math.min(endScale, 1);
    const worldFinalTranslate = {
      x: width / 2 - worldCountryCenter.x * worldFinalScale,
      y: height / 2 - worldCountryCenter.y * worldFinalScale,
    };

    const pinSvgHeight = Math.max(1, pinBottom.y - pinTop.y);
    const pinScale = (height * pinHeightRatio) / pinSvgHeight;

    return {
      worldViewBox,
      pinViewBox,
      fitWorldScale,
      worldFinalScale,
      worldInitialTranslate,
      worldFinalTranslate,
      worldAnchor,
      pinTop,
      pinBottom,
      pinScale,
    };
  }, [assets, country, endScale, height, pinHeightRatio, startScale, width]);

  if (!assets || !geometry) {
    return null;
  }

  const worldScale = lerp(geometry.fitWorldScale, geometry.worldFinalScale, zoomProgress);
  const worldTranslate = lerpPoint(
    geometry.worldInitialTranslate,
    geometry.worldFinalTranslate,
    zoomProgress,
  );

  const currentAnchorScreen = {
    x: worldTranslate.x + geometry.worldAnchor.x * worldScale,
    y: worldTranslate.y + geometry.worldAnchor.y * worldScale,
  };

  const pinTranslateX = currentAnchorScreen.x - geometry.pinBottom.x * geometry.pinScale;
  const pinTranslateY = currentAnchorScreen.y - geometry.pinBottom.y * geometry.pinScale;

  const pinOpacity = interpolate(pinDriver, [0, 0.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pinDropOffset = interpolate(pinDriver, [0, 1], [-120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pinScaleBounce = interpolate(pinDriver, [0, 1], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelRevealOffset = interpolate(zoomProgress, [0.7, 1], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pinHeightOnScreen =
    (geometry.pinBottom.y - geometry.pinTop.y) * geometry.pinScale * pinScaleBounce;
  const pinPivotScreenX = currentAnchorScreen.x;
  const pinBottomScreenY = currentAnchorScreen.y + pinDropOffset;
  const pinTopScreenY = pinBottomScreenY - pinHeightOnScreen;
  const pinCenterScreenY = (pinTopScreenY + pinBottomScreenY) / 2;
  const labelPlacement = (() => {
    switch (labelPosition) {
      case "above":
        return {
          left: pinPivotScreenX,
          top: pinTopScreenY - labelOffset,
          transform: `translate(-50%, calc(-100% - ${labelRevealOffset}px))`,
          textAlign: "center" as const,
        };
      case "below":
        return {
          left: pinPivotScreenX,
          top: pinBottomScreenY + labelOffset,
          transform: `translate(-50%, ${labelRevealOffset}px)`,
          textAlign: "center" as const,
        };
      case "left":
        return {
          left: pinPivotScreenX - labelOffset,
          top: pinCenterScreenY,
          transform: `translate(calc(-100% - ${labelRevealOffset}px), -50%)`,
          textAlign: "right" as const,
        };
      case "right":
      default:
        return {
          left: pinPivotScreenX + labelOffset,
          top: pinCenterScreenY,
          transform: `translate(${labelRevealOffset}px, -50%)`,
          textAlign: "left" as const,
        };
    }
  })();

  return (
    <AbsoluteFill style={{backgroundColor, overflow: "hidden"}}>
      <style>{`circle[id*="pivot_"] { display: none !important; }`}</style>

      <AbsoluteFill
        style={{
          opacity: worldOpacity,
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

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: geometry.pinViewBox.width,
          height: geometry.pinViewBox.height,
          opacity: pinOpacity,
          transformOrigin: `${geometry.pinBottom.x}px ${geometry.pinBottom.y}px`,
          transform: `
            translate(${pinTranslateX}px, ${pinTranslateY}px)
            translateY(${pinDropOffset}px)
            scale(${geometry.pinScale * pinScaleBounce})
          `,
          filter: `
            drop-shadow(0 12px 18px rgba(0, 0, 0, 0.45))
            drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))
          `,
        }}
      >
        <svg
          width={geometry.pinViewBox.width}
          height={geometry.pinViewBox.height}
          viewBox={`${geometry.pinViewBox.x} ${geometry.pinViewBox.y} ${geometry.pinViewBox.width} ${geometry.pinViewBox.height}`}
          style={{overflow: "visible"}}
        >
          <g dangerouslySetInnerHTML={{__html: assets.pin.innerMarkup}} />
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          left: labelPlacement.left,
          top: labelPlacement.top,
          color: "#ffffff",
          fontFamily: "Aptos, Inter, sans-serif",
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          opacity: interpolate(zoomProgress, [0.7, 1], [0, 0.9], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: labelPlacement.transform,
          textAlign: labelPlacement.textAlign,
          textShadow: "0 4px 12px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {formatCountryName(country)}
      </div>
    </AbsoluteFill>
  );
};
