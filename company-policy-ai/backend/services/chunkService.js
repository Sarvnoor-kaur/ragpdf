/**
 * Splits extracted PDF text into smaller chunks based on word counts
 * while preserving page range information.
 * 
 * @param {Array<{pageNumber: number, text: string}>} pages - Array of extracted page objects
 * @param {number} wordsPerChunk - Target word count per chunk
 * @param {number} overlapWords - Overlap word count between consecutive chunks
 * @returns {Array<{text: string, pageStart: number, pageEnd: number, chunkNumber: number}>}
 */
export const chunkText = (pages, wordsPerChunk = 600, overlapWords = 75) => {
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  // 1. Flatten all pages into a list of words, each tagged with its source page number
  const words = [];
  for (const page of pages) {
    // Split on whitespace, filter out empty elements
    const pageWords = page.text.trim().split(/\s+/);
    for (const word of pageWords) {
      if (word) {
        words.push({
          word,
          page: page.pageNumber,
        });
      }
    }
  }

  if (words.length === 0) {
    return [];
  }

  const chunks = [];
  let chunkNumber = 1;
  let i = 0;

  // 2. Sliding window over the word list
  while (i < words.length) {
    const end = Math.min(i + wordsPerChunk, words.length);
    const chunkWords = words.slice(i, end);

    const text = chunkWords.map((w) => w.word).join(' ');
    const pageStart = chunkWords[0].page;
    const pageEnd = chunkWords[chunkWords.length - 1].page;

    chunks.push({
      text,
      pageStart,
      pageEnd,
      chunkNumber: chunkNumber++,
    });

    // Determine the next starting index using the step size
    const step = wordsPerChunk - overlapWords;
    const nextIndex = i + (step > 0 ? step : 1);

    // If next index exceeds or matches the word count, we have processed everything
    if (nextIndex >= words.length) {
      break;
    }
    i = nextIndex;
  }

  return chunks;
};
