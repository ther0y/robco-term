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
import { soundManager } from "../utils/soundManager";

const WORD_LENGTH = 6;
const WORD_COUNT = 10;
const MAX_ATTEMPTS = 4;
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 16;
const TOTAL_CHARS = BOARD_WIDTH * BOARD_HEIGHT * 2;

type HistoryEntry = {
  guess: string;
  result: string;
};

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
  const [board, setBoard] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [guessHistory, setGuessHistory] = useState<HistoryEntry[]>([]);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [usedBracketPositions, setUsedBracketPositions] = useState<Set<number>>(
    new Set()
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const historyScrollThumbRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

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
        const line = board.slice(lineStart, lineEnd);
        const relativePos = position - lineStart;

        // If it's an opening bracket, look for its matching closing bracket
        const openIndex = openBrackets.indexOf(char);
        if (openIndex !== -1) {
          // Look for matching closing bracket after this position
          for (let j = relativePos + 1; j < line.length; j++) {
            const nextChar = line[j];
            const absoluteJ = lineStart + j;

            // Skip if this position was already used
            if (usedBracketPositions.has(absoluteJ)) continue;

            // Check if it's the matching closing bracket
            if (nextChar === closeBrackets[openIndex]) {
              return [position, absoluteJ];
            }
          }
        }

        // If it's a closing bracket, look for its matching opening bracket before
        const closeIndex = closeBrackets.indexOf(char);
        if (closeIndex !== -1) {
          // Look for matching opening bracket before this position
          for (let j = relativePos - 1; j >= 0; j--) {
            const prevChar = line[j];
            const absoluteJ = lineStart + j;

            // Skip if this position was already used
            if (usedBracketPositions.has(absoluteJ)) continue;

            // Check if it's the matching opening bracket
            if (prevChar === openBrackets[closeIndex]) {
              return [absoluteJ, position];
            }
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
          soundManager.playSound("scroll_char");
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
          soundManager.playSound("scroll_char");
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
          soundManager.playSound("scroll_char");
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
              // If at start of first column, wrap to end of second column of previous line
              if (currentLine > 0) {
                return (
                  (currentLine - 1 + BOARD_HEIGHT) * BOARD_WIDTH +
                  (BOARD_WIDTH - 1)
                );
              }
              // At very start, wrap to end of last line
              return (BOARD_HEIGHT * 2 - 1) * BOARD_WIDTH + (BOARD_WIDTH - 1);
            }
            return prev - 1;
          });
          break;
        case "ArrowRight":
          soundManager.playSound("scroll_char");
          setCursorPosition((prev) => {
            const currentCol = prev % BOARD_WIDTH;
            const currentLine = Math.floor(prev / BOARD_WIDTH);

            if (currentCol === BOARD_WIDTH - 1) {
              // If at end of first column, jump to start of second column
              if (currentLine < BOARD_HEIGHT) {
                return (currentLine + BOARD_HEIGHT) * BOARD_WIDTH;
              }
              // If at end of second column, wrap to start of first column of next line
              if (currentLine < BOARD_HEIGHT * 2 - 1) {
                return (currentLine - BOARD_HEIGHT + 1) * BOARD_WIDTH;
              }
              // At very end, wrap to start of first line
              return 0;
            }
            return prev + 1;
          });
          break;
        case "Enter":
          soundManager.playSound("enter");
          // First check if we're on a word
          const wordInfo = findWordAtPosition(cursorPosition);
          if (wordInfo && attempts > 0) {
            const [, selectedWord] = wordInfo;
            const correctLetters = checkGuess(selectedWord, password);

            if (correctLetters === WORD_LENGTH) {
              setGameOver(true);
              setGameOverMessage("ACCESS GRANTED. TERMINAL UNLOCKED.");
              setGuessHistory((prev) => [
                { guess: selectedWord, result: "Entry granted!" },
                ...prev,
              ]);
              return;
            }

            setGuessHistory((prev) => [
              {
                guess: selectedWord,
                result: `Entry denied. Likeness=${correctLetters}`,
              },
              ...prev,
            ]);

            if (attempts <= 1) {
              setGameOver(true);
              setGameOverMessage(
                `TERMINAL LOCKED.\nTOO MANY INCORRECT ATTEMPTS.\nCORRECT PASSWORD WAS: ${password}`
              );
            } else {
              setAttempts((prev) => prev - 1);
            }
            return;
          }

          // Then check for bracket pairs
          const bracketPair = findBracketPairAtPosition(cursorPosition);
          if (bracketPair && attempts > 0) {
            const [start, end] = bracketPair;
            const selectedWord = board.slice(start, end + 1);

            // Mark these bracket positions as used
            const newUsedPositions = new Set(usedBracketPositions);
            for (let i = start; i <= end; i++) {
              newUsedPositions.add(i);
            }
            setUsedBracketPositions(newUsedPositions);

            // Check if this is a replenish attempts sequence
            if (selectedWord.includes("REPLEN")) {
              setAttempts(MAX_ATTEMPTS);
              setGuessHistory((prev) => [
                { guess: selectedWord, result: "Attempts replenished!" },
                ...prev,
              ]);
            } else {
              // Check if this is a dud removal sequence
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

                setGuessHistory((prev) => [
                  {
                    guess: selectedWord,
                    result: `Dud removed: ${removedWord}`,
                  },
                  ...prev,
                ]);
              }
            }
          } else if (attempts > 0) {
            setGuessHistory((prev) => [
              { guess: "INVALID", result: "Invalid selection" },
              ...prev,
            ]);
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

  const getHighlightClass = useCallback(
    (index: number) => {
      // Check cursor position first
      if (index === cursorPosition) {
        return "bg-green-500 text-black";
      }

      // Check hover position
      if (index === hoverPosition) {
        return "bg-green-500 text-black";
      }

      // Check if part of hovered word/bracket
      if (hoverPosition !== null) {
        const hoveredWord = findWordAtPosition(hoverPosition);
        const hoveredBracket = findBracketPairAtPosition(hoverPosition);

        if (
          hoveredWord &&
          index >= hoveredWord[0] &&
          index < hoveredWord[0] + WORD_LENGTH
        ) {
          return "bg-green-900";
        }
        if (
          hoveredBracket &&
          index >= hoveredBracket[0] &&
          index <= hoveredBracket[1]
        ) {
          return "bg-green-900";
        }
      }

      // Check if part of selected word/bracket
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
    [
      cursorPosition,
      hoverPosition,
      findWordAtPosition,
      findBracketPairAtPosition,
    ]
  );

  const handleCharacterClick = useCallback(
    (index: number) => {
      if (gameOver) return;

      // Check if clicking on a word
      const wordInfo = findWordAtPosition(index);
      if (wordInfo && attempts > 0) {
        soundManager.playSound("enter");
        const [, selectedWord] = wordInfo;
        const correctLetters = checkGuess(selectedWord, password);

        if (correctLetters === WORD_LENGTH) {
          setGameOver(true);
          setGameOverMessage("ACCESS GRANTED. TERMINAL UNLOCKED.");
          setGuessHistory((prev) => [
            { guess: selectedWord, result: "Entry granted!" },
            ...prev,
          ]);
          return;
        }

        setGuessHistory((prev) => [
          {
            guess: selectedWord,
            result: `Entry denied. Likeness=${correctLetters}`,
          },
          ...prev,
        ]);

        if (attempts <= 1) {
          setGameOver(true);
          setGameOverMessage(
            `TERMINAL LOCKED.\nTOO MANY INCORRECT ATTEMPTS.\nCORRECT PASSWORD WAS: ${password}`
          );
        } else {
          setAttempts((prev) => prev - 1);
        }
        return;
      }

      // Check if clicking on a bracket pair
      const bracketPair = findBracketPairAtPosition(index);
      if (bracketPair && attempts > 0) {
        soundManager.playSound("enter");
        const [start, end] = bracketPair;
        const selectedWord = board.slice(start, end + 1);

        // Mark these bracket positions as used
        const newUsedPositions = new Set(usedBracketPositions);
        for (let i = start; i <= end; i++) {
          newUsedPositions.add(i);
        }
        setUsedBracketPositions(newUsedPositions);

        // Rest of the bracket handling logic...
        if (selectedWord.includes("REPLEN")) {
          setAttempts(MAX_ATTEMPTS);
          setGuessHistory((prev) => [
            { guess: selectedWord, result: "Attempts replenished!" },
            ...prev,
          ]);
        } else {
          // Existing dud removal logic...
          const allWordPositions: [number, string][] = [];
          for (let i = 0; i < TOTAL_CHARS - WORD_LENGTH; i++) {
            const word = board.slice(i, i + WORD_LENGTH);
            if (words.includes(word) && word !== password) {
              let isPasswordPosition = false;
              for (let j = 0; j < WORD_LENGTH; j++) {
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
            const [wordPos, removedWord] =
              allWordPositions[
                Math.floor(Math.random() * allWordPositions.length)
              ];

            const newBoard = board.split("");
            for (let i = wordPos; i < wordPos + WORD_LENGTH; i++) {
              newBoard[i] = ".";
            }
            setBoard(newBoard.join(""));

            setGuessHistory((prev) => [
              {
                guess: selectedWord,
                result: `Dud removed: ${removedWord}`,
              },
              ...prev,
            ]);
          }
        }
      } else if (attempts > 0) {
        soundManager.playSound("enter");
        setGuessHistory((prev) => [
          { guess: "INVALID", result: "Invalid selection" },
          ...prev,
        ]);
      }
    },
    [
      gameOver,
      findWordAtPosition,
      attempts,
      password,
      findBracketPairAtPosition,
      board,
      words,
      usedBracketPositions,
    ]
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
                className={`inline-block cursor-pointer ${getHighlightClass(
                  leftStart + j
                )}`}
                onMouseEnter={() => setHoverPosition(leftStart + j)}
                onMouseLeave={() => setHoverPosition(null)}
                onClick={() => handleCharacterClick(leftStart + j)}
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
                className={`inline-block cursor-pointer ${getHighlightClass(
                  rightStart + j
                )}`}
                onMouseEnter={() => setHoverPosition(rightStart + j)}
                onMouseLeave={() => setHoverPosition(null)}
                onClick={() => handleCharacterClick(rightStart + j)}
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

  useEffect(() => {
    const container = historyContainerRef.current;
    const thumb = historyScrollThumbRef.current;

    if (!container || !thumb) return;

    // Scroll to top (latest entry in reversed flex layout)
    container.scrollTop = 0;

    const updateThumbSize = () => {
      const viewportRatio = container.clientHeight / container.scrollHeight;
      const thumbHeight = Math.max(20, viewportRatio * container.clientHeight);
      thumb.style.height = `${thumbHeight}px`;
      // Hide thumb when content fits viewport
      thumb.style.opacity = viewportRatio < 1 ? "1" : "0";
    };

    const updateScrollThumb = () => {
      const scrollPercentage =
        container.scrollTop / (container.scrollHeight - container.clientHeight);
      const maxTranslate = container.clientHeight - thumb.clientHeight;
      thumb.style.transform = `translateY(${
        scrollPercentage * maxTranslate
      }px)`;
    };

    // Update thumb size initially and when content changes
    updateThumbSize();
    updateScrollThumb();

    // Add scroll event listener
    container.addEventListener("scroll", updateScrollThumb);

    // Create observer for content changes
    const observer = new ResizeObserver(() => {
      updateThumbSize();
      updateScrollThumb();
    });

    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollThumb);
      observer.disconnect();
    };
  }, [guessHistory]); // Add guessHistory as dependency to re-run when content changes

  const renderHistory = () => {
    return (
      <div className="h-full relative">
        <div
          ref={historyContainerRef}
          className="h-full overflow-y-auto scrollbar-none flex flex-col-reverse"
        >
          {guessHistory.map((entry, index) => (
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
        <div className="absolute top-0 right-0 w-1 h-full">
          <div
            ref={historyScrollThumbRef}
            className="absolute bottom-0 w-full bg-green-500/20 transition-transform duration-100"
          />
        </div>
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

      // Initialize audio context on first user interaction
      const handleFirstInteraction = () => {
        soundManager.playSound("powerOn");
        setTimeout(() => soundManager.playSound("scrollLoop"), 500);
        window.removeEventListener("keydown", handleFirstInteraction);
        window.removeEventListener("click", handleFirstInteraction);
      };

      window.addEventListener("keydown", handleFirstInteraction, {
        once: true,
      });
      window.addEventListener("click", handleFirstInteraction, { once: true });

      let currentStep = 0;
      const loadingInterval = setInterval(() => {
        if (currentStep < loadingSteps.length) {
          setLoadingText((prev) => prev + "\n" + loadingSteps[currentStep]);
          soundManager.playSound("scroll");
          currentStep++;
        } else {
          clearInterval(loadingInterval);
          setTimeout(() => {
            setIsLoading(false);
            startNewGame();
          }, 100);
        }
      }, 100);

      return () => {
        clearInterval(loadingInterval);
        window.removeEventListener("keydown", handleFirstInteraction);
        window.removeEventListener("click", handleFirstInteraction);
      };
    }
  }, [showMobile]);

  useEffect(() => {
    if (gameOver) {
      soundManager.playSound("powerOff");
    }
  }, [gameOver]);

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
            <div className="h-full" style={{ height: `27.5rem` }}>
              {renderHistory()}
            </div>
          </div>
        </div>
      </div>

      {/* Controls hint box */}
      <div className="mt-8 text-green-500 font-mono text-sm">
        <div className="border border-green-500/50 rounded p-4">
          <div className="mb-2 text-green-500/80">CONTROLS:</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-green-500/60">↑ ↓ ← →</span>
              <span className="ml-2 text-green-500/80">Navigate cursor</span>
            </div>
            <div>
              <span className="text-green-500/60">ENTER</span>
              <span className="ml-2 text-green-500/80">
                Select word/brackets
              </span>
            </div>
          </div>
        </div>
      </div>

      {renderGameOverModal()}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
