import {
  Box3,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { enemyAssetDefinitions } from '../../config/enemyAssets';
import { firstTownAssetDefinitions } from '../../config/townAssets';
import { createTownNpc } from '../town/TownPrimitiveFactory';
import { firstTownNpcs } from '../town/firstTownLayout';

interface AssetLoadStatus {
  id: string;
  status: 'failed' | 'loaded' | 'loading';
}

const box = new BoxGeometry(1, 1, 1);

export class AssetInspectionRoom {
  readonly root = new Group();
  readonly camera = new Vector3(-1.85, 3.35, 8.8);
  readonly lookAt = new Vector3(-2.25, 1.15, 0.25);
  readonly heroStand = new Vector3(0, 0, 5.0);

  private readonly loader = new GLTFLoader();
  private readonly loadStatuses = new Map<string, AssetLoadStatus>();
  private loaded = false;

  constructor() {
    this.root.name = 'asset-inspection-room';
    this.root.visible = false;
    this.root.add(createRoomShell());
    this.root.add(createPrimitiveNpcLineup());
  }

  async loadAssets(): Promise<void> {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    const generatedNpcLoads = firstTownNpcs.map((npc, index) => {
      const definition = firstTownAssetDefinitions.find((asset) => asset.id === npc.assetId);
      return this.loadModel(
        npc.assetId,
        definition?.url ?? '',
        new Vector3(-5.2 + index * 1.55, 0, -0.7),
        1.5,
        0,
      );
    });
    await Promise.all([
      this.loadModel('generated-villager-npc', '/assets/town/first-town/villager-npc.glb', new Vector3(-5.95, 0, -2.9), 1.35, Math.PI),
      ...generatedNpcLoads,
      ...enemyAssetDefinitions.map((enemy, index) =>
        this.loadModel(enemy.id, enemy.url, new Vector3(2.4 + index * 2.35, 0, -1.15), 1.65, enemy.id.includes('shellback') ? -0.28 : 0.18),
      ),
    ]);
  }

  show(): void {
    this.root.visible = true;
  }

  hide(): void {
    this.root.visible = false;
  }

  snapshot(): AssetLoadStatus[] {
    return [...this.loadStatuses.values()];
  }

  private async loadModel(
    id: string,
    url: string,
    position: Vector3,
    targetHeight: number,
    rotationY = 0,
  ): Promise<void> {
    this.loadStatuses.set(id, { id, status: 'loading' });
    try {
      if (!url) {
        throw new Error(`Missing URL for ${id}`);
      }
      const gltf = await this.loader.loadAsync(url);
      const model = gltf.scene;
      model.name = id;
      normalizeModel(model, targetHeight);
      model.position.add(position);
      model.rotation.y = rotationY;
      model.traverse((child) => {
        child.castShadow = false;
        child.receiveShadow = true;
      });
      this.root.add(createPedestal(position.x, position.z), model);
      this.loadStatuses.set(id, { id, status: 'loaded' });
    } catch {
      this.root.add(createFailedMarker(position));
      this.loadStatuses.set(id, { id, status: 'failed' });
    }
  }
}

function createRoomShell(): Group {
  const root = new Group();
  const floor = new Mesh(new PlaneGeometry(16, 12), new MeshStandardMaterial({ color: '#334155', roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  const back = new Mesh(box, new MeshStandardMaterial({ color: '#1e293b', roughness: 0.82 }));
  back.scale.set(16, 3.8, 0.24);
  back.position.set(0, 1.9, -5.4);
  const light = new PointLight(new Color('#dbeafe'), 3.2, 14);
  light.position.set(0, 4.2, 2.8);
  root.add(floor, back, light);
  return root;
}

function createPrimitiveNpcLineup(): Group {
  const root = new Group();
  firstTownNpcs.forEach((npc, index) => {
    const model = createTownNpc({
      ...npc,
      position: new Vector3(-5.1 + index * 1.45, 0, 2.35),
      rotationY: Math.PI,
    });
    model.scale.setScalar(0.94);
    root.add(createPedestal(model.position.x, model.position.z), model);
  });
  return root;
}

function createPedestal(x: number, z: number): Mesh {
  const pedestal = new Mesh(new CylinderGeometry(0.72, 0.82, 0.18, 24), new MeshStandardMaterial({ color: '#64748b' }));
  pedestal.position.set(x, 0.09, z);
  return pedestal;
}

function createFailedMarker(position: Vector3): Group {
  const root = new Group();
  root.position.copy(position);
  const marker = new Mesh(box, new MeshStandardMaterial({ color: '#ef4444', emissive: '#5f0d0d' }));
  marker.scale.set(0.8, 1.4, 0.8);
  marker.position.y = 0.72;
  root.add(marker);
  return root;
}

function normalizeModel(model: Object3D, targetHeight: number): void {
  const box3 = new Box3().setFromObject(model);
  const size = box3.getSize(new Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const scaledBox = new Box3().setFromObject(model);
  model.position.y = -scaledBox.min.y;
}
