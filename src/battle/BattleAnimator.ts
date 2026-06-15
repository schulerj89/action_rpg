import { Vector3 } from 'three';
import { wait, tweenVector3 } from '../core/tween';
import type { BattleTunables, PhysicalMoveDefinition } from '../core/types';
import type { EnemyShape } from '../entities/EnemyShape';
import type { HeroCharacter } from '../entities/HeroCharacter';

export class BattleAnimator {
  private readonly tunables: BattleTunables;

  constructor(tunables: BattleTunables) {
    this.tunables = tunables;
  }

  async heroPhysicalMove(
    hero: HeroCharacter,
    enemyPosition: Vector3,
    heroAnchor: Vector3,
    move: PhysicalMoveDefinition,
    onImpact: () => void,
  ): Promise<void> {
    const approachDirection = safeDirection(enemyPosition.clone().sub(hero.root.position).setY(0), new Vector3(0, 0, -1));
    const strikePosition = enemyPosition.clone().addScaledVector(approachDirection, -move.stopDistance);
    strikePosition.y = 0;

    hero.faceToward(enemyPosition);
    hero.play('run', { fadeSeconds: 0.12 });
    await tweenVector3(hero.root.position, strikePosition, this.tunables.approachDurationMs);

    hero.faceToward(enemyPosition);
    hero.play(move.animation, { loopOnce: true, fadeSeconds: 0.08, timeScale: move.timeScale });
    await wait(move.impactDelayMs);
    onImpact();
    await wait(move.recoveryMs);

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
    const approachDirection = safeDirection(heroPosition.clone().sub(enemy.root.position).setY(0), new Vector3(0, 0, 1));
    const strikePosition = heroPosition.clone().addScaledVector(approachDirection, -1.95);
    strikePosition.y = enemy.root.position.y;
    await tweenVector3(enemy.root.position, strikePosition, this.tunables.enemyActionDurationMs * 0.45);
    onImpact();
    await tweenVector3(enemy.root.position, enemyAnchor, this.tunables.enemyActionDurationMs * 0.55);
  }

  async heroVictory(hero: HeroCharacter): Promise<void> {
    hero.play('victory', { loopOnce: true, fadeSeconds: 0.12 });
  }
}

function safeDirection(direction: Vector3, fallback: Vector3): Vector3 {
  if (direction.lengthSq() < 0.0001) {
    return fallback.clone().normalize();
  }

  return direction.normalize();
}
