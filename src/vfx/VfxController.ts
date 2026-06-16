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

type AuraStyle = 'chi' | 'healing';

export class VfxController {
  readonly root = new Group();

  private readonly aura = new Group();
  private readonly auraLight = new PointLight('#67f7ff', 0, 7);
  private readonly footCharge = new Group();
  private readonly footChargeLight = new PointLight('#b9fbff', 0, 3.2);
  private readonly footChargeMaterials: MeshBasicMaterial[] = [];
  private readonly auraMaterials: MeshBasicMaterial[] = [];
  private readonly burstMaterial = new MeshBasicMaterial({
    color: new Color('#f7fbff'),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  private readonly burst = new Mesh(new SphereGeometry(0.7, 24, 16), this.burstMaterial);
  private auraStyle: AuraStyle = 'chi';
  private auraActive = false;
  private footChargeActive = false;
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
      const material = ringMaterial.clone();
      const ring = new Mesh(new RingGeometry(0.72 + index * 0.2, 0.78 + index * 0.2, 64), material);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = (Math.PI / 3) * index;
      ring.position.y = 0.35 + index * 0.42;
      this.auraMaterials.push(material);
      this.aura.add(ring);
    }

    this.aura.visible = false;
    this.aura.add(this.auraLight);
    this.buildFootCharge();
    this.root.add(this.aura, this.footCharge, this.burst);
  }

  update(deltaSeconds: number, heroPosition: Vector3, heroYaw = 0, chargedFootPosition?: Vector3): void {
    this.aura.position.copy(heroPosition);
    this.aura.rotation.y += deltaSeconds * (this.auraStyle === 'healing' ? 4.2 : 2.8);
    const baseIntensity = this.auraStyle === 'healing' ? 5.5 : 4.2;
    this.auraLight.intensity = this.auraActive ? baseIntensity + Math.sin(performance.now() * 0.012) * 0.8 : 0;

    if (chargedFootPosition) {
      this.footCharge.position.copy(chargedFootPosition);
      this.footCharge.position.y += 0.16;
    } else {
      const footOffset = new Vector3(-0.32, 0.18, -0.18).applyAxisAngle(new Vector3(0, 1, 0), heroYaw);
      this.footCharge.position.copy(heroPosition).add(footOffset);
    }
    this.footCharge.rotation.y += deltaSeconds * 7;
    this.footCharge.rotation.x += deltaSeconds * 3.6;
    this.footChargeLight.intensity = this.footChargeActive ? 4.4 + Math.sin(performance.now() * 0.018) : 0;
    this.footChargeMaterials.forEach((material, index) => {
      material.opacity = this.footChargeActive
        ? 0.58 + Math.sin(performance.now() * 0.015 + index) * 0.18
        : 0;
    });

    if (this.burstTimer > 0) {
      this.burstTimer -= deltaSeconds;
      const progress = Math.max(this.burstTimer / 0.32, 0);
      this.burst.scale.setScalar(1 + (1 - progress) * 5.5);
      this.burstMaterial.opacity = progress;
    }
  }

  setAura(active: boolean, style: AuraStyle = 'chi'): void {
    this.auraActive = active;
    this.aura.visible = active;
    this.auraStyle = style;
    this.applyAuraStyle(style);
  }

  setFootCharge(active: boolean): void {
    this.footChargeActive = active;
    this.footCharge.visible = active;
  }

  burstAt(position: Vector3, color = '#f7fbff'): void {
    this.burst.position.copy(position);
    this.burstMaterial.color.set(color);
    this.burstMaterial.opacity = 1;
    this.burstTimer = 0.32;
  }

  private applyAuraStyle(style: AuraStyle): void {
    const ringColors = style === 'healing' ? ['#dfffea', '#78f7a7', '#f8fff8'] : ['#5dfcff', '#9ee8ff', '#f7fbff'];
    this.auraMaterials.forEach((material, index) => {
      material.color.set(ringColors[index % ringColors.length]);
      material.opacity = style === 'healing' ? 0.68 : 0.52;
    });
    this.auraLight.color.set(style === 'healing' ? '#9dffba' : '#67f7ff');
  }

  private buildFootCharge(): void {
    const colors = ['#e0fbff', '#60f7ff'];
    for (let index = 0; index < 2; index += 1) {
      const material = new MeshBasicMaterial({
        color: colors[index],
        transparent: true,
        opacity: 0.78,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const ring = new Mesh(new RingGeometry(0.16 + index * 0.06, 0.21 + index * 0.06, 40), material);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = index * Math.PI * 0.5;
      this.footChargeMaterials.push(material);
      this.footCharge.add(ring);
    }

    const core = new Mesh(
      new SphereGeometry(0.12, 16, 10),
      new MeshBasicMaterial({
        color: '#f7fbff',
        transparent: true,
        opacity: 0.82,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );

    const verticalMaterial = new MeshBasicMaterial({
      color: '#b9fbff',
      transparent: true,
      opacity: 0.68,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const verticalRing = new Mesh(new RingGeometry(0.2, 0.27, 40), verticalMaterial);
    verticalRing.rotation.y = Math.PI / 2;
    this.footChargeMaterials.push(verticalMaterial);

    this.footCharge.add(core, verticalRing, this.footChargeLight);
    this.footCharge.visible = false;
  }
}
