export class AudioManager {
  private static instance: AudioManager;
  private sounds: Record<string, HTMLAudioElement> = {};

  private constructor() {
    this.sounds['complete'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Placeholder bell sound
    this.sounds['click'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Placeholder click
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public play(soundName: string) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Audio play failed', e));
    }
  }
}

export const playNotification = () => AudioManager.getInstance().play('complete');
export const playClick = () => AudioManager.getInstance().play('click');
