import { Vector3 } from 'three';

export interface AabbCollider {
  id: string;
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
}

export class CollisionResolver {
  private readonly colliders: AabbCollider[];
  private readonly radius: number;

  constructor(colliders: AabbCollider[], radius = 0.38) {
    this.colliders = colliders;
    this.radius = radius;
  }

  resolve(previous: Vector3, proposed: Vector3): Vector3 {
    if (!this.collides(proposed)) {
      return proposed;
    }

    const xOnly = proposed.clone();
    xOnly.z = previous.z;
    if (!this.collides(xOnly)) {
      return xOnly;
    }

    const zOnly = proposed.clone();
    zOnly.x = previous.x;
    if (!this.collides(zOnly)) {
      return zOnly;
    }

    return previous;
  }

  private collides(position: Vector3): boolean {
    return this.colliders.some((collider) => circleIntersectsAabb(position.x, position.z, this.radius, collider));
  }
}

function circleIntersectsAabb(x: number, z: number, radius: number, collider: AabbCollider): boolean {
  const nearestX = Math.max(collider.minX, Math.min(x, collider.maxX));
  const nearestZ = Math.max(collider.minZ, Math.min(z, collider.maxZ));
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}
