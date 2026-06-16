import type { BattleTunables, ChiMoveDefinition, PhysicalMoveDefinition } from '../core/types';
import type { Combatant } from './Combatant';

export interface ActionResult {
  damage: number;
  defeated: boolean;
  healing?: number;
}

export class ActionResolver {
  private readonly tunables: BattleTunables;

  constructor(tunables: BattleTunables) {
    this.tunables = tunables;
  }

  resolvePhysicalMove(
    attacker: Combatant,
    defender: Combatant,
    move: PhysicalMoveDefinition,
  ): ActionResult {
    const rawDamage =
      attacker.stats.strength * move.strengthScale +
      attacker.stats.dexterity * move.dexterityScale +
      move.flatBonus -
      defender.stats.defense * this.tunables.attackDefenseScale;
    const damage = defender.applyDamage(rawDamage);
    attacker.gainChi(move.chiGain);

    return { damage, defeated: defender.hp <= 0 };
  }

  resolveChiDamage(attacker: Combatant, defender: Combatant, move: ChiMoveDefinition): ActionResult {
    const rawDamage =
      attacker.stats.focus * move.focusScale +
      attacker.stats.strength * move.strengthScale +
      move.flatBonus -
      defender.stats.defense;
    const damage = defender.applyDamage(rawDamage);

    return { damage, defeated: defender.hp <= 0 };
  }

  resolveChiHealing(caster: Combatant, move: ChiMoveDefinition): ActionResult {
    const rawHealing =
      caster.stats.focus * move.focusScale +
      caster.stats.strength * move.strengthScale +
      move.flatBonus;
    const healing = caster.heal(rawHealing);

    return { damage: 0, defeated: false, healing };
  }

  resolveEnemyAttack(attacker: Combatant, defender: Combatant): ActionResult {
    const rawDamage = attacker.stats.strength * 2.4 - defender.stats.defense * 0.75 + 8;
    const damage = defender.applyDamage(rawDamage);

    return { damage, defeated: defender.hp <= 0 };
  }
}
