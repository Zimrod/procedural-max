// src/remotion/MyComp/DynamicCapitalStack.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type Props = {
  title?: string;
  // Scenario 1: Default configuration target breakdown (e.g., 70/30 split)
  targetDebt?: number;     // e.g., 70
  targetEquity?: number;   // e.g., 30
  targetGrant?: number;    // e.g., 0
  
  // Scenario 2: Shift timeline breakpoint (e.g., introducing a 10% sweetener at frame 75)
  shiftFrame?: number;     
  finalDebt?: number;      // e.g., 60
  finalEquity?: number;    // e.g., 30
  finalGrant?: number;     // e.g., 10

  debtColor?: string;
  equityColor?: string;
  grantColor?: string;
};

export const DynamicCapitalStack: React.FC<Props> = ({
  title = "CAPITAL STRUCTURING LAYERS",
  targetDebt = 70,
  targetEquity = 30,
  targetGrant = 0,
  
  shiftFrame = 75,
  finalDebt = 60,
  finalEquity = 30,
  finalGrant = 10,

  debtColor = "#3182ce",   // Bank blue
  equityColor = "#319795", // Private Equity teal
  grantColor = "#dd6b20",  // Sweetener Orange
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. PHASE ONE: Initial upward spring assembly of the stack layers (0 to 1.5 seconds)
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 90 },
  });

  // 2. PHASE TWO: Fluid re-allocation shifting sequence triggered at the breakpoint frame
  const shiftFrameNormalized = Math.max(0, frame - shiftFrame);
  const shiftSpring = spring({
    frame: shiftFrameNormalized,
    fps,
    config: { damping: 14, mass: 1.0, stiffness: 60 },
  });

  // Interpolate percentages cleanly between Scenario 1 values and Scenario 2 shifts
  const currentDebtPct = interpolate(shiftSpring, [0, 1], [targetDebt, finalDebt]);
  const currentEquityPct = interpolate(shiftSpring, [0, 1], [targetEquity, finalEquity]);
  const currentGrantPct = interpolate(shiftSpring, [0, 1], [targetGrant, finalGrant]);

  // Height configurations mapping percentage directly to pixels
  const stackMaxHeight = 650; 
  
  // Apply the intro spring to scale up the height coordinates cleanly on assembly
  const debtHeight = (currentDebtPct / 100) * stackMaxHeight * introSpring;
  const equityHeight = (currentEquityPct / 100) * stackMaxHeight * introSpring;
  const grantHeight = (currentGrantPct / 100) * stackMaxHeight * introSpring;

  // 3. MIDPOINT POSITION ANCHORS FOR FLOATING METRIC READOUT LABELS
  // Calculated cumulatively from the bottom up to track alongside moving stack segment interfaces
  const debtLabelY = stackMaxHeight - (debtHeight / 2);
  const equityLabelY = stackMaxHeight - debtHeight - (equityHeight / 2);
  const grantLabelY = stackMaxHeight - debtHeight - equityHeight - (grantHeight / 2);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0d10', fontFamily: 'Ubuntu, sans-serif', padding: 80, boxSizing: 'border-box' }}>
      
      {/* HEADER BAR TITLE */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: 100,
        opacity: interpolate(frame, [0, 15], [0, 1]),
      }}>
        <h1 style={{ color: '#ffffff', fontSize: 44, margin: 0, letterSpacing: 2, fontWeight: 700 }}>
          {title}
        </h1>
        <p style={{ color: '#718096', fontSize: 20, marginTop: 8 }}>
          {frame < shiftFrame 
            ? "Visualizing foundational base leverage configurations." 
            : "Rebalancing asset classes: Injecting government funding concessions."}
        </p>
      </div>

      {/* CORE INTEGRATED STACK STAGE */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '55%',
        transform: 'translate(-50%, -50%)',
        width: 1000,
        height: stackMaxHeight,
        display: 'flex',
        position: 'relative'
      }}>
        
        {/* PHYSICAL STRUCTURAL COLUMN TRACK CONTAINER */}
        <div style={{
          position: 'absolute',
          left: 150,
          top: 0,
          width: 240,
          height: stackMaxHeight,
          backgroundColor: '#11151d',
          borderRadius: 20,
          border: '2px solid #1e2530',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end', // Elements build upwards from structural ground baseline
          overflow: 'hidden',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
        }}>
          {/* LAYER 3: GRANT SWEETENER BLOCK */}
          <div style={{
            height: grantHeight,
            backgroundColor: grantColor,
            width: '100%',
            transition: 'background-color 0.2s ease',
            boxShadow: '0 -4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
          }} />

          {/* LAYER 2: PRIVATE EQUITY CAPITAL BLOCK */}
          <div style={{
            height: equityHeight,
            backgroundColor: equityColor,
            width: '100%',
            boxShadow: '0 -4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
          }} />

          {/* LAYER 1: SENIOR BANK DEBT BLOCK */}
          <div style={{
            height: debtHeight,
            backgroundColor: debtColor,
            width: '100%',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
          }} />
        </div>

        {/* TRACKING SYSTEM LABELS LAYER */}
        <div style={{
          position: 'absolute',
          left: 440,
          top: 0,
          width: 500,
          height: stackMaxHeight,
        }}>
          
          {/* SENIOR DEBT READOUT */}
          {debtHeight > 30 && (
            <div style={{
              position: 'absolute',
              top: debtLabelY,
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              opacity: introSpring,
              transition: 'top 0.05s linear'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(currentDebtPct)}
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: debtColor, marginLeft: 4 }}>%</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginLeft: 16, letterSpacing: 0.5 }}>Senior Bank Debt</span>
              </div>
              <span style={{ color: '#718096', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Tier 1 Construction Credit Lines</span>
            </div>
          )}

          {/* PRIVATE EQUITY READOUT */}
          {equityHeight > 30 && (
            <div style={{
              position: 'absolute',
              top: equityLabelY,
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              opacity: introSpring,
              transition: 'top 0.05s linear'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(currentEquityPct)}
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: equityColor, marginLeft: 4 }}>%</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginLeft: 16, letterSpacing: 0.5 }}>Sponsor Equity</span>
              </div>
              <span style={{ color: '#718096', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Developer & Private Fund Assets</span>
            </div>
          )}

          {/* GOVERNMENT GRANT SWEETENER READOUT */}
          {grantHeight > 25 && (
            <div style={{
              position: 'absolute',
              top: grantLabelY,
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              opacity: shiftSpring, // Appears fluidly when the shifting sequence activates
              transition: 'top 0.05s linear'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(currentGrantPct)}
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: grantColor, marginLeft: 4 }}>%</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginLeft: 16, letterSpacing: 0.5 }}>Grant Sweetener</span>
              </div>
              <span style={{ color: '#718096', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Concessionary Non-Dilutive Subsidies</span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};