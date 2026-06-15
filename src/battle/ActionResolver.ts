import type { BattleTunables } from '../core/types';
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

  resolveAttack(attacker: Combatant, defender: Combatant): ActionResult {
    const rawDamage =
      attacker.stats.strength * 4.2 +
      attacker.stats.dexterity * 1.35 -
      defender.stats.defense * this.tunables.attackDefenseScale;
    const damage = defender.applyDamage(rawDamage);
    attacker.gainChi(8);

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
