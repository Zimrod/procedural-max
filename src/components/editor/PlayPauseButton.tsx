import type {PlayerRef} from '@remotion/player';
import {useCallback, useEffect, useState} from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
 
export const PlayPauseButton: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
  const [playing, setPlaying] = useState(false);
 
  useEffect(() => {
    const {current} = playerRef;
    setPlaying(current?.isPlaying() ?? false);
    if (!current) return;
 
    const onPlay = () => {
      setPlaying(true);
    };
 
    const onPause = () => {
      setPlaying(false);
    };
 
    current.addEventListener('play', onPlay);
    current.addEventListener('pause', onPause);
 
    return () => {
      current.removeEventListener('play', onPlay);
      current.removeEventListener('pause', onPause);
    };
  }, [playerRef]);
 
  const onToggle = useCallback(() => {
    playerRef.current?.toggle();
  }, [playerRef]);
 
  return (
    <button 
      onClick={onToggle} 
      type="button"
      aria-label={playing ? 'Pause' : 'Play'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        color: '#333'
      }}
    >
      {playing ? <FaPause /> : <FaPlay />}
    </button>
  );
};