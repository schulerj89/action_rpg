import { Vector3 } from 'three';
import {
  bossEnemyStats,
  enemyBaseStats,
  battleTunables,
  playerChiMoves,
  playerPhysicalMoves,
} from '../config/combatConfig';
import { tweenVector3, wait } from '../core/tween';
import type {
  BattlePhase,
  BattleSnapshot,
  CharacterRewardSummary,
  ChiMoveDefinition,
  HeroStats,
  LevelUpGain,
  MoveBannerTone,
  MoveId,
  PhysicalMoveDefinition,
  StatKey,
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

export interface BattlePartyMemberConfig {
  active: boolean;
  allowedMoves: MoveId[];
  anchor: Vector3;
  character: HeroCharacter;
  defaultMoves: MoveId[];
  id: string;
  name: string;
  portraitUrl: string;
  role: string;
  stats: HeroStats;
}

export interface PartyDebugOption {
  active: boolean;
  allowedMoves: MoveId[];
  equippedMoves: MoveId[];
  id: string;
  name: string;
  role: string;
  stats: HeroStats;
}

interface PartyActor {
  active: boolean;
  allowedMoves: MoveId[];
  anchor: Vector3;
  baseStats: HeroStats;
  character: HeroCharacter;
  combatant: Combatant;
  equippedMoves: MoveId[];
  id: string;
  lastXpGained: number;
  level: number;
  name: string;
  portraitUrl: string;
  role: string;
  xp: number;
}

interface BattleDirectorDeps {
  audio: AudioDirector;
  cameraRig: CameraRig;
  enemy: EnemyShape;
  hud: BattleHud;
  party: BattlePartyMemberConfig[];
  resetPosition: Vector3;
  trigger: EncounterTrigger;
  vfx: VfxController;
}

export class BattleDirector {
  readonly player: Combatant;
  readonly enemyCombatant = new Combatant('Crimson Training Core', enemyBaseStats);

  private readonly audio: AudioDirector;
  private readonly cameraRig: CameraRig;
  private readonly enemy: EnemyShape;
  private readonly hero: HeroCharacter;
  private readonly hud: BattleHud;
  private readonly resetPosition: Vector3;
  private readonly trigger: EncounterTrigger;
  private readonly vfx: VfxController;
  private readonly atb = new ATBController(battleTunables);
  private readonly resolver = new ActionResolver(battleTunables);
  private readonly animator = new BattleAnimator(battleTunables);
  private readonly enemyAnchor = new Vector3(0, 1.05, -31.5);
  private readonly partyActors: PartyActor[];
  private readonly playerActor: PartyActor;
  private readonly spellStart = new Vector3();

  private activeActorId?: string;
  private actionCount = 0;
  private phase: BattlePhase = 'exploration';
  private logLine = 'Run to the glowing ring.';
  private resetTimer = 0;
  private xpGained = 0;
  private level = 1;
  private bossMode = false;

  constructor(deps: BattleDirectorDeps) {
    this.audio = deps.audio;
    this.cameraRig = deps.cameraRig;
    this.enemy = deps.enemy;
    this.hud = deps.hud;
    this.resetPosition = deps.resetPosition.clone();
    this.trigger = deps.trigger;
    this.vfx = deps.vfx;
    this.partyActors = deps.party.map((member) => ({
      active: member.active,
      allowedMoves: [...member.allowedMoves],
      anchor: member.anchor.clone(),
      baseStats: { ...member.stats },
      character: member.character,
      combatant: new Combatant(member.name, member.stats),
      equippedMoves: [...member.defaultMoves],
      id: member.id,
      lastXpGained: 0,
      level: 1,
      name: member.name,
      portraitUrl: member.portraitUrl,
      role: member.role,
      xp: 0,
    }));

    const playerActor = this.partyActors[0];
    if (!playerActor) {
      throw new Error('Battle party requires a leader.');
    }

    this.playerActor = playerActor;
    this.player = playerActor.combatant;
    this.hero = playerActor.character;

    this.hud.onMoveSlot((slotIndex) => {
      void this.executeEquippedMove(slotIndex);
    });
    this.hud.onReset(() => {
      this.resetEncounter();
    });
    this.hud.onGameOverReturn(() => {
      this.resetEncounter();
    });
    this.hud.update(this.snapshot());
  }

  update(deltaSeconds: number): void {
    if (this.phase === 'charging' || this.phase === 'awaitingCommand') {
      const activeParty = this.getActiveLivingActors();
      this.atb.update(
        deltaSeconds,
        activeParty.map((actor) => actor.combatant),
        this.enemyCombatant,
      );

      const lockedActor = this.getActiveActor();
      if (lockedActor?.active && lockedActor.combatant.atb >= battleTunables.atbMax) {
        this.phase = 'awaitingCommand';
        this.logLine = `${lockedActor.name} is ready.`;
      } else {
        const readyActor = activeParty.find((actor) => actor.combatant.atb >= battleTunables.atbMax);
        if (readyActor) {
          this.activeActorId = readyActor.id;
          this.phase = 'awaitingCommand';
          this.logLine = `${readyActor.name} is ready.`;
        } else if (this.enemyCombatant.atb >= battleTunables.atbMax) {
          void this.executeEnemyAction();
        } else {
          this.activeActorId = undefined;
          this.phase = 'charging';
          this.logLine = 'ATB charging...';
        }
      }
    }

    this.hud.update(this.snapshot());
  }

  async startBattle(): Promise<void> {
    if (this.phase !== 'exploration') {
      return;
    }

    this.phase = 'intro';
    this.activeActorId = undefined;
    this.logLine = 'Battle start.';
    this.partyActors.forEach((actor) => {
      actor.combatant.atb = 0;
      if (!actor.active) {
        return;
      }
      actor.character.root.position.copy(actor.anchor);
      actor.character.faceToward(this.enemyAnchor);
      actor.character.play('battleIdle', { fadeSeconds: 0.12 });
    });
    this.enemyCombatant.atb = 0;
    this.enemy.root.position.copy(this.enemyAnchor);
    this.enemy.root.visible = true;
    this.applyEnemyMode();
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
    this.updateHeroStat(this.playerActor.id, key, value);
  }

  updateHeroStat(heroId: string, key: keyof HeroStats, value: number): void {
    const actor = this.getActor(heroId);
    if (!actor) {
      return;
    }

    actor.baseStats = {
      ...actor.baseStats,
      [key]: value,
    };
    actor.combatant.setStats(actor.baseStats);
    this.hud.update(this.snapshot());
  }

  forceReady(heroId = this.playerActor.id): void {
    if (this.phase !== 'intro' && this.phase !== 'charging' && this.phase !== 'awaitingCommand') {
      return;
    }

    const actor = this.getActor(heroId);
    if (!actor?.active || actor.combatant.hp <= 0) {
      return;
    }

    this.atb.forceReady(actor.combatant);
    this.activeActorId = actor.id;
    this.phase = 'awaitingCommand';
    this.logLine = `${actor.name} is ready.`;
    this.hud.update(this.snapshot());
  }

  forceEnemyReady(): void {
    if (this.phase !== 'charging' && this.phase !== 'awaitingCommand') {
      return;
    }

    this.atb.forceReady(this.enemyCombatant);
    void this.executeEnemyAction();
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
    this.activeActorId = undefined;
    this.partyActors.forEach((actor) => {
      actor.combatant.reset();
      actor.combatant.setStats(actor.baseStats);
      actor.combatant.atb = 0;
      actor.character.play('explorationIdle');
    });
    this.enemyCombatant.reset();
    this.enemy.reset();
    this.applyEnemyMode();
    this.enemy.root.visible = false;
    this.vfx.setAura(false);
    this.vfx.setFootCharge(false);
    this.audio.stopChiBreakerCharge();
    this.hud.setDarkened(false);
    this.hud.hideVictoryResults();
    this.hud.hideGameOver();
    this.hud.setBattleVisible(false);
    this.audio.stopBattle();
    this.hero.root.position.copy(this.resetPosition);
    this.trigger.reset();
    this.cameraRig.setExploration();
    this.logLine = 'Run to the glowing ring.';
    this.xpGained = 0;
    this.phase = 'exploration';
    window.dispatchEvent(new CustomEvent('rpg:reset'));
  }

  snapshot(): BattleSnapshot {
    const activeActor = this.getActiveActor();
    const activeMovesActor = activeActor ?? this.playerActor;
    const canAct =
      this.phase === 'awaitingCommand' &&
      Boolean(activeActor) &&
      activeActor!.combatant.atb >= battleTunables.atbMax;

    return {
      phase: this.phase,
      player: this.player.snapshot(),
      party: this.partyActors.map((actor) => ({
        ...actor.combatant.snapshot(),
        active: actor.active,
        canAct: canAct && actor.id === activeActor?.id,
        equippedMoves: actor.equippedMoves.map((moveId) => this.getEquippedMoveSnapshot(moveId)),
        id: actor.id,
        lastXpGained: actor.lastXpGained,
        level: actor.level,
        portraitUrl: actor.portraitUrl,
        role: actor.role,
        xp: actor.xp,
      })),
      enemy: this.enemyCombatant.snapshot(),
      canAct,
      activeActorId: activeActor?.id,
      equippedMoves: activeMovesActor.equippedMoves.map((moveId) => this.getEquippedMoveSnapshot(moveId)),
      logLine: this.logLine,
    };
  }

  getPhase(): BattlePhase {
    return this.phase;
  }

  getEquippedMoves(heroId = this.playerActor.id): MoveId[] {
    return [...(this.getActor(heroId)?.equippedMoves ?? this.playerActor.equippedMoves)];
  }

  getPartyDebugOptions(): PartyDebugOption[] {
    return this.partyActors.map((actor) => ({
      active: actor.active,
      allowedMoves: [...actor.allowedMoves],
      equippedMoves: [...actor.equippedMoves],
      id: actor.id,
      name: actor.name,
      role: actor.role,
      stats: { ...actor.baseStats },
    }));
  }

  getActingActorId(): string | undefined {
    return this.phase === 'playerAction' || this.phase === 'chiCinematic' ? this.activeActorId : undefined;
  }

  getVfxCharacter(): HeroCharacter {
    return this.getActiveActor()?.character ?? this.hero;
  }

  getPartyAnchor(heroId: string, target = new Vector3()): Vector3 | undefined {
    const actor = this.getActor(heroId);
    if (!actor) {
      return undefined;
    }

    return target.copy(actor.anchor);
  }

  getXpGained(): number {
    return this.xpGained;
  }

  getLevel(): number {
    return this.level;
  }

  setEquippedMove(slot: number, moveId: MoveId, heroId = this.playerActor.id): void {
    const actor = this.getActor(heroId);
    if (!actor || slot < 0 || slot >= actor.equippedMoves.length || !this.isKnownMove(moveId)) {
      return;
    }

    if (!actor.allowedMoves.includes(moveId)) {
      return;
    }

    actor.equippedMoves[slot] = moveId;
    this.hud.update(this.snapshot());
  }

  setPartyMemberActive(heroId: string, active: boolean): boolean {
    const actor = this.getActor(heroId);
    if (!actor || actor === this.playerActor) {
      return false;
    }

    actor.active = active;
    actor.combatant.atb = 0;
    if (!active && this.activeActorId === actor.id) {
      this.activeActorId = undefined;
      this.phase = this.phase === 'awaitingCommand' ? 'charging' : this.phase;
    }

    if (active && this.phase !== 'exploration') {
      actor.character.root.position.copy(actor.anchor);
      actor.character.faceToward(this.enemy.root.position);
      actor.character.play('battleIdle');
    }

    this.hud.update(this.snapshot());
    return true;
  }

  async testGameOver(): Promise<void> {
    if (this.phase === 'gameOver' || this.phase === 'resetting') {
      return;
    }

    window.clearTimeout(this.resetTimer);
    this.hud.hideVictoryResults();
    this.hud.hideGameOver();
    this.vfx.setAura(false);
    this.vfx.setFootCharge(false);
    this.audio.stopChiBreakerCharge();

    if (this.phase === 'exploration') {
      this.partyActors.forEach((actor) => {
        if (!actor.active) {
          return;
        }
        actor.character.root.position.copy(actor.anchor);
        actor.character.faceToward(this.enemyAnchor);
      });
      this.enemy.root.position.copy(this.enemyAnchor);
      this.enemy.root.visible = true;
      this.applyEnemyMode();
      this.hud.setBattleVisible(true);
    }

    this.player.setHp(0);
    await this.enterGameOver();
  }

  private async executeEquippedMove(slotIndex: number): Promise<void> {
    const actor = this.getActiveActor();
    const moveId = actor?.equippedMoves[slotIndex];
    if (!actor || !moveId) {
      return;
    }

    if (moveId in playerPhysicalMoves) {
      await this.executePhysicalMove(actor, playerPhysicalMoves[moveId as keyof typeof playerPhysicalMoves]);
      return;
    }

    if (moveId in playerChiMoves) {
      await this.executeChiMove(actor, playerChiMoves[moveId as keyof typeof playerChiMoves]);
    }
  }

  private async executePhysicalMove(actor: PartyActor, move: PhysicalMoveDefinition): Promise<void> {
    if (
      this.phase !== 'awaitingCommand' ||
      this.activeActorId !== actor.id ||
      actor.combatant.atb < battleTunables.atbMax
    ) {
      return;
    }

    this.phase = 'playerAction';
    this.atb.consume(actor.combatant);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(actor.name, move.name, 'player');
    this.hud.update(this.snapshot());

    this.actionCount += 1;
    await this.cameraRig.framePhysicalMove(actor.character.root.position, this.enemy.root.position, this.actionCount);
    await this.animator.heroPhysicalMove(actor.character, this.enemy.root.position, actor.anchor, move, () => {
      const result = this.resolver.resolvePhysicalMove(actor.combatant, this.enemyCombatant, move);
      this.enemy.flashHit();
      this.audio.playPhysicalImpact(move.id);
      this.vfx.burstAt(this.enemy.root.position);
      this.logLine = `${move.name} dealt ${result.damage}.`;
      window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));
    });

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    await this.cameraRig.restoreBattleView(actor.character.root.position, this.enemy.root.position);
    this.finishPartyAction(actor);
  }

  private async executeChiMove(actor: PartyActor, move: ChiMoveDefinition): Promise<void> {
    if (
      this.phase !== 'awaitingCommand' ||
      this.activeActorId !== actor.id ||
      actor.combatant.atb < battleTunables.atbMax
    ) {
      return;
    }

    if (!actor.combatant.spendChi(move.chiCost)) {
      this.logLine = `Not enough ${this.resourceName(actor)}.`;
      this.hud.update(this.snapshot());
      return;
    }

    if (move.id === 'chiBreaker') {
      await this.executeChiBreaker(actor, move);
      return;
    }

    if (move.special === 'mageRanged') {
      await this.executeMageRangedSpecial(actor, move);
      return;
    }

    if (move.special === 'thunder') {
      await this.executeThunderMove(actor, move);
      return;
    }

    this.phase = 'chiCinematic';
    this.atb.consume(actor.combatant);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(actor.name, move.name, this.moveTone(actor, move));
    this.hud.setDarkened(true);
    this.vfx.setAura(true, move.kind === 'heal' ? 'healing' : actor.role === 'Mage' ? 'mage' : 'chi');
    this.audio.playChiCharge();
    actor.character.play(move.animation ?? 'chi', { loopOnce: true, fadeSeconds: 0.1, timeScale: move.timeScale });
    this.hud.update(this.snapshot());

    await this.cameraRig.focusHeroChi(actor.character.root.position, this.enemy.root.position);
    await wait(move.chargeMs);

    if (move.kind === 'damage') {
      actor.character.play('slam', { loopOnce: true, fadeSeconds: 0.08, timeScale: 1.12 });
    }
    this.hud.pulseFlash();
    const healingTarget = move.kind === 'heal' ? this.selectHealingTarget(actor) : actor;
    const burstPosition =
      move.kind === 'heal' ? healingTarget.character.root.position.clone().setY(0.95) : this.enemy.root.position;
    if (move.kind === 'damage' && actor.role === 'Mage') {
      await this.vfx.castMageProjectile(this.getSpellOrigin(actor), this.enemy.root.position);
    } else {
      this.vfx.burstAt(burstPosition, move.kind === 'heal' ? '#dfffea' : '#f7fbff');
    }
    if (move.kind === 'heal') {
      this.vfx.healingBloomAt(healingTarget.character.root.position);
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
        ? this.resolver.resolveChiHealing(actor.combatant, healingTarget.combatant, move)
        : this.resolver.resolveChiDamage(actor.combatant, this.enemyCombatant, move);

    this.logLine =
      move.kind === 'heal'
        ? `${move.name} restored ${result.healing ?? 0} to ${healingTarget.name}.`
        : `${move.name} dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    this.vfx.setAura(false);
    this.hud.setDarkened(false);
    await this.cameraRig.restoreBattleView(actor.character.root.position, this.enemy.root.position);

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    actor.character.play('battleIdle');
    this.finishPartyAction(actor);
  }

  private async executeChiBreaker(actor: PartyActor, move: ChiMoveDefinition): Promise<void> {
    this.phase = 'chiCinematic';
    this.atb.consume(actor.combatant);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(actor.name, move.name, 'chi');
    this.hud.setDarkened(true);
    this.hud.update(this.snapshot());

    const finisher = playerPhysicalMoves.lungeSpinKick;
    const enemyPosition = this.enemy.root.position.clone();
    const approachDirection = safeDirection(
      enemyPosition.clone().sub(actor.character.root.position).setY(0),
      new Vector3(0, 0, -1),
    );
    const lateralOffset = new Vector3(approachDirection.z, 0, -approachDirection.x).normalize().multiplyScalar(0.58);
    const strikePosition = enemyPosition
      .clone()
      .addScaledVector(approachDirection, -(finisher.stopDistance + 0.28))
      .add(lateralOffset);
    strikePosition.y = 0;

    actor.character.faceToward(enemyPosition);
    actor.character.play('run', { fadeSeconds: 0.1 });
    await tweenVector3(actor.character.root.position, strikePosition, battleTunables.approachDurationMs + 160);

    actor.character.faceToward(this.enemy.root.position);
    actor.character.play('battleIdle', { fadeSeconds: 0.1 });
    this.vfx.setAura(true, 'chi');
    this.vfx.setFootCharge(true);
    this.audio.startChiBreakerCharge();
    await this.cameraRig.frameChiBreakerCharge(actor.character.root.position, this.enemy.root.position);
    await wait(Math.max(move.chargeMs, 1500));

    actor.character.faceToward(this.enemy.root.position);
    actor.character.play('lungeSpinKick', { loopOnce: true, fadeSeconds: 0.08, timeScale: move.timeScale });
    const impactCamera = this.cameraRig.frameChiBreakerImpact(actor.character.root.position, this.enemy.root.position);
    await wait(1650);
    await impactCamera;

    this.hud.pulseFlash();
    this.audio.stopChiBreakerCharge();
    this.audio.playChiImpact();
    this.vfx.burstAt(this.enemy.root.position, '#f7fbff');
    this.enemy.flashHit();

    const result = this.resolver.resolveChiDamage(actor.combatant, this.enemyCombatant, move);
    this.logLine = `${move.name} dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    await wait(move.flashMs + 520);
    this.vfx.setFootCharge(false);
    this.vfx.setAura(false);
    this.hud.setDarkened(false);

    actor.character.play('run', { fadeSeconds: 0.12 });
    actor.character.faceToward(actor.anchor);
    await tweenVector3(actor.character.root.position, actor.anchor, battleTunables.returnDurationMs + 120);
    actor.character.faceToward(this.enemy.root.position);
    actor.character.play('battleIdle');

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    await this.cameraRig.restoreBattleView(actor.character.root.position, this.enemy.root.position);
    this.finishPartyAction(actor);
  }

  private async executeMageRangedSpecial(actor: PartyActor, move: ChiMoveDefinition): Promise<void> {
    this.phase = 'chiCinematic';
    this.atb.consume(actor.combatant);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(actor.name, move.name, this.moveTone(actor, move));
    this.hud.setDarkened(true);
    this.vfx.setAura(true, 'mage');
    this.audio.playChiCharge();
    actor.character.faceToward(this.enemy.root.position);
    actor.character.play(move.animation ?? 'chi', { loopOnce: true, fadeSeconds: 0.1, timeScale: move.timeScale });
    this.hud.update(this.snapshot());

    await this.cameraRig.frameMageSpecial(actor.character.root.position, this.enemy.root.position);
    await wait(move.chargeMs);
    actor.character.play('slam', { loopOnce: true, fadeSeconds: 0.08, timeScale: 0.94 });
    const impactCamera = this.cameraRig.frameMageSpecialImpact(actor.character.root.position, this.enemy.root.position);
    await this.vfx.castMageProjectile(this.getSpellOrigin(actor), this.enemy.root.position, true);
    await impactCamera;

    this.hud.pulseFlash();
    this.audio.playChiImpact();
    this.enemy.flashHit();
    this.vfx.arcaneBurstAt(this.enemy.root.position);
    await wait(move.flashMs);

    const result = this.resolver.resolveChiDamage(actor.combatant, this.enemyCombatant, move);
    this.logLine = `${move.name} dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    this.vfx.setAura(false);
    this.hud.setDarkened(false);

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    await this.cameraRig.restoreBattleView(actor.character.root.position, this.enemy.root.position);
    actor.character.play('battleIdle');
    this.finishPartyAction(actor);
  }

  private async executeThunderMove(actor: PartyActor, move: ChiMoveDefinition): Promise<void> {
    this.phase = 'chiCinematic';
    this.atb.consume(actor.combatant);
    this.logLine = `${move.name}.`;
    this.hud.showMoveBanner(actor.name, move.name, 'thunder');
    this.hud.setDarkened(true);
    this.vfx.setAura(true, 'thunder');
    this.audio.playThunderCharge();
    actor.character.faceToward(this.enemy.root.position);
    actor.character.play(move.animation ?? 'slam', { loopOnce: true, fadeSeconds: 0.1, timeScale: move.timeScale });
    this.hud.update(this.snapshot());

    await this.cameraRig.frameMageSpecial(actor.character.root.position, this.enemy.root.position);
    await wait(move.chargeMs);
    await this.cameraRig.frameThunderOverhead(actor.character.root.position, this.enemy.root.position);

    this.hud.pulseFlash();
    this.audio.playThunderImpact();
    this.enemy.flashHit();
    this.vfx.thunderBurstAt(this.enemy.root.position);
    await wait(move.flashMs);

    const result = this.resolver.resolveChiDamage(actor.combatant, this.enemyCombatant, move);
    this.logLine = `${move.name} dealt ${result.damage}.`;
    window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));

    this.vfx.setAura(false);
    this.hud.setDarkened(false);

    if (this.enemyCombatant.hp <= 0) {
      await this.enterVictory();
      return;
    }

    await this.cameraRig.restoreBattleView(actor.character.root.position, this.enemy.root.position);
    actor.character.play('battleIdle');
    this.finishPartyAction(actor);
  }

  private async executeEnemyAction(): Promise<void> {
    if (this.phase !== 'charging' && this.phase !== 'awaitingCommand') {
      return;
    }

    const target = this.selectEnemyTarget();
    if (!target) {
      await this.enterGameOver();
      return;
    }

    this.phase = 'enemyAction';
    this.activeActorId = undefined;
    this.atb.consume(this.enemyCombatant);
    this.logLine = 'Pulse Ram.';
    this.hud.showMoveBanner(this.enemyCombatant.name, 'Pulse Ram', 'enemy');

    this.actionCount += 1;
    await this.cameraRig.frameEnemyAttackWindup(this.enemy.root.position, target.character.root.position, this.actionCount);
    await wait(260);
    await this.animator.enemyAttack(
      this.enemy,
      target.character.root.position,
      this.enemyAnchor,
      () => {
        const result = this.resolver.resolveEnemyAttack(this.enemyCombatant, target.combatant);
        this.audio.playEnemyImpact();
        target.character.play('hit', { loopOnce: true, fadeSeconds: 0.08, timeScale: 1.1 });
        this.logLine = `Counter dealt ${result.damage} to ${target.name}.`;
        window.dispatchEvent(new CustomEvent('rpg:action-resolved', { detail: result }));
      },
      () => this.cameraRig.frameEnemyAttackImpact(this.enemy.root.position, target.character.root.position, this.actionCount),
    );

    if (this.player.hp <= 0) {
      await this.enterGameOver();
      return;
    }

    target.character.faceToward(this.enemy.root.position);
    target.character.play('battleIdle');
    await this.cameraRig.restoreBattleView(this.hero.root.position, this.enemy.root.position);
    this.phase = 'charging';
  }

  private async enterVictory(): Promise<void> {
    this.phase = 'victory';
    this.logLine = 'Victory.';
    const rewards = this.applyVictoryRewards(this.calculateXpReward());
    this.xpGained = this.playerActor.lastXpGained;
    this.level = this.playerActor.level;
    this.activeActorId = undefined;
    this.enemy.root.visible = false;
    this.hud.update(this.snapshot());
    this.hud.showVictoryResults(rewards);
    this.audio.playVictory();
    this.audio.playLevelUp();
    window.dispatchEvent(new CustomEvent('rpg:victory'));
    await Promise.all([
      ...this.partyActors.filter((actor) => actor.active).map((actor) => this.animator.heroVictory(actor.character)),
      this.cameraRig.victorySequence(this.hero.root.position, this.enemy.root.position),
    ]);

    this.resetTimer = window.setTimeout(() => {
      this.resetEncounter();
    }, battleTunables.victoryHoldMs);
  }

  private async enterGameOver(): Promise<void> {
    this.phase = 'gameOver';
    this.activeActorId = undefined;
    this.logLine = 'Ryuji fell.';
    this.player.setHp(0);
    this.partyActors.forEach((actor) => {
      actor.combatant.atb = 0;
    });
    this.enemyCombatant.atb = 0;
    this.vfx.setAura(false);
    this.vfx.setFootCharge(false);
    this.hud.setDarkened(false);
    this.hud.update(this.snapshot());
    this.audio.stopBattle();

    const faintTimeScale = 1.05;
    const faintDurationMs = this.hero.getAnimationDuration('dead') * (1000 / faintTimeScale);
    this.hero.faceToward(this.enemy.root.position);
    this.hero.play('dead', { loopOnce: true, fadeSeconds: 0.08, timeScale: faintTimeScale });
    await wait(Math.max(faintDurationMs + 160, 3000));

    this.audio.playGameOver();
    await wait(360);
    this.hud.setBattleVisible(false);
    this.hud.showGameOver();
    window.dispatchEvent(new CustomEvent('rpg:game-over'));
  }

  private finishPartyAction(actor: PartyActor): void {
    if (this.activeActorId === actor.id) {
      this.activeActorId = undefined;
    }
    actor.character.faceToward(this.enemy.root.position);
    actor.character.play('battleIdle');
    this.phase = 'charging';
  }

  private calculateXpReward(): number {
    const bossBonus = this.bossMode ? 260 : 0;
    return Math.round(120 + bossBonus + this.enemyCombatant.maxHp * 0.25 + this.player.hp * 0.1);
  }

  private applyEnemyMode(): void {
    this.enemy.setBossMode(this.bossMode);
    this.enemyCombatant.setStats(this.bossMode ? bossEnemyStats : enemyBaseStats);
  }

  private applyVictoryRewards(baseXp: number): CharacterRewardSummary[] {
    return this.partyActors
      .filter((actor) => actor.active)
      .map((actor) => {
        const xpGained = Math.round(baseXp * (actor.id === 'mira' ? 0.5 : 1));
        actor.lastXpGained = xpGained;
        actor.xp += xpGained;
        actor.level += 1;
        const statGains = this.applyLevelUpGains(actor);
        actor.combatant.setHp(actor.combatant.maxHp);
        return {
          level: actor.level,
          name: actor.name,
          portraitUrl: actor.portraitUrl,
          statGains,
          totalXp: actor.xp,
          xpGained,
        };
      });
  }

  private applyLevelUpGains(actor: PartyActor): LevelUpGain[] {
    const gainKeys: StatKey[] =
      actor.role === 'Mage' ? ['focus', 'dexterity', 'vitality'] : ['strength', 'dexterity', 'focus'];
    if (actor.level % 2 === 0 && !gainKeys.includes('vitality')) {
      gainKeys.push('vitality');
    }
    if (this.bossMode) {
      gainKeys.push('defense');
    }

    const gains = gainKeys.map((stat) => ({
      stat,
      amount: 1,
      nextValue: actor.baseStats[stat] + 1,
    }));

    actor.baseStats = gains.reduce(
      (stats, gain) => ({
        ...stats,
        [gain.stat]: gain.nextValue,
      }),
      actor.baseStats,
    );
    actor.combatant.setStats(actor.baseStats);
    return gains;
  }

  private selectEnemyTarget(): PartyActor | undefined {
    if (this.playerActor.active && this.player.hp > 0) {
      return this.playerActor;
    }

    return this.getActiveLivingActors()[0];
  }

  private selectHealingTarget(fallback: PartyActor): PartyActor {
    const livingActors = this.getActiveLivingActors();
    if (livingActors.length === 0) {
      return fallback;
    }

    return livingActors.reduce((lowest, actor) => {
      const lowestRatio = lowest.combatant.hp / lowest.combatant.maxHp;
      const actorRatio = actor.combatant.hp / actor.combatant.maxHp;
      return actorRatio < lowestRatio ? actor : lowest;
    }, livingActors[0]);
  }

  private getSpellOrigin(actor: PartyActor): Vector3 {
    if (actor.role === 'Mage') {
      return actor.character.getAttachmentTipWorldPosition('staff', this.spellStart);
    }

    return this.spellStart.copy(actor.character.root.position).setY(1.2);
  }

  private getActiveLivingActors(): PartyActor[] {
    return this.partyActors.filter((actor) => actor.active && actor.combatant.hp > 0);
  }

  private getActiveActor(): PartyActor | undefined {
    return this.activeActorId ? this.getActor(this.activeActorId) : undefined;
  }

  private moveTone(actor: PartyActor, move: ChiMoveDefinition): MoveBannerTone {
    if (move.tone) {
      return move.tone;
    }

    if (move.kind === 'heal') {
      return 'healing';
    }

    return actor.role === 'Mage' ? 'magic' : 'chi';
  }

  private resourceName(actor: PartyActor): string {
    return actor.role === 'Mage' ? 'Mana' : 'Chi';
  }

  private getActor(heroId: string): PartyActor | undefined {
    return this.partyActors.find((actor) => actor.id === heroId);
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
