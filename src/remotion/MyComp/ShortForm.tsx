// src/remotion/Compositions/ShortForm.tsx
import { useVideoConfig, Sequence } from 'remotion';
import { TextAnimation } from '../Elements/TextAnimations';

export const ShortForm: React.FC<{
  clips: MediaClip[];
  captions: Caption[];
}> = ({ clips, captions }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      {clips.map((clip, i) => (
        <Sequence
          key={clip.id}
          from={i * fps * clip.duration}
          durationInFrames={fps * clip.duration}
        >
          <MediaComponent clip={clip} />
        </Sequence>
      ))}
      
      <CaptionTrack captions={captions} />
    </>
  );
};