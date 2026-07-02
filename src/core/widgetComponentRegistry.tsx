// src/core/widgetComponentRegistry.tsx
'use client';

import React from 'react';
import { WidgetType } from './widgetRegistry';

// Existing Rig Imports
import { TextRig } from '../graphics/TextRig';
import { TitleCardRig } from '../graphics/TitleCardRig';
import { TypewriterRig } from '../graphics/TypewriterRig';

// Newly Integrated Rig Imports
import { TerminalTypingTextRig } from '../graphics/TerminalTypingTextRig';
import { TextAnimationsWordHighlight } from '../graphics/TextAnimationsWordHighlight';
import { SvgDrawInTextRig } from '../graphics/SvgDrawInTextRig';
import { SlidingWordMaskRig } from '../graphics/SlidingWordMaskRig';
import { SequentialElasticTextRig } from '../graphics/SequentialElasticTextRig';
import { BulletPointsRig } from '../graphics/BulletPointsRig';
import { GeometricQuoteRig } from '../graphics/GeometricQuoteRig';
import { GridPrinciplesRig } from '../graphics/GridPrinciplesRig';

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
