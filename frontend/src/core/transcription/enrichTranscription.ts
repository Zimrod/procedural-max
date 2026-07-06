// src/core/transcription/enrichTranscription.ts

export function enrichTranscription(transcription: any) {
  const fullText = transcription.text;
  const words = [...transcription.words];
  let textIndex = 0;

  // 1. Initial Mapping: Attach punctuation from fullText to individual words
  const enrichedWords = words.map((wordObj) => {
    const rawWord = wordObj.word;
    const wordIndex = fullText.indexOf(rawWord, textIndex);

    if (wordIndex === -1) return wordObj;

    let start = wordIndex;
    let end = wordIndex + rawWord.length;

    // Grab leading symbols[cite: 23]
    while (start > 0 && /[$€£]/.test(fullText[start - 1])) start--;

    // Grab trailing punctuation, including % and decimals[cite: 23]
    while (end < fullText.length && /[.,%!?]/.test(fullText[end])) {
      // If we hit a dot followed by a digit, it's a decimal, keep it[cite: 23]
      if (fullText[end] === '.' && /\d/.test(fullText[end + 1])) {
        end++; 
        continue;
      }
      end++;
    }

    const enrichedWord = fullText.slice(start, end);
    textIndex = end;

    return { ...wordObj, word: enrichedWord };
  });

  // 2. Final Merging: Fix decimals (16. + 4%) and thousands (35, + 000)[cite: 22, 23]
  const finalWords = [];
  for (let i = 0; i < enrichedWords.length; i++) {
    const current = enrichedWords[i];
    const next = enrichedWords[i + 1];

    if (next) {
      const isDecimal = current.word.endsWith('.') && /^\d/.test(next.word);
      const isThousands = current.word.endsWith(',') && next.word === '000';

      if (isDecimal || isThousands) {
        finalWords.push({
          ...current,
          word: `${current.word}${next.word}`, // Merge strings[cite: 23]
          end: next.end, // Extend end time to the end of the second part
        });
        i++; // Skip the 'next' word as it is now merged
        continue;
      }
    }
    
    finalWords.push(current);
  }

  return { ...transcription, words: finalWords };
}