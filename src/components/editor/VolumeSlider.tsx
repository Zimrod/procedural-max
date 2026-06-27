import type { PlayerRef } from '@remotion/player';
import React, { useEffect, useState, useCallback } from 'react';
import { FaVolumeUp, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100px',
};

const iconStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#333',
  minWidth: '16px', // Prevent layout shift when icon changes
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  cursor: 'pointer',
  accentColor: '#0070f3', // Modern browser accent color
};

export const VolumeSlider: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ playerRef }) => {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Handle volume and mute changes
  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    setVolume(currentPlayer.getVolume());
    setMuted(currentPlayer.isMuted());

    const onVolumeChange = () => setVolume(currentPlayer.getVolume());
    const onMuteChange = () => setMuted(currentPlayer.isMuted());

    currentPlayer.addEventListener('volumechange', onVolumeChange);
    currentPlayer.addEventListener('mutechange', onMuteChange);

    return () => {
      currentPlayer.removeEventListener('volumechange', onVolumeChange);
      currentPlayer.removeEventListener('mutechange', onMuteChange);
    };
  }, [playerRef]);

  const handleVolumeChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;

      const newVolume = Number(e.target.value);
      
      // Unmute if volume is increased from 0
      if (newVolume > 0 && currentPlayer.isMuted()) {
        currentPlayer.unmute();
      }

      currentPlayer.setVolume(newVolume);
    },
    [playerRef]
  );

  const getVolumeIcon = () => {
    if (muted || volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>
        {getVolumeIcon()}
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={handleVolumeChange}
        style={sliderStyle}
        aria-label="Volume control"
      />
    </div>
  );
};