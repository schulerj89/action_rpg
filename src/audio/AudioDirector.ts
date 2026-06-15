import { battleMusicAsset } from '../config/assets';

export class AudioDirector {
  private readonly battleMusic = new Audio(battleMusicAsset.url);
  private muted = false;
  private pendingBattleMusic = false;
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
    this.battleMusic.pause();
    this.battleMusic.currentTime = 0;
    this.status = this.muted ? 'muted' : 'idle';
  }

  mute(): void {
    this.muted = true;
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
}
