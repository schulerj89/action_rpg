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
import { wait } from './core/tween';
import type { RuntimeDebugInfo } from './core/types';
import { EnemyShape } from './entities/EnemyShape';
import { HeroCharacter } from './entities/HeroCharacter';
import { BattleHud } from './ui/BattleHud';
import { DebugPanel } from './ui/DebugPanel';
import { DialogueBox } from './ui/DialogueBox';
import { GameMenu } from './ui/GameMenu';
import { TitleScreen } from './ui/TitleScreen';
import { VfxController } from './vfx/VfxController';
import { CameraRig } from './world/CameraRig';
import { EncounterTrigger } from './world/EncounterTrigger';
import { DialogueRepository, type SceneDialogue } from './world/dialogue/DialogueRepository';
import { createWorldScene } from './world/SceneFactory';
import type { WorldScene } from './world/SceneFactory';
import { FirstTownScene } from './world/town/FirstTownScene';
import { WeatherSystem } from './world/WeatherSystem';

const playerMoveSpeed = 4.2;
const explorationAcceleration = 18;
const explorationDeceleration = 24;
const explorationPivotTurnSpeed = 3.9;
const explorationReverseTurnSpeed = 5.6;
const movementStopThreshold = 0.03;
const leaderBattleAnchor = new Vector3(0, 0, -24.6);

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly audio = new AudioDirector();
  private readonly battle: BattleDirector;
  private readonly cameraRig: CameraRig;
  private readonly debugPanel: DebugPanel;
  private readonly dialogueBox: DialogueBox;
  private readonly sceneDialogue: SceneDialogue;
  private readonly enemy: EnemyShape;
  private readonly frameStats = new FrameStats();
  private readonly gameMenu: GameMenu;
  private readonly hero: HeroCharacter;
  private readonly hud: BattleHud;
  private readonly input = new InputController();
  private readonly activeSupportHeroIds = new Set<SupportHeroId>(defaultActiveSupportHeroIds);
  private readonly explorationVelocity = new Vector3();
  private readonly heroForward = new Vector3(0, 0, -1);
  private readonly movement = new Vector3();
  private readonly supportHeroes: Map<SupportHeroId, HeroCharacter>;
  private readonly town: FirstTownScene;
  private readonly supportTarget = new Vector3();
  private readonly supportRight = new Vector3();
  private readonly targetVelocity = new Vector3();
  private readonly titleScreen: TitleScreen;
  private readonly chiBreakerFootPosition = new Vector3();
  private readonly previousHeroPosition = new Vector3();
  private readonly proposedHeroPosition = new Vector3();
  private readonly trigger: EncounterTrigger;
  private readonly vfx = new VfxController();
  private readonly weather: WeatherSystem;
  private readonly world: WorldScene;
  private readonly openingCaption: HTMLElement;
  private readonly openingCaptionText: HTMLElement;
  private readonly qaCaption: HTMLElement;
  private reverseTurnTargetYaw?: number;
  private cinematicActive = false;
  private enemyAssetsLoading = false;
  private openingCinematicPlayed = false;
  private qaCaptureMode = false;
  private townAssetsLoading = false;
  private townCombatMode = false;
  private lastFrameTime = performance.now();

  private constructor(
    canvas: HTMLCanvasElement,
    hero: HeroCharacter,
    supportHeroes: Map<SupportHeroId, HeroCharacter>,
    sceneDialogue: SceneDialogue,
  ) {
    this.canvas = canvas;
    this.world = createWorldScene(this.canvas);
    this.town = new FirstTownScene();
    this.sceneDialogue = sceneDialogue;
    this.hero = hero;
    const openingCaption = document.querySelector<HTMLElement>('[data-testid="opening-caption"]');
    const openingCaptionText = document.querySelector<HTMLElement>('[data-testid="opening-caption-text"]');
    const qaCaption = document.querySelector<HTMLElement>('[data-testid="qa-caption"]');
    if (!openingCaption || !openingCaptionText || !qaCaption) {
      throw new Error('Opening cinematic markup is missing.');
    }
    this.openingCaption = openingCaption;
    this.openingCaptionText = openingCaptionText;
    this.qaCaption = qaCaption;
    this.hud = new BattleHud(document);
    this.gameMenu = new GameMenu(document);
    this.dialogueBox = new DialogueBox(document);
    this.cameraRig = new CameraRig(this.world.camera, this.canvas);
    this.weather = new WeatherSystem(this.world.scene);
    this.enemy = new EnemyShape();
    this.supportHeroes = supportHeroes;
    this.trigger = new EncounterTrigger(this.town.battleTriggerPosition, 1.35, this.town.battleTriggerPad);
    this.battle = new BattleDirector({
      audio: this.audio,
      cameraRig: this.cameraRig,
      enemy: this.enemy,
      hud: this.hud,
      party: this.createBattleParty(),
      resetPosition: this.town.spawn,
      trigger: this.trigger,
      vfx: this.vfx,
    });
    this.debugPanel = new DebugPanel(
      document,
      this.battle.getPartyDebugOptions(),
      moveDebugOptions,
      this.town.getDebugPoses().map((pose) => ({ id: pose.id, label: pose.label })),
      false,
      {
      onCameraPose: (poseId) => {
        this.applyDebugPose(poseId, { cameraOnly: true });
      },
      onCollisionOverlayToggle: () => {
        this.town.setCollisionOverlay(!this.town.isCollisionOverlayVisible());
      },
      onBossModeChange: (enabled) => {
        this.battle.setBossMode(enabled);
      },
      onEquipMove: (heroId, slot, moveId) => {
        this.battle.setEquippedMove(slot, moveId, heroId);
      },
      onForceReady: (heroId) => {
        this.battle.forceReady(heroId);
      },
      onFreeCameraToggle: () => {
        this.toggleFreeCamera();
      },
      onMenuToggle: () => {
        this.gameMenu.toggle();
      },
      onOpeningCinematic: () => {
        void this.playOpeningCinematic(true);
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
      onTeleportPose: (poseId) => {
        this.applyDebugPose(poseId, { teleportOnly: true });
      },
      onWeatherCycle: () => {
        this.weather.cycle();
      },
    },
    );
    this.titleScreen = new TitleScreen(document, {
      onStart: () => {
        this.audio.stopTitle();
        this.audio.playTown();
        if (!this.openingCinematicPlayed) {
          void this.playOpeningCinematic(false);
        }
      },
    });

    this.world.scene.add(
      this.town.root,
      this.weather.root,
      this.hero.root,
      this.enemy.root,
      this.vfx.root,
      ...this.getSupportHeroRoots(),
    );
    this.hero.root.position.copy(this.town.spawn);
    this.hero.root.rotation.y = Math.PI;
    this.enemy.root.visible = false;
    this.syncPartyHud();
    this.updateSupportHeroVisibility();
    this.installResizeHandler();
    this.installInteractionHandler();
    this.installGlobalShortcuts();
    this.installTestApi();
    window.addEventListener('rpg:reset', () => {
      if (!this.titleScreen.isActive()) {
        this.audio.playTown();
      }
    });
    this.audio.playTitle();
  }

  static async mount(canvas: HTMLCanvasElement): Promise<GameApp> {
    const dialogueRepository = new DialogueRepository();
    const [hero, supportEntries, sceneDialogue] = await Promise.all([
      HeroCharacter.load(playerHeroDefinition),
      Promise.all(
        supportHeroDefinitions.map(async (definition) => {
          const character = await HeroCharacter.load(definition);
          return [definition.id, character] as const;
        }),
      ),
      dialogueRepository.loadScene('first-town'),
    ]);
    const app = new GameApp(canvas, hero, new Map(supportEntries), sceneDialogue);
    app.start();
    void app.loadSceneAssets();
    void app.loadEnemyAssets();
    return app;
  }

  private async loadSceneAssets(): Promise<void> {
    this.townAssetsLoading = true;
    try {
      await this.town.loadMeshyProps();
    } finally {
      this.townAssetsLoading = false;
    }
  }

  private async loadEnemyAssets(): Promise<void> {
    this.enemyAssetsLoading = true;
    try {
      await this.enemy.loadGeneratedAssets();
    } finally {
      this.enemyAssetsLoading = false;
    }
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

    this.town.update(deltaSeconds);
    this.weather.update(deltaSeconds);
    this.updateWorld(deltaSeconds);
    this.hero.update(deltaSeconds);
    this.supportHeroes.forEach((supportHero) => {
      supportHero.update(deltaSeconds);
    });
    this.updateTownCombatMode();
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

    if (this.cinematicActive || this.gameMenu.isActive()) {
      this.explorationVelocity.set(0, 0, 0);
      this.hero.play('explorationIdle');
      if (this.cameraRig.getMode() === 'free') {
        this.cameraRig.updateFreeCamera(this.input.getFreeCameraAxes(), deltaSeconds);
      } else {
        this.cameraRig.updateExploration(this.hero.root.position, this.heroForward, deltaSeconds);
      }
      this.updateSupportHeroes(deltaSeconds, true);
      return;
    }

    if (this.dialogueBox.isActive()) {
      this.explorationVelocity.set(0, 0, 0);
      this.hero.play('explorationIdle');
      this.cameraRig.updateExploration(this.hero.root.position, this.heroForward, deltaSeconds);
      this.updateSupportHeroes(deltaSeconds, true);
      return;
    }

    if (this.battle.getPhase() === 'exploration') {
      if (this.cameraRig.getMode() === 'free') {
        this.explorationVelocity.set(0, 0, 0);
        this.hero.play('explorationIdle');
        this.cameraRig.updateFreeCamera(this.input.getFreeCameraAxes(), deltaSeconds);
        this.updateSupportHeroes(deltaSeconds, true);
        return;
      }

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

      this.previousHeroPosition.copy(this.hero.root.position);
      this.proposedHeroPosition.copy(this.hero.root.position).addScaledVector(this.explorationVelocity, deltaSeconds);
      this.hero.root.position.copy(this.town.resolvePlayerPosition(this.previousHeroPosition, this.proposedHeroPosition));

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

  private updateTownCombatMode(): void {
    const enabled = this.battle.getPhase() !== 'exploration' && !this.titleScreen.isActive();
    if (enabled === this.townCombatMode) {
      return;
    }

    this.townCombatMode = enabled;
    this.town.setCombatMode(enabled);
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
    const townAssetInfo = this.town.getAssetSnapshot();
    const cameraInfo = this.cameraRig.snapshot();
    const weatherInfo = this.weather.snapshot();
    this.gameMenu.update(battle);
    const info: RuntimeDebugInfo = {
      fps: this.frameStats.fps,
      frameMs: this.frameStats.frameMs,
      playerX: this.hero.root.position.x,
      playerZ: this.hero.root.position.z,
      battle,
      bossMode: this.battle.isBossMode(),
      audioStatus: this.audio.getStatus(),
      cameraMode: cameraInfo.mode,
      cameraPreset: cameraInfo.preset,
      dialogueActive: this.dialogueBox.isActive(),
      enemyVisual: this.enemy.getVisualState().modelId ?? (this.enemyAssetsLoading ? 'loading' : 'fallback'),
      renderCalls: this.world.renderer.info.render.calls,
      renderGeometries: this.world.renderer.info.memory.geometries,
      renderTextures: this.world.renderer.info.memory.textures,
      renderTriangles: this.world.renderer.info.render.triangles,
      sceneId: this.town.sceneId,
      townAssetsFailed: townAssetInfo.failed.length,
      townAssetsLoaded: townAssetInfo.loaded.length,
      townAssetsLoading: this.townAssetsLoading,
      weatherMode: weatherInfo.mode,
      weatherParticles: weatherInfo.particleCount,
    };

    this.debugPanel.update(info);
    this.updateQaCaption(info);
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

  private installInteractionHandler(): void {
    window.addEventListener('keydown', (event) => {
      if (event.code !== 'KeyE' && event.code !== 'Enter' && event.code !== 'Space') {
        return;
      }

      if (this.dialogueBox.isActive()) {
        event.preventDefault();
        this.dialogueBox.advance();
        return;
      }

      if (this.titleScreen.isActive() || this.battle.getPhase() !== 'exploration') {
        return;
      }

      if (this.openNearestDialogue()) {
        event.preventDefault();
      }
    });
  }

  private installGlobalShortcuts(): void {
    window.addEventListener('keydown', (event) => {
      if (event.repeat) {
        return;
      }

      if (event.code === 'ShiftRight') {
        event.preventDefault();
        this.toggleFreeCamera();
        return;
      }

      if (event.code === 'KeyM' && !this.titleScreen.isActive()) {
        event.preventDefault();
        this.gameMenu.toggle();
        return;
      }

      if (event.code === 'Escape' && this.gameMenu.isActive()) {
        event.preventDefault();
        this.gameMenu.hide();
      }
    });
  }

  private openNearestDialogue(): boolean {
    const interaction = this.town.findNearestInteraction(this.hero.root.position);
    if (!interaction) {
      return false;
    }

    return this.openDialogue(interaction.npcId);
  }

  private openDialogue(npcId: string): boolean {
    return this.dialogueBox.show(this.sceneDialogue, npcId);
  }

  private applyDebugPose(
    poseId: string,
    options: { cameraOnly?: boolean; teleportOnly?: boolean } = {},
  ): boolean {
    const pose = this.town.getDebugPose(poseId);
    if (!pose) {
      return false;
    }

    this.town.setCollisionOverlay(Boolean(pose.collisionOverlay));
    if (!options.cameraOnly) {
      this.hero.root.position.copy(pose.player);
      this.hero.root.rotation.y = pose.yaw;
      setYawForward(this.hero.root.rotation.y, this.heroForward);
      this.explorationVelocity.set(0, 0, 0);
      this.updateSupportHeroes(0.016, true);
    }

    if (!options.teleportOnly) {
      this.cameraRig.setDebugPose(pose.camera, pose.lookAt, pose.fov, pose.id);
    }

    if (poseId.startsWith('battle.') && this.battle.getPhase() === 'exploration') {
      void this.battle.startBattle().then(() => {
        if (!options.teleportOnly) {
          this.cameraRig.setDebugPose(pose.camera, pose.lookAt, pose.fov, pose.id);
        }
      });
    }

    return true;
  }

  private setQaCaptureMode(enabled: boolean): void {
    this.qaCaptureMode = enabled;
    this.qaCaption.hidden = !enabled;
    document.body.classList.toggle('qa-capture-mode', enabled);
  }

  private updateQaCaption(info: RuntimeDebugInfo): void {
    if (!this.qaCaptureMode) {
      return;
    }

    this.qaCaption.textContent = [
      `FPS ${info.fps.toFixed(0)}`,
      `Draws ${info.renderCalls}`,
      `Tri ${info.renderTriangles}`,
      `Pose ${info.cameraPreset ?? info.cameraMode}`,
      `Weather ${info.weatherMode}`,
      `Enemy ${info.enemyVisual}`,
    ].join(' | ');
  }

  private toggleFreeCamera(): void {
    const enabled = this.cameraRig.getMode() !== 'free';
    this.cameraRig.setFreeCamera(enabled);
    if (!enabled) {
      this.town.setCollisionOverlay(false);
    }
  }

  private async playOpeningCinematic(fromDebug: boolean): Promise<void> {
    if (this.cinematicActive) {
      return;
    }

    this.openingCinematicPlayed = true;
    this.cinematicActive = true;
    this.gameMenu.hide();
    this.dialogueBox.hide();
    this.town.setCollisionOverlay(false);
    this.weather.setMode('mist');
    if (fromDebug && this.battle.getPhase() !== 'exploration') {
      this.battle.resetEncounter();
      await wait(120);
    }

    this.hero.root.position.set(2.1, 0, 5.15);
    this.hero.root.rotation.y = Math.PI;
    setYawForward(this.hero.root.rotation.y, this.heroForward);
    this.openingCaption.hidden = false;
    this.openingCaptionText.textContent = 'Ryuji reaches the square as Pip stumbles near the well.';
    this.cameraRig.setDebugPose(new Vector3(3.8, 2.15, 7.35), new Vector3(2.6, 1.05, 3.8), 43, 'opening.helping-pip');
    this.hero.play('run', { fadeSeconds: 0.08 });
    await wait(900);

    this.hero.play('chi', { loopOnce: true, fadeSeconds: 0.08, timeScale: 0.85 });
    this.vfx.setAura(true, 'healing');
    this.vfx.healingBloomAt(new Vector3(3.15, 0, 3.55));
    this.audio.playHealing();
    this.openingCaptionText.textContent = 'A quiet pulse steadies him before the storm can take hold.';
    await wait(1450);

    this.vfx.setAura(false);
    this.hero.play('explorationIdle');
    this.openingCaptionText.textContent = 'The north gate glows. The first battle waits beyond town.';
    this.cameraRig.setDebugPose(new Vector3(0, 4.2, -8.4), new Vector3(0, 1.2, -16.9), 46, 'opening.north-gate');
    await wait(1350);

    this.openingCaption.hidden = true;
    this.weather.setMode('clear');
    this.cameraRig.setExploration();
    this.cinematicActive = false;
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
        const cameraInfo = this.cameraRig.snapshot();
        const weatherInfo = this.weather.snapshot();
        return {
          audioStatus: this.audio.getStatus(),
          battleState: this.battle.getPhase(),
          bossMode: this.battle.isBossMode(),
          cameraInfo,
          collisionOverlay: this.town.isCollisionOverlayVisible(),
          debugPoses: this.town.getDebugPoses().map((pose) => ({ id: pose.id, label: pose.label })),
          dialogueActive: this.dialogueBox.isActive(),
          dialogueSpeaker: this.dialogueBox.getCurrentNpcName(),
          enemyHp: this.battle.enemyCombatant.hp,
          enemyVisual: {
            loading: this.enemyAssetsLoading,
            ...this.enemy.getVisualState(),
          },
          equippedMoves: this.battle.getEquippedMoves(),
          level: this.battle.getLevel(),
          meshyProps: this.town.getLoadedMeshyProps(),
          npcIds: this.town.getNpcIds(),
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
          renderInfo: {
            calls: this.world.renderer.info.render.calls,
            geometries: this.world.renderer.info.memory.geometries,
            textures: this.world.renderer.info.memory.textures,
            triangles: this.world.renderer.info.render.triangles,
          },
          sceneId: this.town.sceneId,
          supportHeroes: Array.from(this.activeSupportHeroIds),
          townAssetInfo: {
            fallbackIds: this.town.getFallbackIds(),
            loading: this.townAssetsLoading,
            ...this.town.getAssetSnapshot(),
          },
          townOccludersVisible: this.town.areCombatOccludersVisible(),
          vfxInfo: this.vfx.snapshot(),
          visualState: {
            attachments: {
              ryuji: this.hero.getAttachmentDebugState(),
              ...Object.fromEntries(
                Array.from(this.supportHeroes.entries(), ([id, character]) => [id, character.getAttachmentDebugState()]),
              ),
            },
          },
          xpGained: this.battle.getXpGained(),
          weatherInfo,
          qaCaptureMode: this.qaCaptureMode,
        };
      },
      interactWithNpc: (npcId: string) => this.openDialogue(npcId),
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
      setCameraPose: (position, lookAt, fov) => {
        this.cameraRig.setDebugPose(
          new Vector3(position.x, position.y, position.z),
          new Vector3(lookAt.x, lookAt.y, lookAt.z),
          fov,
          'api.custom',
        );
      },
      setCollisionOverlay: (enabled: boolean) => {
        this.town.setCollisionOverlay(enabled);
      },
      setDebugPose: (id, options) => this.applyDebugPose(id, options),
      setFreeCamera: (enabled) => {
        this.cameraRig.setFreeCamera(enabled);
      },
      setHeroYaw: (yaw) => {
        this.hero.root.rotation.y = yaw;
        setYawForward(this.hero.root.rotation.y, this.heroForward);
      },
      setQaCaptureMode: (enabled) => {
        this.setQaCaptureMode(enabled);
      },
      testGameOver: () => {
        void this.battle.testGameOver();
      },
      playOpeningCinematic: () => {
        void this.playOpeningCinematic(true);
      },
      toggleMenu: () => {
        this.gameMenu.toggle();
      },
      cycleWeather: () => {
        this.weather.cycle();
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
