import type { ShopId } from '../config/economy';
import { Vector3 } from 'three';

export interface InteractionTriggerConfig {
  id: string;
  kind: 'dialogue' | 'shop';
  npcId?: string;
  position: Vector3;
  radius: number;
  shopId?: ShopId;
}

export class InteractionTrigger {
  readonly id: string;
  readonly kind: 'dialogue' | 'shop';
  readonly npcId?: string;
  readonly position: Vector3;
  readonly radius: number;
  readonly shopId?: ShopId;

  constructor(config: InteractionTriggerConfig) {
    this.id = config.id;
    this.kind = config.kind;
    this.npcId = config.npcId;
    this.position = config.position;
    this.radius = config.radius;
    this.shopId = config.shopId;
  }

  distanceTo(position: Vector3): number {
    return this.position.distanceTo(position);
  }

  check(position: Vector3): boolean {
    return this.distanceTo(position) <= this.radius;
  }
}
