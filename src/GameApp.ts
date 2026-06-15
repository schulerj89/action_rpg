import { Vector3 } from 'three';
import { AudioDirector } from './audio/AudioDirector';
import { BattleDirector } from './battle/BattleDirector';
import { heroAnimationAssets } from './config/assets';
import { heroBaseStats } from './config/combatConfig';
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
  private readonly movement = new Vector3();
  private readonly trigger: EncounterTrigger;
  private readonly vfx = new VfxController();
  private readonly world: WorldScene;
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
    this.debugPanel = new DebugPanel(document, heroBaseStats, {
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
    this.vfx.update(deltaSeconds, this.hero.root.position);
    this.battle.update(deltaSeconds);
    this.updateDebug();

    this.world.triggerPad.rotation.z += deltaSeconds * 1.8;
    this.world.renderer.render(this.world.scene, this.world.camera);
    window.requestAnimationFrame(this.render);
  };

  private updateWorld(deltaSeconds: number): void {
    if (this.battle.getPhase() === 'exploration') {
      this.movement.copy(this.input.getMovementDirection());

      if (this.movement.lengthSq() > 0) {
        this.hero.root.position.addScaledVector(this.movement, playerMoveSpeed * deltaSeconds);
        this.hero.faceToward(this.hero.root.position.clone().add(this.movement));
        this.hero.play('run');
      } else {
        this.hero.play('idle');
      }

      this.cameraRig.updateExploration(this.hero.root.position, this.movement, deltaSeconds);

      if (this.trigger.check(this.hero.root.position)) {
        void this.battle.startBattle();
      }
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
      forceReady: () => {
        this.battle.forceReady();
      },
      getState: () => ({
        audioStatus: this.audio.getStatus(),
        battleState: this.battle.getPhase(),
        enemyHp: this.battle.enemyCombatant.hp,
        playerAtb: this.battle.player.atb,
        playerHp: this.battle.player.hp,
        position: {
          x: this.hero.root.position.x,
          z: this.hero.root.position.z,
        },
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
      setPlayerPosition: (x: number, z: number) => {
        this.hero.root.position.set(x, 0, z);
      },
    };
  }
}
