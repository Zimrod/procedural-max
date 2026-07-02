// src/remotion/core/presets/characterMode.ts
//
// Returns the active mode for a character at the current frame.
// Phases are checked in order — first matching phase wins.
// Outputs { mode } which the rig reads to adjust non-blended behaviour.

type Phase = {
  start: number;
  end: number;
  mode: string;
};

type Params = {
  phases: Phase[];
  defaultMode?: string;
};

export const characterMode = (
  frame: number,
  { phases, defaultMode = 'idle' }: Params
) => {
  const active = phases.find(p => frame >= p.start && frame <= p.end);
  return { mode: active?.mode ?? defaultMode };
};