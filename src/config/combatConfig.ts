import type {
  BattleTunables,
  HeroStats,
  PhysicalMoveDefinition,
  PhysicalMoveId,
} from '../core/types';

export const heroBaseStats: HeroStats = {
  strength: 14,
  dexterity: 13,
  vitality: 12,
  focus: 14,
  defense: 8,
};

export const enemyBaseStats: HeroStats = {
  strength: 9,
  dexterity: 7,
  vitality: 28,
  focus: 4,
  defense: 5,
};

export const playerPhysicalMoves: Record<PhysicalMoveId, PhysicalMoveDefinition> = {
  ironPalm: {
    id: 'ironPalm',
    name: 'Iron Palm Rush',
    animation: 'attack',
    strengthScale: 4.2,
    dexterityScale: 1.35,
    flatBonus: 0,
    chiGain: 8,
    stopDistance: 1.92,
    impactDelayMs: 460,
    recoveryMs: 460,
    timeScale: 1.18,
  },
  dragonHeel: {
    id: 'dragonHeel',
    name: 'Dragon Heel Kick',
    animation: 'kick',
    strengthScale: 3.15,
    dexterityScale: 2.55,
    flatBonus: 10,
    chiGain: 10,
    stopDistance: 2.18,
    impactDelayMs: 540,
    recoveryMs: 430,
    timeScale: 1.05,
  },
};

export const battleTunables: BattleTunables = {
  atbMax: 100,
  playerAtbMultiplier: 5.2,
  enemyAtbMultiplier: 3.4,
  attackDefenseScale: 1.55,
  chiMultiplier: 7.5,
  chiFlatBonus: 32,
  chiCost: 30,
  approachDurationMs: 540,
  returnDurationMs: 520,
  enemyActionDurationMs: 600,
  chiChargeMs: 1450,
  chiFlashMs: 260,
  victoryHoldMs: 3200,
};
