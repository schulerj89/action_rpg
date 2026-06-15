import type { BattleTunables } from '../core/types';
import type { Combatant } from './Combatant';

export class ATBController {
  private readonly tunables: BattleTunables;

  constructor(tunables: BattleTunables) {
    this.tunables = tunables;
  }

  update(deltaSeconds: number, player: Combatant, enemy: Combatant): void {
    player.atb = Math.min(
      this.tunables.atbMax,
      player.atb + deltaSeconds * player.stats.dexterity * this.tunables.playerAtbMultiplier,
    );
    enemy.atb = Math.min(
      this.tunables.atbMax,
      enemy.atb + deltaSeconds * enemy.stats.dexterity * this.tunables.enemyAtbMultiplier,
    );
  }

  consume(combatant: Combatant): void {
    combatant.atb = 0;
  }

  forceReady(combatant: Combatant): void {
    combatant.atb = this.tunables.atbMax;
  }
}
