import type { PlayerRef } from '@remotion/player';
import React, { useEffect } from 'react';

export const formatTime = (frame: number, fps: number): string => {
  const hours = Math.floor(frame / fps / 3600);
  const minutes = Math.floor((frame / fps / 60) % 60);
  const seconds = Math.floor((frame / fps) % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const TimeDisplay: React.FC<{
  durationInFrames: number;
  fps: number;
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ durationInFrames, fps, playerRef }) => {
  const [time, setTime] = React.useState(0);

  useEffect(() => {
    const { current } = playerRef;
    if (!current) return;

    const onTimeUpdate = () => setTime(current.getCurrentFrame());
    current.addEventListener('frameupdate', onTimeUpdate);
    return () => current.removeEventListener('frameupdate', onTimeUpdate);
  }, [playerRef]);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      color: '#333',
      display: 'flex',
      gap: '4px'
    }}>
      <span>{formatTime(time, fps)}</span>
      <span>/</span>
      <span>{formatTime(durationInFrames, fps)}</span>
    </div>
  );
};