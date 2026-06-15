import { battleMusicAsset } from '../config/assets';

export class AudioDirector {
  private readonly battleMusic = new Audio(battleMusicAsset.url);
  private audioContext?: AudioContext;
  private muted = false;
  private pendingBattleMusic = false;
  private victoryTimers: number[] = [];
  private status = 'idle';

  constructor() {
    this.battleMusic.loop = true;
    this.battleMusic.volume = 0.38;
    this.battleMusic.preload = 'auto';
    window.addEventListener('pointerdown', this.resumePendingMusic, { capture: true });
    window.addEventListener('keydown', this.resumePendingMusic, { capture: true });
  }

  playBattle(): void {
    if (this.muted) {
      this.status = 'muted';
      return;
    }

    this.stopVictoryFanfare();
    this.pendingBattleMusic = true;
    this.battleMusic.currentTime = 0;
    const playPromise = this.battleMusic.play();
    this.status = 'playing';

    playPromise.catch(() => {
      this.status = 'waiting for user gesture';
      this.pendingBattleMusic = true;
    });

    playPromise.then(() => {
      this.pendingBattleMusic = false;
    });
  }

  stopBattle(): void {
    this.pendingBattleMusic = false;
    this.stopVictoryFanfare();
    this.battleMusic.pause();
    this.battleMusic.currentTime = 0;
    this.status = this.muted ? 'muted' : 'idle';
  }

  playVictory(): void {
    this.pendingBattleMusic = false;
    this.battleMusic.pause();

    if (this.muted) {
      this.status = 'muted';
      return;
    }

    this.stopVictoryFanfare();
    this.status = 'victory fanfare';

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      this.status = 'victory';
      return;
    }

    this.audioContext ??= new AudioContextCtor();
    const context = this.audioContext;
    const notes = [
      { frequency: 523.25, start: 0, duration: 0.18 },
      { frequency: 659.25, start: 0.18, duration: 0.18 },
      { frequency: 783.99, start: 0.36, duration: 0.22 },
      { frequency: 1046.5, start: 0.62, duration: 0.42 },
      { frequency: 1318.51, start: 1.03, duration: 0.55 },
    ];

    context.resume().catch(() => {
      this.status = 'victory waiting for user gesture';
    });

    notes.forEach((note) => {
      const timer = window.setTimeout(() => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.value = note.frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + note.duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + note.duration + 0.02);
      }, note.start * 1000);
      this.victoryTimers.push(timer);
    });
  }

  mute(): void {
    this.muted = true;
    this.stopVictoryFanfare();
    this.stopBattle();
  }

  getStatus(): string {
    return this.status;
  }

  private readonly resumePendingMusic = (): void => {
    if (this.muted || !this.pendingBattleMusic) {
      return;
    }

    const playPromise = this.battleMusic.play();
    this.status = 'playing';
    playPromise
      .then(() => {
        this.pendingBattleMusic = false;
      })
      .catch(() => {
        this.status = 'waiting for user gesture';
      });
  };

  private stopVictoryFanfare(): void {
    this.victoryTimers.forEach((timer) => {
      window.clearTimeout(timer);
    });
    this.victoryTimers = [];
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
