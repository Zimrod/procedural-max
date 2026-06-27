// src/remotion/MyComp/CanvasParticleLogoAssemblyRig.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  useCurrentFrame, 
  useVideoConfig, 
  AbsoluteFill, 
  interpolate, 
  Easing,
  staticFile 
} from "remotion";

type Particle = {
  readonly targetX: number;  
  readonly targetY: number;  
  readonly startOffsetX: number; 
  readonly startOffsetY: number; 
  readonly color: string;
  readonly staggerDelay: number; 
};

type RigProps = {
  readonly logoFileOrUrl: string;      // 💡 Takes "logo.svg" OR a full dynamic uploaded URL string
  readonly logoWidth?: number;         
  readonly particleSpacing?: number;   
  readonly backgroundColor?: string;
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number;  
};

export const CanvasParticleLogoAssemblyRig: React.FC<RigProps> = ({
  logoFileOrUrl = "logo.svg", // Default fallback asset
  logoWidth = 600,
  particleSpacing = 2, 
  backgroundColor = "#dde9ff",
  startFrameOffset = 10,
  durationInFrames = 120,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [logoDimensions, setLogoDimensions] = useState({ w: 0, h: 0 });

  // 💡 RESOLVE LOCATION INTELLIGENTLY
  // If it's just a filename, look in public/logos/. Otherwise, use the raw URL.
  const resolvedLogoUrl = useMemo(() => {
    if (!logoFileOrUrl) return "";
    const isFullUrl = logoFileOrUrl.includes("://") || logoFileOrUrl.startsWith("data:") || logoFileOrUrl.startsWith("blob:");
    return isFullUrl ? logoFileOrUrl : staticFile(`logos/${logoFileOrUrl}`);
  }, [logoFileOrUrl]);

  // 1. OFFSCREEN BITMAP CONVERTER & REVERSE MATRIX GENERATOR
  useEffect(() => {
    if (!resolvedLogoUrl) return;
    
    const img = new Image();
    img.src = resolvedLogoUrl;
    img.crossOrigin = "anonymous"; 
    
    img.onload = () => {
      const scaleFactor = logoWidth / img.width;
      const computedW = logoWidth;
      const computedH = img.height * scaleFactor;
      setLogoDimensions({ w: computedW, h: computedH });

      const scratchCanvas = document.createElement("canvas");
      scratchCanvas.width = computedW;
      scratchCanvas.height = computedH;
      const ctx = scratchCanvas.getContext("2d");
      
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, computedW, computedH);
      
      const imgData = ctx.getImageData(0, 0, computedW, computedH);
      const pixels = imgData.data;
      const sampledParticles: Particle[] = [];

      for (let y = 0; y < computedH; y += particleSpacing) {
        for (let x = 0; x < computedW; x += particleSpacing) {
          const alphaIndex = (y * computedW + x) * 4 + 3;
          
          if (pixels[alphaIndex] > 128) {
            const r = pixels[alphaIndex - 3];
            const g = pixels[alphaIndex - 2];
            const b = pixels[alphaIndex - 1];
            const colorString = `rgba(${r}, ${g}, ${b}, 1)`;

            const angle = Math.random() * Math.PI * 2;
            const scatterDistance = 300 + Math.random() * 500;

            sampledParticles.push({
              targetX: x,
              targetY: y,
              startOffsetX: Math.cos(angle) * scatterDistance,
              startOffsetY: Math.sin(angle) * scatterDistance - 150, 
              color: colorString,
              staggerDelay: (x / computedW) * 0.35,
            });
          }
        }
      }
      
      setParticles(sampledParticles);
      setImageLoaded(true);
    };
  }, [resolvedLogoUrl, logoWidth, particleSpacing]);

  // 2. REVERSE DETERMINISTIC CANVAS ASSEMBLY LOOP
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || particles.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false; 

    const centerOffsetX = width / 2 - logoDimensions.w / 2;
    const centerOffsetY = height / 2 - logoDimensions.h / 2;

    const activeDuration = durationInFrames - startFrameOffset;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (frame < startFrameOffset) {
        ctx.fillStyle = p.color.replace("1)", "0)"); 
        continue;
      }

      const currentTimelineProgress = (frame - startFrameOffset) / activeDuration;
      
      const individualProgress = interpolate(
        currentTimelineProgress,
        [0.0, 0.65 + p.staggerDelay], 
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad), 
        }
      );

      const currentX = centerOffsetX + interpolate(individualProgress, [0, 1], [p.targetX + p.startOffsetX, p.targetX]);
      const currentY = centerOffsetY + interpolate(individualProgress, [0, 1], [p.targetY + p.startOffsetY, p.targetY]);

      const opacity = interpolate(individualProgress, [0, 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      ctx.fillStyle = p.color.replace("1)", `${opacity})`);

      const currentSize = individualProgress >= 1 
        ? Math.ceil(particleSpacing) 
        : particleSpacing * interpolate(individualProgress, [0, 1], [2.5, 1]);

      ctx.fillRect(
        currentX, 
        currentY, 
        currentSize, 
        currentSize
      );
    }
  }, [frame, imageLoaded, particles, width, height, logoDimensions, startFrameOffset, durationInFrames, particleSpacing]);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </AbsoluteFill>
  );
};