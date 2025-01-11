import { Button } from "./ui/Button";
import React from "react";

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-16 z-50">
      <div className="crt-screen relative">
        <div
          className="crt relative bg-black text-green-500 border-2 border-green-500 rounded-lg overflow-hidden"
          style={{
            width: "576px", // 12 chars * 2 columns * 24px char width
            height: "500px", // 16 lines * 1.5em * 16px base font size
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-black via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-black via-transparent to-transparent" />
          </div>

          <div
            className="absolute inset-0 rounded-lg border-2 border-green-500/30 pointer-events-none"
            style={{
              boxShadow:
                "0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.2)",
            }}
          />

          <div className="flex-1 overflow-hidden h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-8 pt-12">
              <h2 className="text-2xl mb-6">ROBCO TERMLINK TUTORIAL</h2>

              <div className="space-y-6 pb-12">
                <section>
                  <h3 className="text-xl mb-2">OBJECTIVE</h3>
                  <p className="mb-4">
                    Hack into the computer by finding the correct password. You
                    have 4 attempts before the system locks you out.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl mb-2">PASSWORD HINTS</h3>
                  <p className="mb-2">
                    When you select a word, the system shows its "likeness" to
                    the password:
                  </p>
                  <div className="bg-black border border-green-500 p-4 mb-4 font-mono">
                    <div>{`>`} SYSTEM</div>
                    <div className="text-gray-500 ml-2">
                      Entry denied. Likeness=3
                    </div>
                    <div className="mt-2 text-gray-500">
                      (3 letters match the password in the same positions)
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl mb-2">SPECIAL SEQUENCES</h3>
                  <p className="mb-2">
                    Find and select bracket pairs to reveal bonuses:
                  </p>
                  <div className="bg-black border border-green-500 p-4 mb-4 font-mono">
                    <div className="mb-2">Examples of bracket pairs:</div>
                    <div className="text-gray-500">
                      (.....) {"{....."} [.....] &lt;.....&gt;
                    </div>
                    <div className="mt-2">Selecting these can:</div>
                    <div className="text-gray-500 ml-2">
                      - Remove incorrect words (DUD REMOVED)
                    </div>
                    <div className="text-gray-500 ml-2">
                      - Replenish your attempts
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl mb-2">NAVIGATION</h3>
                  <div className="bg-black border border-green-500 p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-bold mb-1">Movement:</div>
                        <div className="text-gray-500">↑ Move cursor up</div>
                        <div className="text-gray-500">↓ Move cursor down</div>
                        <div className="text-gray-500">← Move cursor left</div>
                        <div className="text-gray-500">→ Move cursor right</div>
                      </div>
                      <div>
                        <div className="font-bold mb-1">Selection:</div>
                        <div className="text-gray-500">
                          ENTER - Select word or bracket pair
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl mb-2">TIPS</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-500">
                    <li>Start with different words to maximize information</li>
                    <li>
                      Use bracket pairs when you're unsure to remove wrong
                      options
                    </li>
                    <li>
                      Watch your remaining attempts - use bracket pairs to
                      replenish them
                    </li>
                    <li>
                      Words with higher likeness are closer to the password
                    </li>
                  </ul>
                </section>
              </div>
            </div>

            <div className="flex-none p-4 border-t border-green-500 flex justify-end bg-black">
              <Button
                onClick={onClose}
                className="bg-green-500 hover:bg-green-600 text-black"
              >
                RETURN TO TERMINAL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}