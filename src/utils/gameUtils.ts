const WORDS = [
  "SYSTEM",
  "ACCESS",
  "CIPHER",
  "SECURE",
  "BREACH",
  "DECODE",
  "HACKER",
  "BINARY",
  "CRYPTO",
  "FIREWALL",
  "NETWORK",
  "PROTOCOL",
  "TERMINAL",
  "VIRUS",
  "BYPASS",
  "EXPLOIT",
  "MALWARE",
  "TROJAN",
  "WORM",
  "SPYWARE",
  "ROOTKIT",
];

export function generateWords(length: number, count: number): string[] {
  const validWords = WORDS.filter((word) => word.length === length);
  return validWords.sort(() => 0.5 - Math.random()).slice(0, count);
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
