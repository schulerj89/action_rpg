import type { BattleTunables, PhysicalMoveDefinition } from '../core/types';
import type { Combatant } from './Combatant';

export interface ActionResult {
  damage: number;
  defeated: boolean;
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

  resolveChi(attacker: Combatant, defender: Combatant): ActionResult {
    const rawDamage =
      attacker.stats.focus * this.tunables.chiMultiplier +
      attacker.stats.strength * 2.1 +
      this.tunables.chiFlatBonus -
      defender.stats.defense;
    const damage = defender.applyDamage(rawDamage);

    return { damage, defeated: defender.hp <= 0 };
  }

  resolveEnemyAttack(attacker: Combatant, defender: Combatant): ActionResult {
    const rawDamage = attacker.stats.strength * 2.4 - defender.stats.defense * 0.75 + 8;
    const damage = defender.applyDamage(rawDamage);

    return { damage, defeated: defender.hp <= 0 };
  }
}
