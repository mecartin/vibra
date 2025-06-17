import { Howl } from 'howler';

class SoundManager {
  private sounds: { [key: string]: Howl };
  private enabled: boolean = true;

  constructor() {
    this.sounds = {};
    
    // Define sound files - these will fail gracefully if not found
    const soundFiles = {
      type: '/sounds/type.mp3',
      submit: '/sounds/submit.mp3',
      transition: '/sounds/transition.mp3',
      success: '/sounds/success.mp3',
      hover: '/sounds/hover.mp3',
      favorite: '/sounds/favorite.mp3',
      click: '/sounds/click.mp3',
      loading: '/sounds/loading.mp3',
      error: '/sounds/error.mp3'
    };

    // Initialize sounds with error handling
    Object.entries(soundFiles).forEach(([name, src]) => {
      this.sounds[name] = new Howl({
        src: [src],
        volume: 0.3,
        onloaderror: () => {
          console.warn(`Sound file not found: ${src}`);
        }
      });
    });
  }

  play(soundName: string) {
    if (this.enabled && this.sounds[soundName]) {
      try {
        this.sounds[soundName].play();
      } catch (error) {
        console.warn(`Could not play sound: ${soundName}`);
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();