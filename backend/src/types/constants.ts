// src/types/constants.ts

import { z } from "zod";

export const COMP_NAME = "vidWithCaptions";

export const CompositionProps = z.object({
  title: z.string(),
});

export type CompositionPropsType =
  z.infer<typeof CompositionProps>;

export const defaultMyCompProps: CompositionPropsType = {
  title: "Dynamic Captions Demo",
};

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

export const VOICEOVER_DELAY_SECONDS = 2;

const LINGER_SECONDS = VOICEOVER_DELAY_SECONDS * 2;

export const calculateTotalDuration = (
  words: { end: number }[]
) => {
  if (!words || words.length === 0) {
    return 15 * VIDEO_FPS;
  }

  const lastWordEnd = words[words.length - 1].end;

  return Math.ceil(
    (lastWordEnd + LINGER_SECONDS) * VIDEO_FPS
  );
};