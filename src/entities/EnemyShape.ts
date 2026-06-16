import {
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  RingGeometry,
  TorusKnotGeometry,
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
  private readonly baseMaterial = new MeshStandardMaterial({
    color: '#f07167',
    emissive: '#6b1111',
    transparent: true,
    opacity: 0.55,
  });
  private readonly body = new Mesh<BufferGeometry, MeshStandardMaterial>(
    new IcosahedronGeometry(1.1, 2),
    this.bodyMaterial,
  );
  private readonly base = new Mesh(new RingGeometry(1.15, 1.35, 36), this.baseMaterial);
  private readonly light = new PointLight('#ff5959', 0.8, 5);
  private bossMode = false;
  private hitTimer = 0;

  constructor() {
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.base.rotation.x = -Math.PI / 2;
    this.base.position.y = -1;

    this.light.position.set(0, 0.4, 0.4);
    this.root.add(this.body, this.base, this.light);
    this.reset();
  }

  update(deltaSeconds: number): void {
    this.root.rotation.y += deltaSeconds * (this.bossMode ? 0.95 : 0.7);
    this.root.position.y = this.home.y + Math.sin(performance.now() * 0.002) * 0.12;

    if (this.hitTimer > 0) {
      this.hitTimer -= deltaSeconds;
      const intensity = Math.max(this.hitTimer / 0.22, 0);
      this.bodyMaterial.emissive.setRGB(1.2 * intensity, this.bossMode ? 0.65 * intensity : 0.08, 0.12);
      this.light.intensity = this.getBaseLightIntensity() + intensity * 5;
    } else {
      this.bodyMaterial.emissive.set(this.bossMode ? '#26105f' : '#3d0808');
      this.light.intensity = this.getBaseLightIntensity();
    }
  }

  flashHit(): void {
    this.hitTimer = 0.22;
  }

  setBossMode(enabled: boolean): void {
    if (this.bossMode === enabled) {
      return;
    }

    this.bossMode = enabled;
    this.body.geometry.dispose();
    this.body.geometry = enabled ? new TorusKnotGeometry(0.9, 0.26, 96, 18) : new IcosahedronGeometry(1.1, 2);
    this.root.scale.setScalar(enabled ? 1.34 : 1);

    this.bodyMaterial.color.set(enabled ? '#6d28d9' : '#cc3434');
    this.bodyMaterial.emissive.set(enabled ? '#26105f' : '#3d0808');
    this.bodyMaterial.roughness = enabled ? 0.26 : 0.38;
    this.bodyMaterial.metalness = enabled ? 0.34 : 0.18;
    this.baseMaterial.color.set(enabled ? '#fbbf24' : '#f07167');
    this.baseMaterial.emissive.set(enabled ? '#7c2d12' : '#6b1111');
    this.light.color.set(enabled ? '#fde68a' : '#ff5959');
    this.light.intensity = this.getBaseLightIntensity();
  }

  reset(): void {
    this.root.position.copy(this.home);
    this.root.rotation.set(0, 0, 0);
    this.root.visible = true;
  }

  private getBaseLightIntensity(): number {
    return this.bossMode ? 1.35 : 0.8;
  }
}
