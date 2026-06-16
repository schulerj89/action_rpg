import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  RingGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { tweenVector3 } from '../core/tween';

type AuraStyle = 'chi' | 'healing' | 'mage' | 'thunder';

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
  private readonly thunder = new Group();
  private readonly thunderLight = new PointLight('#9ee8ff', 0, 8);
  private readonly thunderLines: Line[] = [];
  private readonly thunderMaterials: LineBasicMaterial[] = [];
  private readonly thunderTubeMaterials: MeshBasicMaterial[] = [];
  private readonly thunderTubes: Mesh[] = [];
  private auraStyle: AuraStyle = 'chi';
  private auraActive = false;
  private footChargeActive = false;
  private burstTimer = 0;
  private sigilTimer = 0;
  private thunderTimer = 0;

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
    this.buildThunder();
    this.spellOrb.visible = false;
    this.root.add(this.aura, this.footCharge, this.burst, this.spellOrb, this.sigil, this.thunder);
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

    if (this.thunderTimer > 0) {
      this.thunderTimer -= deltaSeconds;
      const progress = Math.max(this.thunderTimer / 0.82, 0);
      this.thunderLight.intensity = progress * 8.4;
      this.thunderMaterials.forEach((material, index) => {
        material.opacity = progress * (index === 0 ? 0.95 : 0.58);
      });
      this.thunderTubeMaterials.forEach((material, index) => {
        material.opacity = progress * (index === 0 ? 0.78 : 0.48);
      });
      if (this.thunderTimer <= 0) {
        this.thunder.visible = false;
        this.thunderLight.intensity = 0;
        this.thunderTubeMaterials.forEach((material) => {
          material.opacity = 0;
        });
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

  thunderBurstAt(position: Vector3): void {
    const ground = position.clone().setY(0.08);
    const sky = position.clone().setY(5.8);
    this.thunderStrike(sky, ground);
    this.arcaneBurstAt(position);
    this.burstAt(position.clone().setY(1.1), '#dbeafe');
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

  healingBloomAt(position: Vector3): void {
    const bloom = position.clone().setY(1.05);
    this.burstAt(bloom, '#eafff2');
    this.sigil.position.copy(position).setY(0.06);
    this.sigil.scale.setScalar(0.8);
    this.sigil.visible = true;
    this.sigilTimer = 0.72;
    this.sigilMaterials.forEach((material, index) => {
      material.color.set(index === 1 ? '#86efac' : '#f8fff8');
      material.opacity = 0.68;
    });
  }

  snapshot(): { activeEffects: string[]; activeLights: number } {
    const activeEffects = [
      this.auraActive ? `aura:${this.auraStyle}` : '',
      this.footChargeActive ? 'footCharge' : '',
      this.burstTimer > 0 ? 'burst' : '',
      this.sigilTimer > 0 ? 'sigil' : '',
      this.thunderTimer > 0 ? 'thunder' : '',
      this.spellOrb.visible ? 'spellOrb' : '',
    ].filter(Boolean);

    return {
      activeEffects,
      activeLights: [this.auraLight, this.footChargeLight, this.thunderLight].filter((light) => light.intensity > 0.1)
        .length,
    };
  }

  private thunderStrike(start: Vector3, end: Vector3): void {
    this.thunder.position.set(0, 0, 0);
    this.thunder.visible = true;
    this.thunderTimer = 0.82;
    this.thunderLight.position.copy(end).setY(1.6);
    this.thunderLight.intensity = 8.4;

    this.thunderLines.forEach((line, lineIndex) => {
      line.geometry.dispose();
      const points: number[] = [];
      const curvePoints: Vector3[] = [];
      const segments = 8;
      const side = new Vector3(lineIndex === 1 ? 0.18 : lineIndex === 2 ? -0.18 : 0, 0, lineIndex === 1 ? -0.12 : 0.12);
      for (let index = 0; index <= segments; index += 1) {
        const t = index / segments;
        const point = start.clone().lerp(end, t);
        const jitter = Math.sin((index + 1) * 2.17 + lineIndex) * 0.16;
        point.x += side.x * t + jitter * (lineIndex + 1) * 0.24;
        point.z += side.z * t + Math.cos((index + 3) * 1.67 + lineIndex) * 0.12;
        points.push(point.x, point.y, point.z);
        curvePoints.push(point);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
      line.geometry = geometry;

      const tube = this.thunderTubes[lineIndex];
      if (tube) {
        tube.geometry.dispose();
        tube.geometry = new TubeGeometry(new CatmullRomCurve3(curvePoints), 18, lineIndex === 0 ? 0.045 : 0.028, 6, false);
      }
    });
  }

  private applyAuraStyle(style: AuraStyle): void {
    const ringColors =
      style === 'healing'
        ? ['#dfffea', '#78f7a7', '#f8fff8']
        : style === 'thunder'
          ? ['#dbeafe', '#60a5fa', '#f8fafc']
        : style === 'mage'
          ? ['#c4b5fd', '#7dd3fc', '#f5d0fe']
          : ['#5dfcff', '#9ee8ff', '#f7fbff'];
    this.auraMaterials.forEach((material, index) => {
      material.color.set(ringColors[index % ringColors.length]);
      material.opacity = style === 'healing' ? 0.68 : style === 'mage' || style === 'thunder' ? 0.76 : 0.52;
    });
    this.auraLight.color.set(
      style === 'healing' ? '#9dffba' : style === 'thunder' ? '#93c5fd' : style === 'mage' ? '#c4b5fd' : '#67f7ff',
    );
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

  private buildThunder(): void {
    for (let index = 0; index < 3; index += 1) {
      const material = new LineBasicMaterial({
        color: index === 0 ? '#f8fafc' : '#93c5fd',
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const line = new Line(new BufferGeometry(), material);
      this.thunderMaterials.push(material);
      this.thunderLines.push(line);
      const tubeMaterial = new MeshBasicMaterial({
        color: index === 0 ? '#f8fafc' : '#60a5fa',
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const tube = new Mesh(new TubeGeometry(new CatmullRomCurve3([new Vector3(), new Vector3(0, 1, 0)]), 1, 0.02, 6), tubeMaterial);
      this.thunderTubeMaterials.push(tubeMaterial);
      this.thunderTubes.push(tube);
      this.thunder.add(line, tube);
    }
    this.thunder.add(this.thunderLight);
    this.thunder.visible = false;
  }
}
