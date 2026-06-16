export type BattlePhase =
  | 'exploration'
  | 'intro'
  | 'charging'
  | 'awaitingCommand'
  | 'playerAction'
  | 'enemyAction'
  | 'chiCinematic'
  | 'victory'
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
  | 'slam'
  | 'hit'
  | 'victory';

export type PhysicalMoveId =
  | 'ironPalm'
  | 'dragonHeel'
  | 'tigerHook'
  | 'risingUppercut'
  | 'craneHighKick'
  | 'sweepKick'
  | 'lungeSpinKick';
export type ChiMoveId = 'chiBreaker' | 'healingChi';
export type MoveId = PhysicalMoveId | ChiMoveId;
export type ChiMoveKind = 'damage' | 'heal';
export type StatKey = keyof HeroStats;
export type MoveBannerTone = 'player' | 'enemy' | 'chi' | 'healing';

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

export interface BattleSnapshot {
  phase: BattlePhase;
  player: CombatantSnapshot;
  enemy: CombatantSnapshot;
  canAct: boolean;
  equippedMoves: EquippedMoveSnapshot[];
  logLine: string;
}

export interface LevelUpGain {
  stat: StatKey;
  amount: number;
  nextValue: number;
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
}

export interface RpgTestApi {
  equipMove: (slot: number, moveId: MoveId) => void;
  forceReady: () => void;
  getState: () => {
    audioStatus: string;
    battleState: BattlePhase;
    bossMode: boolean;
    enemyHp: number;
    equippedMoves: MoveId[];
    level: number;
    playerAtb: number;
    playerHp: number;
    playerChi: number;
    position: { x: number; z: number };
    xpGained: number;
  };
  forceEnemyReady: () => void;
  movePlayerToBattleTrigger: () => void;
  muteAudio: () => void;
  setEnemyHp: (value: number) => void;
  setBossMode: (enabled: boolean) => void;
  setPlayerPosition: (x: number, z: number) => void;
}

declare global {
  interface Window {
    __rpgTest?: RpgTestApi;
  }
}
