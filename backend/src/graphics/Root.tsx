// src/Root.tsx
import { Composition, getInputProps } from "remotion";
import { Main } from "./graphics/Main";
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./types/constants";

export const Root: React.FC = () => {
  // 1. Unpack properties using the exact snake_case keys sent by your backend
  const inputProps = getInputProps() as {
    scene_config?: any[];
    voiceover_url?: string;
  };

  // Map to your local React variables
  const scenes = inputProps.scene_config || [];
  
  // Use the dynamic voiceover URL, or a robust public placeholder if completely empty
  const audioUrl = inputProps.voiceover_url || ""; 

  // 2. Derive total length from every independent widget timeline window.
  let totalVideoFrames = VIDEO_FPS * 10; // Default 10 second fallback

  if (scenes && scenes.length > 0) {
    const endingFrame = Math.max(...scenes.map((scene) => {
      const start = Number(scene.startFrame ?? scene.start ?? 0);
      const duration = Number(scene.durationFrames ?? scene.durationInFrames ?? scene.duration ?? 0);
      return Number(scene.endFrame ?? scene.end ?? start + duration);
    }));

    if (Number.isFinite(endingFrame)) {
      totalVideoFrames = Math.max(1, endingFrame);
    }
  }

  return (
    <>
      <Composition
        id="MainScene"
        component={Main}
        durationInFrames={totalVideoFrames}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          scenes: scenes,
          audioUrl: audioUrl,
        }}
      />
    </>
  );
};
