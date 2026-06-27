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
  backgroundColor?: string;
  baseStaggerFrames?: number;
  bladeDegreesPerSecond?: number;
};

const PANEL_NAMES = [
  "solar_panel_1.svg",
  "solar_panel_2.svg",
  "solar_panel_3.svg",
] as const;

const MAST_NAMES = [
  "turbine_mast_1.svg",
  "turbine_mast_2.svg",
  "turbine_mast_3.svg",
  "turbine_mast_4.svg",
] as const;

const BLADE_NAMES = [
  "turbine_blades_1.svg",
  "turbine_blades_2.svg",
  "turbine_blades_3.svg",
  "turbine_blades_4.svg",
] as const;

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

  return {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  };
};

const parseSvgAsset = (svgText: string): ParsedSvgAsset => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) {
    throw new Error("Invalid SVG asset: missing <svg> element.");
  }

  const pivots: Record<string, Point> = {};

  svg.querySelectorAll("[id^='pivot_']").forEach((element) => {
    const id = element.getAttribute("id");

    if (!id) {
      return;
    }

    pivots[id] = {
      x: Number.parseFloat(element.getAttribute("cx") ?? "0"),
      y: Number.parseFloat(element.getAttribute("cy") ?? "0"),
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
    throw new Error(`Missing pivot "${id}" in SVG asset.`);
  }

  return pivot;
};

const renderAsset = (
  asset: ParsedSvgAsset,
  markupOverride?: string,
) => {
  return (
    <svg
      width={asset.viewBox.width}
      height={asset.viewBox.height}
      viewBox={`${asset.viewBox.x} ${asset.viewBox.y} ${asset.viewBox.width} ${asset.viewBox.height}`}
      style={{overflow: "visible"}}
    >
      <g
        dangerouslySetInnerHTML={{
          __html: markupOverride ?? asset.innerMarkup,
        }}
      />
    </svg>
  );
};

export const SolarWindFieldRig: React.FC<Props> = ({
  backgroundColor = "#ffffff",
  baseStaggerFrames = 12,
  bladeDegreesPerSecond = 120,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const [assets, setAssets] = useState<{
    background: ParsedSvgAsset;
    ground: ParsedSvgAsset;
    panels: ParsedSvgAsset[];
    masts: ParsedSvgAsset[];
    blades: ParsedSvgAsset[];
  } | null>(null);

  useEffect(() => {
    const handle = delayRender("Loading SolarWindFieldRig assets");

    Promise.all([
      fetch(staticFile("solar-wind-field/background.svg")).then((response) => response.text()),
      fetch(staticFile("solar-wind-field/ground.svg")).then((response) => response.text()),
      ...PANEL_NAMES.map((name) =>
        fetch(staticFile(`solar-wind-field/${name}`)).then((response) => response.text()),
      ),
      ...MAST_NAMES.map((name) =>
        fetch(staticFile(`solar-wind-field/${name}`)).then((response) => response.text()),
      ),
      ...BLADE_NAMES.map((name) =>
        fetch(staticFile(`solar-wind-field/${name}`)).then((response) => response.text()),
      ),
    ])
      .then((texts) => {
        let index = 0;

        const background = parseSvgAsset(texts[index++]);
        const ground = parseSvgAsset(texts[index++]);
        const panels = texts
          .slice(index, index + PANEL_NAMES.length)
          .map(parseSvgAsset);

        index += PANEL_NAMES.length;

        const masts = texts
          .slice(index, index + MAST_NAMES.length)
          .map(parseSvgAsset);

        index += MAST_NAMES.length;

        const blades = texts
          .slice(index, index + BLADE_NAMES.length)
          .map(parseSvgAsset);

        setAssets({
          background,
          ground,
          panels,
          masts,
          blades,
        });

        continueRender(handle);
      })
      .catch((error) => {
        console.error("Failed to load SolarWindFieldRig assets", error);
        continueRender(handle);
      });
  }, []);

  const geometry = useMemo(() => {
    if (!assets) {
      return null;
    }

    const {background, ground, panels, masts, blades} = assets;

    const west = requirePivot(background, "pivot_west");
    const east = requirePivot(background, "pivot_east");
    const sky = requirePivot(background, "pivot_sky");
    const groundAnchor = requirePivot(background, "pivot_ground");
    const groundPivot = requirePivot(ground, "pivot_ground");

    const sceneWidth = Math.max(1, east.x - west.x);
    const sceneHeight = Math.max(1, groundAnchor.y - sky.y);
    const fitScale = Math.min(width / sceneWidth, height / sceneHeight);
    const translateX = width / 2 - (west.x + sceneWidth / 2) * fitScale;
    const translateY = height / 2 - (sky.y + sceneHeight / 2) * fitScale;

    const groundPlacement = {
      x: groundAnchor.x - groundPivot.x,
      y: groundAnchor.y - groundPivot.y,
    };

    const turbinePlacements = masts.map((mast, index) => {
      const turbineNumber = index + 1;
      const pivotId = `pivot_blade_centre_${turbineNumber}`;
      const worldPivot = requirePivot(background, pivotId);
      const mastPivot = requirePivot(mast, pivotId);
      const bladePivot = requirePivot(blades[index], pivotId);

      return {
        mastX: worldPivot.x - mastPivot.x,
        mastY: worldPivot.y - mastPivot.y,
        mastPivot,
        bladeX: worldPivot.x - bladePivot.x,
        bladeY: worldPivot.y - bladePivot.y,
        bladePivot,
      };
    });

    const panelRegionStart = west.x + sceneWidth * 0.14;
    const panelRegionEnd = east.x - sceneWidth * 0.12;
    const panelSpacing =
      panels.length > 1
        ? (panelRegionEnd - panelRegionStart) / (panels.length - 1)
        : 0;
    const panelGroundY = groundAnchor.y - sceneHeight * 0.01;

    const panelPlacements = panels.map((panel, index) => {
      const panelPivot = requirePivot(panel, "pivot_ground");
      const targetX = panelRegionStart + panelSpacing * index;

      return {
        x: targetX - panelPivot.x,
        y: panelGroundY - panelPivot.y,
        pivot: panelPivot,
      };
    });

    return {
      fitScale,
      translateX,
      translateY,
      sceneWidth,
      sceneHeight,
      groundPlacement,
      groundPivot,
      turbinePlacements,
      panelPlacements,
    };
  }, [assets, height, width]);

  if (!assets || !geometry) {
    return null;
  }

  const popAt = (delayFrames: number) =>
    spring({
      fps,
      frame: Math.max(0, frame - delayFrames),
      config: {
        stiffness: 130,
        damping: 16,
        mass: 0.85,
      },
    });

  const backgroundPop = popAt(0);
  const groundPop = popAt(baseStaggerFrames);
  const mastPop = popAt(baseStaggerFrames * 2);
  const bladePop = popAt(baseStaggerFrames * 3);
  const panelPop = popAt(baseStaggerFrames * 4);

  const bladeRotation = (frame / fps) * bladeDegreesPerSecond;

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

      <div
        style={{
          position: "absolute",
          width: assets.background.viewBox.width,
          height: assets.background.viewBox.height,
          transformOrigin: "0 0",
          transform: `translate(${geometry.translateX}px, ${geometry.translateY}px) scale(${geometry.fitScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            opacity: interpolate(backgroundPop, [0, 1], [0, 1]),
            transformOrigin: `${geometry.sceneWidth / 2}px ${geometry.sceneHeight / 2}px`,
            transform: `scale(${interpolate(backgroundPop, [0, 1], [0.96, 1])})`,
          }}
        >
          {renderAsset(assets.background)}
        </div>

        <div
          style={{
            position: "absolute",
            left: geometry.groundPlacement.x,
            top: geometry.groundPlacement.y,
            opacity: interpolate(groundPop, [0, 1], [0, 1]),
            transformOrigin: `${geometry.groundPivot.x}px ${geometry.groundPivot.y}px`,
            transform: `
              translateY(${interpolate(groundPop, [0, 1], [10, 0])}px)
              scaleY(${interpolate(groundPop, [0, 1], [0.12, 1])})
            `,
          }}
        >
          {renderAsset(assets.ground)}
        </div>

        {assets.masts.map((mast, index) => {
          const placement = geometry.turbinePlacements[index];

          return (
            <div
              key={`mast-${index + 1}`}
              style={{
                position: "absolute",
                left: placement.mastX,
                top: placement.mastY,
                opacity: interpolate(mastPop, [0, 1], [0, 1]),
                transformOrigin: `${placement.mastPivot.x}px ${mast.viewBox.height}px`,
                transform: `
                  translateY(${interpolate(mastPop, [0, 1], [16, 0])}px)
                  scaleY(${interpolate(mastPop, [0, 1], [0.08, 1])})
                `,
              }}
            >
              {renderAsset(mast)}
            </div>
          );
        })}

        {assets.blades.map((blade, index) => {
          const placement = geometry.turbinePlacements[index];
          const rotation = bladeRotation * (1 + index * 0.08) + index * 28;

          return (
            <div
              key={`blade-${index + 1}`}
              style={{
                position: "absolute",
                left: placement.bladeX,
                top: placement.bladeY,
                opacity: interpolate(bladePop, [0, 1], [0, 1]),
                transformOrigin: `${placement.bladePivot.x}px ${placement.bladePivot.y}px`,
                transform: `
                  scale(${interpolate(bladePop, [0, 1], [0.2, 1])})
                  rotate(${rotation}deg)
                `,
              }}
            >
              {renderAsset(blade)}
            </div>
          );
        })}

        {assets.panels.map((panel, index) => {
          const placement = geometry.panelPlacements[index];

          return (
            <div
              key={`panel-${index + 1}`}
              style={{
                position: "absolute",
                left: placement.x,
                top: placement.y,
                opacity: interpolate(panelPop, [0, 1], [0, 1]),
                transformOrigin: `${placement.pivot.x}px ${placement.pivot.y}px`,
                transform: `
                  translateY(${interpolate(panelPop, [0, 1], [28, 0])}px)
                  scale(${interpolate(panelPop, [0, 1], [0.2, 1])})
                `,
              }}
            >
              {renderAsset(panel)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
