// src/graphics/AudioLayers.tsx
import { Audio, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { getDynamicBgmVolume } from "../core/utils/audioMath";

export interface AudioConfig {
  voUrl?: string;
  voVolume: number;
  voStartFrame?: number;
  voDurationFrames?: number;
  bgmUrl?: string;
  bgmVolume: number;
  bgmStartFrame?: number;
  bgmDurationFrames?: number;
  masterVolume: number;
  autoDucking: boolean;
}

export function AudioLayers({ audioConfig }: { audioConfig: AudioConfig }) {
  // useCurrentFrame() is relative to the containing Sequence. Convert it back
  // to the composition timeline before calculating ducking/fades.
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const voiceoverDuration = audioConfig.voDurationFrames && audioConfig.voDurationFrames > 0
    ? audioConfig.voDurationFrames
    : undefined;
  const masterVolume = audioConfig.masterVolume ?? 1;
  const bgmStartFrame = Math.max(0, audioConfig.bgmStartFrame ?? 0);
  const bgmDuration = audioConfig.bgmDurationFrames && audioConfig.bgmDurationFrames > 0
    ? audioConfig.bgmDurationFrames
    : Math.max(1, durationInFrames - bgmStartFrame);
  const bgmEndFrame = Math.min(durationInFrames, bgmStartFrame + bgmDuration);

  const voEndFrame =
    audioConfig.voStartFrame !== undefined && audioConfig.voDurationFrames
      ? audioConfig.voStartFrame + audioConfig.voDurationFrames
      : undefined;

  return (
    <>
      {/* Voiceover Track */}
      {audioConfig.voUrl && (
        <Sequence
          from={Math.max(0, audioConfig.voStartFrame ?? 0)}
          durationInFrames={voiceoverDuration || Math.max(1, durationInFrames - Math.max(0, audioConfig.voStartFrame ?? 0))}
        >
          <Audio
            src={audioConfig.voUrl}
            volume={audioConfig.voVolume * masterVolume}
            startFrom={0}
            {...(voiceoverDuration ? { endAt: voiceoverDuration } : {})}
          />
        </Sequence>
      )}

      {/* Background Music Track */}
      {audioConfig.bgmUrl && bgmEndFrame > bgmStartFrame && (
        <Sequence from={bgmStartFrame} durationInFrames={bgmEndFrame - bgmStartFrame}>
          <Audio
            src={audioConfig.bgmUrl}
            volume={() =>
              getDynamicBgmVolume({
                frame: frame + bgmStartFrame,
                totalFrames: durationInFrames,
                bgmMasterVolume: audioConfig.bgmVolume * masterVolume,
                duckedVolumeRatio: audioConfig.autoDucking ? 0.15 : 1.0,
                voStartFrame: audioConfig.voStartFrame ?? 0,
                voEndFrame,
                fadeStartFrame: bgmStartFrame,
                fadeEndFrame: bgmEndFrame,
              })
            }
          />
        </Sequence>
      )}
    </>
  );
}
