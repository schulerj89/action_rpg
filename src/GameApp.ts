import { Group, Vector3 } from 'three';
import { AudioDirector } from './audio/AudioDirector';
import { BattleDirector, type BattlePartyMemberConfig } from './battle/BattleDirector';
import { moveDebugOptions } from './config/combatConfig';
import {
  defaultActiveSupportHeroIds,
  playerHeroDefinition,
  supportHeroDefinitions,
  type SupportHeroDefinition,
  type SupportHeroId,
} from './config/heroes';
import { FrameStats } from './core/FrameStats';
import { InputController } from './core/InputController';
import type { RuntimeDebugInfo } from './core/types';
import { EnemyShape } from './entities/EnemyShape';
import { HeroCharacter } from './entities/HeroCharacter';
import { BattleHud } from './ui/BattleHud';
import { DebugPanel } from './ui/DebugPanel';
import { TitleScreen } from './ui/TitleScreen';
import { VfxController } from './vfx/VfxController';
import { CameraRig } from './world/CameraRig';
import { EncounterTrigger } from './world/EncounterTrigger';
import { battleTriggerPosition, createWorldScene } from './world/SceneFactory';
import type { WorldScene } from './world/SceneFactory';

const playerMoveSpeed = 4.2;
const explorationAcceleration = 18;
const explorationDeceleration = 24;
const explorationPivotTurnSpeed = 3.9;
const explorationReverseTurnSpeed = 5.6;
const movementStopThreshold = 0.03;
const leaderBattleAnchor = new Vector3(0, 0, -5.8);

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly audio = new AudioDirector();
  private readonly battle: BattleDirector;
  private readonly cameraRig: CameraRig;
  private readonly debugPanel: DebugPanel;
  private readonly enemy: EnemyShape;
  private readonly frameStats = new FrameStats();
  private readonly hero: HeroCharacter;
  private readonly hud: BattleHud;
  private readonly input = new InputController();
  private readonly activeSupportHeroIds = new Set<SupportHeroId>(defaultActiveSupportHeroIds);
  private readonly explorationVelocity = new Vector3();
  private readonly heroForward = new Vector3(0, 0, -1);
  private readonly movement = new Vector3();
  private readonly supportHeroes: Map<SupportHeroId, HeroCharacter>;
  private readonly supportTarget = new Vector3();
  private readonly supportRight = new Vector3();
  private readonly targetVelocity = new Vector3();
  private readonly titleScreen: TitleScreen;
  private readonly chiBreakerFootPosition = new Vector3();
  private readonly trigger: EncounterTrigger;
  private readonly vfx = new VfxController();
  private readonly world: WorldScene;
  private reverseTurnTargetYaw?: number;
  private lastFrameTime = performance.now();

  private constructor(canvas: HTMLCanvasElement, hero: HeroCharacter, supportHeroes: Map<SupportHeroId, HeroCharacter>) {
    this.canvas = canvas;
    this.world = createWorldScene(this.canvas);
    this.hero = hero;
    this.hud = new BattleHud(document);
    this.cameraRig = new CameraRig(this.world.camera);
    this.enemy = new EnemyShape();
    this.supportHeroes = supportHeroes;
    this.trigger = new EncounterTrigger(battleTriggerPosition, 1.35, this.world.triggerPad);
    this.battle = new BattleDirector({
      audio: this.audio,
      cameraRig: this.cameraRig,
      enemy: this.enemy,
      hud: this.hud,
      party: this.createBattleParty(),
      trigger: this.trigger,
      vfx: this.vfx,
    });
    this.debugPanel = new DebugPanel(document, this.battle.getPartyDebugOptions(), moveDebugOptions, false, {
      onBossModeChange: (enabled) => {
        this.battle.setBossMode(enabled);
      },
      onEquipMove: (heroId, slot, moveId) => {
        this.battle.setEquippedMove(slot, moveId, heroId);
      },
      onForceReady: (heroId) => {
        this.battle.forceReady(heroId);
      },
      onStartBattle: () => {
        void this.battle.startBattle();
      },
      onStatChange: (heroId, key, value) => {
        this.battle.updateHeroStat(heroId, key, value);
      },
      onSupportHeroToggle: (id, active) => {
        this.setSupportHeroActive(id as SupportHeroId, active);
      },
      onTestFaint: () => {
        void this.battle.testGameOver();
      },
    });
    this.titleScreen = new TitleScreen(document, {
      onStart: () => {
        this.audio.stopTitle();
      },
    });

    this.world.scene.add(this.hero.root, this.enemy.root, this.vfx.root, ...this.getSupportHeroRoots());
    this.hero.root.position.set(0, 0, 0);
    this.hero.root.rotation.y = Math.PI;
    this.enemy.root.visible = false;
    this.syncPartyHud();
    this.updateSupportHeroVisibility();
    this.installResizeHandler();
    this.installTestApi();
    this.audio.playTitle();
  }

  static async mount(canvas: HTMLCanvasElement): Promise<GameApp> {
    const [hero, supportEntries] = await Promise.all([
      HeroCharacter.load(playerHeroDefinition),
      Promise.all(
        supportHeroDefinitions.map(async (definition) => {
          const character = await HeroCharacter.load(definition);
          return [definition.id, character] as const;
        }),
      ),
    ]);
    const app = new GameApp(canvas, hero, new Map(supportEntries));
    app.start();
    return app;
  }

  start(): void {
    this.lastFrameTime = performance.now();
    this.render();
  }

  private render = (): void => {
    const now = performance.now();
    const deltaSeconds = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.frameStats.update(deltaSeconds);

    this.updateWorld(deltaSeconds);
    this.hero.update(deltaSeconds);
    this.supportHeroes.forEach((supportHero) => {
      supportHero.update(deltaSeconds);
    });
    this.enemy.update(deltaSeconds);
    const vfxCharacter = this.battle.getVfxCharacter();
    this.vfx.update(
      deltaSeconds,
      vfxCharacter.root.position,
      vfxCharacter.root.rotation.y,
      vfxCharacter.getLeftFootWorldPosition(this.chiBreakerFootPosition),
    );
    this.battle.update(deltaSeconds);
    this.updateDebug();

    this.world.triggerPad.rotation.z += deltaSeconds * 1.8;
    this.world.renderer.render(this.world.scene, this.world.camera);
    window.requestAnimationFrame(this.render);
  };

  private updateWorld(deltaSeconds: number): void {
    if (this.titleScreen.isActive()) {
      this.explorationVelocity.set(0, 0, 0);
      this.hero.play('explorationIdle');
      this.cameraRig.updateExploration(this.hero.root.position, this.heroForward, deltaSeconds);
      this.updateSupportHeroes(deltaSeconds, true);
      return;
    }

    if (this.battle.getPhase() === 'exploration') {
      const input = this.input.getMovementAxes();
      if (input.turn !== 0) {
        this.hero.root.rotation.y -= input.turn * explorationPivotTurnSpeed * deltaSeconds;
        this.reverseTurnTargetYaw = undefined;
      }
      if (input.reverse) {
        this.reverseTurnTargetYaw ??= this.hero.root.rotation.y + Math.PI;
        this.hero.root.rotation.y = turnTowardAngle(
          this.hero.root.rotation.y,
          this.reverseTurnTargetYaw,
          explorationReverseTurnSpeed * deltaSeconds,
        );
      } else {
        this.reverseTurnTargetYaw = undefined;
      }

      setYawForward(this.hero.root.rotation.y, this.heroForward);

      const hasMovementInput = input.forward > 0;
      this.targetVelocity.copy(this.heroForward).multiplyScalar(hasMovementInput ? playerMoveSpeed : 0);
      const moveRate = hasMovementInput ? explorationAcceleration : explorationDeceleration;

      moveVectorToward(this.explorationVelocity, this.targetVelocity, moveRate * deltaSeconds);

      if (this.explorationVelocity.lengthSq() < movementStopThreshold * movementStopThreshold) {
        this.explorationVelocity.set(0, 0, 0);
      }

      this.hero.root.position.addScaledVector(this.explorationVelocity, deltaSeconds);

      if (this.explorationVelocity.lengthSq() > movementStopThreshold * movementStopThreshold) {
        this.hero.play('run');
      } else {
        this.hero.play('explorationIdle');
      }

      this.movement.copy(this.explorationVelocity);
      if (this.movement.lengthSq() > 0) {
        this.movement.normalize();
      }

      this.cameraRig.updateExploration(this.hero.root.position, this.heroForward, deltaSeconds);
      this.updateSupportHeroes(deltaSeconds, true);

      if (this.trigger.check(this.hero.root.position)) {
        void this.battle.startBattle();
      }
    } else {
      this.explorationVelocity.set(0, 0, 0);
      this.updateSupportHeroes(deltaSeconds, false);
    }
  }

  private createBattleParty(): BattlePartyMemberConfig[] {
    const supportParty = supportHeroDefinitions.map((definition) => {
      const character = this.supportHeroes.get(definition.id);
      if (!character) {
        throw new Error(`${definition.name} failed to load.`);
      }

      return {
        active: this.activeSupportHeroIds.has(definition.id),
        allowedMoves: definition.allowedMoves,
        anchor: leaderBattleAnchor.clone().add(new Vector3(definition.battleOffset.side, 0, definition.battleOffset.back)),
        character,
        defaultMoves: definition.defaultMoves,
        id: definition.id,
        name: definition.name,
        portraitUrl: definition.portraitUrl,
        role: definition.role,
        stats: definition.stats,
      };
    });

    return [
      {
        active: true,
        allowedMoves: playerHeroDefinition.allowedMoves,
        anchor: leaderBattleAnchor.clone(),
        character: this.hero,
        defaultMoves: playerHeroDefinition.defaultMoves,
        id: playerHeroDefinition.id,
        name: playerHeroDefinition.name,
        portraitUrl: playerHeroDefinition.portraitUrl,
        role: playerHeroDefinition.role,
        stats: playerHeroDefinition.stats,
      },
      ...supportParty,
    ];
  }

  private updateSupportHeroes(deltaSeconds: number, inExploration: boolean): void {
    const activeDefinitions = this.getActiveSupportHeroDefinitions();

    activeDefinitions.forEach((definition) => {
      const supportHero = this.supportHeroes.get(definition.id);
      if (!supportHero) {
        return;
      }

      if (inExploration) {
        this.setExplorationSupportTarget(definition);
        supportHero.root.position.lerp(this.supportTarget, Math.min(deltaSeconds * 9, 1));
        supportHero.root.rotation.y = this.hero.root.rotation.y;
        supportHero.play(
          this.explorationVelocity.lengthSq() > movementStopThreshold * movementStopThreshold ? 'run' : 'explorationIdle',
        );
        return;
      }

      if (this.battle.getPhase() === 'gameOver' || this.battle.getPhase() === 'resetting') {
        supportHero.play('battleIdle');
        return;
      }

      if (this.battle.getActingActorId() === definition.id) {
        return;
      }

      this.setBattleSupportTarget(definition);
      supportHero.root.position.lerp(this.supportTarget, Math.min(deltaSeconds * 12, 1));
      supportHero.faceToward(this.enemy.root.position);
      supportHero.play('battleIdle');
    });
  }

  private setExplorationSupportTarget(definition: SupportHeroDefinition): void {
    this.supportRight.set(-this.heroForward.z, 0, this.heroForward.x).normalize();
    this.supportTarget
      .copy(this.hero.root.position)
      .addScaledVector(this.supportRight, definition.explorationOffset.side)
      .addScaledVector(this.heroForward, -definition.explorationOffset.back);
    this.supportTarget.y = 0;
  }

  private setBattleSupportTarget(definition: SupportHeroDefinition): void {
    this.battle.getPartyAnchor(definition.id, this.supportTarget);
  }

  private setSupportHeroActive(id: SupportHeroId, active: boolean): void {
    if (!this.supportHeroes.has(id)) {
      return;
    }

    this.battle.setPartyMemberActive(id, active);
    if (active) {
      this.activeSupportHeroIds.add(id);
    } else {
      this.activeSupportHeroIds.delete(id);
    }
    this.syncPartyHud();
    this.updateSupportHeroVisibility();
    this.debugPanel.refreshParty(this.battle.getPartyDebugOptions());
  }

  private updateSupportHeroVisibility(): void {
    this.supportHeroes.forEach((supportHero, id) => {
      supportHero.root.visible = this.activeSupportHeroIds.has(id);
    });
  }

  private syncPartyHud(): void {
    this.hud.setSupportParty(
      this.battle.getPartyDebugOptions().slice(1).map((hero) => ({
        active: hero.active,
        name: hero.name,
        role: hero.role,
      })),
    );
  }

  private getActiveSupportHeroDefinitions(): SupportHeroDefinition[] {
    return supportHeroDefinitions.filter((definition) => this.activeSupportHeroIds.has(definition.id));
  }

  private getSupportHeroRoots(): Group[] {
    return Array.from(this.supportHeroes.values(), (supportHero) => supportHero.root);
  }

  private updateDebug(): void {
    const battle = this.battle.snapshot();
    const info: RuntimeDebugInfo = {
      fps: this.frameStats.fps,
      frameMs: this.frameStats.frameMs,
      playerX: this.hero.root.position.x,
      playerZ: this.hero.root.position.z,
      battle,
      bossMode: this.battle.isBossMode(),
      audioStatus: this.audio.getStatus(),
    };

    this.debugPanel.update(info);
  }

  private installResizeHandler(): void {
    const resize = (): void => {
      this.world.camera.aspect = window.innerWidth / window.innerHeight;
      this.world.camera.updateProjectionMatrix();
      this.world.renderer.setSize(window.innerWidth, window.innerHeight);
      this.world.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private installTestApi(): void {
    window.__rpgTest = {
      equipMove: (slot, moveId) => {
        this.battle.setEquippedMove(slot, moveId);
      },
      equipHeroMove: (heroId, slot, moveId) => {
        this.battle.setEquippedMove(slot, moveId, heroId);
      },
      forceReady: () => {
        this.battle.forceReady();
      },
      forceHeroReady: (heroId) => {
        this.battle.forceReady(heroId);
      },
      forceEnemyReady: () => {
        this.battle.forceEnemyReady();
      },
      getState: () => {
        const snapshot = this.battle.snapshot();
        return {
          audioStatus: this.audio.getStatus(),
          battleState: this.battle.getPhase(),
          bossMode: this.battle.isBossMode(),
          enemyHp: this.battle.enemyCombatant.hp,
          equippedMoves: this.battle.getEquippedMoves(),
          level: this.battle.getLevel(),
          party: snapshot.party.map((member) => ({
            active: member.active,
            atb: member.atb,
            chi: member.chi,
            hp: member.hp,
            id: member.id,
            level: member.level,
            moves: this.battle.getEquippedMoves(member.id),
            name: member.name,
            xp: member.xp,
          })),
          playerAtb: this.battle.player.atb,
          playerChi: this.battle.player.chi,
          playerHp: this.battle.player.hp,
          position: {
            x: this.hero.root.position.x,
            z: this.hero.root.position.z,
          },
          supportHeroes: Array.from(this.activeSupportHeroIds),
          xpGained: this.battle.getXpGained(),
        };
      },
      movePlayerToBattleTrigger: () => {
        this.hero.root.position.copy(this.trigger.getPosition());
        void this.battle.startBattle();
      },
      muteAudio: () => {
        this.audio.mute();
      },
      setEnemyHp: (value: number) => {
        this.battle.setEnemyHp(value);
      },
      setBossMode: (enabled: boolean) => {
        this.battle.setBossMode(enabled);
      },
      setHeroStat: (heroId, key, value) => {
        this.battle.updateHeroStat(heroId, key, value);
      },
      setSupportHeroActive: (id: string, active: boolean) => {
        this.setSupportHeroActive(id as SupportHeroId, active);
      },
      setPlayerHp: (value: number) => {
        this.battle.player.setHp(value);
      },
      setPlayerPosition: (x: number, z: number) => {
        this.hero.root.position.set(x, 0, z);
      },
      testGameOver: () => {
        void this.battle.testGameOver();
      },
    };
  }
}

function moveVectorToward(current: Vector3, target: Vector3, maxDelta: number): void {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= maxDelta || distance < 0.0001) {
    current.copy(target);
    return;
  }

  const scale = maxDelta / distance;
  current.x += dx * scale;
  current.z += dz * scale;
}

function setYawForward(yaw: number, target: Vector3): void {
  target.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
}

function turnTowardAngle(current: number, target: number, maxStep: number): number {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));

  if (Math.abs(delta) <= maxStep) {
    return target;
  }

  return current + Math.sign(delta) * maxStep;
}
