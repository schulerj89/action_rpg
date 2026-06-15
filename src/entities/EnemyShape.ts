import {
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  RingGeometry,
  Vector3,
} from 'three';

export class EnemyShape {
  readonly root = new Group();
  readonly home = new Vector3(0, 1.05, -12);

  private readonly bodyMaterial = new MeshStandardMaterial({
    color: new Color('#cc3434'),
    emissive: new Color('#3d0808'),
    roughness: 0.38,
    metalness: 0.18,
  });
  private readonly light = new PointLight('#ff5959', 0.8, 5);
  private hitTimer = 0;

  constructor() {
    const body = new Mesh(new IcosahedronGeometry(1.1, 2), this.bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;

    const base = new Mesh(
      new RingGeometry(1.15, 1.35, 36),
      new MeshStandardMaterial({
        color: '#f07167',
        emissive: '#6b1111',
        transparent: true,
        opacity: 0.55,
      }),
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = -1;

    this.light.position.set(0, 0.4, 0.4);
    this.root.add(body, base, this.light);
    this.reset();
  }

  update(deltaSeconds: number): void {
    this.root.rotation.y += deltaSeconds * 0.7;
    this.root.position.y = this.home.y + Math.sin(performance.now() * 0.002) * 0.12;

    if (this.hitTimer > 0) {
      this.hitTimer -= deltaSeconds;
      const intensity = Math.max(this.hitTimer / 0.22, 0);
      this.bodyMaterial.emissive.setRGB(1.2 * intensity, 0.08, 0.06);
      this.light.intensity = 0.8 + intensity * 5;
    } else {
      this.bodyMaterial.emissive.set('#3d0808');
      this.light.intensity = 0.8;
    }
  }

  flashHit(): void {
    this.hitTimer = 0.22;
  }

  reset(): void {
    this.root.position.copy(this.home);
    this.root.visible = true;
  }
}
