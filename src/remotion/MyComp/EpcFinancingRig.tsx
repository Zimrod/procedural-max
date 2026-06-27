// src/remotion/MyComp/EpcFinancingRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export const EpcFinancingRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Polished high-contrast corporate financial palette
  const bgDark = '#090d16';
  const nodeBg = '#111827';
  const borderMuted = '#1f2937';
  const textMain = '#f3f4f6';
  const textMuted = '#9ca3af';
  
  // Functional flow colors
  const colorCapital = '#10b981'; // Emerald green for funding/equity lines
  const colorContract = '#3b82f6'; // Bright blue for construction/EPC obligations

  // Continuous animation loop for running financial transaction particles
  const loopCycle = 150;
  const progress = (frame % loopCycle) / loopCycle;

  // Global Title Entrance Spring
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 60 },
  });

  // Staggered node entrance springs
  const createNodeSpring = (delay: number) => spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 15, mass: 0.85, stiffness: 65 },
  });

  const springSponsor = createNodeSpring(10);
  const springBank    = createNodeSpring(25);
  const springEpc     = createNodeSpring(40);

  // Geometric layout anchor matrices
  const centerX = 960;
  const centerY = 580;

  // Flow line paths
  const pathDebtLine    = `M ${centerX - 350},${centerY - 130} L ${centerX - 100},${centerY - 130}`;
  const pathEquityLine  = `M ${centerX - 100},${centerY - 70} L ${centerX - 350},${centerY - 70}`;
  const pathEpcContract = `M ${centerX + 100},${centerY - 130} L ${centerX + 350},${centerY - 130}`;
  const pathDrawdowns   = `M ${centerX + 350},${centerY - 70} L ${centerX + 100},${centerY - 70}`;

  return (
    <AbsoluteFill style={{ backgroundColor: bgDark, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ==========================================
          GLOW FILTERS & CORE STYLE SHADERS
          ========================================== */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="heavyShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#000000" floodOpacity="0.7" />
          </filter>
        </defs>
      </svg>

      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* ==========================================
            SECTION 1: HIGH-LEGIBILITY HEADER BLOCK
            ========================================== */}
        <g opacity={headerSpring} transform={`translate(0, ${interpolate(headerSpring, [0, 1], [-40, 0])})`}>
          <rect x="100" y="80" width="230" height="36" rx="6" fill="#1e293b" stroke={borderMuted} strokeWidth="1" />
          <text x="115" y="103" fill="#3b82f6" fontSize="14" fontWeight="800" letterSpacing="1.5">FINANCING STRUCTURE</text>
          
          <text x="100" y="165" fill={textMain} fontSize="44" fontWeight="800" letterSpacing="-1">
            EPC Project Finance Architecture
          </text>
          <text x="100" y="205" fill={textMuted} fontSize="19" fontWeight="500">
            Capital deployment matrix mapping debt facility drawdowns against construction delivery milestones.
          </text>
        </g>

        {/* ==========================================
            SECTION 2: CORE TRANSACTIONAL STATIONS (NODES)
            ========================================== */}
        
        {/* NODE A: LENDERS / BANK FACILITY */}
        <g transform={`translate(${centerX - 500}, ${centerY - 100})`} opacity={springBank} filter="url(#heavyShadow)">
          <rect x="-150" y="-100" width="300" height="200" rx="12" fill={nodeBg} stroke={colorCapital} strokeWidth="2.5" />
          <circle cx="0" cy="-35" r="28" fill="#064e3b" />
          <text x="0" y="-26" fill={colorCapital} fontSize="26" fontWeight="900" textAnchor="middle">$$</text>
          <text x="0" y="30" fill={textMain} fontSize="24" fontWeight="800" textAnchor="middle">Debt Lenders</text>
          <text x="0" y="60" fill={textMuted} fontSize="15" fontWeight="600" textAnchor="middle" letterSpacing="0.5">BANKS / SYNDICATE</text>
        </g>

        {/* NODE B: PROJECT SPONSOR (SPV SPECIAL PURPOSE VEHICLE) */}
        <g transform={`translate(${centerX}, ${centerY - 100})`} opacity={springSponsor} filter="url(#heavyShadow)">
          <rect x="-170" y="-120" width="340" height="240" rx="16" fill="#1e293b" stroke={textMain} strokeWidth="3" />
          {/* Internal content focus */}
          <rect x="-150" y="-100" width="300" height="200" rx="10" fill={nodeBg} stroke={borderMuted} strokeWidth="1.5" />
          <text x="0" y="-35" fill="#38bdf8" fontSize="20" fontWeight="800" textAnchor="middle" letterSpacing="2">PROJECT COMPANY</text>
          <text x="0" y="15" fill={textMain} fontSize="34" fontWeight="900" textAnchor="middle">SPV CORE</text>
          <text x="0" y="55" fill={textMuted} fontSize="16" fontWeight="600" textAnchor="middle">Asset Owner / Issuer</text>
        </g>

        {/* NODE C: EPC CONTRACTOR */}
        <g transform={`translate(${centerX + 500}, ${centerY - 100})`} opacity={springEpc} filter="url(#heavyShadow)">
          <rect x="-150" y="-100" width="300" height="200" rx="12" fill={nodeBg} stroke={colorContract} strokeWidth="2.5" />
          <circle cx="0" cy="-35" r="28" fill="#1e3a8a" />
          {/* Engineering hardware asset icon simulation */}
          <path d="M -10,-40 L 10,-40 L 5,-25 L -5,-25 Z" fill={colorContract} />
          <rect x="-12" y="-25" width="24" height="6" fill={textMain} />
          <text x="0" y="30" fill={textMain} fontSize="24" fontWeight="800" textAnchor="middle">EPC Contractor</text>
          <text x="0" y="60" fill={textMuted} fontSize="15" fontWeight="600" textAnchor="middle" letterSpacing="0.5">ENGINEERING FIRM</text>
        </g>

        {/* ==========================================
            SECTION 3: LARGE SCALE LEGIBLE TRANSACT LINES
            ========================================== */}
        <g opacity={interpolate(frame, [45, 60], [0, 1], { extrapolateLeft: 'clamp' })}>
          
          {/* LEFT INTERACTION ZONE: BANK <-> SPV */}
          <g fill="none" strokeLinecap="round">
            {/* Top Debt Track Line */}
            <path d={pathDebtLine} stroke="#1f2937" strokeWidth="6" />
            <path d={pathDebtLine} stroke={colorCapital} strokeWidth="3" />
            
            {/* Bottom Debt Service Return Track Line */}
            <path d={pathEquityLine} stroke="#1f2937" strokeWidth="6" />
            <path d={pathEquityLine} stroke={colorCapital} strokeWidth="3" strokeDasharray="6 6" />
          </g>

          {/* LARGE CAPTION LABELS: BANK <-> SPV */}
          <g fontClassName="system-ui" fontWeight="800" fontSize="18" letterSpacing="-0.2">
            <text x={centerX - 225} y={centerY - 145} fill={colorCapital} textAnchor="middle">1. Debt Facility</text>
            <text x={centerX - 225} y={centerY - 45} fill={textMuted} textAnchor="middle">Principal + Interest</text>
          </g>

          {/* RIGHT INTERACTION ZONE: SPV <-> EPC */}
          <g fill="none" strokeLinecap="round">
            {/* Top Turnkey Obligation Line */}
            <path d={pathEpcContract} stroke="#1f2937" strokeWidth="6" />
            <path d={pathEpcContract} stroke={colorContract} strokeWidth="3" />
            
            {/* Bottom Funding Drawdown Line */}
            <path d={pathDrawdowns} stroke="#1f2937" strokeWidth="6" />
            <path d={pathDrawdowns} stroke={colorCapital} strokeWidth="3" />
          </g>

          {/* LARGE CAPTION LABELS: SPV <-> EPC */}
          <g fontClassName="system-ui" fontWeight="800" fontSize="18" letterSpacing="-0.2">
            <text x={centerX + 225} y={centerY - 145} fill={colorContract} textAnchor="middle">2. Turnkey EPC Contract</text>
            <text x={centerX + 225} y={centerY - 45} fill={colorCapital} textAnchor="middle">3. Progress Drawdowns</text>
          </g>

          {/* ==========================================
              SECTION 4: ACTIVE KINETIC FUNDS PARTICLES
              ========================================== */}
          {/* Debt Flow Particle (Left to Right) */}
          <circle cx="0" cy="0" r="7" fill={colorCapital} filter="url(#glowEffect)">
            <animateMotion dur={`${loopCycle / fps}s`} repeatCount="indefinite" path={pathDebtLine} />
          </circle>

          {/* Progress Milestone Payments Particle (Left to Right) */}
          <circle cx="0" cy="0" r="7" fill={colorCapital} filter="url(#glowEffect)">
            <animateMotion dur={`${loopCycle / fps}s`} repeatCount="indefinite" path={pathDrawdowns} />
          </circle>

          {/* Execution Delivery Deliverable Particle (Right to Left) */}
          <circle cx="0" cy="0" r="7" fill={colorContract} filter="url(#glowEffect)">
            <animateMotion dur={`${loopCycle / fps}s`} repeatCount="indefinite" path={pathEpcContract} keyPoints="1;0" keyTimes="0;1" />
          </circle>
        </g>

        {/* ==========================================
            SECTION 5: FOOTER SYSTEM SPECS
            ========================================== */}
        <g transform="translate(100, 920)" fontClassName="system-ui" fontWeight="700" fontSize="13" letterSpacing="0.5">
          <text x="0" y="0" fill={textMuted}>COMMERCIAL FRAMEWORK MATRIX:</text>
          <text x="320" y="0" fill={colorContract}>✓ FIXED-PRICE TURNKEY LUMP SUM</text>
          <text x="640" y="0" fill={colorContract}>✓ GUARANTEED COMPLETION DATE</text>
          <text x="980" y="0" fill={colorContract}>✓ PERFORMANCE LIQUIDATED DAMAGES (LDs)</text>

          <text x="1720" y="0" fill={textMuted} textAnchor="end" fontWeight="600" letterSpacing="3">
            PROJECT FINANCE SCHEMATIC RIG // COMP-ID_EPC_V4
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};