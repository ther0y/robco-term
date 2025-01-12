"use client";

import "../styles/crt.css";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  checkGuess,
  generateGameBoard,
  generateWords,
} from "../utils/gameUtils";

import { Button } from "@/components/ui/Button";
import { Tutorial } from "./Tutorial";

const WORD_LENGTH = 6;
const WORD_COUNT = 10;
const MAX_ATTEMPTS = 4;
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 16;
const TOTAL_CHARS = BOARD_WIDTH * BOARD_HEIGHT * 2;

function getInitialMobileState() {
  // Check if window is defined (we're in the browser)
  if (typeof window !== "undefined") {
    return window.innerWidth < 640;
  }
  return false; // Default to desktop on server
}

function MobileMessage() {
  return (
    <div className="bg-black min-h-screen flex items-center justify-center p-8">
      <div className="crt relative bg-black text-green-500 border-2 border-green-500 p-8 rounded-lg text-center max-w-sm">
        <div className="text-xl mb-4">ROBCO TERMINAL ACCESS DENIED!</div>
        <div className="text-gray-500">
          This terminal hacking simulation requires a desktop computer for
          optimal functionality.
          <br />
          <br />
          Please access from a desktop device to proceed.
        </div>
        <div
          className="absolute inset-0 rounded-lg border-2 border-green-500/30 pointer-events-none"
          style={{
            boxShadow:
              "0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.2)",
          }}
        />
      </div>
    </div>
  );
}

export default function TerminalHacking() {
  const [showMobile, setShowMobile] = useState(getInitialMobileState());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [board, setBoard] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [guessHistory, setGuessHistory] = useState<
    Array<{ guess: string; result: string }>
  >([]);
  const [usedBracketPositions, setUsedBracketPositions] = useState<Set<number>>(
    new Set()
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setShowMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = useCallback(() => {
    const newWords = generateWords(WORD_LENGTH, WORD_COUNT);
    setWords(newWords);
    const newPassword = newWords[Math.floor(Math.random() * newWords.length)];
    setPassword(newPassword);
    setAttempts(MAX_ATTEMPTS);
    setGuessHistory([]);
    setGameOver(false);
    setUsedBracketPositions(new Set());
    const newBoard = generateGameBoard(newWords, TOTAL_CHARS);
    setBoard(newBoard);
    setCursorPosition(0);
  }, []);

  const findWordAtPosition = useCallback(
    (position: number): [number, string] | null => {
      for (
        let i = Math.max(0, position - WORD_LENGTH + 1);
        i <= position;
        i++
      ) {
        if (i + WORD_LENGTH <= TOTAL_CHARS) {
          const word = board.slice(i, i + WORD_LENGTH);
          if (words.includes(word)) {
            return [i, word];
          }
        }
      }
      return null;
    },
    [board, words]
  );

  const findBracketPairAtPosition = useCallback(
    (position: number): [number, number] | null => {
      const openBrackets = ["(", "<", "{", "["];
      const closeBrackets = [")", ">", "}", "]"];
      const char = board[position];

      // Check if it's any kind of bracket
      if (openBrackets.includes(char) || closeBrackets.includes(char)) {
        // Find matching closing bracket in the same line
        const lineStart = Math.floor(position / BOARD_WIDTH) * BOARD_WIDTH;
        const lineEnd = lineStart + BOARD_WIDTH;

        // Find all valid bracket sequences in the line
        const sequences: [number, number][] = [];

        // For each opening bracket
        for (let start = lineStart; start < lineEnd; start++) {
          // Skip if this position was already used
          if (usedBracketPositions.has(start)) continue;

          const startChar = board[start];
          const startBracketIndex = openBrackets.indexOf(startChar);
          if (startBracketIndex === -1) continue;

          // Look for its matching closing bracket
          for (let end = start + 1; end < lineEnd; end++) {
            if (board[end] === closeBrackets[startBracketIndex]) {
              sequences.push([start, end]);
            }
          }
        }

        // Find the sequence that contains our cursor position
        for (const [start, end] of sequences) {
          if (position >= start && position <= end) {
            return [start, end];
          }
        }
      }
      return null;
    },
    [board, usedBracketPositions]
  );

  const getMemoryAddress = (lineIndex: number) => {
    const baseAddress = 0xf000;
    return `0x${(baseAddress + lineIndex * 0x10).toString(16).toUpperCase()}`;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case "ArrowUp":
          setCursorPosition((prev) => {
            const currentLine = Math.floor(prev / BOARD_WIDTH);
            const currentCol = prev % BOARD_WIDTH;
            const isInRightColumn = currentLine >= BOARD_HEIGHT;
            const newLine = isInRightColumn
              ? Math.max(BOARD_HEIGHT, currentLine - 1)
              : Math.max(0, currentLine - 1);
            return newLine * BOARD_WIDTH + currentCol;
          });
          break;
        case "ArrowDown":
          setCursorPosition((prev) => {
            const currentLine = Math.floor(prev / BOARD_WIDTH);
            const currentCol = prev % BOARD_WIDTH;
            const isInRightColumn = currentLine >= BOARD_HEIGHT;
            const newLine = isInRightColumn
              ? Math.min(BOARD_HEIGHT * 2 - 1, currentLine + 1)
              : Math.min(BOARD_HEIGHT - 1, currentLine + 1);
            return newLine * BOARD_WIDTH + currentCol;
          });
          break;
        case "ArrowLeft":
          setCursorPosition((prev) => {
            const currentCol = prev % BOARD_WIDTH;
            const currentLine = Math.floor(prev / BOARD_WIDTH);
            if (currentCol === 0) {
              // If at start of second column, jump to end of first column
              if (currentLine >= BOARD_HEIGHT) {
                return (
                  (currentLine - BOARD_HEIGHT) * BOARD_WIDTH + (BOARD_WIDTH - 1)
                );
              }
              // If at start of first column, stay there
              return prev;
            }
            return Math.max(0, prev - 1);
          });
          break;
        case "ArrowRight":
          setCursorPosition((prev) => {
            const currentCol = prev % BOARD_WIDTH;
            const currentLine = Math.floor(prev / BOARD_WIDTH);
            if (currentCol === BOARD_WIDTH - 1) {
              // If at end of first column and not in last line of first column,
              // move to second column on same relative line
              if (currentLine < BOARD_HEIGHT) {
                return (currentLine + BOARD_HEIGHT) * BOARD_WIDTH;
              }
              return prev;
            }
            return Math.min(TOTAL_CHARS - 1, prev + 1);
          });
          break;
        case "Enter":
          const wordInfo = findWordAtPosition(cursorPosition);
          const bracketPair = findBracketPairAtPosition(cursorPosition);

          if (wordInfo && attempts > 0) {
            handleGuess(wordInfo[1]);
          } else if (bracketPair && attempts > 0) {
            const [start, end] = bracketPair;

            // 1/10 chance to replenish attempts
            if (Math.random() <= 0.2 && attempts < MAX_ATTEMPTS) {
              setAttempts(MAX_ATTEMPTS);

              // Mark this position as used
              setUsedBracketPositions((prev) => new Set([...prev, start]));

              // Add to history
              const maxEntries = Math.floor((BOARD_HEIGHT * 1.5) / 4.5);
              setGuessHistory((prev) => {
                const newHistory = [...prev];
                if (newHistory.length >= maxEntries) {
                  newHistory.shift();
                }
                return [
                  {
                    guess: board.slice(start, end + 1),
                    result: "Attempts replenished!",
                  },
                  ...newHistory,
                ];
              });
            } else {
              // Find a random word position that isn't the password
              const allWordPositions: [number, string][] = [];
              for (let i = 0; i < TOTAL_CHARS - WORD_LENGTH; i++) {
                const word = board.slice(i, i + WORD_LENGTH);
                // Double check to ensure we never remove the password
                if (words.includes(word) && word !== password) {
                  // Find all instances of this word
                  let isPasswordPosition = false;
                  for (let j = 0; j < WORD_LENGTH; j++) {
                    // Check if this position overlaps with any instance of the password
                    for (let k = 0; k < TOTAL_CHARS - WORD_LENGTH; k++) {
                      if (
                        board.slice(k, k + WORD_LENGTH) === password &&
                        k <= i + j &&
                        i + j < k + WORD_LENGTH
                      ) {
                        isPasswordPosition = true;
                        break;
                      }
                    }
                    if (isPasswordPosition) break;
                  }
                  if (!isPasswordPosition) {
                    allWordPositions.push([i, word]);
                  }
                }
              }

              if (allWordPositions.length > 0) {
                // Choose a random word to remove
                const [wordPos, removedWord] =
                  allWordPositions[
                    Math.floor(Math.random() * allWordPositions.length)
                  ];

                // Replace the word with dots
                const newBoard = board.split("");
                for (let i = wordPos; i < wordPos + WORD_LENGTH; i++) {
                  newBoard[i] = ".";
                }
                setBoard(newBoard.join(""));

                // Mark this position as used
                setUsedBracketPositions((prev) => new Set([...prev, start]));

                // Add to history
                const maxEntries = Math.floor((BOARD_HEIGHT * 1.5) / 4.5);
                setGuessHistory((prev) => {
                  const newHistory = [...prev];
                  if (newHistory.length >= maxEntries) {
                    newHistory.shift();
                  }
                  return [
                    {
                      guess: board.slice(start, end + 1),
                      result: `Dud removed: ${removedWord}`,
                    },
                    ...newHistory,
                  ];
                });
              }
            }
          } else if (!wordInfo && attempts > 0) {
            const maxEntries = Math.floor((BOARD_HEIGHT * 1.5) / 4.5);
            setGuessHistory((prev) => {
              const newHistory = [...prev];
              if (newHistory.length >= maxEntries) {
                newHistory.shift();
              }
              return [
                { guess: "INVALID", result: "Invalid selection" },
                ...newHistory,
              ];
            });
          }
          break;
      }
    },
    [
      cursorPosition,
      gameOver,
      findWordAtPosition,
      attempts,
      board,
      findBracketPairAtPosition,
      words,
      password,
      usedBracketPositions,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleGuess = useCallback(
    (guess: string) => {
      const correctLetters = checkGuess(guess, password);
      const maxEntries = Math.floor((BOARD_HEIGHT * 1.5) / 4.5);

      if (correctLetters === WORD_LENGTH) {
        setGameOver(true);
        setGameOverMessage("ACCESS GRANTED. TERMINAL UNLOCKED.");
        return;
      }

      setGuessHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            guess,
            result: `Entry denied. Likeness=${correctLetters}`,
          },
        ];
        return newHistory.slice(-maxEntries);
      });

      if (attempts <= 1) {
        setGameOver(true);
        setGameOverMessage("TERMINAL LOCKED. TOO MANY INCORRECT ATTEMPTS.");
      } else {
        setAttempts((prev) => prev - 1);
      }
    },
    [attempts, password]
  );

  const getHighlightClass = useCallback(
    (index: number) => {
      if (index === cursorPosition) {
        return "bg-green-500 text-black";
      }
      const wordInfo = findWordAtPosition(cursorPosition);
      const bracketPair = findBracketPairAtPosition(cursorPosition);

      if (
        wordInfo &&
        index >= wordInfo[0] &&
        index < wordInfo[0] + WORD_LENGTH
      ) {
        return "bg-green-900";
      }
      if (bracketPair && index >= bracketPair[0] && index <= bracketPair[1]) {
        return "bg-green-900";
      }
      return "";
    },
    [cursorPosition, findWordAtPosition, findBracketPairAtPosition]
  );

  const renderBoard = () => {
    const lines = [];
    for (let i = 0; i < BOARD_HEIGHT; i++) {
      const leftAddr = getMemoryAddress(i * 2);
      const rightAddr = getMemoryAddress(i * 2 + 1);

      const leftStart = i * BOARD_WIDTH;
      const rightStart = (BOARD_HEIGHT + i) * BOARD_WIDTH;

      const leftChars = board.slice(leftStart, leftStart + BOARD_WIDTH);
      const rightChars = board.slice(rightStart, rightStart + BOARD_WIDTH);

      lines.push(
        <div key={i} className="flex gap-8 h-[1.5em]">
          <div className="flex">
            <span className="text-gray-500 mr-2">{leftAddr}</span>
            {leftChars.split("").map((char, j) => (
              <span
                key={j}
                className={`inline-block ${getHighlightClass(leftStart + j)}`}
              >
                {char}
              </span>
            ))}
          </div>
          <div className="flex">
            <span className="text-gray-500 mr-2">{rightAddr}</span>
            {rightChars.split("").map((char, j) => (
              <span
                key={j}
                className={`inline-block ${getHighlightClass(rightStart + j)}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return lines;
  };

  const renderHistory = () => {
    // Each entry takes 4.5em total (3em for content + 1.5em gap)
    const maxEntries = Math.floor((BOARD_HEIGHT * 1.5) / 4.5); // Account for total entry height including gap
    const recentHistory = guessHistory.slice(-maxEntries);

    return (
      <div className="h-full">
        {recentHistory.map((entry, index) => (
          <div key={index} className="mb-[1.5em]">
            <div className="text-green-500 leading-[1.5em] min-h-[1.5em] whitespace-pre-wrap">
              {`>`} {entry.guess}
            </div>
            <div className="text-gray-500 ml-2 leading-[1.5em] min-h-[1.5em] whitespace-pre-wrap">
              {entry.result}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGameOverModal = () => {
    if (!gameOver) return null;

    const isSuccess = gameOverMessage.includes("GRANTED");

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div
          className={`crt bg-black border-2 ${
            isSuccess ? "border-green-500" : "border-red-500"
          } p-8 max-w-md w-full mx-4`}
        >
          <div
            className={`font-mono mb-6 whitespace-pre-line ${
              isSuccess ? "text-green-500" : "text-red-500"
            }`}
          >
            {gameOverMessage}
          </div>
          <Button
            onClick={startNewGame}
            className={`w-full ${
              isSuccess
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } text-black`}
          >
            INITIALIZE NEW GAME
          </Button>
        </div>
      </div>
    );
  };

  const renderAttempts = () => {
    return (
      <div className="flex items-center gap-2 mb-8">
        <span>ATTEMPTS REMAINING: {attempts}</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 border border-green-500 ${
                index < attempts ? "bg-green-500" : ""
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Add loading sequence
  useEffect(() => {
    if (!showMobile) {
      const loadingSteps = [
        "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
        "[    0.000000] Linux version 2.6.32-504.el6.x86_64",
        "[    0.000000] KERNEL supported cpus:",
        "[    0.008000] BIOS-provided physical RAM map:",
        "[    0.015000] Scanning memory blocks... [OK]",
        "[    0.020000] Loading security protocols... [OK]",
        "[    0.025000] Initializing random number generator... [OK]",
        "[    0.032000] Checking password database... [OK]",
        "[    0.040000] Establishing secure connection... [OK]",
        "[    0.045000] TERMINAL READY. ENTER PASSWORD.",
      ];

      let currentStep = 0;
      const loadingInterval = setInterval(() => {
        if (currentStep < loadingSteps.length) {
          setLoadingText((prev) => prev + "\n" + loadingSteps[currentStep]);
          currentStep++;
        } else {
          clearInterval(loadingInterval);
          setTimeout(() => {
            setIsLoading(false);
            startNewGame();
          }, 100);
        }
      }, 100); // Faster interval

      return () => clearInterval(loadingInterval);
    }
  }, [showMobile]);

  if (showMobile) {
    return <MobileMessage />;
  }

  if (isLoading) {
    return (
      <div className="crt-screen bg-black p-16 min-w-7xl w-[814px] mx-auto relative">
        {/* Corner indents */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top left */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-black via-transparent to-transparent" />
          {/* Top right */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black via-transparent to-transparent" />
          {/* Bottom left */}
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-black via-transparent to-transparent" />
          {/* Bottom right */}
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-black via-transparent to-transparent" />
        </div>

        <div className="crt relative bg-black text-green-500 p-8 pb-16 pt-12 font-mono text-base rounded-lg border border-green-500 min-h-[670px] flex flex-col">
          <div
            className="absolute inset-0 rounded-lg border-2 border-green-500/30 pointer-events-none"
            style={{
              boxShadow:
                "0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.2)",
            }}
          />
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl">
              ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL
            </h1>
          </div>
          <div className="flex-1">
            <div
              className="flex flex-col gap-1 select-none cursor-default font-mono text-base"
              style={{
                userSelect: "none",
                height: `${BOARD_HEIGHT * 1.5}em`,
                lineHeight: "1.5em",
                width: `${BOARD_WIDTH * 2 * 2 + 16}ch`,
              }}
            >
              <pre className="whitespace-pre-line">{loadingText}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crt-screen bg-black p-16 max-w-4xl mx-auto relative">
      {/* Corner indents */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-black via-transparent to-transparent" />
        {/* Top right */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black via-transparent to-transparent" />
        {/* Bottom left */}
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-black via-transparent to-transparent" />
        {/* Bottom right */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-black via-transparent to-transparent" />
      </div>

      {/* Main terminal content */}
      <div className="crt relative bg-black text-green-500 p-8 pb-16 pt-12 font-mono text-base rounded-lg border border-green-500 min-h-[670px] flex flex-col">
        {/* Terminal border glow */}
        <div
          className="absolute inset-0 rounded-lg border-2 border-green-500/30 pointer-events-none"
          style={{
            boxShadow:
              "0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.2)",
          }}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl">ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL</h1>
          <Button
            onClick={() => setShowTutorial(true)}
            className="bg-green-500 hover:bg-green-600 text-black"
          >
            HELP
          </Button>
        </div>

        {renderAttempts()}
        <div className="flex gap-8 flex-1">
          <div className="flex-none">
            <div
              ref={boardRef}
              className="flex flex-col gap-1 select-none cursor-default font-mono text-base"
              style={{
                userSelect: "none",
                height: `${BOARD_HEIGHT * 1.5}em`,
                lineHeight: "1.5em",
              }}
            >
              {renderBoard()}
            </div>
          </div>
          <div className="border-l border-green-500 pl-8 w-56">
            <div
              className="h-full"
              style={{ height: `${BOARD_HEIGHT * 1.5}em` }}
            >
              {renderHistory()}
            </div>
          </div>
        </div>
      </div>
      {renderGameOverModal()}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
