import OpenAI from 'openai';
import {
  ClassifiedSegment,
  WidgetCategory,
  WidgetType,
  WIDGET_TAXONOMY,
} from '../taxonomy/widgetTaxonomy';

const apiKey = process.env.OPENAI_API_KEY;

type Word = {
  word: string;
  start: number;
  end: number;
};

type AISegment = {
  text: string;
  shortSummary: string;
  primaryCategory: string;
  primaryType: string;
  confidence: number;
  reasoning: string;
  extractedData?: Record<string, any>;
  widgetProps?: Record<string, any>;
  visualIntent?: string;
  emotionalTone?: string;
};

const MAX_SEGMENT_DURATION_SEC = 4.5;
const MIN_SPLITTABLE_WORDS = 6;

const VALID_WIDGET_TYPES = new Set<WidgetType>(
  Object.values(WIDGET_TAXONOMY).flatMap((category) =>
    Object.keys(category.types)
  ) as WidgetType[]
);

const FALLBACK_WIDGET_BY_CATEGORY: Record<WidgetCategory, WidgetType> = {
  DATA_REPORTING: 'STAT_REVEAL',
  FINANCIAL_INSTRUMENTS: 'VALUATION',
  PROCESS_FLOW: 'LINEAR_FLOW',
  MECHANICAL_INDUSTRIAL: 'ENERGY_ASSET',
  LOCATION_GEOGRAPHY: 'MAP_OUTLINE',
  ENVIRONMENT_BACKGROUND: 'URBAN',
  BIOLOGICAL_HUMAN: 'TITLE_CARD',
  TEXT_TYPOGRAPHY: 'CAPTION',
  COMMUNICATION_MEDIA: 'UI_ELEMENT',
  SYMBOLISM: 'TEXT_EMPHASIS',
  TIME_MOTION: 'PROGRESS_BAR',
};

const WIDGET_TYPE_ALIASES: Record<string, WidgetType> = {
  EMPHASIS: 'TEXT_EMPHASIS',
  TEXT_EMPHASIS: 'TEXT_EMPHASIS',
  PROCESS_FLOW: 'LINEAR_FLOW',
  FLOW_DIAGRAM: 'LINEAR_FLOW',
  BRAND: 'BRAND_CARD',
  TITLE: 'TITLE_CARD',
  MAP_FOCUS_REVEAL: 'MAP_PIN',
  MEDITATION: 'TEXT_EMPHASIS',
  SPEED: 'PROGRESS_BAR',
  COUNTUP: 'COUNTER',
};

const WIDGET_CATEGORY_ALIASES: Record<string, WidgetCategory> = {
  DATA_VISUALIZATION: 'DATA_REPORTING',
  FINANCE: 'FINANCIAL_INSTRUMENTS',
  GEOGRAPHY: 'LOCATION_GEOGRAPHY',
  INDUSTRIAL: 'MECHANICAL_INDUSTRIAL',
  TYPOGRAPHY: 'TEXT_TYPOGRAPHY',
  TEXT: 'TEXT_TYPOGRAPHY',
  SYMBOLIC_ABSTRACT: 'SYMBOLISM',
  ABSTRACT: 'SYMBOLISM',
  MOTION: 'TIME_MOTION',
};

function generateTaxonomyPromptDescription(): string {
  return Object.entries(WIDGET_TAXONOMY)
    .map(([categoryKey, categoryConfig]) => {
      // Map over all active child keys in the category types object
      const typeLines = Object.keys(categoryConfig.types)
        .map(typeKey => `- ${typeKey}`)
        .join('\n');
        
      return `${categoryKey}:\n${typeLines}`;
    })
    .join('\n\n');
}

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, '')
    .replace(/[^a-z0-9%$£€]+/g, ' ')
    .trim();

const tokenizeWords = (text: string) =>
  normalizeToken(text).split(/\s+/).filter(Boolean);

const renderWords = (words: Word[]) =>
  words
    .map((word, index) => {
      const needsSpaceBefore =
        index > 0 && !/^[,.;:!?%)]/.test(word.word) && !/^'s$/i.test(word.word);
      return `${needsSpaceBefore ? ' ' : ''}${word.word}`;
    })
    .join('')
    .trim();

const normalizeCategory = (rawCategory: string): WidgetCategory => {
  const upper = rawCategory.toUpperCase().trim();
  if (upper in WIDGET_TAXONOMY) {
    return upper as WidgetCategory;
  }

  return WIDGET_CATEGORY_ALIASES[upper] ?? 'TEXT_TYPOGRAPHY';
};

const normalizeWidgetType = (
  rawType: string,
  category: WidgetCategory
): WidgetType => {
  const upper = rawType.toUpperCase().trim();
  const aliased = WIDGET_TYPE_ALIASES[upper] ?? upper;

  if (VALID_WIDGET_TYPES.has(aliased as WidgetType)) {
    return aliased as WidgetType;
  }

  return FALLBACK_WIDGET_BY_CATEGORY[category];
};

const buildFallbackWidgetProps = (
  primaryType: WidgetType,
  shortSummary: string,
  extractedData: Record<string, any> | undefined,
  durationFrames: number,
  text: string
) => {
  switch (primaryType) {
    case 'VALUATION':
      return {
        label: extractedData?.label ?? shortSummary,
        value: extractedData?.value ?? extractFirstNumber(text) ?? 0,
        prefix:
          extractedData?.prefix ??
          extractedData?.currency ??
          detectCurrencySymbol(text) ??
          '$',
        suffix: extractedData?.suffix ?? normalizeSuffix(extractedData?.unit),
        durationInFrames: durationFrames,
      };

    case 'STAT_REVEAL':
      return {
        label: extractedData?.label ?? shortSummary,
        value: extractedData?.value ?? extractFirstNumber(text) ?? 0,
        prefix: extractedData?.prefix ?? detectCurrencySymbol(text) ?? '',
        suffix: extractedData?.suffix ?? normalizeSuffix(extractedData?.unit),
        text: shortSummary,
        durationInFrames: durationFrames,
      };

    case 'GAUGE':
      return {
        label: extractedData?.label ?? shortSummary,
        value: extractedData?.value ?? extractFirstNumber(text) ?? 0,
        suffix: extractedData?.suffix ?? '%',
        durationInFrames: durationFrames,
      };

    case 'LINEAR_FLOW':
    case 'MILESTONE':
    case 'TIMELINE':
      return {
        steps:
          extractedData?.steps ??
          splitIntoSteps(text).slice(0, 5),
        durationPerStep: Math.max(
          20,
          Math.floor(durationFrames / Math.max(1, splitIntoSteps(text).length))
        ),
        nodeRadius: 70,
        nodeSpacing: 320,
        stepYOffset: 140,
        virtualHeight: 1080,
      };

    case 'TEXT_EMPHASIS':
    case 'TITLE_CARD':
    case 'CAPTION':
    case 'BRAND_CARD':
      return {
        text: shortSummary || text,
        durationInFrames: durationFrames,
        fontSize: primaryType === 'CAPTION' ? 32 : 42,
      };

    default:
      return {
        text: shortSummary || text,
        durationInFrames: durationFrames,
        fontSize: 32,
      };
  }
};

const splitIntoSteps = (text: string) =>
  text
    .split(/,| and | then | to /i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5);

const normalizeSuffix = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/million/i, 'M')
    .replace(/billion/i, 'B')
    .replace(/percent|percentage/i, '%')
    .trim();
};

const detectCurrencySymbol = (text: string) => {
  const match = text.match(/[$£€]/);
  return match?.[0] ?? null;
};

const extractFirstNumber = (text: string) => {
  const match = text.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
};

const findSegmentWordRange = (
  segmentText: string,
  words: Word[],
  startIndex: number
) => {
  const segmentTokens = tokenizeWords(segmentText);

  if (segmentTokens.length === 0) {
    return null;
  }

  let bestMatch: { start: number; end: number; score: number } | null = null;
  const maxStart = Math.max(startIndex, 0);
  const searchLimit = Math.min(words.length, maxStart + 24);

  for (let candidateStart = maxStart; candidateStart < searchLimit; candidateStart++) {
    let wordCursor = candidateStart;
    let tokenCursor = 0;
    let matchedTokens = 0;

    while (wordCursor < words.length && tokenCursor < segmentTokens.length) {
      const wordTokens = tokenizeWords(words[wordCursor].word);

      if (wordTokens.length === 0) {
        wordCursor++;
        continue;
      }

      let allMatched = true;

      for (const token of wordTokens) {
        if (segmentTokens[tokenCursor] !== token) {
          allMatched = false;
          break;
        }
        tokenCursor++;
        matchedTokens++;
        if (tokenCursor >= segmentTokens.length) {
          break;
        }
      }

      if (!allMatched) {
        break;
      }

      wordCursor++;
    }

    if (matchedTokens === 0) {
      continue;
    }

    const score = matchedTokens / segmentTokens.length;
    const end = Math.max(candidateStart, wordCursor - 1);

    if (
      !bestMatch ||
      score > bestMatch.score ||
      (score === bestMatch.score && end - candidateStart < bestMatch.end - bestMatch.start)
    ) {
      bestMatch = { start: candidateStart, end, score };
    }

    if (score === 1) {
      break;
    }
  }

  return bestMatch;
};

const findPreferredSplitIndex = (words: Word[], approxIndex: number) => {
  const localStart = Math.max(1, approxIndex - 3);
  const localEnd = Math.min(words.length - 1, approxIndex + 3);

  for (let i = localStart; i <= localEnd; i++) {
    const token = words[i - 1]?.word ?? '';
    if (/[,:;.]$/.test(token)) {
      return i;
    }
  }

  return approxIndex;
};

const splitWordsIntoParts = (words: Word[], parts: number) => {
  const ranges: Array<{ start: number; end: number }> = [];
  let partStart = 0;

  for (let part = 1; part <= parts; part++) {
    if (part === parts) {
      ranges.push({ start: partStart, end: words.length - 1 });
      break;
    }

    const approxIndex = Math.round((words.length * part) / parts);
    const splitIndex = findPreferredSplitIndex(words, approxIndex);
    ranges.push({ start: partStart, end: splitIndex - 1 });
    partStart = splitIndex;
  }

  return ranges.filter((range) => range.end >= range.start);
};

const splitLongSegment = (
  baseSegment: Omit<ClassifiedSegment, 'text' | 'startSec' | 'endSec' | 'startFrame' | 'endFrame' | 'durationFrames' | 'shortSummary' | 'widgetProps'>,
  matchedWords: Word[],
  fps: number,
  originalSummary: string,
  originalText: string
): ClassifiedSegment[] => {
  const startSec = matchedWords[0]?.start ?? 0;
  const endSec = matchedWords[matchedWords.length - 1]?.end ?? startSec;
  const durationSec = Math.max(0, endSec - startSec);

  if (
    durationSec <= MAX_SEGMENT_DURATION_SEC ||
    matchedWords.length < MIN_SPLITTABLE_WORDS
  ) {
    const startFrame = Math.floor(startSec * fps);
    const endFrame = Math.floor(endSec * fps);
    const text = renderWords(matchedWords);
    const shortSummary = originalSummary || text;

    return [
      {
        ...baseSegment,
        text,
        shortSummary,
        startSec,
        endSec,
        startFrame,
        endFrame,
        durationFrames: endFrame - startFrame,
        widgetProps: baseSegment.widgetProps ?? buildFallbackWidgetProps(
          baseSegment.primaryType,
          shortSummary,
          baseSegment.aiExtractedData,
          endFrame - startFrame,
          text
        ),
      },
    ];
  }

  const partCount = Math.ceil(durationSec / MAX_SEGMENT_DURATION_SEC);
  const ranges = splitWordsIntoParts(matchedWords, partCount);

  return ranges.map((range, index) => {
    const partWords = matchedWords.slice(range.start, range.end + 1);
    const partStartSec = partWords[0]?.start ?? startSec;
    const partEndSec = partWords[partWords.length - 1]?.end ?? partStartSec;
    const partStartFrame = Math.floor(partStartSec * fps);
    const partEndFrame = Math.floor(partEndSec * fps);
    const partText = renderWords(partWords);
    const shortSummary =
      partCount === 1 ? originalSummary : partText || `${originalSummary} ${index + 1}`;
    const durationFrames = partEndFrame - partStartFrame;

    return {
      ...baseSegment,
      text: partText,
      shortSummary,
      startSec: partStartSec,
      endSec: partEndSec,
      startFrame: partStartFrame,
      endFrame: partEndFrame,
      durationFrames,
      widgetProps: buildFallbackWidgetProps(
        baseSegment.primaryType,
        shortSummary,
        baseSegment.aiExtractedData,
        durationFrames,
        partText || originalText
      ),
    };
  });
};

export async function semanticSegmenter(
  transcriptionText: string,
  words: Word[],
  fps: number = 30
): Promise<ClassifiedSegment[]> {
  const dynamicTaxonomyDescription = generateTaxonomyPromptDescription();

  const prompt = `
You are the semantic orchestration engine for an AI motion graphics system.
Your single job is to segment this transcript into short, clean phrase beats that last between 1.5 and 4.0 seconds max.

Rules:
1. Segment by short visual PHRASES or clauses, never by whole sentences.
2. For a 30-second video, aim for 8 to 11 concise segments.
3. Keep the transcript wording EXACTLY identical inside the "text" field. No paraphrasing here.
4. Classify the segment into the single most accurate category and type from the taxonomy list.

TAXONOMY:
${dynamicTaxonomyDescription}

Transcript:
"""
${transcriptionText}
"""

Return STRICT valid JSON matching this shape:
{
  "segments": [
    {
      "text": "... exact transcript phrase ...",
      "primaryCategory": "DATA_REPORTING",
      "primaryType": "BAR_CHART"
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', 
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0].message.content || '{}';
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.segments)) {
    throw new Error(
      `AI response malformed. Expected segments array. Got: ${JSON.stringify(parsed)}`
    );
  }

  const aiSegments: AISegment[] = parsed.segments;
  const classifiedSegments: ClassifiedSegment[] = [];
  let currentWordIndex = 0;

  for (const seg of aiSegments) {
    const primaryCategory = normalizeCategory(seg.primaryCategory);
    const primaryType = normalizeWidgetType(seg.primaryType, primaryCategory);
    const match = findSegmentWordRange(seg.text, words, currentWordIndex);

    if (!match) {
      continue;
    }

    const matchedWords = words.slice(match.start, match.end + 1);
    currentWordIndex = match.end + 1;

    const baseSegment = {
      primaryCategory,
      primaryType,
      confidence: seg.confidence,
      reasoning: seg.reasoning,
      aiExtractedData: seg.extractedData,
      visualIntent: seg.visualIntent,
      emotionalTone: seg.emotionalTone,
      widgetProps: seg.widgetProps,
    };

    const splitSegments = splitLongSegment(
      baseSegment,
      matchedWords,
      fps,
      seg.shortSummary,
      seg.text
    );

    classifiedSegments.push(...splitSegments);
  }

  return classifiedSegments;
}
