import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { runPreset } from "../core/presets/runPreset";
import { solveConstraints } from "../core/constraints/solveConstraints";
import { Forklift } from "../rigs/forklift/Forklift";
import { Pallet } from "../rigs/pallet/Pallet";
import { OilDrum } from "../rigs/oil_drum/OilDrum";
import { createForkliftEntity } from "../rigs/forklift/createForkliftEntity";
import { createPalletEntity } from "../rigs/pallet/createPalletEntity";
import { createOilDrumEntity } from "../rigs/oil_drum/createOilDrumEntity";
import { parsePart, PartData } from "../core/utils/svgUtils";
import { StickmanRig } from "../rigs/stickman/StickmanRig";

// SVGs are loaded once at module level by each rig component internally.
// Puppeteer only needs parsed pivot data for getPivots() — loaded here
// via the same parsePart utility the rigs use.
import { staticFile, delayRender, continueRender } from "remotion";
import { useEffect, useState } from "react";

type PuppeteerProps = {
  entities: any[];
  timeline: any[];
  constraints?: any[];
};

export const Puppeteer: React.FC<PuppeteerProps> = ({
  entities,
  constraints = [],
  timeline = [],
}) => {
  const frame = useCurrentFrame();

  // Load pivot data for createXEntity factories.
  // The rig components load their own SVGs for rendering — this is separate,
  // only for pivot geometry used by the constraint solver.
  const [parts, setParts] = useState<Partial<Record<string, PartData>>>({});

  useEffect(() => {
    const handle = delayRender("Puppeteer: loading pivot data");
    const pathMap: Record<string, string> = {
      forklift_body: "forklift/forklift_body.svg",
      forklift_fork: "forklift/forklift_fork.svg",
      pallet:        "pallet/pallet.svg",
      oil_drum:      "oil_drum/oil_drum.svg",
    };

    Promise.all(
      Object.entries(pathMap).map(async ([name, path]) => {
        const res  = await fetch(staticFile(path));
        const text = await res.text();
        return [name, parsePart(text, name)] as [string, PartData];
      })
    )
      .then((entries) => {
        setParts(Object.fromEntries(entries));
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Puppeteer pivot load failed:", err);
        continueRender(handle);
      });
  }, []);

  if (Object.keys(parts).length < 4) return null;

  // --- 1. Apply timeline presets ---
  const animatedEntities = entities.map((entity) => {
    const anims = timeline.filter((t) => t.target === entity.id);

    let updatedTransform = { ...entity.transform };
    let updatedProps     = { ...(entity.props ?? {}) };

    anims.forEach((anim) => {
      const result = runPreset(anim.preset, frame, anim.params);
      if (result.x !== undefined) updatedTransform.x = result.x;
      if (result.y !== undefined) updatedTransform.y = result.y;
      const { x: _x, y: _y, ...rest } = result;
      updatedProps = { ...updatedProps, ...rest };
    });

    return { ...entity, transform: updatedTransform, props: updatedProps };
  });

  // --- 2. Enrich with getPivots() ---
  const enrichedEntities = animatedEntities.map((entity) => {
    switch (entity.type) {
      case "forklift":
        return createForkliftEntity(entity, parts.forklift_body!, parts.forklift_fork!);
      case "pallet":
        return createPalletEntity(entity, parts.pallet!);
      case "oil_drum":
        return createOilDrumEntity(entity, parts.oil_drum!);
      case "stickman":
        // Stickman doesn't use SVG pivots, so no enrichment needed
        return entity;
      default:
        return entity;
    }
  });

  // --- 3. Resolve constraints ---
  const resolvedEntities = solveConstraints(enrichedEntities, constraints, frame);

  // --- 4. Render ---
  const renderEntity = (entity: any) => {
    const { x, y } = entity.transform;
    const { scale, forkCarriageOffsetY, wheelBackRotDeg, wheelFrontRotDeg } = entity.props ?? {};

    switch (entity.type) {
      case "forklift":
        return (
          <Forklift
            key={entity.id}
            x={x}
            y={y}
            scale={scale}
            forkCarriageOffsetY={forkCarriageOffsetY}
            wheelBackRotDeg={wheelBackRotDeg}
            wheelFrontRotDeg={wheelFrontRotDeg}
          />
        );
      case "pallet":
        return <Pallet  key={entity.id} x={x} y={y} scale={scale} />;
      case "oil_drum":
        return <OilDrum key={entity.id} x={x} y={y} scale={scale} />;
      case "stickman":
        return (
          <StickmanRig
            key={entity.id}
            x={x}
            y={y}
            scale={entity.props?.scale || 1}
            walkPhase={entity.props?.walkPhase || 0}
            talk={entity.props?.talk || 0}
            emotion={entity.props?.emotion || "neutral"}
            mode={entity.props?.mode || "idle"}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill>
      {resolvedEntities.map(renderEntity)}
    </AbsoluteFill>
  );
};