import * as randomWords from "random-words";

export function generateWords(length: number, count: number): string[] {
  const words = new Set<string>();

  // Generate more words than needed to ensure we have enough after filtering
  const candidates = (
    randomWords.generate({ exactly: count * 3, maxLength: length }) as string[]
  )
    .map((word: string) => word.toUpperCase())
    .filter((word: string) => word.length === length);

  // If we don't have enough words of the exact length, generate more
  while (candidates.length < count) {
    const moreWords = (
      randomWords.generate({
        exactly: count * 2,
        maxLength: length,
      }) as string[]
    )
      .map((word: string) => word.toUpperCase())
      .filter((word: string) => word.length === length);
    candidates.push(...moreWords);
  }

  // Get random unique words
  while (words.size < count && candidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const word = candidates[randomIndex];
    words.add(word);
    candidates.splice(randomIndex, 1);
  }

  return Array.from(words);
}

export function generateGarbage(length: number): string {
  const characters = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  return Array(length)
    .fill(0)
    .map(() => characters[Math.floor(Math.random() * characters.length)])
    .join("");
}

export function checkGuess(guess: string, password: string): number {
  return guess.split("").filter((char, index) => char === password[index])
    .length;
}

export function generateGameBoard(words: string[], totalChars: number): string {
  const board = Array(totalChars).fill(".");
  const wordLength = words[0].length;
  const usedRanges: [number, number][] = [];

  // Place each word
  for (const word of words) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const position = Math.floor(Math.random() * (totalChars - wordLength));
      const range: [number, number] = [position, position + wordLength - 1];

      // Check if this position overlaps with any existing word (including 2-char buffer)
      const hasOverlap = usedRanges.some(([start, end]) => {
        // Add 2-char buffer on both sides
        const bufferedStart = start - 2;
        const bufferedEnd = end + 2;
        return (
          (range[0] >= bufferedStart && range[0] <= bufferedEnd) ||
          (range[1] >= bufferedStart && range[1] <= bufferedEnd) ||
          (bufferedStart >= range[0] && bufferedStart <= range[1])
        );
      });

      if (!hasOverlap) {
        // Place the word
        for (let i = 0; i < word.length; i++) {
          board[position + i] = word[i];
        }
        usedRanges.push(range);
        placed = true;
      }

      attempts++;
    }
  }

  // Fill remaining spaces with random characters
  const fillerChars = "!@#$%^&*(){}[]<>-_=+|;:',./?";
  for (let i = 0; i < totalChars; i++) {
    if (board[i] === ".") {
      board[i] = fillerChars[Math.floor(Math.random() * fillerChars.length)];
    }
  }

  return board.join("");
}
