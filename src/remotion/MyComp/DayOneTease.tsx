import React from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  useCurrentFrame, 
  useVideoConfig, 
  staticFile, 
  delayRender, 
  continueRender 
} from 'remotion';
import { TextRig } from './TextRig';

// 1. Load Fonts outside the component
const dsDigital = new FontFace(
  'DS-Digital',
  `url(${staticFile('fonts/ds-digital/ds-digib.ttf')})`
);

// Loading Ubuntu from Google Fonts
const ubuntu = new FontFace(
  'Ubuntu',
  `url(https://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgoKcg72nU6AF7xm.woff2)`
);

const waitForFonts = delayRender();
Promise.all([dsDigital.load(), ubuntu.load()])
  .then(([f1, f2]) => {
    document.fonts.add(f1);
    document.fonts.add(f2);
    continueRender(waitForFonts);
  })
  .catch((err) => console.log("Font load failed", err));

export const DayOneTease: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Adjusted to match your desired start point
  const startCountingFrame = 9 * fps;   

  const formatTimer = () => {
    let totalSeconds = 60 * 24 * 3600; 
    if (frame >= startCountingFrame) {
      const secondsElapsed = Math.floor((frame - startCountingFrame) / fps);
      totalSeconds -= secondsElapsed;
    }

    const d = Math.floor(totalSeconds / (24 * 3600));
    const h = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    return `${d.toString().padStart(2, '0')}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerText = formatTimer();
  const background8s = "88:88:88:88";

  const fastTextProps = {
    letterHeight: 50,
    startDelay: 0,
    staggerDelay: 1.5,
    textAlign: "center" as const,
  };

  const timerStyle: React.CSSProperties = {
    fontFamily: 'DS-Digital',
    fontSize: 240,
    letterSpacing: '8px',
    position: 'absolute',
    textAlign: 'center',
    width: '100%',
  };

  return (
    <AbsoluteFill style={{ backgroundColor: 'white', fontFamily: 'Ubuntu' }}>
      <div style={{ transform: 'translateY(-15%)', width: '100%', height: '100%' }}>
        
        {/* TOP ROW: TextRig with Ubuntu Font */}
        <div style={{ height: '50%', width: '100%', display: 'flex', alignItems: 'flex-end' }}>
          <Sequence from={0.5} durationInFrames={3.5 * fps}>
            <TextRig {...fastTextProps} text="Years of Mechanical Systems." color="#1a1a1a" />
          </Sequence>

          <Sequence from={3.5 * fps} durationInFrames={3.2 * fps}>
            <TextRig {...fastTextProps} text="Building a new kind of engine." color="#4ECDC4" />
          </Sequence>

          <Sequence from={6.5 * fps} durationInFrames={15 * fps}>
            <TextRig {...fastTextProps} text="Sixty Days to automate animation" color="#FF6B6B" />
          </Sequence>
        </div>

        {/* BOTTOM ROW: Digital Timer */}
        <div style={{ 
          height: '50%', 
          width: '100%', 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '60px'
        }}>
          {/* Background Gray 8s */}
          <div style={{ ...timerStyle, color: '#e0e0e0', zIndex: 1 }}>
            {background8s}
          </div>

          {/* Active Red/Grey Timer */}
          <div style={{ 
            ...timerStyle, 
            color: frame >= startCountingFrame ? '#504f51' : '#e0e0e0', 
            zIndex: 2,
            textShadow: frame >= startCountingFrame ? '0 0 15px rgba(0, 0, 0, 0.68)' : 'none'
          }}>
            {timerText}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};