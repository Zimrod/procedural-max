// src/remotion/MyComp/PowerPurchaseAgreementRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

// ==========================================
// PREMIUM DETAILED GRAPHIC STATIONS
// ==========================================

const PremiumSolarArray: React.FC = () => {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Foundation Concrete Blocks */}
      <rect x="25" y="145" width="60" height="15" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
      <rect x="135" y="145" width="60" height="15" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
      
      {/* Industrial Metallic Supporting Framework */}
      <line x1="55" y1="145" x2="65" y2="95" stroke="#475569" strokeWidth="4" />
      <line x1="165" y1="145" x2="155" y2="95" stroke="#475569" strokeWidth="4" />
      <line x1="35" y1="105" x2="185" y2="105" stroke="#94a3b8" strokeWidth="3" />

      {/* Solar Panel Module 1 (Left Structural Angle) */}
      <g transform="translate(15, 20)">
        {/* Deep Blue Monocrystalline Base */}
        <path d="M 10,75 L 40,15 L 95,15 L 75,75 Z" fill="url(#solarGradient)" stroke="#0f172a" strokeWidth="2.5" />
        {/* Precision Wafer Grids */}
        <path d="M 23,55 L 48,15 M 36,55 L 56,15 M 49,55 L 65,15 M 62,55 L 74,15" stroke="#60a5fa" strokeWidth="1" opacity="0.4" />
        <path d="M 17,60 L 82,60 M 24,45 L 87,45 M 32,30 L 92,30" stroke="#ffffff" strokeWidth="1" opacity="0.25" />
        {/* Frame Highlight Border */}
        <path d="M 10,75 L 40,15 L 95,15 L 75,75 Z" fill="none" stroke="#475569" strokeWidth="1.5" />
      </g>

      {/* Solar Panel Module 2 (Right Structural Angle) */}
      <g transform="translate(100, 20)">
        <path d="M 10,75 L 40,15 L 95,15 L 75,75 Z" fill="url(#solarGradient)" stroke="#0f172a" strokeWidth="2.5" />
        <path d="M 23,55 L 48,15 M 36,55 L 56,15 M 49,55 L 65,15 M 62,55 L 74,15" stroke="#60a5fa" strokeWidth="1" opacity="0.4" />
        <path d="M 17,60 L 82,60 M 24,45 L 87,45 M 32,30 L 92,30" stroke="#ffffff" strokeWidth="1" opacity="0.25" />
        <path d="M 10,75 L 40,15 L 95,15 L 75,75 Z" fill="none" stroke="#475569" strokeWidth="1.5" />
      </g>

      {/* Station Ground Deck Platform */}
      <line x1="5" y1="160" x2="215" y2="160" stroke="#334155" strokeWidth="4" />
    </g>
  );
};

const PremiumCorporateHQ: React.FC = () => {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Ground Foundation Slab */}
      <rect x="10" y="142" width="200" height="12" rx="2" fill="#1e293b" />

      {/* Building B (Right Compact Complex Structure) */}
      <rect x="115" y="55" width="80" height="90" fill="url(#buildingFacade)" stroke="#334155" strokeWidth="2.5" />
      {/* Rooftop Maintenance Canopy */}
      <rect x="125" y="47" width="45" height="8" fill="#475569" />
      {/* Structural Window Matrix Grid */}
      {[0, 1, 2, 3].map((row) => (
        <g key={`b-windows-${row}`} transform={`translate(127, ${65 + row * 18})`}>
          <rect x="0" y="0" width="16" height="11" rx="1" fill="#e2e8f0" opacity={0.3 + (row * 0.15)} />
          <rect x="24" y="0" width="16" height="11" rx="1" fill="#e2e8f0" opacity={0.3 + (row * 0.15)} />
          <rect x="48" y="0" width="16" height="11" rx="1" fill="#e2e8f0" opacity={0.3 + (row * 0.15)} />
        </g>
      ))}

      {/* Building A (Primary Office Glass Tower - Front Overlap Layer) */}
      <rect x="25" y="15" width="80" height="130" fill="url(#buildingFacade)" stroke="#1e293b" strokeWidth="3" />
      {/* Architectural Roof Spire Overhang */}
      <path d="M 20,15 L 110,15 L 100,5 L 30,5 Z" fill="#334155" />
      
      {/* Premium Glass Panel Matrix */}
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <g key={`a-windows-${row}`} transform={`translate(37, ${26 + row * 18})`}>
          <rect x="0" y="0" width="22" height="11" rx="1.5" fill="#93c5fd" opacity={0.4 + (row * 0.08)} />
          <rect x="32" y="0" width="22" height="11" rx="1.5" fill="#93c5fd" opacity={0.4 + (row * 0.08)} />
        </g>
      ))}

      {/* Main Ground Level Illuminated Lobby Entrance */}
      <rect x="45" y="112" width="40" height="30" fill="#fef08a" opacity="0.35" filter="url(#glowFilter)" />
      <rect x="45" y="112" width="40" height="30" fill="none" stroke="#e2e8f0" strokeWidth="2" />
      <line x1="65" y1="112" x2="65" y2="142" stroke="#e2e8f0" strokeWidth="1.5" />
    </g>
  );
};

// ==========================================
// CORE REFACTORED APPLICATION INFRASTRUCTURE
// ==========================================

export const PowerPurchaseAgreementRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Polished Contemporary Branding Tones
  const brandOrange = '#ff9800';      // Pure solar energetic amber orange
  const brandOrangeDark = '#e65100';  // Depth vector shadow lining
  const textDark = '#1e293b';         // Sleek deep charcoal slate text
  const textMuted = '#64748b';        // Professional dashboard subtext label

  // Physical Rig Entrance Dynamics
  const entryDelay = 8;
  const globalSpring = spring({
    frame: Math.max(0, frame - entryDelay),
    fps,
    config: { damping: 19, mass: 0.75, stiffness: 55 },
  });

  // Flow Tracking Mechanics (120 Frame Cycles)
  const loopCycle = 120;
  const loopProgress = (frame % loopCycle) / loopCycle;

  // Seamless Catenary Pipeline Arcs
  const topCircuitPath = "M 385,510 L 385,380 A 60,60 0 0 1 445,320 L 1475,320 A 60,60 0 0 1 1535,380 L 1535,450";
  const bottomCircuitPath = "M 1535,620 L 1535,800 A 60,60 0 0 1 1475,860 L 445,860 A 60,60 0 0 1 385,800 L 385,735";

  return (
    <AbsoluteFill style={{ backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ADVANCED VECTOR DEF FILTERS & GRADIENT SHADERS */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Component Ambient Soft Glow Filter */}
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Premium Drop Shadow for Contract Documentation Sheets */}
          <filter id="layerShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>

          {/* Core Hardware Material Gradients */}
          <linearGradient id="solarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>

          <linearGradient id="buildingFacade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          <linearGradient id="ppaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>

      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* ==========================================
            SECTION 2: CONDUITS & ENERGY CIRCUITS
            ========================================== */}
        <g opacity={interpolate(globalSpring, [0.3, 1], [0, 1])}>
          
          {/* High-Fidelity Opaque Track Guide Bases underneath pipelines */}
          <path d={topCircuitPath} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <path d={bottomCircuitPath} fill="none" stroke="#e2e8f0" strokeWidth="8" />

          {/* Active Primary Flow Channels */}
          <path d={topCircuitPath} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d={bottomCircuitPath} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 6" />

          {/* Arrow Terminal Guide Gates */}
          <path d="M 1524,455 L 1535,472 L 1546,455" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 374,730 L 385,713 L 396,730" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* TOP HUB CONSOLE: Electron Infrastructure Transmit */}
          <g transform="translate(960, 320)" filter="url(#layerShadow)">
            <circle cx="0" cy="0" r="50" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="0" cy="0" r="42" fill="#fafafa" />
            {/* Lightning vector core */}
            <path d="M -7,-20 L 11,-5 L -3,2 L 9,22 L -11,4 L 2,-2 Z" fill={brandOrange} stroke={brandOrangeDark} strokeWidth="1.5" strokeLinejoin="round" />
            <text x="-70" y="8" fill={textDark} fontSize="22" fontWeight="700" textAnchor="end" letterSpacing="-0.5">
              Supply of electricity
            </text>
          </g>

          {/* BOTTOM HUB CONSOLE: Capital Settlement Account */}
          <g transform="translate(960, 860)" filter="url(#layerShadow)">
            <circle cx="0" cy="0" r="50" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="0" cy="0" r="42" fill="#fafafa" />
            {/* Financial currency badge asset */}
            <rect x="-24" y="-16" width="48" height="32" rx="4" fill="none" stroke={textDark} strokeWidth="3" />
            <circle cx="0" cy="0" r="7" fill="none" stroke={textDark} strokeWidth="2.5" />
            <text x="0" y="6" fill={textDark} transform="scale(0.9)" fontSize="18" fontWeight="900" textAnchor="middle">€</text>
            
            <text x="70" y="8" fill={textDark} fontSize="22" fontWeight="700" textAnchor="start" letterSpacing="-0.5">
              Payment of fixed price
            </text>
          </g>

          {/* HIGH-INTENSITY SURGING ENERGY ELECTRON CHARGES */}
          <circle cx="0" cy="0" r="8" fill={brandOrange} filter="url(#glowFilter)">
            <animateMotion dur={`${loopCycle / fps}s`} repeatCount="indefinite" path={topCircuitPath} />
          </circle>
          <circle cx="0" cy="0" r="8" fill="#10b981" filter="url(#glowFilter)">
            <animateMotion dur={`${loopCycle / fps}s`} repeatCount="indefinite" path={bottomCircuitPath} />
          </circle>
        </g>

        {/* ==========================================
            SECTION 3: CORE GENERATOR & CONSUMER ACTORS
            ========================================== */}
        
        {/* LEFT ACTOR PANEL: Premium Clean Energy Solar Field */}
        <g transform="translate(140, 440)" opacity={globalSpring}>
          <PremiumSolarArray />
          <g transform="translate(110, 215)" fontSize="26" fontWeight="800" fill={textDark} textAnchor="middle" letterSpacing="-0.5">
            <text x="0" y="0">Producer of</text>
            <text x="0" y="34" fill={brandOrange}>renewable energy</text>
          </g>
        </g>

        {/* RIGHT ACTOR PANEL: Premium Glass Corporate Commercial Center */}
        <g transform="translate(1410, 450)" opacity={globalSpring}>
          <PremiumCorporateHQ />
          <g transform="translate(110, 205)" fontSize="26" fontWeight="800" fill={textDark} textAnchor="middle" letterSpacing="-0.5">
            <text x="0" y="0">Corporate customer</text>
          </g>
        </g>

        {/* CENTER ENGINE STAGE: THE SECURITY CONTRACT STACK */}
        <g transform="translate(960, 590)" opacity={interpolate(globalSpring, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' })}>
          
          {/* Layered Document Contract Folio */}
          <g transform="translate(0, -95)" filter="url(#layerShadow)">
            {/* Structural Underlay Sheet */}
            <path d="M -22,-45 L 23,-45 L 35,-33 L 35,55 L -22,55 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" transform="translate(6, -6) rotate(3)" />
            {/* Primary Top Sheet Document Face */}
            <path d="M -22,-45 L 23,-45 L 35,-33 L 35,55 L -22,55 Z" fill="url(#ppaGold)" stroke={brandOrange} strokeWidth="3" strokeLinejoin="round" />
            
            {/* Typography Simulation Elements */}
            <text x="-12" y="-22" fill={brandOrange} fontSize="13" fontWeight="900" letterSpacing="0.5">PPA</text>
            <line x1="-12" y1="-6" x2="22" y2="-6" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <line x1="-12" y1="6" x2="22" y2="6" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-12" y1="18" x2="14" y2="18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Polished Security Ribbon Seal */}
            <path d="M -12,38 Q -6,33 0,38 T 12,38" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Premium Interconnection Bridge Vectors */}
          <g stroke={brandOrange} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Left Output Channel Bridge */}
            <line x1="-75" y1="-50" x2="-330" y2="-50" strokeWidth="3" strokeDasharray="1 5" />
            <line x1="-200" y1="-50" x2="-330" y2="-50" />
            <path d="M -320,-60 L -335,-50 L -320,-40" fill="none" stroke={brandOrange} strokeWidth="3.5" />
            
            {/* Right Output Channel Bridge */}
            <line x1="75" y1="-50" x2="330" y2="-50" strokeWidth="3" strokeDasharray="1 5" />
            <line x1="200" y1="-50" x2="330" y2="-50" />
            <path d="M 320,-60 L 335,-50 L 320,-40" fill="none" stroke={brandOrange} strokeWidth="3.5" />
          </g>

          {/* Core Descriptive Text Block Headers */}
          <text x="0" y="50" fill={textDark} fontSize="34" fontWeight="800" textAnchor="middle" letterSpacing="-0.5">
            Power Purchase Agreement
          </text>
          <text x="0" y="90" fill={textMuted} fontSize="21" fontWeight="500" textAnchor="middle">
            Long-term supply contract at a fixed price
          </text>
        </g>

        {/* PLATFORM METRICS FOOTER */}
        <text x="1820" y="1025" fill={textMuted} fontSize="15" fontWeight="600" textAnchor="end" letterSpacing="1">
          SOURCE: INNOGY SE
        </text>
      </svg>
    </AbsoluteFill>
  );
};