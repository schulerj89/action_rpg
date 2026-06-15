import type { BattleTunables, HeroStats } from '../core/types';

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
  vitality: 16,
  focus: 4,
  defense: 5,
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
