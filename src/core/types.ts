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
  | 'idle'
  | 'run'
  | 'attack'
  | 'kick'
  | 'chi'
  | 'slam'
  | 'hit'
  | 'victory';

export type PhysicalMoveId = 'ironPalm' | 'dragonHeel';

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
  logLine: string;
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
  audioStatus: string;
}

export interface RpgTestApi {
  forceReady: () => void;
  getState: () => {
    audioStatus: string;
    battleState: BattlePhase;
    enemyHp: number;
    playerAtb: number;
    playerHp: number;
    position: { x: number; z: number };
  };
  forceEnemyReady: () => void;
  movePlayerToBattleTrigger: () => void;
  muteAudio: () => void;
  setEnemyHp: (value: number) => void;
  setPlayerPosition: (x: number, z: number) => void;
}

declare global {
  interface Window {
    __rpgTest?: RpgTestApi;
  }
}
