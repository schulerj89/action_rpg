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
  renderCalls: number;
  renderGeometries: number;
  renderTextures: number;
  renderTriangles: number;
  sceneId: string;
  townAssetsFailed: number;
  townAssetsLoaded: number;
  townAssetsLoading: boolean;
}

export interface RpgTestApi {
  equipMove: (slot: number, moveId: MoveId) => void;
  equipHeroMove: (heroId: string, slot: number, moveId: MoveId) => void;
  forceReady: () => void;
  forceHeroReady: (heroId: string) => void;
  getState: () => {
    audioStatus: string;
    battleState: BattlePhase;
    bossMode: boolean;
    enemyHp: number;
    equippedMoves: MoveId[];
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
    renderInfo: {
      calls: number;
      geometries: number;
      textures: number;
      triangles: number;
    };
    sceneId: string;
    supportHeroes: string[];
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
  };
  forceEnemyReady: () => void;
  interactWithNpc: (npcId: string) => boolean;
  movePlayerToBattleTrigger: () => void;
  muteAudio: () => void;
  setEnemyHp: (value: number) => void;
  setBossMode: (enabled: boolean) => void;
  setHeroStat: (heroId: string, key: StatKey, value: number) => void;
  setPlayerHp: (value: number) => void;
  setPlayerPosition: (x: number, z: number) => void;
  setSupportHeroActive: (id: string, active: boolean) => void;
  testGameOver: () => void;
}

declare global {
  interface Window {
    __rpgTest?: RpgTestApi;
  }
}
