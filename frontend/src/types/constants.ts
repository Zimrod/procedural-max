import { z } from "zod";
// import { CAPTION_FRAMES } from "../remotion/MyComp/CaptioningDemo";

export const COMP_NAME = "vidWithCaptions";

export const CompositionProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Dynamic Captions Demo",
};

// export const DURATION_IN_FRAMES = CAPTION_FRAMES;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
export const VOICEOVER_DELAY_SECONDS = 2; // Adjustable global start delay
const LINGER_SECONDS = VOICEOVER_DELAY_SECONDS * 2; // Extra time at the end

export const calculateTotalDuration = (words: { end: number }[]) => {
  if (!words || words.length === 0) return 15 * VIDEO_FPS; // Fallback
  
  const lastWordEnd = words[words.length - 1].end;
  // Final duration = (Last word timestamp + buffer) * FPS
  return Math.ceil((lastWordEnd + LINGER_SECONDS) * VIDEO_FPS);
};