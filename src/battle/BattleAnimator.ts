import { Vector3 } from 'three';
import { wait, tweenVector3 } from '../core/tween';
import type { BattleTunables } from '../core/types';
import type { EnemyShape } from '../entities/EnemyShape';
import type { HeroCharacter } from '../entities/HeroCharacter';

export class BattleAnimator {
  private readonly tunables: BattleTunables;

  constructor(tunables: BattleTunables) {
    this.tunables = tunables;
  }

  async heroAttack(
    hero: HeroCharacter,
    enemyPosition: Vector3,
    heroAnchor: Vector3,
    onImpact: () => void,
  ): Promise<void> {
    const strikePosition = enemyPosition.clone();
    strikePosition.z += 1.55;
    strikePosition.y = 0;

    hero.faceToward(enemyPosition);
    hero.play('run', { fadeSeconds: 0.12 });
    await tweenVector3(hero.root.position, strikePosition, this.tunables.approachDurationMs);

    hero.faceToward(enemyPosition);
    hero.play('attack', { loopOnce: true, fadeSeconds: 0.08, timeScale: 1.18 });
    await wait(460);
    onImpact();
    await wait(460);

    hero.play('run', { fadeSeconds: 0.12 });
    hero.faceToward(heroAnchor);
    await tweenVector3(hero.root.position, heroAnchor, this.tunables.returnDurationMs);
    hero.faceToward(enemyPosition);
    hero.play('idle');
  }

  async enemyAttack(
    enemy: EnemyShape,
    heroPosition: Vector3,
    enemyAnchor: Vector3,
    onImpact: () => void,
  ): Promise<void> {
    const strikePosition = heroPosition.clone();
    strikePosition.z -= 1.8;
    strikePosition.y = enemy.root.position.y;
    await tweenVector3(enemy.root.position, strikePosition, this.tunables.enemyActionDurationMs * 0.45);
    onImpact();
    await tweenVector3(enemy.root.position, enemyAnchor, this.tunables.enemyActionDurationMs * 0.55);
  }

  async heroVictory(hero: HeroCharacter): Promise<void> {
    hero.play('victory', { loopOnce: true, fadeSeconds: 0.12 });
  }
}
