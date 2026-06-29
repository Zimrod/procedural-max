// src/remotion/Root.tsx
import { Composition } from "remotion";
import { Main } from "./MyComp/Main";
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "../types/constants";

// Import your raw pipeline data payloads safely
import captionsData from "../public/02_transcription.json";
import sceneConfigData from "../public/08_scene_config.json";

export const Root: React.FC = () => {
  // 💡 CALCULATE THE TRUE PARAMETRIC TIMELINE AT MOUNT
  // Get the absolute end time of the last word in the transcription array
  const lastWordSeconds = captionsData.words[captionsData.words.length - 1].end;
  
  // Convert to frames and explicitly append your 3-second (90 frames) post-roll buffer
  const baseAudioFrames = Math.ceil(lastWordSeconds * VIDEO_FPS);
  const totalVideoFramesWithBuffer = baseAudioFrames + (VIDEO_FPS * 3);

  return (
    <>
      <Composition
        id="MainScene"
        component={Main}
        // 💡 THIS IS THE MOAT FIXED AXIS: Remotion now locks onto the real buffered timeline!
        durationInFrames={totalVideoFramesWithBuffer}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          captions: captionsData.words,
          scenes: sceneConfigData,
          audioUrl: "01_voiceover.mp3", // Update with your media source asset link mapping
        }}
      />
    </>
  );
};