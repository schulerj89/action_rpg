import {
  BoxGeometry,
  Color,
  DoubleSide,
  Fog,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
} from 'three';

export type WeatherMode = 'clear' | 'mist' | 'rain';

export interface WeatherSnapshot {
  mode: WeatherMode;
  particleCount: number;
  sky: string;
}

const rainCount = 180;

export class WeatherSystem {
  readonly root = new Group();

  private readonly scene: Scene;
  private readonly rain: InstancedMesh;
  private readonly rainMatrix = new Matrix4();
  private readonly rainOffsets: Array<{ x: number; z: number; speed: number; y: number }> = [];
  private mode: WeatherMode = 'clear';

  constructor(scene: Scene) {
    this.scene = scene;
    this.root.name = 'weather-system';

    const cloudMaterial = new MeshStandardMaterial({ color: '#f8fafc', roughness: 0.92 });
    const cloudGeometry = new BoxGeometry(1, 1, 1);
    for (let index = 0; index < 8; index += 1) {
      const cloud = new Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(-24 + index * 7.2, 8.2 + (index % 3) * 0.35, -18 + (index % 4) * 8.5);
      cloud.scale.set(3.6 + (index % 2) * 1.4, 0.42, 1.25 + (index % 3) * 0.35);
      this.root.add(cloud);
    }

    this.rain = new InstancedMesh(
      new PlaneGeometry(0.025, 0.62),
      new MeshStandardMaterial({
        color: '#dbeafe',
        emissive: '#93c5fd',
        roughness: 0.45,
        side: DoubleSide,
        transparent: true,
        opacity: 0.55,
      }),
      rainCount,
    );
    this.rain.frustumCulled = false;
    this.root.add(this.rain);

    for (let index = 0; index < rainCount; index += 1) {
      this.rainOffsets.push({
        x: seededRandom(index * 5.31) * 58 - 29,
        z: seededRandom(index * 9.17 + 3) * 58 - 29,
        y: seededRandom(index * 7.11 + 1) * 7 + 2.4,
        speed: 5.4 + seededRandom(index * 2.29) * 2.4,
      });
    }

    this.setMode('clear');
  }

  update(deltaSeconds: number): void {
    this.root.children.forEach((child, index) => {
      if (child === this.rain) {
        return;
      }
      child.position.x += deltaSeconds * (0.12 + index * 0.008);
      if (child.position.x > 34) {
        child.position.x = -34;
      }
    });

    if (this.mode !== 'rain') {
      return;
    }

    this.rainOffsets.forEach((drop, index) => {
      drop.y -= drop.speed * deltaSeconds;
      if (drop.y < 0.25) {
        drop.y = 8 + seededRandom(index * 4.83 + performance.now() * 0.001) * 2;
      }
      this.rainMatrix.makeRotationZ(-0.11);
      this.rainMatrix.setPosition(drop.x, drop.y, drop.z);
      this.rain.setMatrixAt(index, this.rainMatrix);
    });
    this.rain.instanceMatrix.needsUpdate = true;
  }

  setMode(mode: WeatherMode): void {
    this.mode = mode;
    this.rain.visible = mode === 'rain';
    if (mode === 'rain') {
      this.scene.background = new Color('#7f9fc8');
      this.scene.fog = new Fog('#7f9fc8', 18, 50);
    } else if (mode === 'mist') {
      this.scene.background = new Color('#abc4dd');
      this.scene.fog = new Fog('#abc4dd', 16, 44);
    } else {
      this.scene.background = new Color('#8ec5ff');
      this.scene.fog = new Fog('#8ec5ff', 28, 62);
    }
  }

  cycle(): WeatherMode {
    const next = this.mode === 'clear' ? 'mist' : this.mode === 'mist' ? 'rain' : 'clear';
    this.setMode(next);
    return next;
  }

  snapshot(): WeatherSnapshot {
    return {
      mode: this.mode,
      particleCount: this.mode === 'rain' ? rainCount : 0,
      sky: this.scene.background instanceof Color ? `#${this.scene.background.getHexString()}` : 'custom',
    };
  }
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}
