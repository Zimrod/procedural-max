// src/remotion/puppeteer/Puppeteer.tsx
import React, { useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, staticFile, delayRender, continueRender } from "remotion";
import { runPreset } from "../core/presets/runPreset";
import { solveConstraints } from "../core/constraints/solveConstraints";
import { parsePart, PartData } from "../core/utils/svgUtils";
import { rigRegistry } from "../core/rigRegistry";

// Import rig registrations
import "../rigs/forklift/register";
import "../rigs/pallet/register";
import "../rigs/oil_drum/register";
import "../rigs/human_side/register";
import "../rigs/generic/register";
import '../rigs/car/register'

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

  const [partsCache, setPartsCache] = useState<Record<string, PartData>>({});
  const [partsReady, setPartsReady] = useState(false);

  // --- Load all SVG pivot data needed by the rigs in this scene ---
  useEffect(() => {
    const allTypes = entities.map((e) => e.type);
    const rigTypes = allTypes.filter((type, index) => allTypes.indexOf(type) === index);
    
    const requiredPartsMap: Record<string, string> = {};

    for (const type of rigTypes) {
      const rig = rigRegistry.get(type);
      if (rig?.requiredParts) {
        Object.assign(requiredPartsMap, rig.requiredParts);
      }
    }

    const entries = Object.entries(requiredPartsMap);

    // No parts needed — mark ready immediately
    if (entries.length === 0) {
      setPartsReady(true);
      return;
    }

    setPartsReady(false);
    const handle = delayRender("Puppeteer: loading SVG pivot data");

    Promise.all(
      entries.map(async ([logicalName, path]) => {
        const res  = await fetch(staticFile(path as string));
        const text = await res.text();
        return [logicalName, parsePart(text, logicalName)] as [string, PartData];
      })
    )
      .then((loaded) => {
        setPartsCache(Object.fromEntries(loaded));
        setPartsReady(true);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Puppeteer: failed to load SVG parts", err);
        continueRender(handle);
      });
  }, [entities]);

  // Block ALL rendering until parts are loaded.
  // This is the critical guard — without it enrichedEntities runs with an
  // empty partsCache, createXEntity receives undefined data, and getPivot crashes.
  if (!partsReady) return null;

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

  // --- 2. Enrich entities with getPivots() via registry ---
  const enrichedEntities = animatedEntities.map((entity) => {
    const rig = rigRegistry.get(entity.type);
    if (!rig?.enrich) return entity;

    // Collect only the parts this rig declared as required
    const neededParts: Record<string, PartData> = {};
    for (const logicalName of Object.keys(rig.requiredParts ?? {})) {
      const part = partsCache[logicalName];
      if (part) neededParts[logicalName] = part;
    }

    // Secondary guard: all declared parts must be present
    const allPresent = Object.keys(rig.requiredParts ?? {}).every(
      (k) => neededParts[k] !== undefined
    );
    if (!allPresent) {
      console.warn(`Puppeteer: missing parts for "${entity.type}", skipping enrich`);
      return entity;
    }

    return rig.enrich(entity, neededParts);
  });

  // --- 3. Resolve constraints ---
  const resolvedEntities = solveConstraints(enrichedEntities, constraints, frame);

  // --- 4. Render ---
  const renderEntity = (entity: any) => {
    const rig = rigRegistry.get(entity.type);

    // ── ADD THIS ──
    // console.log(`[Puppeteer] renderEntity`, {
    //   id: entity.id,
    //   type: entity.type,
    //   hasRig: !!rig,
    //   x: entity.transform.x,
    //   y: entity.transform.y,
    //   scale: entity.props?.scale,
    // });
    // ─────────────
    
    if (!rig) {
      console.warn(`Puppeteer: no rig registered for type "${entity.type}"`);
      return null;
    }
    const Component = rig.component;
    return <Component key={entity.id} {...entity.transform} {...entity.props} />;
  };

  return <AbsoluteFill>{resolvedEntities.map(renderEntity)}</AbsoluteFill>;
};