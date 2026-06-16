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
import { tweenVector3 } from '../core/tween';

type AuraStyle = 'chi' | 'healing' | 'mage';

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
  private readonly spellOrbMaterial = new MeshBasicMaterial({
    color: new Color('#c4b5fd'),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  private readonly spellOrb = new Mesh(new SphereGeometry(0.22, 24, 16), this.spellOrbMaterial);
  private readonly sigil = new Group();
  private readonly sigilMaterials: MeshBasicMaterial[] = [];
  private auraStyle: AuraStyle = 'chi';
  private auraActive = false;
  private footChargeActive = false;
  private burstTimer = 0;
  private sigilTimer = 0;

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
    this.buildSigil();
    this.spellOrb.visible = false;
    this.root.add(this.aura, this.footCharge, this.burst, this.spellOrb, this.sigil);
  }

  update(deltaSeconds: number, heroPosition: Vector3, heroYaw = 0, chargedFootPosition?: Vector3): void {
    this.aura.position.copy(heroPosition);
    this.aura.rotation.y += deltaSeconds * (this.auraStyle === 'healing' ? 4.2 : 2.8);
    const baseIntensity = this.auraStyle === 'healing' ? 5.5 : this.auraStyle === 'mage' ? 7.2 : 4.2;
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

    if (this.sigilTimer > 0) {
      this.sigilTimer -= deltaSeconds;
      const progress = Math.max(this.sigilTimer / 0.72, 0);
      this.sigil.rotation.y += deltaSeconds * 3.8;
      this.sigil.scale.setScalar(1.1 + (1 - progress) * 1.4);
      this.sigilMaterials.forEach((material, index) => {
        material.opacity = progress * (0.74 - index * 0.12);
      });
      if (this.sigilTimer <= 0) {
        this.sigil.visible = false;
      }
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

  arcaneBurstAt(position: Vector3): void {
    this.sigil.position.copy(position);
    this.sigil.position.y = 0.08;
    this.sigil.scale.setScalar(1);
    this.sigil.visible = true;
    this.sigilTimer = 0.72;
    this.sigilMaterials.forEach((material) => {
      material.opacity = 0.72;
    });
    this.burstAt(position.clone().setY(0.9), '#d8b4fe');
  }

  async castMageProjectile(start: Vector3, end: Vector3, special = false): Promise<void> {
    const orbStart = start.clone().setY(1.2);
    const orbEnd = end.clone().setY(1.15);
    this.spellOrb.position.copy(orbStart);
    this.spellOrb.scale.setScalar(special ? 1.7 : 1);
    this.spellOrbMaterial.color.set(special ? '#f5d0fe' : '#c4b5fd');
    this.spellOrbMaterial.opacity = special ? 0.92 : 0.78;
    this.spellOrb.visible = true;
    await tweenVector3(this.spellOrb.position, orbEnd, special ? 760 : 460);
    this.spellOrb.visible = false;
    this.spellOrbMaterial.opacity = 0;
    this.arcaneBurstAt(end);
  }

  private applyAuraStyle(style: AuraStyle): void {
    const ringColors =
      style === 'healing'
        ? ['#dfffea', '#78f7a7', '#f8fff8']
        : style === 'mage'
          ? ['#c4b5fd', '#7dd3fc', '#f5d0fe']
          : ['#5dfcff', '#9ee8ff', '#f7fbff'];
    this.auraMaterials.forEach((material, index) => {
      material.color.set(ringColors[index % ringColors.length]);
      material.opacity = style === 'healing' ? 0.68 : style === 'mage' ? 0.76 : 0.52;
    });
    this.auraLight.color.set(style === 'healing' ? '#9dffba' : style === 'mage' ? '#c4b5fd' : '#67f7ff');
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

  private buildSigil(): void {
    const colors = ['#f5d0fe', '#93c5fd', '#ddd6fe'];
    for (let index = 0; index < 3; index += 1) {
      const material = new MeshBasicMaterial({
        color: colors[index],
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const ring = new Mesh(new RingGeometry(0.62 + index * 0.28, 0.67 + index * 0.28, 64), material);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = (Math.PI / 4) * index;
      this.sigilMaterials.push(material);
      this.sigil.add(ring);
    }
    this.sigil.visible = false;
  }
}
