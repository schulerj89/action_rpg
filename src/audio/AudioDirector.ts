import {
  battleMusicAsset,
  bossMusicAsset,
  chiBreakerChargeLoopSfxAsset,
  chiBreakerChargeStartSfxAsset,
  chiChargeSfxAsset,
  chiImpactSfxAsset,
  healingSfxAsset,
  enemyImpactSfxAsset,
  kickImpactSfxAsset,
  levelUpSfxAsset,
  punchImpactSfxAsset,
  victoryMusicAsset,
} from '../config/assets';
import type { PhysicalMoveId } from '../core/types';

export class AudioDirector {
  private readonly battleMusic = new Audio(battleMusicAsset.url);
  private readonly bossMusic = new Audio(bossMusicAsset.url);
  private readonly victoryMusic = new Audio(victoryMusicAsset.url);
  private readonly chiChargeSfx = new Audio(chiChargeSfxAsset.url);
  private readonly chiBreakerChargeStartSfx = new Audio(chiBreakerChargeStartSfxAsset.url);
  private readonly chiBreakerChargeLoop = new Audio(chiBreakerChargeLoopSfxAsset.url);
  private readonly chiImpactSfx = new Audio(chiImpactSfxAsset.url);
  private readonly healingSfx = new Audio(healingSfxAsset.url);
  private readonly levelUpSfx = new Audio(levelUpSfxAsset.url);
  private readonly punchImpactSfx = new Audio(punchImpactSfxAsset.url);
  private readonly kickImpactSfx = new Audio(kickImpactSfxAsset.url);
  private readonly enemyImpactSfx = new Audio(enemyImpactSfxAsset.url);
  private muted = false;
  private pendingTrack?: HTMLAudioElement;
  private status = 'idle';

  constructor() {
    this.configureTrack(this.battleMusic, true, 0.38);
    this.configureTrack(this.bossMusic, true, 0.42);
    this.configureTrack(this.victoryMusic, false, 0.56);
    this.configureSfx(this.chiChargeSfx, 0.58);
    this.configureSfx(this.chiBreakerChargeStartSfx, 0.54);
    this.configureLoopedSfx(this.chiBreakerChargeLoop, 0.38, 0.88);
    this.configureSfx(this.chiImpactSfx, 0.62);
    this.configureSfx(this.healingSfx, 0.66);
    this.configureSfx(this.levelUpSfx, 0.72);
    this.configureSfx(this.punchImpactSfx, 0.62);
    this.configureSfx(this.kickImpactSfx, 0.68);
    this.configureSfx(this.enemyImpactSfx, 0.58);
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

  startChiBreakerCharge(): void {
    this.playSfx(this.chiBreakerChargeStartSfx);
    this.playLoopedSfx(this.chiBreakerChargeLoop);
  }

  stopChiBreakerCharge(): void {
    this.stopSfx(this.chiBreakerChargeStartSfx);
    this.stopSfx(this.chiBreakerChargeLoop);
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

  playPhysicalImpact(moveId: PhysicalMoveId): void {
    this.playSfx(isKickMove(moveId) ? this.kickImpactSfx : this.punchImpactSfx);
  }

  playEnemyImpact(): void {
    this.playSfx(this.enemyImpactSfx);
  }

  stopBattle(): void {
    this.pendingTrack = undefined;
    this.stopAllSfx();
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

  private configureLoopedSfx(track: HTMLAudioElement, volume: number, playbackRate = 1): void {
    track.loop = true;
    track.volume = volume;
    track.playbackRate = playbackRate;
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

  private playLoopedSfx(track: HTMLAudioElement): void {
    if (this.muted) {
      return;
    }

    track.pause();
    track.currentTime = 0;
    void track.play().catch(() => undefined);
  }

  private stopSfx(track: HTMLAudioElement): void {
    track.pause();
    track.currentTime = 0;
  }

  private stopAllSfx(): void {
    [
      this.chiChargeSfx,
      this.chiBreakerChargeStartSfx,
      this.chiBreakerChargeLoop,
      this.chiImpactSfx,
      this.healingSfx,
      this.levelUpSfx,
      this.punchImpactSfx,
      this.kickImpactSfx,
      this.enemyImpactSfx,
    ].forEach((track) => {
      this.stopSfx(track);
    });
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

function isKickMove(moveId: PhysicalMoveId): boolean {
  return moveId === 'dragonHeel' || moveId === 'craneHighKick' || moveId === 'sweepKick' || moveId === 'lungeSpinKick';
}
