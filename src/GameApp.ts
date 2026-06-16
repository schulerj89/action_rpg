import { Vector3 } from 'three';
import { AudioDirector } from './audio/AudioDirector';
import { BattleDirector } from './battle/BattleDirector';
import { heroAnimationAssets } from './config/assets';
import { heroBaseStats, moveDebugOptions } from './config/combatConfig';
import { FrameStats } from './core/FrameStats';
import { InputController } from './core/InputController';
import type { RuntimeDebugInfo } from './core/types';
import { EnemyShape } from './entities/EnemyShape';
import { HeroCharacter } from './entities/HeroCharacter';
import { BattleHud } from './ui/BattleHud';
import { DebugPanel } from './ui/DebugPanel';
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
  private readonly explorationVelocity = new Vector3();
  private readonly heroForward = new Vector3(0, 0, -1);
  private readonly movement = new Vector3();
  private readonly targetVelocity = new Vector3();
  private readonly chiBreakerFootPosition = new Vector3();
  private readonly trigger: EncounterTrigger;
  private readonly vfx = new VfxController();
  private readonly world: WorldScene;
  private reverseTurnTargetYaw?: number;
  private lastFrameTime = performance.now();

  private constructor(canvas: HTMLCanvasElement, hero: HeroCharacter) {
    this.canvas = canvas;
    this.world = createWorldScene(this.canvas);
    this.hero = hero;
    this.hud = new BattleHud(document);
    this.cameraRig = new CameraRig(this.world.camera);
    this.enemy = new EnemyShape();
    this.trigger = new EncounterTrigger(battleTriggerPosition, 1.35, this.world.triggerPad);
    this.battle = new BattleDirector({
      audio: this.audio,
      cameraRig: this.cameraRig,
      enemy: this.enemy,
      hero: this.hero,
      hud: this.hud,
      trigger: this.trigger,
      vfx: this.vfx,
    });
    this.debugPanel = new DebugPanel(document, heroBaseStats, moveDebugOptions, this.battle.getEquippedMoves(), false, {
      onBossModeChange: (enabled) => {
        this.battle.setBossMode(enabled);
      },
      onEquipMove: (slot, moveId) => {
        this.battle.setEquippedMove(slot, moveId);
      },
      onForceReady: () => {
        this.battle.forceReady();
      },
      onStartBattle: () => {
        void this.battle.startBattle();
      },
      onStatChange: (key, value) => {
        this.battle.updatePlayerStat(key, value);
      },
    });

    this.world.scene.add(this.hero.root, this.enemy.root, this.vfx.root);
    this.hero.root.position.set(0, 0, 0);
    this.hero.root.rotation.y = Math.PI;
    this.enemy.root.visible = false;
    this.installResizeHandler();
    this.installTestApi();
  }

  static async mount(canvas: HTMLCanvasElement): Promise<GameApp> {
    const hero = await HeroCharacter.load(heroAnimationAssets);
    const app = new GameApp(canvas, hero);
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
    this.enemy.update(deltaSeconds);
    this.vfx.update(
      deltaSeconds,
      this.hero.root.position,
      this.hero.root.rotation.y,
      this.hero.getLeftFootWorldPosition(this.chiBreakerFootPosition),
    );
    this.battle.update(deltaSeconds);
    this.updateDebug();

    this.world.triggerPad.rotation.z += deltaSeconds * 1.8;
    this.world.renderer.render(this.world.scene, this.world.camera);
    window.requestAnimationFrame(this.render);
  };

  private updateWorld(deltaSeconds: number): void {
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

      if (this.trigger.check(this.hero.root.position)) {
        void this.battle.startBattle();
      }
    } else {
      this.explorationVelocity.set(0, 0, 0);
    }
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
      forceReady: () => {
        this.battle.forceReady();
      },
      forceEnemyReady: () => {
        this.battle.forceEnemyReady();
      },
      getState: () => ({
        audioStatus: this.audio.getStatus(),
        battleState: this.battle.getPhase(),
        bossMode: this.battle.isBossMode(),
        enemyHp: this.battle.enemyCombatant.hp,
        equippedMoves: this.battle.getEquippedMoves(),
        level: this.battle.getLevel(),
        playerAtb: this.battle.player.atb,
        playerChi: this.battle.player.chi,
        playerHp: this.battle.player.hp,
        position: {
          x: this.hero.root.position.x,
          z: this.hero.root.position.z,
        },
        xpGained: this.battle.getXpGained(),
      }),
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
      setPlayerPosition: (x: number, z: number) => {
        this.hero.root.position.set(x, 0, z);
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
