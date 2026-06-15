import type { Mesh, Vector3 } from 'three';

export class EncounterTrigger {
  private readonly position: Vector3;
  private readonly radius: number;
  private readonly pad: Mesh;
  private active = true;

  constructor(position: Vector3, radius: number, pad: Mesh) {
    this.position = position;
    this.radius = radius;
    this.pad = pad;
  }

  check(playerPosition: Vector3): boolean {
    if (!this.active) {
      return false;
    }

    const distance = playerPosition.distanceTo(this.position);
    if (distance <= this.radius) {
      this.active = false;
      this.pad.visible = false;
      return true;
    }

    return false;
  }

  reset(): void {
    this.active = true;
    this.pad.visible = true;
  }

  getPosition(): Vector3 {
    return this.position;
  }
}
