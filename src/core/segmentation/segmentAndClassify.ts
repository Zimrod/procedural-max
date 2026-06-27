// src/core/segmentation/segmentAndClassify.ts
import { ClassifiedSegment, WidgetCategory, WidgetType } from '../taxonomy/widgetTaxonomy';

type Word = { word: string; start: number; end: number };

const FPS = 30;

function assignTaxonomy(text: string): {
  primaryCategory: WidgetCategory;
  primaryType: WidgetType;
} {
  const lower = text.toLowerCase();
  const hasNumber = /\d/.test(lower);
  const hasTrendLanguage = ['trend', 'growth', 'decline', 'projection', 'forecast', 'over time'].some((term) => lower.includes(term));
  const hasComparisonLanguage = ['compare', 'versus', 'vs', 'between', 'across', 'relative'].some((term) => lower.includes(term));
  const hasCompositionLanguage = ['share', 'split', 'mix', 'composition', 'allocation', 'portion'].some((term) => lower.includes(term));
  const hasBridgeLanguage = ['bridge', 'waterfall', 'reconciliation', 'gross to net', 'net of', 'variance'].some((term) => lower.includes(term));
  const hasNarrativeLanguage = ['intro', 'headline', 'takeaway', 'summary', 'in short', 'this means', 'here is'].some((term) => lower.includes(term));

  if (hasNumber) {
    if (hasBridgeLanguage) {
      return { primaryCategory: 'DATA_REPORTING', primaryType: 'WATERFALL_CHART' };
    }

    if (hasCompositionLanguage) {
      return { primaryCategory: 'DATA_REPORTING', primaryType: hasComparisonLanguage ? 'DONUT_COMPARISON' : 'DONUT_CHART' };
    }

    if (hasComparisonLanguage) {
      return { primaryCategory: 'DATA_REPORTING', primaryType: lower.includes('multi') ? 'MULTI_BAR_CHART' : 'BAR_CHART' };
    }

    if (hasTrendLanguage) {
      return { primaryCategory: 'DATA_REPORTING', primaryType: lower.includes('multiple') || lower.includes('scenarios') ? 'MULTI_LINE_CHART' : 'LINE_CHART' };
    }

    return { primaryCategory: 'DATA_REPORTING', primaryType: 'STAT_REVEAL' };
  }

  if (hasTrendLanguage) {
    return { primaryCategory: 'DATA_REPORTING', primaryType: 'LINE_CHART' };
  }

  if (hasComparisonLanguage || hasCompositionLanguage || hasBridgeLanguage) {
    return { primaryCategory: 'DATA_REPORTING', primaryType: 'BAR_CHART' };
  }

  if (hasNarrativeLanguage || lower.length > 90) {
    return { primaryCategory: 'TEXT_TYPOGRAPHY', primaryType: 'TEXT' };
  }

  if (lower.length < 40) {
    return { primaryCategory: 'TEXT_TYPOGRAPHY', primaryType: 'TITLE_CARD' };
  }

  return { primaryCategory: 'TEXT_TYPOGRAPHY', primaryType: 'TYPEWRITER' };
}

export function segmentAndClassify(words: Word[], fps: number = FPS): ClassifiedSegment[] {
  const segments: ClassifiedSegment[] = [];
  let currentWords: Word[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    const isSentenceEnd = /[.!?]/.test(word.word);
    const nextWord = words[i + 1];
    const largeGap = nextWord ? nextWord.start - word.end > 0.5 : true;

    if (isSentenceEnd || largeGap) {
      const text = currentWords.map((w) => w.word).join(' ');
      const startSec = currentWords[0].start;
      const endSec = currentWords[currentWords.length - 1].end;
      const startFrame = Math.floor(startSec * fps);
      // Use ceil for endFrame so short partial seconds still consume frames
      const endFrame = Math.ceil(endSec * fps);
      const durationFrames = Math.max(1, endFrame - startFrame);

      const tax = assignTaxonomy(text);
      segments.push({
        text,
        startSec,
        endSec,
        startFrame,
        endFrame,
        durationFrames,
        primaryCategory: tax.primaryCategory,
        primaryType: tax.primaryType,
      });
      currentWords = [];
    }
  }

  return segments;
}
