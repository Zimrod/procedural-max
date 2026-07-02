// src/remotion/MyComp/CarDrive.tsx
import React, { useEffect, useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
  interpolate,
} from 'remotion';

const CANVAS_SIZE = 800;

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivot: { x: number; y: number };
}

interface BodyData extends PartData {
  frontPivot?: { x: number; y: number };
}

// ---------- Preset definitions ----------
type VehiclePreset = 'compact' | 'sedan' | 'suv' | 'truck' | 'bus' | 'tractor';

interface PresetData {
  bodySvgFile: string;
  wheelBackSvgFile: string;
  wheelFrontSvgFile: string;
  carScale: number;
  startX: number;
  endX: number;
  durationSeconds: number;
  yBody?: number;
  direction?: 'left-to-right' | 'right-to-left';
  shake?: number; // 0 to 1
}

const presets: Record<VehiclePreset, PresetData> = {
  compact: {
    bodySvgFile: 'compact_car_body.svg',
    wheelBackSvgFile: 'compact_car_wheel_back.svg',
    wheelFrontSvgFile: 'compact_car_wheel_front.svg',
    carScale: 0.4,
    startX: 0,
    endX: CANVAS_SIZE,
    durationSeconds: 4,
    direction: 'left-to-right',
  },
  sedan: {
    bodySvgFile: 'sedan_body.svg',
    wheelBackSvgFile: 'sedan_wheel_back.svg',
    wheelFrontSvgFile: 'sedan_wheel_front.svg',
    carScale: 0.45,
    startX: 0,
    endX: CANVAS_SIZE,
    durationSeconds: 5,
    direction: 'left-to-right',
  },
  suv: {
    bodySvgFile: 'suv_body.svg',
    wheelBackSvgFile: 'suv_wheel_back.svg',
    wheelFrontSvgFile: 'suv_wheel_front.svg',
    carScale: 0.5,
    startX: 0,
    endX: CANVAS_SIZE,
    durationSeconds: 5.5,
    direction: 'left-to-right',
  },
  truck: {
    bodySvgFile: 'truck_body.svg',
    wheelBackSvgFile: 'truck_wheel_back.svg',
    wheelFrontSvgFile: 'truck_wheel_front.svg',
    carScale: 0.6,
    startX: 0,
    endX: CANVAS_SIZE,
    durationSeconds: 6,
    direction: 'left-to-right',
  },
  bus: {
    bodySvgFile: 'bus_body.svg',
    wheelBackSvgFile: 'bus_wheel_back.svg',
    wheelFrontSvgFile: 'bus_wheel_front.svg',
    carScale: 0.7,
    startX: 0,
    endX: CANVAS_SIZE,
    durationSeconds: 7,
    direction: 'left-to-right',
  },
  tractor: {
    bodySvgFile: 'tractor/tractor_body.svg',
    wheelBackSvgFile: 'tractor/tractor_wheel_back.svg',
    wheelFrontSvgFile: 'tractor/tractor_wheel_front.svg',
    carScale: 1.3,
    startX: CANVAS_SIZE + 80,
    endX: -400,
    durationSeconds: 7,
    direction: 'right-to-left',
    yBody: 150,
    shake: 0.3,
  },
};

// Parse SVG, extract inner content, viewBox, and all pivots (by id)
const parseBody = (svgText: string): BodyData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error('Invalid SVG for body');

  const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number);
  const viewBox = vb ? { w: vb[2], h: vb[3] } : { w: 500, h: 500 };

  // Find all pivot elements (circles with id containing "pivot")
  const pivotEls = svgEl.querySelectorAll('circle[id*="pivot"]');
  let backPivot = { x: viewBox.w / 2, y: viewBox.h / 2 };
  let frontPivot: { x: number; y: number } | undefined;

  pivotEls.forEach((el) => {
    const id = el.getAttribute('id') || '';
    const cx = parseFloat(el.getAttribute('cx') ?? '0');
    const cy = parseFloat(el.getAttribute('cy') ?? '0');
    if (id === 'pivot_back' || (pivotEls.length === 1 && id === 'pivot')) {
      backPivot = { x: cx, y: cy };
    } else if (id === 'pivot_front') {
      frontPivot = { x: cx, y: cy };
    }
  });

  // If only one pivot is found, use it as back; if none, fallback to center
  if (pivotEls.length === 1 && !frontPivot) {
    backPivot = {
      x: parseFloat(pivotEls[0].getAttribute('cx') ?? String(viewBox.w / 2)),
      y: parseFloat(pivotEls[0].getAttribute('cy') ?? String(viewBox.h / 2)),
    };
  }

  if (!frontPivot && pivotEls.length > 1) {
    // If more than one pivot but none named pivot_front, use the second as front
    frontPivot = {
      x: parseFloat(pivotEls[1].getAttribute('cx') ?? String(viewBox.w / 2)),
      y: parseFloat(pivotEls[1].getAttribute('cy') ?? String(viewBox.h / 2)),
    };
  }

  return {
    svgText: svgEl.innerHTML,
    viewBox,
    pivot: backPivot,
    frontPivot,
  };
};

// Parse a wheel (must have a pivot at its center)
const parseWheel = (svgText: string): PartData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error('Invalid SVG for wheel');

  const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number);
  const viewBox = vb ? { w: vb[2], h: vb[3] } : { w: 100, h: 100 };

  const pivotEl = svgEl.querySelector('#pivot');
  let pivot = { x: viewBox.w / 2, y: viewBox.h / 2 };
  if (pivotEl) {
    pivot = {
      x: parseFloat(pivotEl.getAttribute('cx') ?? String(viewBox.w / 2)),
      y: parseFloat(pivotEl.getAttribute('cy') ?? String(viewBox.h / 2)),
    };
  } else {
    console.warn('Wheel SVG missing #pivot – using viewBox center');
  }

  return {
    svgText: svgEl.innerHTML,
    viewBox,
    pivot,
  };
};

// Renders a single part with rotation around its pivot
const Part: React.FC<{
  data: PartData;
  scale: number;
  anchorX: number; // world position where the pivot should be placed
  anchorY: number;
  rotateDeg: number;
}> = ({ data, scale, anchorX, anchorY, rotateDeg }) => {
  const scaledPivotX = data.pivot.x * scale;
  const scaledPivotY = data.pivot.y * scale;
  const tx = anchorX - scaledPivotX;
  const ty = anchorY - scaledPivotY;

  return (
    <g transform={`rotate(${rotateDeg}, ${anchorX}, ${anchorY})`}>
      <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>
        <g dangerouslySetInnerHTML={{ __html: data.svgText }} />
      </g>
    </g>
  );
};

export const CarDrive: React.FC<{
  preset?: VehiclePreset;                         // name of a preset
  bodySvgFile?: string;                           // override preset
  wheelBackSvgFile?: string;
  wheelFrontSvgFile?: string;
  startX?: number;
  endX?: number;
  durationSeconds?: number;
  carScale?: number;
  direction?: 'left-to-right' | 'right-to-left';
  yBody?: number;                                 // vertical position (pixels in canvas)
  shake?: number;
}> = ({
  preset,
  bodySvgFile,
  wheelBackSvgFile,
  wheelFrontSvgFile,
  startX,
  endX,
  durationSeconds,
  carScale,
  direction,
  yBody,
  shake,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  const xScale = videoWidth / CANVAS_SIZE;
  const yScale = videoHeight / CANVAS_SIZE;

  // Resolve final props: preset defaults + explicit overrides
  const presetData = preset ? presets[preset] : null;
  const resolved = {
    bodySvgFile: bodySvgFile ?? presetData?.bodySvgFile ?? 'car_body.svg',
    wheelBackSvgFile: wheelBackSvgFile ?? presetData?.wheelBackSvgFile ?? 'wheel_back.svg',
    wheelFrontSvgFile: wheelFrontSvgFile ?? presetData?.wheelFrontSvgFile ?? 'wheel_front.svg',
    carScale: carScale ?? presetData?.carScale ?? 0.5,
    startX: (startX ?? presetData?.startX ?? 0) * xScale,
    endX: (endX ?? presetData?.endX ?? CANVAS_SIZE) * xScale,
    durationSeconds: durationSeconds ?? presetData?.durationSeconds ?? 5,
    direction: direction ?? presetData?.direction ?? 'left-to-right',
    yBody: (yBody ?? presetData?.yBody ?? CANVAS_SIZE * 0.7) * yScale,
    shake: shake ?? presetData?.shake ?? 0,
  };

  const [bodyData, setBodyData] = useState<BodyData | null>(null);
  const [wheelBackData, setWheelBackData] = useState<PartData | null>(null);
  const [wheelFrontData, setWheelFrontData] = useState<PartData | null>(null);

  useEffect(() => {
    const handle = delayRender('Loading car SVGs');
    Promise.all([
      fetch(staticFile(resolved.bodySvgFile)).then(r => r.text()),
      fetch(staticFile(resolved.wheelBackSvgFile)).then(r => r.text()),
      fetch(staticFile(resolved.wheelFrontSvgFile)).then(r => r.text()),
    ])
      .then(([bodySvg, backSvg, frontSvg]) => {
        setBodyData(parseBody(bodySvg));
        setWheelBackData(parseWheel(backSvg));
        setWheelFrontData(parseWheel(frontSvg));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Failed to load car SVGs:', err);
        continueRender(handle);
      });
  }, [resolved.bodySvgFile, resolved.wheelBackSvgFile, resolved.wheelFrontSvgFile]);

  if (!bodyData || !wheelBackData || !wheelFrontData) return null;

  const progress = interpolate(
    frame,
    [0, resolved.durationSeconds * fps],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  let x = resolved.startX + (resolved.endX - resolved.startX) * progress;
  if (resolved.direction === 'right-to-left') {
    x = resolved.startX - (resolved.startX - resolved.endX) * progress;
  }

  const shakeIntensity = resolved.shake ?? 0;
  let shakeOffset = 0;
  if (shakeIntensity > 0) {
    const shakeSpeed = 20; // cycles per second
    const shakeAmplitude = 10 * shakeIntensity; // max 10px
    shakeOffset = Math.sin((frame / fps) * shakeSpeed * Math.PI * 2) * shakeAmplitude;
  }

  // Wheel anchor positions (no shake)
  const bodyBackPivotWorld = {
    x: x + bodyData.pivot.x * resolved.carScale,
    y: resolved.yBody + bodyData.pivot.y * resolved.carScale,
  };

  let bodyFrontPivotWorld = null;
  if (bodyData.frontPivot) {
    bodyFrontPivotWorld = {
      x: x + bodyData.frontPivot.x * resolved.carScale,
      y: resolved.yBody + bodyData.frontPivot.y * resolved.carScale,
    };
  }

  // Body anchor with shake (vertical only, can also add rotation later)
  const bodyWorldWithShake = {
    x: bodyBackPivotWorld.x,
    y: bodyBackPivotWorld.y + shakeOffset,
  };

  const getWheelRotation = (wheelData: PartData) => {
    const wheelDiameter = Math.max(wheelData.viewBox.w, wheelData.viewBox.h) * resolved.carScale;
    const wheelCircumference = Math.PI * wheelDiameter;
    const totalDistance = Math.abs(resolved.endX - resolved.startX);
    const totalRotations = totalDistance / wheelCircumference;
    const totalRotationDeg = totalRotations * 360;
    const rotationDeg = progress * totalRotationDeg;
    return resolved.direction === 'left-to-right' ? rotationDeg : -rotationDeg;
  };

  const backWheelRot = getWheelRotation(wheelBackData);
  const frontWheelRot = getWheelRotation(wheelFrontData);

  return (
    <svg
      width={videoWidth}
      height={videoHeight}
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Part
        data={bodyData}
        scale={resolved.carScale}
        anchorX={bodyWorldWithShake.x}
        anchorY={bodyWorldWithShake.y}
        rotateDeg={0}
      />
      <Part
        data={wheelBackData}
        scale={resolved.carScale}
        anchorX={bodyBackPivotWorld.x}
        anchorY={bodyBackPivotWorld.y}
        rotateDeg={backWheelRot}
      />
      {bodyFrontPivotWorld && (
        <Part
          data={wheelFrontData}
          scale={resolved.carScale}
          anchorX={bodyFrontPivotWorld.x}
          anchorY={bodyFrontPivotWorld.y}
          rotateDeg={frontWheelRot}
        />
      )}
    </svg>
  );
};