// src/core/widgetComponentRegistry.tsx
'use client';

import React from 'react';
import { WidgetType } from './widgetRegistry';

// Existing Rig Imports
import { TextRig } from '../remotion/MyComp/TextRig';
import { TitleCardRig } from '../remotion/MyComp/TitleCardRig';
import { TypewriterRig } from '../remotion/MyComp/TypewriterRig';

// Newly Integrated Rig Imports
import { TerminalTypingTextRig } from '../remotion/MyComp/TerminalTypingTextRig';
import { TextAnimationsWordHighlight } from '../remotion/MyComp/TextAnimationsWordHighlight';
import { SvgDrawInTextRig } from '../remotion/MyComp/SvgDrawInTextRig';
import { SlidingWordMaskRig } from '../remotion/MyComp/SlidingWordMaskRig';
import { SequentialElasticTextRig } from '../remotion/MyComp/SequentialElasticTextRig';
import { BulletPointsRig } from '../remotion/MyComp/BulletPointsRig';
import { GeometricQuoteRig } from '../remotion/MyComp/GeometricQuoteRig';
import { GridPrinciplesRig } from '../remotion/MyComp/GridPrinciplesRig';

export const DiagnosticFallbackRig: React.FC<{ widget: string }> = ({ widget }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a0505',
      border: '4px dashed #ff4444',
      color: '#ff8888',
      fontFamily: 'monospace',
    }}
  >
    <h1 style={{ fontSize: 42 }}>RENDER FAILURE</h1>
    <p style={{ fontSize: 20 }}>Widget Missing: {widget}</p>
  </div>
);

// 🚀 Fix: Update keys to UPPERCASE to exactly match the WidgetType registry contract
const componentMapping: Record<WidgetType, React.ComponentType<any>> = {
  TITLE_CARD: TitleCardRig,
  TYPEWRITER: TypewriterRig,
  TEXT: TextRig,
  TERMINAL_TYPING_TEXT: TerminalTypingTextRig,
  TEXT_ANIMATIONS_WORD_HIGHLIGHT: TextAnimationsWordHighlight,
  SVG_DRAW_IN_TEXT: SvgDrawInTextRig,
  SLIDING_WORD_MASK: SlidingWordMaskRig,
  SEQUENTIAL_ELASTIC_TEXT: SequentialElasticTextRig,
  BULLET_POINTS: BulletPointsRig,
  GEOMETRIC_QUOTE: GeometricQuoteRig,
  GRID_PRINCIPLES: GridPrinciplesRig,
};

export function getWidgetComponent(widgetType: string): React.ComponentType<any> {
  // 🚀 Fix: Convert to UPPERCASE instead of lowercase to match your type matrix keys
  const normalized = widgetType.toUpperCase() as WidgetType;
  return componentMapping[normalized] || (() => <DiagnosticFallbackRig widget={widgetType} />);
}