// src/remotion/MyComp/DataRevealScene.tsx
//
// Split screen composition:
//   LEFT  (30%): TypewriterRig — types out stats line by line
//   RIGHT (70%): ChartSequenceRig — charts appear one after another,
//                each triggered when its corresponding stat line finishes typing
//
// The SceneConfig is the only place any values live.
// Every rig and preset is a pure template — nothing hardcoded inside them.
//
// Usage:
//   <DataRevealScene config={mySceneConfig} />
//
// Or in a Remotion composition:
//   component: () => <DataRevealScene config={sceneConfig} />,
//   durationInFrames: calcSceneDuration(sceneConfig),

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from 'remotion';
import { TypewriterRig }    from './TypewriterRig';
import { ChartSequenceRig, Scene } from './ChartSequenceRig';
import { BarChartRig }      from './BarChartRig';
import { DonutChartRig }    from './DonutChartRig';
import { MultiAreaChartRig } from './MultiAreaChartRig';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChartConfig =
  | {
      type: 'bar';
      durationInFrames: number;
      data: { labels: string[]; values: number[] };
      barColors?: string[];
    }
  | {
      type: 'donut';
      durationInFrames: number;
      data: { labels: string[]; values: number[] };
      pieColors?: string[];
    }
  | {
      type: 'area';
      durationInFrames: number;
      data: {
        labels: string[];
        series: { name: string; values: number[]; color?: string }[];
      };
      curveType?: 'linear' | 'curved';
      maxValue?: number;
    };

export type StatLine = {
  text:           string;   // text typed into the input box for this stat
  typingSpeed?:   number;   // chars per second override (default 18)
  chart:          ChartConfig;
};

export type DataRevealConfig = {
  // Layout
  splitFraction?:   number;   // left panel width as fraction of total, default 0.3
  dividerColor?:    string;   // default '#ddd'
  dividerPadding?:  number;   // vertical padding on divider in px, default 40
  background?:      string;   // scene background, default '#fff'

  // Typewriter
  inputBoxStyle?: {
    backgroundColor?: string;
    textColor?:       string;
    fontSize?:        number;
    fontFamily?:      string;
  };

  // Gap between charts on the right
  gapBetweenCharts?: number;  // frames, default 20

  // The data — one stat per chart
  stats: StatLine[];
};

// ── Duration calculator ───────────────────────────────────────────────────────
// Exported so the composition can set durationInFrames correctly.

export const calcSceneDuration = (config: DataRevealConfig, fps = 30): number => {
  const { stats, gapBetweenCharts = 20 } = config;
  let total = 0;
  for (const stat of stats) {
    const typingFrames = calcTypingFrames(stat.text, stat.typingSpeed ?? 18, fps);
    total += typingFrames + stat.chart.durationInFrames + gapBetweenCharts;
  }
  return total + 30; // tail
};

// How many frames does it take to type a string at a given speed?
const calcTypingFrames = (text: string, typingSpeed: number, fps: number): number => {
  const charsPerFrame = typingSpeed / fps;
  return Math.ceil(text.length / charsPerFrame) + 15; // +15 start delay
};

// ── Chart renderer ────────────────────────────────────────────────────────────

const renderChart = (chart: ChartConfig): React.ReactNode => {
  switch (chart.type) {
    case 'bar':
      return <BarChartRig data={chart.data} barColors={chart.barColors} />;
    case 'donut':
      return <DonutChartRig data={chart.data} pieColors={chart.pieColors} />;
    case 'area':
      return (
        <MultiAreaChartRig
          data={chart.data}
          curveType={chart.curveType}
          maxValue={chart.maxValue}
        />
      );
    default:
      return null;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export const DataRevealScene: React.FC<{ config: DataRevealConfig }> = ({ config }) => {
  const { width, height, fps } = useVideoConfig();

  const {
    splitFraction    = 0.3,
    dividerColor     = '#ddd',
    dividerPadding   = 40,
    background       = '#fff',
    inputBoxStyle    = {},
    gapBetweenCharts = 20,
    stats,
  } = config;

  const leftW   = Math.round(width * splitFraction);
  const rightW  = width - leftW;
  const dividerX = leftW;

  // ── Build timing ────────────────────────────────────────────────────────────
  // Each stat line:
  //   1. Typing starts at cumulativeFrame
  //   2. Chart starts when typing finishes (typing is causally linked)
  //   3. After chart duration + gap, next stat begins

  type TimedStat = {
    stat:         StatLine;
    typingStart:  number;
    typingFrames: number;
    chartStart:   number;
  };

  const timedStats: TimedStat[] = [];
  let cursor = 0;

  for (const stat of stats) {
    const typingFrames = calcTypingFrames(stat.text, stat.typingSpeed ?? 18, fps);
    const typingStart  = cursor;
    const chartStart   = typingStart + typingFrames;
    timedStats.push({ stat, typingStart, typingFrames, chartStart });
    cursor = chartStart + stat.chart.durationInFrames + gapBetweenCharts;
  }

  // ── Build ChartSequenceRig scenes array from timing ─────────────────────────
  const chartScenes: Scene[] = timedStats.map(({ stat, chartStart }) => ({
    component:        renderChart(stat.chart),
    durationInFrames: stat.chart.durationInFrames,
    startOffset:      0,
  }));

  // ChartSequenceRig uses cumulative offsets internally, so we need to
  // convert our absolute chartStart values to the format it expects.
  // Since ChartSequenceRig accumulates from startDelay, we pass startDelay=0
  // and use startOffset to position each chart at its absolute frame.
  // The cleanest approach: build scenes with explicit from= using Sequence directly.

  return (
    <AbsoluteFill style={{ background }}>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position:   'absolute',
          left:       dividerX - 1,
          top:        dividerPadding,
          width:      1,
          height:     height - dividerPadding * 2,
          background: dividerColor,
        }}
      />

      {/* ── Left panel: typewriter ────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left:     0,
          top:      0,
          width:    leftW,
          height,
          display:  'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          padding: '40px 24px',
          boxSizing: 'border-box',
        }}
      >
        {timedStats.map(({ stat, typingStart }, i) => (
          <Sequence key={i} from={typingStart} durationInFrames={3000}>
            <div style={{ width: '100%' }}>
              <TypewriterRig
                text={stat.text}
                typingSpeed={stat.typingSpeed ?? 18}
                boxWidth={leftW - 48}
                boxHeight={inputBoxStyle.fontSize ? inputBoxStyle.fontSize * 2.8 : 80}
                fontSize={inputBoxStyle.fontSize ?? 32}
                fontFamily={inputBoxStyle.fontFamily ?? 'Poppins, sans-serif'}
                textColor={inputBoxStyle.textColor ?? '#333'}
                backgroundColor={inputBoxStyle.backgroundColor ?? '#f8f8f8'}
                startDelay={0}
              />
            </div>
          </Sequence>
        ))}
      </div>

      {/* ── Right panel: chart sequence ───────────────────────────────────── */}
      <div
  style={{
    position: 'absolute',
    left: leftW,
    top: 0,
    width: rightW,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }}
>
  {timedStats.map(({ stat, chartStart }, i) => (
    <Sequence
      key={i}
      from={chartStart}
      durationInFrames={stat.chart.durationInFrames}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'scale(0.85)',  // adjust value as needed
          transformOrigin: 'center center',
        }}
      >
        {renderChart(stat.chart)}
      </div>
    </Sequence>
  ))}
</div>

    </AbsoluteFill>
  );
};