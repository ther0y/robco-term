type SoundEffect = {
  key: string;
  buffer: AudioBuffer;
};

type SoundType =
  | "keypress"
  | "enter"
  | "scroll"
  | "scroll_char"
  | "scrollLoop"
  | "powerOn"
  | "powerOff";
type SoundKey = SoundType | `${SoundType}_${number}`;

class SoundManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, SoundEffect> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Initialize immediately for testing
    if (typeof window !== "undefined") {
      this.initializeContext();
      // Also try to initialize on first click as fallback
      window.addEventListener("click", () => this.initializeContext(), {
        once: true,
      });
    }
  }

  private async initializeContext() {
    if (this.context) return;

    try {
      console.log("Initializing audio context...");
      this.context = new AudioContext();
      await this.loadSounds();
      console.log(
        "Audio context initialized, sounds loaded:",
        Array.from(this.sounds.keys())
      );
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  }

  private async loadSounds() {
    const soundFiles = {
      keypress: [
        "./sounds/ui_hacking_charsingle_01.wav",
        "./sounds/ui_hacking_charsingle_02.wav",
        "./sounds/ui_hacking_charsingle_03.wav",
        "./sounds/ui_hacking_charsingle_04.wav",
        "./sounds/ui_hacking_charsingle_05.wav",
        "./sounds/ui_hacking_charsingle_06.wav",
      ],
      scroll_char: [
        "./sounds/ui_hacking_charsingle_01.wav",
        "./sounds/ui_hacking_charsingle_02.wav",
        "./sounds/ui_hacking_charsingle_03.wav",
        "./sounds/ui_hacking_charsingle_04.wav",
      ],
      enter: [
        "./sounds/ui_hacking_charenter_01.wav",
        "./sounds/ui_hacking_charenter_02.wav",
        "./sounds/ui_hacking_charenter_03.wav",
      ],
      scroll: "./sounds/ui_hacking_charscroll.wav",
      scrollLoop: "./sounds/ui_hacking_charscroll_lp.wav",
      powerOn: "./sounds/poweron.mp3",
      powerOff: "./sounds/poweroff.mp3",
    };

    try {
      // Load keypress variations
      for (let i = 0; i < soundFiles.keypress.length; i++) {
        await this.loadSound(`keypress_${i}`, soundFiles.keypress[i]);
      }

      // Load scroll_char variations
      for (let i = 0; i < soundFiles.scroll_char.length; i++) {
        await this.loadSound(`scroll_char_${i}`, soundFiles.scroll_char[i]);
      }

      // Load enter variations
      for (let i = 0; i < soundFiles.enter.length; i++) {
        await this.loadSound(`enter_${i}`, soundFiles.enter[i]);
      }

      // Load other sounds
      await this.loadSound("scroll", soundFiles.scroll);
      await this.loadSound("scrollLoop", soundFiles.scrollLoop);
      await this.loadSound("powerOn", soundFiles.powerOn);
      await this.loadSound("powerOff", soundFiles.powerOff);
    } catch (error) {
      console.error("Failed to load sounds:", error);
    }
  }

  private async loadSound(key: string, url: string) {
    if (!this.context) return;

    try {
      console.log(`Loading sound: ${key} from ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      this.sounds.set(key, {
        key,
        buffer: audioBuffer,
      });
      console.log(`Sound loaded: ${key}`);
    } catch (error) {
      console.error(`Failed to load sound ${key}:`, error);
    }
  }

  private getRandomVariation(baseKey: SoundType, count: number): SoundKey {
    const index = Math.floor(Math.random() * count);
    return `${baseKey}_${index}` as SoundKey;
  }

  public async playSound(type: SoundType) {
    if (!this.context || !this.isEnabled) {
      console.log("Cannot play sound - context or sound disabled", {
        hasContext: !!this.context,
        isEnabled: this.isEnabled,
      });
      return;
    }

    try {
      let soundKey: SoundKey = type;

      if (type === "keypress") {
        soundKey = this.getRandomVariation("keypress", 6);
      } else if (type === "enter") {
        soundKey = this.getRandomVariation("enter", 3);
      } else if (type === "scroll_char") {
        soundKey = this.getRandomVariation("scroll_char", 4);
      }

      console.log(`Playing sound: ${soundKey}`);
      const sound = this.sounds.get(soundKey);
      if (!sound) {
        console.log(`Sound not found: ${soundKey}`);
        return;
      }

      const source = this.context.createBufferSource();
      source.buffer = sound.buffer;
      source.connect(this.context.destination);
      source.start(0);
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  }

  public toggleSound(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Export a singleton instance
export const soundManager = new SoundManager();
