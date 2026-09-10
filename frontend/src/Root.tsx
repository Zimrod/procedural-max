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

  // Match the dimensions used by PreviewPlayer. Lambda validates the
  // composition using these values before rendering any frames.
  const aspectRatio = Number.isFinite(inputProps.aspectRatio) && inputProps.aspectRatio! > 0
    ? inputProps.aspectRatio!
    : VIDEO_WIDTH / VIDEO_HEIGHT;
  const compositionHeight = VIDEO_HEIGHT;
  const compositionWidth = Math.max(1, Math.round(compositionHeight * aspectRatio));

  // 2. Safely derive total length from scene durations calculated by your backend pipeline
  let totalVideoFramesWithBuffer = VIDEO_FPS * 10; // Default 10 second fallback

  if (scenes && scenes.length > 0) {
    const lastScene = scenes[scenes.length - 1];
    // Adjusting this check to use whichever frame naming convention you have (e.g., durationFrames or endFrame)
    const endingFrame = typeof lastScene.endFrame === "number" 
      ? lastScene.endFrame 
      : (lastScene.startFrame + lastScene.durationFrames);

    if (typeof endingFrame === "number") {
      // Append a 3-second (90 frames at 30fps) post-roll buffer onto the final scene frame index
      totalVideoFramesWithBuffer = endingFrame + (VIDEO_FPS * 3);
    }
  }

  return (
    <>
      <Composition
        id="MainScene"
        component={Main}
        durationInFrames={totalVideoFramesWithBuffer}
        fps={VIDEO_FPS}
        width={compositionWidth}
        height={compositionHeight}
        defaultProps={{
          scenes: scenes,
          audioUrl: audioUrl,
        }}
      />
    </>
  );
};
