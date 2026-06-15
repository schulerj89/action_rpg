import { Vector3 } from 'three';
import {
  enemyBaseStats,
  heroBaseStats,
  battleTunables,
  playerPhysicalMoves,
} from '../config/combatConfig';
import { wait } from '../core/tween';
import type { BattlePhase, BattleSnapshot, HeroStats, PhysicalMoveDefinition } from '../core/types';
import type { AudioDirector } from '../audio/AudioDirector';
import type { EnemyShape } from '../entities/EnemyShape';
import type { HeroCharacter } from '../entities/HeroCharacter';
import type { BattleHud } from '../ui/BattleHud';
import type { VfxController } from '../vfx/VfxController';
import type { CameraRig } from '../world/CameraRig';
import type { EncounterTrigger } from '../world/EncounterTrigger';
import { ActionResolver } from './ActionResolver';
import { ATBController } from './ATBController';
import { BattleAnimator } from './BattleAnimator';
import { Combatant } from './Combatant';

interface BattleDirectorDeps {
  audio: AudioDirector;
  cameraRig: CameraRig;
  enemy: EnemyShape;
  hero: HeroCharacter;
  hud: BattleHud;
  trigger: EncounterTrigger;
  vfx: VfxController;
}

export class BattleDirector {
  readonly player = new Combatant('Ryuji Vale', heroBaseStats);
  readonly enemyCombatant = new Combatant('Crimson Training Core', enemyBaseStats);

  private readonly audio: AudioDirector;
  private readonly cameraRig: CameraRig;
  private readonly enemy: EnemyShape;
  private readonly hero: HeroCharacter;
  private readonly hud: BattleHud;
  private readonly trigger: EncounterTrigger;
  private readonly vfx: VfxController;
  private readonly atb = new ATBController(battleTunables);
  private readonly resolver = new ActionResolver(battleTunables);
  private readonly animator = new BattleAnimator(battleTunables);
  private readonly heroAnchor = new Vector3(0, 0, -5.8);
  private readonly enemyAnchor = new Vector3(0, 1.05, -12);

  private phase: BattlePhase = 'exploration';
  private logLine = 'Run to the glowing ring.';
  private resetTimer = 0;

  constructor(deps: BattleDirectorDeps) {
    this.audio = deps.audio;
    this.cameraRig = deps.cameraRig;
    this.enemy = deps.enemy;
    this.hero = deps.hero;
    this.hud = deps.hud;
    this.trigger = deps.trigger;
    this.vfx = deps.vfx;

    this.hud.onAttack(() => {
      void this.executePhysicalMove(playerPhysicalMoves.ironPalm);
    });
    this.hud.onKick(() => {
      void this.executePhysicalMove(playerPhysicalMoves.dragonHeel);
    });
    this.hud.onChi(() => {
      void this.executeChi();
    });
    this.hud.onReset(() => {
      this.resetEncounter();
    });
    this.hud.update(this.snapshot());
  }

  update(deltaSeconds: number): void {
    if (this.phase === 'charging' || this.phase === 'awaitingCommand') {
      this.atb.update(deltaSeconds, this.player, this.enemyCombatant);

      if (this.enemyCombatant.atb >= battleTunables.atbMax && this.player.atb < battleTunables.atbMax) {
        void this.executeEnemyAction();
      } else if (this.player.atb >= battleTunables.atbMax) {
        this.phase = 'awaitingCommand';
        this.logLine = 'Ryuji is ready.';
      } else {
        this.phase = 'charging';
        this.logLine = 'ATB charging...';
      }
    }

    this.hud.update(this.snapshot());
  }

  async startBattle(): Promise<void> {
    if (this.phase !== 'exploration') {
      return;
    }

    this.phase = 'intro';
    this.logLine = 'Battle start.';
    this.player.atb = 0;
    this.enemyCombatant.atb = 0;
    this.hero.root.position.copy(this.heroAnchor);
    this.enemy.root.position.copy(this.enemyAnchor);
    this.enemy.root.visible = true;
    this.hero.faceToward(this.enemy.root.position);
    this.hud.setBattleVisible(true);
    this.hud.update(this.snapshot());
    this.audio.playBattle();
    window.dispatchEvent(new CustomEvent('rpg:battle-start'));

    await this.cameraRig.transitionToBattle(this.hero.root.position, this.enemy.root.position);

    if (this.phase === 'intro') {
      this.phase = 'charging';
    }
  }

  updatePlayerStat(key: keyof HeroStats, value: number): void {
    this.player.setStats({
      ...this.player.stats,
      [key]: value,
    });
  }

  forceReady(): void {
    if (this.phase !== 'intro' && this.phase !== 'charging' && this.phase !== 'awaitingCommand') {
      return;
    }

    this.atb.forceReady(this.player);
  }

  forceEnemyReady(): void {
    if (this.phase !== 'charging' && this.phase !== 'awaitingCommand') {
      return;
    }

    this.atb.forceReady(this.enemyCombatant);
  }

  setEnemyHp(value: number): void {
    this.enemyCombatant.setHp(value);
  }

  resetEncounter(): void {
    window.clearTimeout(this.resetTimer);
    this.phase = 'resetting';
    this.player.reset();
    this.enemyCombatant.reset();
    this.enemy.reset();
    this.vfx.setAura(false);
    this.hud.setDarkened(false);
    this.hud.setBattleVisible(false);
    this.audio.stopBattle();
    this.hero.root.position.set(0, 0, 0);
    this.hero.play('idle');
    this.trigger.reset();
    this.cameraRig.setExploration();
    this.logLine = 'Run to the glowing ring.';
    this.phase = 'exploration';
    window.dispatchEvent(new CustomEvent('rpg:reset'));
  }

  snapshot(): BattleSnapshot {
    const canAct = this.phase === 'awaitingCommand' && this.player.atb >= battleTunables.atbMax;
    return {
      phase: this.phase,
      player: this.player.snapshot(),
      enemy: this.enemyCombatant.snapshot(),
      canAct,
      logLine: this.logLine,
    };
  }

  getPhase(): BattlePhase {
    return this.phase;
  }

  private async executePhysicalMove(move: PhysicalMoveDefinition): Promise<void> {
    if (this.phase !== 'awaitingCommand' || this.player.atb < battleTunables.atbMax) {
      return;
    }

    this.phase = 'playerAction';
    this.atb.consume(this.player);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(this.player.name, move.name);
    this.hud.update(this.snapshot());

    await this.animator.heroPhysicalMove(this.hero, this.enemy.root.position, this.heroAnchor, move, () => {
      const result = this.resolver.resolvePhysicalMove(this.player, this.enemyCombatant, move);
      this.enemy.flashHit();
      this.vfx.burstAt(this.enemy.root.position);
      this.logLine = `${move.name} dealt ${result.damage}.`;
      window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));
    });

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    this.phase = 'charging';
  }

  private async executeChi(): Promise<void> {
    if (this.phase !== 'awaitingCommand' || this.player.atb < battleTunables.atbMax) {
      return;
    }

    if (!this.player.spendChi(battleTunables.chiCost)) {
      this.logLine = 'Not enough Chi.';
      return;
    }

    this.phase = 'chiCinematic';
    this.atb.consume(this.player);
    this.logLine = 'Chi Breaker.';
    this.hud.showMoveBanner(this.player.name, 'Chi Breaker');
    this.hud.setDarkened(true);
    this.vfx.setAura(true);
    this.hero.play('chi', { loopOnce: true, fadeSeconds: 0.1, timeScale: 0.92 });
    this.hud.update(this.snapshot());

    await this.cameraRig.focusHeroFace(this.hero.root.position, this.enemy.root.position);
    await wait(battleTunables.chiChargeMs);

    this.hero.play('slam', { loopOnce: true, fadeSeconds: 0.08, timeScale: 1.12 });
    this.hud.pulseFlash();
    this.vfx.burstAt(this.enemy.root.position);
    this.enemy.flashHit();
    await wait(battleTunables.chiFlashMs);

    const result = this.resolver.resolveChi(this.player, this.enemyCombatant);
    this.logLine = `Chi Breaker dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    this.vfx.setAura(false);
    this.hud.setDarkened(false);
    await this.cameraRig.restoreBattleView(this.hero.root.position, this.enemy.root.position);

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    this.hero.play('idle');
    this.phase = 'charging';
  }

  private async executeEnemyAction(): Promise<void> {
    if (this.phase !== 'charging') {
      return;
    }

    this.phase = 'enemyAction';
    this.atb.consume(this.enemyCombatant);
    this.logLine = 'Pulse Ram.';
    this.hud.showMoveBanner(this.enemyCombatant.name, 'Pulse Ram');

    await this.animator.enemyAttack(this.enemy, this.hero.root.position, this.enemyAnchor, () => {
      const result = this.resolver.resolveEnemyAttack(this.enemyCombatant, this.player);
      this.hero.play('hit', { loopOnce: true, fadeSeconds: 0.08, timeScale: 1.1 });
      this.logLine = `Counter dealt ${result.damage}.`;
      window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));
    });

    this.hero.faceToward(this.enemy.root.position);
    this.hero.play('idle');
    this.phase = this.player.hp <= 0 ? 'resetting' : 'charging';

    if (this.player.hp <= 0) {
      this.logLine = 'Ryuji was knocked down. Resetting.';
      await wait(900);
      this.resetEncounter();
    }
  }

  private async enterVictory(): Promise<void> {
    this.phase = 'victory';
    this.logLine = 'Victory.';
    this.enemy.root.visible = false;
    this.hud.update(this.snapshot());
    this.audio.playVictory();
    window.dispatchEvent(new CustomEvent('rpg:victory'));
    await Promise.all([
      this.animator.heroVictory(this.hero),
      this.cameraRig.victorySequence(this.hero.root.position, this.enemy.root.position),
    ]);

    this.resetTimer = window.setTimeout(() => {
      this.resetEncounter();
    }, battleTunables.victoryHoldMs);
  }
}
