import type {PlayerRef} from '@remotion/player';
import React, {useEffect, useState} from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
 
export const MuteButton: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
  const [muted, setMuted] = useState(playerRef.current?.isMuted() ?? false);
 
  const onClick = React.useCallback(() => {
    if (!playerRef.current) {
      return;
    }
 
    if (playerRef.current.isMuted()) {
      playerRef.current.unmute();
    } else {
      playerRef.current.mute();
    }
  }, [playerRef]);
 
  useEffect(() => {
    const {current} = playerRef;
    if (!current) {
      return;
    }
 
    const onMuteChange = () => {
      setMuted(current.isMuted());
    };
 
    current.addEventListener('mutechange', onMuteChange);
    return () => {
      current.removeEventListener('mutechange', onMuteChange);
    };
  }, [playerRef]);
 
  return (
    <button 
      type="button" 
      onClick={onClick}
      aria-label={muted ? 'Unmute' : 'Mute'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        color: '#333'
      }}
    >
      {muted ? <FaVolumeMute /> : <FaVolumeUp />}
    </button>
  );
};