// src/Root.tsx
import { Composition, getInputProps } from "remotion";
import { Main } from "./graphics/Main";
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./types/constants";

export const Root: React.FC = () => {
  // 1. Unpack properties passed down dynamically from AWS Lambda inputProps
  const inputProps = getInputProps() as {
    sceneConfig?: any;
    voiceoverUrl?: string;
  };

  // Fallbacks for local editing/compilation stability
  const scenes = inputProps.sceneConfig || [];
  const audioUrl = inputProps.voiceoverUrl || "01_voiceover.mp3";

  // 2. Safely derive total length from scene durations calculated by your backend pipeline
  // This bypasses requiring captions data directly on the root mounting node
  let totalVideoFramesWithBuffer = VIDEO_FPS * 10; // Default 10 second fallback

  if (scenes && scenes.length > 0) {
    const lastScene = scenes[scenes.length - 1];
    if (lastScene && typeof lastScene.endFrame === "number") {
      // Append a 3-second (90 frames at 30fps) post-roll buffer onto the final scene frame index
      totalVideoFramesWithBuffer = lastScene.endFrame + (VIDEO_FPS * 3);
    }
  }

  return (
    <>
      <Composition
        id="MainScene" // 👈 Matches your server trigger configuration string exactly
        component={Main}
        durationInFrames={totalVideoFramesWithBuffer}
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