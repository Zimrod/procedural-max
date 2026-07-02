// src/remotion/MyComp/CanvasParticleLogoRig.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  useCurrentFrame, 
  useVideoConfig, 
  staticFile, 
  AbsoluteFill, 
  interpolate, 
  Easing 
} from "remotion";

type Particle = {
  readonly originX: number;
  readonly originY: number;
  readonly color: string;
  readonly angle: number;
  readonly speed: number;
  readonly lift: number;
  readonly staggerDelay: number; // Staggers disintegration from left to right
};

type RigProps = {
  readonly logoFileName: string;       // e.g., "my-logo.svg" or "logo.png"
  readonly logoWidth?: number;         // Scale boundary width inside the canvas
  readonly particleSpacing?: number;   // 💡 LOWER = High Density / More Particles (2 to 4 is sweet spot)
  readonly backgroundColor?: string;
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number;  // 💡 MASTER CONTROLLER
};

export const CanvasParticleLogoRig: React.FC<RigProps> = ({
  logoFileName = "logo.png", // Must sit inside your public/logos/ directory
  logoWidth = 900,
  particleSpacing = 6, 
  backgroundColor = "#e3ecfc",
  startFrameOffset = 15,
  durationInFrames = 140,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [logoDimensions, setLogoDimensions] = useState({ w: 0, h: 0 });

  // Resolve the static file route safely out of the public folder
  const logoUrl = useMemo(() => staticFile(`logos/${logoFileName}`), [logoFileName]);

  // 1. OFFSCREEN BITMAP POINT SAMPLING ENGINE
  useEffect(() => {
    const img = new Image();
    img.src = logoUrl;
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Scale height proportionally based on user-defined target width bounds
      const scaleFactor = logoWidth / img.width;
      const computedW = logoWidth;
      const computedH = img.height * scaleFactor;
      setLogoDimensions({ w: computedW, h: computedH });

      // Create an isolated offscreen scratchpad canvas to parse image vectors
      const scratchCanvas = document.createElement("canvas");
      scratchCanvas.width = computedW;
      scratchCanvas.height = computedH;
      const ctx = scratchCanvas.getContext("2d");
      
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, computedW, computedH);
      
      // Grab the raw underlying RGBA pixel matrix buffer array
      const imgData = ctx.getImageData(0, 0, computedW, computedH);
      const pixels = imgData.data;
      const sampledParticles: Particle[] = [];

      // Step across rows and columns using your particle spacing threshold density
      for (let y = 0; y < computedH; y += particleSpacing) {
        for (let x = 0; x < computedW; x += particleSpacing) {
          const alphaIndex = (y * computedW + x) * 4 + 3;
          
          // Only pull coordinates from solid parts of your logo graphic
          if (pixels[alphaIndex] > 128) {
            const r = pixels[alphaIndex - 3];
            const g = pixels[alphaIndex - 2];
            const b = pixels[alphaIndex - 1];
            const colorString = `rgba(${r}, ${g}, ${b}, 1)`;

            sampledParticles.push({
              originX: x,
              originY: y,
              color: colorString,
              // Pre-calculate randomized fluid trajectory vectors
              angle: Math.PI * 1.5 + (Math.random() - 0.5) * 0.5, // Predominantly blowing upwards
              speed: 1.5 + Math.random() * 3.5,
              lift: -0.4 - Math.random() * 1.2,
              // Stagger vector: Left pixels explode first, right pixels blow away later
              staggerDelay: (x / computedW) * 0.45, 
            });
          }
        }
      }
      
      setParticles(sampledParticles);
      setImageLoaded(true);
    };
  }, [logoUrl, logoWidth, particleSpacing]);

  // 2. DETERMINISTIC CANVAS RENDER LOOP (Tied strictly to Remotion Playhead)
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || particles.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flush old pixels clean every single frame update
    ctx.clearRect(0, 0, width, height);

    // Context Positioning Anchors: Lock logo bounding frame right dead center
    const centerOffsetX = width / 2 - logoDimensions.w / 2;
    const centerOffsetY = height / 2 - logoDimensions.h / 2;

    const activeDuration = durationInFrames - startFrameOffset;
    const currentTimelineProgress = (frame - startFrameOffset) / activeDuration;

    // Render the particle matrix state deterministically
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // If the scene hasn't fired yet, render the solid intact logo state
      if (frame < startFrameOffset) {
        ctx.fillStyle = p.color;
        ctx.fillRect(centerOffsetX + p.originX, centerOffsetY + p.originY, particleSpacing - 0.5, particleSpacing - 0.5);
        continue;
      }

      // Calculate individual particle lifecycle progression incorporating left-to-right stagger offsets
      const individualProgress = interpolate(
        currentTimelineProgress,
        [p.staggerDelay, 1.0],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.25, 1, 0.5, 1),
        }
      );

      if (individualProgress <= 0) {
        // Particle is resting before disintegration hits its column
        ctx.fillStyle = p.color;
        ctx.fillRect(centerOffsetX + p.originX, centerOffsetY + p.originY, particleSpacing - 0.5, particleSpacing - 0.5);
      } else {
        // Compute active spatial travel displacement based on progress parameters
        const physicalFrameTime = individualProgress * activeDuration;

        // Kinematic trajectory calculation formulas
        const velocityX = Math.cos(p.angle) * p.speed + 2.5; // Steady cross-wind factor sweeping right
        const velocityY = Math.sin(p.angle) * p.speed + p.lift; // Vertical lift factor drawing upwards

        const currentX = centerOffsetX + p.originX + (velocityX * physicalFrameTime);
        const currentY = centerOffsetY + p.originY + (velocityY * physicalFrameTime);

        // Alpha values dissolve away cleanly as they travel further from the origin
        const opacity = interpolate(individualProgress, [0, 0.2, 0.95, 1], [1, 1, 0, 0]);

        // Inject modified opacity back onto the particle's sampled color canvas context
        ctx.fillStyle = p.color.replace("1)", `${opacity})`);
        
        // Render out the dynamic pixel block vector
        ctx.fillRect(
          currentX, 
          currentY, 
          particleSpacing * interpolate(individualProgress, [0, 1], [1, 0.4]), // Slowly shrink particles as they fade
          particleSpacing * interpolate(individualProgress, [0, 1], [1, 0.4])
        );
      }
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