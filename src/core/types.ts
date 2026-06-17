export type BattlePhase =
  | 'exploration'
  | 'intro'
  | 'charging'
  | 'awaitingCommand'
  | 'playerAction'
  | 'enemyAction'
  | 'chiCinematic'
  | 'victory'
  | 'gameOver'
  | 'resetting';

export type HeroAnimationKey =
  | 'explorationIdle'
  | 'battleIdle'
  | 'run'
  | 'attack'
  | 'kick'
  | 'hook'
  | 'uppercut'
  | 'highKick'
  | 'sweepKick'
  | 'lungeSpinKick'
  | 'chi'
  | 'mageCast7'
  | 'slam'
  | 'hit'
  | 'dead'
  | 'victory';

export type PhysicalMoveId =
  | 'ironPalm'
  | 'dragonHeel'
  | 'tigerHook'
  | 'risingUppercut'
  | 'craneHighKick'
  | 'sweepKick'
  | 'lungeSpinKick';
export type ChiMoveId =
  | 'spiritFlare'
  | 'starfallHex'
  | 'astralCascade'
  | 'thunderfall'
  | 'chiBreaker'
  | 'healingChi';
export type MoveId = PhysicalMoveId | ChiMoveId;
export type ChiMoveKind = 'damage' | 'heal';
export type StatKey = keyof HeroStats;
export type MoveBannerTone = 'player' | 'enemy' | 'chi' | 'healing' | 'magic' | 'thunder';

export interface HeroStats {
  strength: number;
  dexterity: number;
  vitality: number;
  focus: number;
  defense: number;
}

export interface CombatantSnapshot {
  name: string;
  hp: number;
  maxHp: number;
  chi: number;
  maxChi: number;
  atb: number;
  stats: HeroStats;
}

export interface PartyCombatantSnapshot extends CombatantSnapshot {
  active: boolean;
  canAct: boolean;
  equippedMoves: EquippedMoveSnapshot[];
  id: string;
  lastXpGained: number;
  level: number;
  portraitUrl: string;
  role: string;
  xp: number;
}

export interface BattleSnapshot {
  phase: BattlePhase;
  player: CombatantSnapshot;
  party: PartyCombatantSnapshot[];
  enemy: CombatantSnapshot;
  canAct: boolean;
  activeActorId?: string;
  equippedMoves: EquippedMoveSnapshot[];
  logLine: string;
}

export interface LevelUpGain {
  stat: StatKey;
  amount: number;
  nextValue: number;
}

export interface CharacterRewardSummary {
  level: number;
  name: string;
  portraitUrl: string;
  statGains: LevelUpGain[];
  totalXp: number;
  xpGained: number;
}

export interface EquippedMoveSnapshot {
  id: MoveId;
  name: string;
  chiCost: number;
}

export interface PhysicalMoveDefinition {
  id: PhysicalMoveId;
  name: string;
  animation: HeroAnimationKey;
  strengthScale: number;
  dexterityScale: number;
  flatBonus: number;
  chiGain: number;
  stopDistance: number;
  impactDelayMs: number;
  recoveryMs: number;
  timeScale: number;
}

export interface ChiMoveDefinition {
  id: ChiMoveId;
  name: string;
  kind: ChiMoveKind;
  animation?: HeroAnimationKey;
  special?: 'mageRanged' | 'thunder';
  tone?: MoveBannerTone;
  chiCost: number;
  focusScale: number;
  strengthScale: number;
  flatBonus: number;
  chargeMs: number;
  flashMs: number;
  timeScale: number;
}

export interface BattleTunables {
  atbMax: number;
  playerAtbMultiplier: number;
  enemyAtbMultiplier: number;
  attackDefenseScale: number;
  chiMultiplier: number;
  chiFlatBonus: number;
  chiCost: number;
  approachDurationMs: number;
  returnDurationMs: number;
  enemyActionDurationMs: number;
  chiChargeMs: number;
  chiFlashMs: number;
  victoryHoldMs: number;
}

export interface RuntimeDebugInfo {
  fps: number;
  frameMs: number;
  playerX: number;
  playerZ: number;
  battle: BattleSnapshot;
  bossMode: boolean;
  audioStatus: string;
  dialogueActive: boolean;
  cameraMode: string;
  cameraPreset?: string;
  enemyVisual: string;
  renderCalls: number;
  renderGeometries: number;
  renderTextures: number;
  renderTriangles: number;
  sceneId: string;
  townAssetsFailed: number;
  townAssetsLoaded: number;
  townAssetsLoading: boolean;
  weatherMode: string;
  weatherParticles: number;
}

export interface RpgTestApi {
  equipMove: (slot: number, moveId: MoveId) => void;
  equipHeroMove: (heroId: string, slot: number, moveId: MoveId) => void;
  forceReady: () => void;
  forceHeroReady: (heroId: string) => void;
  getState: () => {
    audioStatus: string;
    activeActorId?: string;
    battleState: BattlePhase;
    bossMode: boolean;
    enemyHp: number;
    equippedMoves: MoveId[];
    enemyVisual: {
      loaded: string[];
      loading: boolean;
      modelId?: string;
    };
    dialogueActive: boolean;
    dialogueSpeaker?: string;
    level: number;
    meshyProps: string[];
    npcIds: string[];
    party: Array<{
      active: boolean;
      atb: number;
      chi: number;
      hp: number;
      id: string;
      level: number;
      moves: MoveId[];
      name: string;
      xp: number;
    }>;
    playerAtb: number;
    playerHp: number;
    playerChi: number;
    position: { x: number; z: number };
    cameraInfo: {
      fov: number;
      mode: string;
      position: { x: number; y: number; z: number };
      preset?: string;
    };
    collisionOverlay: boolean;
    currentRoom: string;
    debugPoses: Array<{
      id: string;
      label: string;
    }>;
    economy: {
      equippedWeaponByHero: Record<string, string>;
      gold: number;
      inventory: Record<string, number>;
    };
    renderInfo: {
      calls: number;
      geometries: number;
      textures: number;
      triangles: number;
    };
    sceneId: string;
    shopId?: string;
    shopMenuActive: boolean;
    supportHeroes: string[];
    assetRoomInfo: Array<{
      id: string;
      status: 'failed' | 'loaded' | 'loading';
    }>;
    battleRoomInfo: {
      id: string;
      visible: boolean;
    };
    regionMapInfo?: {
      activeZones: string[];
      battleScenes: Array<{
        id: string;
        terrainZone: string;
        theme: string;
      }>;
      id: string;
      version: number;
    };
    routeInfo: {
      fieldEnemyVisible: boolean;
      fixedFieldEnemyDefeated: boolean;
      nextTownName: string;
      northRouteStartZ: number;
      postBattleCinematicPlayed: boolean;
    };
    outsideEncounterInfo: {
      active: boolean;
      cap: number;
      count: number;
      meters: number;
      nextMeters: number;
    };
    objectiveInfo: {
      checklist: Array<{
        complete: boolean;
        id: string;
        label: string;
      }>;
      description: string;
      id: string;
      title: string;
    };
    townAssetInfo: {
      failed: string[];
      fallbackIds: string[];
      instanceCounts: Record<string, number>;
      loaded: string[];
      loading: boolean;
      records: Array<{
        id: string;
        loadMs: number;
        status: 'loaded' | 'failed' | 'missing';
      }>;
    };
    townOccludersVisible: boolean;
    vfxInfo: {
      activeEffects: string[];
      activeLights: number;
    };
    visualState: {
      attachments: Record<
        string,
        Array<{
          bounds: {
            max: { x: number; y: number; z: number };
            min: { x: number; y: number; z: number };
          };
          id: string;
          visible: boolean;
        }>
      >;
    };
    xpGained: number;
    weatherInfo: {
      mode: string;
      particleCount: number;
      sky: string;
    };
    qaCaptureMode: boolean;
    sceneCaptureMode: boolean;
  };
  forceEnemyReady: () => void;
  interactWithNpc: (npcId: string) => boolean;
  enterAssetRoom: () => void;
  enterShop: (shopId: 'potions' | 'weapons') => void;
  openShopInteraction: () => boolean;
  openShopMenu: (shopId: 'potions' | 'weapons') => void;
  exitSpecialRoom: () => void;
  buyItem: (itemId: string) => boolean;
  equipWeapon: (itemId: string) => boolean;
  movePlayerToBattleTrigger: () => void;
  muteAudio: () => void;
  setEnemyHp: (value: number) => void;
  setBossMode: (enabled: boolean) => void;
  setHeroStat: (heroId: string, key: StatKey, value: number) => void;
  setPlayerHp: (value: number) => void;
  setPlayerPosition: (x: number, z: number) => void;
  setCameraPose: (position: { x: number; y: number; z: number }, lookAt: { x: number; y: number; z: number }, fov?: number) => void;
  setCollisionOverlay: (enabled: boolean) => void;
  setDebugPose: (id: string, options?: { cameraOnly?: boolean; teleportOnly?: boolean }) => boolean;
  setFreeCamera: (enabled: boolean) => void;
  setHeroYaw: (yaw: number) => void;
  setQaCaptureMode: (enabled: boolean, sceneOnly?: boolean) => void;
  setSupportHeroActive: (id: string, active: boolean) => void;
  resetRouteEncounter: () => void;
  playPostBattleCinematic: () => void;
  playOpeningCinematic: () => void;
  toggleMenu: () => void;
  testGameOver: () => void;
  cycleWeather: () => void;
}

declare global {
  interface Window {
    __rpgTest?: RpgTestApi;
  }
}
