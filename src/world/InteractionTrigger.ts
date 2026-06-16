import { Vector3 } from 'three';

export interface InteractionTriggerConfig {
  id: string;
  kind: 'dialogue';
  npcId: string;
  position: Vector3;
  radius: number;
}

export class InteractionTrigger {
  readonly id: string;
  readonly kind: 'dialogue';
  readonly npcId: string;
  readonly position: Vector3;
  readonly radius: number;

  constructor(config: InteractionTriggerConfig) {
    this.id = config.id;
    this.kind = config.kind;
    this.npcId = config.npcId;
    this.position = config.position;
    this.radius = config.radius;
  }

  distanceTo(position: Vector3): number {
    return this.position.distanceTo(position);
  }

  check(position: Vector3): boolean {
    return this.distanceTo(position) <= this.radius;
  }
}
