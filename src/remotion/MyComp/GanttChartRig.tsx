// src/remotion/MyComp/GanttChartRig.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

// Interfaces for structured data configuration
interface GanttTask {
  id: string;
  name: string;
  phase: string;
  startWeek: number;  // 0 to 8 mapping framework
  durationWeeks: number;
  progress: number;   // Internal filling value 0 to 1
  color: string;
}

export const GanttChartRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Core Configuration Metrics
  const totalWeeks = 8;
  const chartWidth = 1100;
  const colWidth = chartWidth / totalWeeks;
  const rowHeight = 65;
  const startX = 420; // Offset spacing for left row labels
  const startY = 320;

  // Professional Slate Theme Palette
  const bgDark = '#0b0f19';
  const panelDark = '#111827';
  const borderMuted = '#1f2937';
  const textMain = '#f3f4f6';
  const textMuted = '#9ca3af';
  const timelineIndicatorColor = '#ef4444'; // Red active tracking line

  // Project Task Breakdown Schedule
  const tasks: GanttTask[] = [
    { id: '1', name: 'Feasibility & Project Charter', phase: 'Initiation', startWeek: 0, durationWeeks: 1.5, progress: 1.0, color: '#3b82f6' },
    { id: '2', name: 'Site Survey & Grid Assessment', phase: 'Initiation', startWeek: 1.0, durationWeeks: 2.0, progress: 1.0, color: '#3b82f6' },
    { id: '3', name: 'System Architecture Design', phase: 'Planning', startWeek: 2.5, durationWeeks: 2.5, progress: 0.85, color: '#10b981' },
    { id: '4', name: 'Procurement of Core Modules', phase: 'Planning', startWeek: 4.0, durationWeeks: 2.0, progress: 0.40, color: '#10b981' },
    { id: '5', name: 'Hardware Assembly & Mounting', phase: 'Execution', startWeek: 5.0, durationWeeks: 2.5, progress: 0.10, color: '#f59e0b' },
    { id: '6', name: 'System Integration & Testing', phase: 'Execution', startWeek: 6.5, durationWeeks: 1.5, progress: 0.0, color: '#f59e0b' },
  ];

  // Global Title Card Drop Entrance Spring
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 60 },
  });

  // Animated Current Timeline Scrubber Scans across the project weeks sequentially
  const timelineProgress = interpolate(frame, [30, durationInFrames - 10], [0, totalWeeks], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scrubberX = startX + timelineProgress * colWidth;

  return (
    <AbsoluteFill style={{ backgroundColor: bgDark, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        
        {/* ==========================================
            SECTION 1: DASHBOARD HEADER BLOCK
            ========================================== */}
        <g opacity={headerSpring} transform={`translate(0, ${interpolate(headerSpring, [0, 1], [-30, 0])})`}>
          {/* Decorative Corner Status Badge */}
          <rect x="100" y="90" width="140" height="32" rx="6" fill="#1e293b" stroke={borderMuted} strokeWidth="1" />
          <circle cx="120" cy="106" r="5" fill="#10b981" />
          <text x="135" y="111" fill="#10b981" fontSize="13" fontWeight="700" letterSpacing="1">PROJECT LIVE</text>

          {/* Core Descriptive Text Elements */}
          <text x="100" y="175" fill={textMain} fontSize="44" fontWeight="800" letterSpacing="-1">
            Master Implementation Schedule
          </text>
          <text x="100" y="215" fill={textMuted} fontSize="18" fontWeight="500">
            Phase roadmap tracking deployment milestones, hardware provisioning, and integration cycles.
          </text>
        </g>

        {/* ==========================================
            SECTION 2: CHART BASE GRID WORKPLATFORM
            ========================================== */}
        <g opacity={spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 20 } })}>
          {/* Master Table Outer Border Shell */}
          <rect x="100" y="260" width="1720" height="640" fill={panelDark} rx="12" stroke={borderMuted} strokeWidth="1.5" />
          
          {/* Vertical Column Background Division Matrix Grid */}
          {Array.from({ length: totalWeeks + 1 }).map((_, idx) => {
            const linesX = startX + idx * colWidth;
            return (
              <g key={`grid-col-${idx}`}>
                <line x1={linesX} y1="260" x2={linesX} y2="840" stroke={borderMuted} strokeWidth={idx === 0 ? 2 : 1} strokeDasharray={idx === 0 ? "0" : "4 4"} />
                {/* Column Heading Week Labels */}
                {idx < totalWeeks && (
                  <text x={linesX + colWidth / 2} y="295" fill={textMuted} fontSize="14" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
                    WEEK 0{idx + 1}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Table Header Horizontal Separator Underline Line */}
          <line x1="100" y1="320" x2="1820" y2="320" stroke={borderMuted} strokeWidth="2" />
        </g>

        {/* ==========================================
            SECTION 3: DATA ROWS & ANIMATED TRACK BARS
            ========================================== */}
        <g>
          {tasks.map((task, idx) => {
            const currentY = startY + idx * rowHeight + 35;
            
            // Staggered incremental frame delay parameters per row item 
            const rowStaggerDelay = 15 + idx * 6;
            const rowSpring = spring({
              frame: Math.max(0, frame - rowStaggerDelay),
              fps,
              config: { damping: 15, mass: 0.75, stiffness: 75 },
            });

            // Width scaling factor calculations based on week allocations
            const taskStartX = startX + task.startWeek * colWidth;
            const targetTotalWidth = task.durationWeeks * colWidth;
            
            // Kinetic growth animation parameters matching row tracking timelines
            const dynamicBarWidth = interpolate(rowSpring, [0, 1], [0, targetTotalWidth]);
            
            // Row Divider Underline Segment Traces
            const rowLineY = startY + (idx + 1) * rowHeight;

            return (
              <g key={`task-row-${task.id}`} opacity={rowSpring} transform={`translate(0, ${interpolate(rowSpring, [0, 1], [15, 0])})`}>
                
                {/* A: Left Row Text Meta Descriptions */}
                <text x="125" y={currentY + 6} fill={textMain} fontSize="16" fontWeight="700">
                  {task.name}
                </text>
                <text x="125" y={currentY + 23} fill={textMuted} fontSize="12" fontWeight="600" letterSpacing="0.5">
                  PHASE // {task.phase.toUpperCase()}
                </text>

                {/* B: Gantt Chart Bar Base Guide Tracks (Empty unfulfilled slot tracks) */}
                <rect x={taskStartX} y={currentY - 14} width={targetTotalWidth} height="28" rx="6" fill="#1f2937" opacity="0.4" />

                {/* C: Active Resource Task Bars */}
                <rect x={taskStartX} y={currentY - 14} width={dynamicBarWidth} height="28" rx="6" fill={task.color} />

                {/* D: Nested Performance Progress Indicator Fill Layers */}
                {task.progress > 0 && (
                  <rect 
                    x={taskStartX} 
                    y={currentY - 14} 
                    width={dynamicBarWidth * task.progress} 
                    height="28" 
                    rx="6" 
                    fill="url(#progressDiagonalHatch)" 
                    opacity="0.35" 
                  />
                )}

                {/* E: Floating Numeric Progress Value Label Strings */}
                {rowSpring > 0.95 && task.progress > 0 && (
                  <text 
                    x={taskStartX + (targetTotalWidth * task.progress) + 12} 
                    y={currentY + 5} 
                    fill={task.color} 
                    fontSize="13" 
                    fontWeight="800"
                  >
                    {Math.round(task.progress * 100)}%
                  </text>
                )}

                {/* F: Horizontal Table Grid Separation Base Borders */}
                <line x1="100" y1={rowLineY} x2="1820" y2={rowLineY} stroke={borderMuted} strokeWidth="1" />
              </g>
            );
          })}
        </g>

        {/* ==========================================
            SECTION 4: ACTIVE TIMELINE SCRUBBER SYSTEM
            ========================================== */}
        <g opacity={interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: 'clamp' })}>
          {/* Vertical Time Indicator Line */}
          <line x1={scrubberX} y1="260" x2={scrubberX} y2="840" stroke={timelineIndicatorColor} strokeWidth="2.5" filter="url(#activeLineGlow)" />
          
          {/* Upper Time Scrubber Handle Hub Pin */}
          <polygon points={`${scrubberX},260 ${scrubberX - 8},246 ${scrubberX + 8},246`} fill={timelineIndicatorColor} />
          <rect x={scrubberX - 32} y="222" width="64" height="24" rx="4" fill={timelineIndicatorColor} />
          <text x={scrubberX} y="238" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle">NOW</text>
        </g>

        {/* ==========================================
            SECTION 5: DATA LEGEND & FOOTER METRICS
            ========================================== */}
        <g transform="translate(100, 875)" fontSize="13" fontWeight="700" letterSpacing="0.5">
          <text x="0" y="0" fill={textMuted}>LEGEND:</text>
          
          <rect x="90" y="-11" width="16" height="14" rx="3" fill="#3b82f6" />
          <text x="115" y="1" fill={textMain}>INITIATION</text>

          <rect x="240" y="-11" width="16" height="14" rx="3" fill="#10b981" />
          <text x="265" y="1" fill={textMain}>PLANNING</text>

          <rect x="380" y="-11" width="16" height="14" rx="3" fill="#f59e0b" />
          <text x="405" y="1" fill={textMain}>EXECUTION</text>

          {/* Operational Platform Meta Information Specs */}
          <text x="1720" y="1" fill={textMuted} textAnchor="end" fontWeight="600" letterSpacing="3">
            GANTT TIMELINE MANAGEMENT COMPONENT // RIG-ID_GNT_v26
          </text>
        </g>

        {/* SVG STRUCTURAL CONFIGURATION DEF TEMPLATES */}
        <defs>
          {/* Progress Diagonal Pattern Hatching Overlay Fill */}
          <pattern id="progressDiagonalHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ffffff" strokeWidth="3" />
          </pattern>

          {/* Subtle Ambient Glow for Active Timeline Scrubber Line */}
          <filter id="activeLineGlow" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};