// src/components/editor/Controls.tsx
import { PlayerRef } from '@remotion/player';
import { useEditorStore } from '../../stores/useEditorStore';

export const EditorControls = ({ playerRef }: { playerRef: React.RefObject<PlayerRef> }) => {
  const { currentFrame, setCurrentFrame } = useEditorStore();
  
  return (
    <div className="timeline-controls">
      <input
        type="range"
        min={0}
        // max={playerRef.current?.durationInFrames || 0}
        value={currentFrame}
        onChange={(e) => {
          const frame = Number(e.target.value);
          setCurrentFrame(frame);
          playerRef.current?.seekTo(frame);
        }}
      />
      
      <button onClick={() => playerRef.current?.play()}>
        Play
      </button>
    </div>
  );
};
