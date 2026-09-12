// src/Root.tsx
import { Composition, getInputProps } from "remotion";
import { Main } from "./graphics/Main";
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./types/constants";

export const Root: React.FC = () => {
  // 1. Unpack properties using the exact snake_case keys sent by your backend
  const inputProps = getInputProps() as {
    scene_config?: any[];
    voiceover_url?: string;
    aspectRatio?: number;
  };

  // Map to your local React variables
  const scenes = inputProps.scene_config || [];
  
  // Use the dynamic voiceover URL, or a robust public placeholder if completely empty
  const audioUrl = inputProps.voiceover_url || ""; 

  // 2. Safely derive total length from all independent widget timeline windows.
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
        // These are fallback dimensions for Studio/Player. Lambda applies the
        // render payload's aspect ratio through calculateMetadata below.
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        calculateMetadata={({ props }) => {
          const renderProps = props as typeof inputProps;
          const ratio = Number.isFinite(renderProps.aspectRatio) && renderProps.aspectRatio! > 0
            ? renderProps.aspectRatio!
            : VIDEO_WIDTH / VIDEO_HEIGHT;

          return {
            width: Math.max(1, Math.round(VIDEO_HEIGHT * ratio)),
            height: VIDEO_HEIGHT,
          };
        }}
        defaultProps={{
          scenes: scenes,
          audioUrl: audioUrl,
        }}
      />
    </>
  );
};
