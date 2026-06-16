import { Vector3 } from 'three';
import {
  bossEnemyStats,
  defaultEquippedMoves,
  enemyBaseStats,
  heroBaseStats,
  battleTunables,
  playerChiMoves,
  playerPhysicalMoves,
} from '../config/combatConfig';
import { tweenVector3, wait } from '../core/tween';
import type {
  BattlePhase,
  BattleSnapshot,
  ChiMoveDefinition,
  HeroStats,
  MoveId,
  PhysicalMoveDefinition,
} from '../core/types';
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

  private equippedMoves: MoveId[] = [...defaultEquippedMoves];
  private phase: BattlePhase = 'exploration';
  private logLine = 'Run to the glowing ring.';
  private resetTimer = 0;
  private totalXp = 0;
  private xpGained = 0;
  private level = 1;
  private bossMode = false;

  constructor(deps: BattleDirectorDeps) {
    this.audio = deps.audio;
    this.cameraRig = deps.cameraRig;
    this.enemy = deps.enemy;
    this.hero = deps.hero;
    this.hud = deps.hud;
    this.trigger = deps.trigger;
    this.vfx = deps.vfx;

    this.hud.onMoveSlot((slotIndex) => {
      void this.executeEquippedMove(slotIndex);
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
    this.applyEnemyMode();
    this.hero.faceToward(this.enemy.root.position);
    this.hero.play('battleIdle', { fadeSeconds: 0.12 });
    this.hud.setBattleVisible(true);
    this.hud.update(this.snapshot());
    this.audio.playBattle(this.bossMode);
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

  setBossMode(enabled: boolean): void {
    this.bossMode = enabled;
    this.applyEnemyMode();
    this.hud.update(this.snapshot());
  }

  isBossMode(): boolean {
    return this.bossMode;
  }

  resetEncounter(): void {
    window.clearTimeout(this.resetTimer);
    this.phase = 'resetting';
    this.player.reset();
    this.enemyCombatant.reset();
    this.enemy.reset();
    this.applyEnemyMode();
    this.enemy.root.visible = false;
    this.vfx.setAura(false);
    this.vfx.setFootCharge(false);
    this.hud.setDarkened(false);
    this.hud.hideVictoryResults();
    this.hud.setBattleVisible(false);
    this.audio.stopBattle();
    this.hero.root.position.set(0, 0, 0);
    this.hero.play('explorationIdle');
    this.trigger.reset();
    this.cameraRig.setExploration();
    this.logLine = 'Run to the glowing ring.';
    this.xpGained = 0;
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
      equippedMoves: this.equippedMoves.map((moveId) => this.getEquippedMoveSnapshot(moveId)),
      logLine: this.logLine,
    };
  }

  getPhase(): BattlePhase {
    return this.phase;
  }

  getEquippedMoves(): MoveId[] {
    return [...this.equippedMoves];
  }

  getXpGained(): number {
    return this.xpGained;
  }

  getLevel(): number {
    return this.level;
  }

  setEquippedMove(slot: number, moveId: MoveId): void {
    if (slot < 0 || slot >= this.equippedMoves.length || !this.isKnownMove(moveId)) {
      return;
    }

    this.equippedMoves[slot] = moveId;
    this.hud.update(this.snapshot());
  }

  private async executeEquippedMove(slotIndex: number): Promise<void> {
    const moveId = this.equippedMoves[slotIndex];

    if (moveId in playerPhysicalMoves) {
      await this.executePhysicalMove(playerPhysicalMoves[moveId as keyof typeof playerPhysicalMoves]);
      return;
    }

    if (moveId in playerChiMoves) {
      await this.executeChiMove(playerChiMoves[moveId as keyof typeof playerChiMoves]);
    }
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

  private async executeChiMove(move: ChiMoveDefinition): Promise<void> {
    if (this.phase !== 'awaitingCommand' || this.player.atb < battleTunables.atbMax) {
      return;
    }

    if (!this.player.spendChi(move.chiCost)) {
      this.logLine = 'Not enough Chi.';
      return;
    }

    if (move.id === 'chiBreaker') {
      await this.executeChiBreaker(move);
      return;
    }

    this.phase = 'chiCinematic';
    this.atb.consume(this.player);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(this.player.name, move.name);
    this.hud.setDarkened(true);
    this.vfx.setAura(true, move.kind === 'heal' ? 'healing' : 'chi');
    this.audio.playChiCharge();
    this.hero.play('chi', { loopOnce: true, fadeSeconds: 0.1, timeScale: move.timeScale });
    this.hud.update(this.snapshot());

    await this.cameraRig.focusHeroChi(this.hero.root.position, this.enemy.root.position);
    await wait(move.chargeMs);

    if (move.kind === 'damage') {
      this.hero.play('slam', { loopOnce: true, fadeSeconds: 0.08, timeScale: 1.12 });
    }
    this.hud.pulseFlash();
    const burstPosition = move.kind === 'heal' ? this.hero.root.position.clone().setY(0.95) : this.enemy.root.position;
    this.vfx.burstAt(burstPosition, move.kind === 'heal' ? '#dfffea' : '#f7fbff');
    if (move.kind === 'heal') {
      this.audio.playHealing();
    } else {
      this.audio.playChiImpact();
    }
    if (move.kind === 'damage') {
      this.enemy.flashHit();
    }
    await wait(move.flashMs);

    const result =
      move.kind === 'heal'
        ? this.resolver.resolveChiHealing(this.player, move)
        : this.resolver.resolveChiDamage(this.player, this.enemyCombatant, move);

    this.logLine =
      move.kind === 'heal'
        ? `${move.name} restored ${result.healing ?? 0}.`
        : `${move.name} dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    this.vfx.setAura(false);
    this.hud.setDarkened(false);
    await this.cameraRig.restoreBattleView(this.hero.root.position, this.enemy.root.position);

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    this.hero.play('battleIdle');
    this.phase = 'charging';
  }

  private async executeChiBreaker(move: ChiMoveDefinition): Promise<void> {
    this.phase = 'chiCinematic';
    this.atb.consume(this.player);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(this.player.name, move.name);
    this.hud.setDarkened(true);
    this.hud.update(this.snapshot());

    const finisher = playerPhysicalMoves.lungeSpinKick;
    const enemyPosition = this.enemy.root.position.clone();
    const approachDirection = safeDirection(enemyPosition.clone().sub(this.hero.root.position).setY(0), new Vector3(0, 0, -1));
    const strikePosition = enemyPosition.clone().addScaledVector(approachDirection, -finisher.stopDistance);
    strikePosition.y = 0;

    this.hero.faceToward(enemyPosition);
    this.hero.play('run', { fadeSeconds: 0.1 });
    await tweenVector3(this.hero.root.position, strikePosition, battleTunables.approachDurationMs + 160);

    this.hero.faceToward(this.enemy.root.position);
    this.hero.play('battleIdle', { fadeSeconds: 0.1 });
    this.vfx.setAura(true, 'chi');
    this.vfx.setFootCharge(true);
    this.audio.playChiCharge();
    await this.cameraRig.frameChiBreakerCharge(this.hero.root.position, this.enemy.root.position);
    await wait(Math.max(move.chargeMs, 1050));

    this.hero.faceToward(this.enemy.root.position);
    this.hero.play('lungeSpinKick', { loopOnce: true, fadeSeconds: 0.08, timeScale: move.timeScale });
    const impactCamera = this.cameraRig.frameChiBreakerImpact(this.hero.root.position, this.enemy.root.position);
    await wait(760);
    await impactCamera;

    this.hud.pulseFlash();
    this.audio.playChiImpact();
    this.vfx.burstAt(this.enemy.root.position, '#f7fbff');
    this.enemy.flashHit();

    const result = this.resolver.resolveChiDamage(this.player, this.enemyCombatant, move);
    this.logLine = `${move.name} dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    await wait(move.flashMs + 420);
    this.vfx.setFootCharge(false);
    this.vfx.setAura(false);
    this.hud.setDarkened(false);

    this.hero.play('run', { fadeSeconds: 0.12 });
    this.hero.faceToward(this.heroAnchor);
    await tweenVector3(this.hero.root.position, this.heroAnchor, battleTunables.returnDurationMs + 120);
    this.hero.faceToward(this.enemy.root.position);
    this.hero.play('battleIdle');

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    await this.cameraRig.restoreBattleView(this.hero.root.position, this.enemy.root.position);
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
    this.hero.play('battleIdle');
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
    this.xpGained = this.calculateXpReward();
    this.totalXp += this.xpGained;
    const previousLevel = this.level;
    this.level += 1;
    this.enemy.root.visible = false;
    this.hud.update(this.snapshot());
    this.hud.showVictoryResults(this.xpGained, this.totalXp, previousLevel, this.level);
    this.audio.playVictory();
    this.audio.playLevelUp();
    window.dispatchEvent(new CustomEvent('rpg:victory'));
    await Promise.all([
      this.animator.heroVictory(this.hero),
      this.cameraRig.victorySequence(this.hero.root.position, this.enemy.root.position),
    ]);

    this.resetTimer = window.setTimeout(() => {
      this.resetEncounter();
    }, battleTunables.victoryHoldMs);
  }

  private calculateXpReward(): number {
    const bossBonus = this.bossMode ? 260 : 0;
    return Math.round(120 + bossBonus + this.enemyCombatant.maxHp * 0.25 + this.player.hp * 0.1);
  }

  private applyEnemyMode(): void {
    this.enemy.setBossMode(this.bossMode);
    this.enemyCombatant.setStats(this.bossMode ? bossEnemyStats : enemyBaseStats);
  }

  private getEquippedMoveSnapshot(moveId: MoveId) {
    const physicalMove = playerPhysicalMoves[moveId as keyof typeof playerPhysicalMoves];
    if (physicalMove) {
      return {
        id: physicalMove.id,
        name: physicalMove.name,
        chiCost: 0,
      };
    }

    const chiMove = playerChiMoves[moveId as keyof typeof playerChiMoves];
    return {
      id: chiMove.id,
      name: chiMove.name,
      chiCost: chiMove.chiCost,
    };
  }

  private isKnownMove(moveId: MoveId): boolean {
    return moveId in playerPhysicalMoves || moveId in playerChiMoves;
  }
}

function safeDirection(direction: Vector3, fallback: Vector3): Vector3 {
  if (direction.lengthSq() < 0.0001) {
    return fallback.clone().normalize();
  }

  return direction.normalize();
}
