// src/utils/SoundManager.ts
export class SoundManager {
  private flipSound: HTMLAudioElement | null = null;

  constructor() {
    // Preload sounds
    this.flipSound = new Audio("path/to/flip-sound.mp3");
    this.flipSound.preload = "auto";
  }

  playFlipSound(): void {
    if (this.flipSound) {
      this.flipSound.currentTime = 0;
      this.flipSound.play().catch(() => {
        // Handle autoplay restrictions
      });
    }
  }
}
