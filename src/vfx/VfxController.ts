import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three';

export class VfxController {
  readonly root = new Group();

  private readonly aura = new Group();
  private readonly auraLight = new PointLight('#67f7ff', 0, 7);
  private readonly burst = new Mesh(
    new SphereGeometry(0.7, 24, 16),
    new MeshBasicMaterial({
      color: new Color('#f7fbff'),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  private auraActive = false;
  private burstTimer = 0;

  constructor() {
    const ringMaterial = new MeshBasicMaterial({
      color: '#5dfcff',
      transparent: true,
      opacity: 0.52,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    for (let index = 0; index < 3; index += 1) {
      const ring = new Mesh(new RingGeometry(0.72 + index * 0.2, 0.78 + index * 0.2, 64), ringMaterial.clone());
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = (Math.PI / 3) * index;
      ring.position.y = 0.35 + index * 0.42;
      this.aura.add(ring);
    }

    this.aura.visible = false;
    this.aura.add(this.auraLight);
    this.root.add(this.aura, this.burst);
  }

  update(deltaSeconds: number, heroPosition: Vector3): void {
    this.aura.position.copy(heroPosition);
    this.aura.rotation.y += deltaSeconds * 2.8;
    this.auraLight.intensity = this.auraActive ? 4.2 + Math.sin(performance.now() * 0.012) * 0.8 : 0;

    if (this.burstTimer > 0) {
      this.burstTimer -= deltaSeconds;
      const progress = Math.max(this.burstTimer / 0.32, 0);
      this.burst.scale.setScalar(1 + (1 - progress) * 5.5);
      const material = this.burst.material;
      if (material instanceof MeshBasicMaterial) {
        material.opacity = progress;
      }
    }
  }

  setAura(active: boolean): void {
    this.auraActive = active;
    this.aura.visible = active;
  }

  burstAt(position: Vector3): void {
    this.burst.position.copy(position);
    this.burstTimer = 0.32;
  }
}
