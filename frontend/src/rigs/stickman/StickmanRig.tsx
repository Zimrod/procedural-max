// src/rigs/stickman/StickmanRig.tsx
import React from "react";

type Props = {
  x: number;
  y: number;

  scale?: number;

  // --- motion
  walkPhase?: number;   // 0 → 1 loop
  speed?: number;

  // --- talking
  talk?: number;        // 0 → 1
  emotion?: "neutral" | "happy" | "angry";

  // --- state
  mode?: "idle" | "walk" | "talk";
};

export const StickmanRig: React.FC<Props> = ({
  x,
  y,
  scale = 1,

  walkPhase = 0,
  speed = 1,

  talk = 0,
  emotion = "neutral",

  mode = "idle",
}) => {

  // -----------------------------
  // PHASE + BASE MOTION
  // -----------------------------
  const phase = walkPhase * speed;

  const swing = Math.sin(phase * 2 * Math.PI);
  const swingOpp = Math.sin((phase + 0.5) * 2 * Math.PI);

  const depth = Math.sin(phase * 2 * Math.PI);

  // -----------------------------
  // 2.5D DEPTH
  // -----------------------------
  const frontScale = 1 + 0.08 * depth;
  const backScale = 1 - 0.08 * depth;

  const leftIsFront = depth > 0;

  // -----------------------------
  // PARAMETERS
  // -----------------------------
  const legSwing = mode === "walk" ? 30 : 5;
  const kneeBend = 25;
  const armSwing = mode === "walk" ? 25 : 5;

  // -----------------------------
  // LEGS
  // -----------------------------
  const upperLegL = swing * legSwing;
  const upperLegR = swingOpp * legSwing;

  const lowerLegL = Math.max(0, -swing) * kneeBend;
  const lowerLegR = Math.max(0, -swingOpp) * kneeBend;

  // -----------------------------
  // ARMS
  // -----------------------------
  const upperArmL = swingOpp * armSwing;
  const upperArmR = swing * armSwing;

  const lowerArmL = 10;
  const lowerArmR = 10;

  // -----------------------------
  // TORSO SWAY (2.5D)
  // -----------------------------
  const torsoShiftX = depth * 4;

  // -----------------------------
  // TALKING (mouth animation)
  // -----------------------------
  const isTalking = talk > 0.5;

  const Mouth = () => {
    if (emotion === "happy") {
      return (
        <path
          d="M -6 -70 Q 0 -60 6 -70"
          stroke="black"
          strokeWidth="2"
          fill="none"
        />
      );
    }

    if (emotion === "angry") {
      return (
        <line x1="-6" y1="-68" x2="6" y2="-72" stroke="black" strokeWidth="2" />
      );
    }

    return isTalking ? (
      <ellipse cx="0" cy="-70" rx="6" ry="4" fill="black" />
    ) : (
      <line x1="-5" y1="-70" x2="5" y2="-70" stroke="black" />
    );
  };

  // -----------------------------
  // LIMB COMPONENTS
  // -----------------------------
  const LeftLeg = (
    <g
      style={{
        transform: `scale(${leftIsFront ? frontScale : backScale})`,
        transformOrigin: "0px 0px",
      }}
    >
      <g transform={`rotate(${upperLegL}, 0, 0)`}>
        <line x1="0" y1="0" x2="0" y2="40" stroke="black" strokeWidth="4" />
        <g transform={`translate(0, 40) rotate(${lowerLegL})`}>
          <line x1="0" y1="0" x2="0" y2="40" stroke="black" strokeWidth="4" />
        </g>
      </g>
    </g>
  );

  const RightLeg = (
    <g
      style={{
        transform: `scale(${leftIsFront ? backScale : frontScale})`,
        transformOrigin: "0px 0px",
      }}
    >
      <g transform={`rotate(${upperLegR}, 0, 0)`}>
        <line x1="0" y1="0" x2="0" y2="40" stroke="black" strokeWidth="4" />
        <g transform={`translate(0, 40) rotate(${lowerLegR})`}>
          <line x1="0" y1="0" x2="0" y2="40" stroke="black" strokeWidth="4" />
        </g>
      </g>
    </g>
  );

  const LeftArm = (
    <g transform={`translate(0, -50) rotate(${upperArmL})`}>
      <line x1="0" y1="0" x2="0" y2="30" stroke="black" strokeWidth="4" />
      <g transform={`translate(0, 30) rotate(${lowerArmL})`}>
        <line x1="0" y1="0" x2="0" y2="30" stroke="black" strokeWidth="4" />
      </g>
    </g>
  );

  const RightArm = (
    <g transform={`translate(0, -50) rotate(${upperArmR})`}>
      <line x1="0" y1="0" x2="0" y2="30" stroke="black" strokeWidth="4" />
      <g transform={`translate(0, 30) rotate(${lowerArmR})`}>
        <line x1="0" y1="0" x2="0" y2="30" stroke="black" strokeWidth="4" />
      </g>
    </g>
  );

  // -----------------------------
  // RENDER ORDER (2.5D)
  // -----------------------------
  const legs = leftIsFront ? (
    <>
      {RightLeg}
      {LeftLeg}
    </>
  ) : (
    <>
      {LeftLeg}
      {RightLeg}
    </>
  );

  const arms = leftIsFront ? (
    <>
      {RightArm}
      {LeftArm}
    </>
  ) : (
    <>
      {LeftArm}
      {RightArm}
    </>
  );

  // -----------------------------
  // FINAL RENDER
  // -----------------------------
  return (
    <svg
      style={{ position: "absolute", overflow: "visible", top: 0, left: 0 }}
      width="100%"
      height="100%"
    >
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g transform={`translate(${torsoShiftX}, 0)`}>

        {/* LEGS */}
        {legs}

        {/* TORSO */}
        <g transform="translate(0, -60)">
          <line x1="0" y1="0" x2="0" y2="60" stroke="black" strokeWidth="4" />
        </g>

        {/* ARMS */}
        {arms}

        {/* HEAD */}
        <circle cx="0" cy="-80" r="15" stroke="black" strokeWidth="4" fill="none" />

        {/* FACE */}
        <Mouth />

      </g>
    </g>
    </svg>
  );
};