// src/core/widgetComponentRegistry.tsx
'use client';

import React from 'react';
import { WidgetType } from './widgetRegistry.js';

// Existing Rig Imports
import { TextRig } from '../graphics/TextRig.js';
import { TitleCardRig } from '../graphics/TitleCardRig.js';
import { TypewriterRig } from '../graphics/TypewriterRig.js';

// Newly Integrated Rig Imports
import { TerminalTypingTextRig } from '../graphics/TerminalTypingTextRig.js';
import { TextAnimationsWordHighlight } from '../graphics/TextAnimationsWordHighlight.js';
import { SvgDrawInTextRig } from '../graphics/SvgDrawInTextRig.js';
import { SlidingWordMaskRig } from '../graphics/SlidingWordMaskRig.js';
import { SequentialElasticTextRig } from '../graphics/SequentialElasticTextRig.js';
import { BulletPointsRig } from '../graphics/BulletPointsRig.js';
import { GeometricQuoteRig } from '../graphics/GeometricQuoteRig.js';
import { GridPrinciplesRig } from '../graphics/GridPrinciplesRig.js';

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

