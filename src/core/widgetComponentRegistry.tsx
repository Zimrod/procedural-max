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

// Maps runtime string types explicitly to React Component structures
const componentMapping: Record<WidgetType, React.ComponentType<any>> = {
  title_card: TitleCardRig,
  typewriter: TypewriterRig,
  text: TextRig,
  terminal_typing_text: TerminalTypingTextRig,
  text_animations_word_highlight: TextAnimationsWordHighlight,
  svg_draw_in_text: SvgDrawInTextRig,
  sliding_word_mask: SlidingWordMaskRig,
  sequential_elastic_text: SequentialElasticTextRig,
  bullet_points: BulletPointsRig,
  geometric_quote: GeometricQuoteRig,
  grid_principles: GridPrinciplesRig,
};

export function getWidgetComponent(widgetType: string): React.ComponentType<any> {
  // Checks against the runtime string type (e.g. 'terminal_typing_text')
  const normalized = widgetType.toLowerCase() as WidgetType;
  return componentMapping[normalized] || (() => <DiagnosticFallbackRig widget={widgetType} />);
}