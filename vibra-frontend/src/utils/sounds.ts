import { Howl } from 'howler';

class SoundManager {
  private sounds: { [key: string]: Howl };

  constructor() {
    this.sounds = {
      type: new Howl({
        src: ['/sounds/type.mp3'],
        volume: 0.3,
        rate: 1.5
      }),
      submit: new Howl({
        src: ['/sounds/submit.mp3'],
        volume: 0.5
      }),
      transition: new Howl({
        src: ['/sounds/transition.mp3'],
        volume: 0.4
      }),
      success: new Howl({
        src: ['/sounds/success.mp3'],
        volume: 0.5
      }),
      hover: new Howl({
        src: ['/sounds/hover.mp3'],
        volume: 0.2,
        rate: 2
      }),
      favorite: new Howl({
        src: ['/sounds/favorite.mp3'],
        volume: 0.4
      })
    };
  }

  play(soundName: string) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }
}

export const soundManager = new SoundManager();