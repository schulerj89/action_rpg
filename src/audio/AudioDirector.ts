import {
  battleMusicAsset,
  bossMusicAsset,
  chiChargeSfxAsset,
  chiImpactSfxAsset,
  healingSfxAsset,
  levelUpSfxAsset,
  victoryMusicAsset,
} from '../config/assets';

export class AudioDirector {
  private readonly battleMusic = new Audio(battleMusicAsset.url);
  private readonly bossMusic = new Audio(bossMusicAsset.url);
  private readonly victoryMusic = new Audio(victoryMusicAsset.url);
  private readonly chiChargeSfx = new Audio(chiChargeSfxAsset.url);
  private readonly chiImpactSfx = new Audio(chiImpactSfxAsset.url);
  private readonly healingSfx = new Audio(healingSfxAsset.url);
  private readonly levelUpSfx = new Audio(levelUpSfxAsset.url);
  private muted = false;
  private pendingTrack?: HTMLAudioElement;
  private status = 'idle';

  constructor() {
    this.configureTrack(this.battleMusic, true, 0.38);
    this.configureTrack(this.bossMusic, true, 0.42);
    this.configureTrack(this.victoryMusic, false, 0.56);
    this.configureSfx(this.chiChargeSfx, 0.58);
    this.configureSfx(this.chiImpactSfx, 0.62);
    this.configureSfx(this.healingSfx, 0.66);
    this.configureSfx(this.levelUpSfx, 0.72);
    window.addEventListener('pointerdown', this.resumePendingMusic, { capture: true });
    window.addEventListener('keydown', this.resumePendingMusic, { capture: true });
  }

  playBattle(isBossBattle = false): void {
    const track = isBossBattle ? this.bossMusic : this.battleMusic;
    this.playTrack(track, isBossBattle ? 'boss music' : 'battle music');
  }

  playVictory(): void {
    this.playTrack(this.victoryMusic, 'victory song');
  }

  playChiCharge(): void {
    this.playSfx(this.chiChargeSfx);
  }

  playChiImpact(): void {
    this.playSfx(this.chiImpactSfx);
  }

  playHealing(): void {
    this.playSfx(this.healingSfx);
  }

  playLevelUp(): void {
    this.playSfx(this.levelUpSfx);
  }

  stopBattle(): void {
    this.pendingTrack = undefined;
    this.stopAllTracks();
    this.status = this.muted ? 'muted' : 'idle';
  }

  mute(): void {
    this.muted = true;
    this.stopBattle();
  }

  getStatus(): string {
    return this.status;
  }

  private configureTrack(track: HTMLAudioElement, loop: boolean, volume: number): void {
    track.loop = loop;
    track.volume = volume;
    track.preload = 'auto';
  }

  private configureSfx(track: HTMLAudioElement, volume: number): void {
    track.loop = false;
    track.volume = volume;
    track.preload = 'auto';
  }

  private playTrack(track: HTMLAudioElement, label: string): void {
    this.stopAllTracks();

    if (this.muted) {
      this.status = 'muted';
      return;
    }

    track.currentTime = 0;
    const playPromise = track.play();
    this.pendingTrack = track;
    this.status = label;

    playPromise
      .then(() => {
        this.pendingTrack = undefined;
      })
      .catch(() => {
        this.status = `${label} waiting for user gesture`;
      });
  }

  private stopAllTracks(): void {
    [this.battleMusic, this.bossMusic, this.victoryMusic].forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
  }

  private playSfx(track: HTMLAudioElement): void {
    if (this.muted) {
      return;
    }

    track.pause();
    track.currentTime = 0;
    void track.play().catch(() => undefined);
  }

  private readonly resumePendingMusic = (): void => {
    if (this.muted || !this.pendingTrack) {
      return;
    }

    const playPromise = this.pendingTrack.play();
    playPromise
      .then(() => {
        this.pendingTrack = undefined;
      })
      .catch(() => {
        this.status = `${this.status} waiting for user gesture`;
      });
  };
}
