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

export function generateGameBoard(
  words: string[],
  totalLength: number
): string {
  const board = Array(totalLength).fill(".");
  const usedIndices = new Set<number>();

  words.forEach((word) => {
    let index: number;
    do {
      index = Math.floor(Math.random() * (totalLength - word.length + 1));
    } while (
      Array.from({ length: word.length }, (_, i) =>
        usedIndices.has(index + i)
      ).some(Boolean)
    );

    for (let i = 0; i < word.length; i++) {
      board[index + i] = word[i];
      usedIndices.add(index + i);
    }
  });

  for (let i = 0; i < totalLength; i++) {
    if (board[i] === ".") {
      board[i] = generateGarbage(1);
    }
  }

  return board.join("");
}
