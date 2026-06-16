import { Box3, Group, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { TownAssetDefinition, TownAssetId } from '../../config/townAssets';

interface TownAssetInstanceOptions {
  flattenY?: number;
  name: string;
  position: Vector3;
  rotationY?: number;
  targetHeight?: number;
  targetLongestSide?: number;
  yOffset?: number;
}

export interface TownAssetLoadRecord {
  id: TownAssetId;
  loadMs: number;
  status: 'loaded' | 'failed' | 'missing';
}

export interface TownAssetSystemSnapshot {
  failed: TownAssetId[];
  instanceCounts: Record<string, number>;
  loaded: TownAssetId[];
  records: TownAssetLoadRecord[];
}

export class TownAssetSystem {
  private readonly definitions = new Map<TownAssetId, TownAssetDefinition>();
  private readonly instanceCounts = new Map<TownAssetId, number>();
  private readonly loadRecords = new Map<TownAssetId, TownAssetLoadRecord>();
  private readonly loadedAssets = new Map<TownAssetId, Object3D>();
  private readonly loader = new GLTFLoader();

  constructor(definitions: TownAssetDefinition[]) {
    definitions.forEach((definition) => {
      this.definitions.set(definition.id, definition);
    });
  }

  async loadAssets(ids: TownAssetId[]): Promise<void> {
    await Promise.all([...new Set(ids)].map((id) => this.loadAsset(id)));
  }

  createInstance(id: TownAssetId, options: TownAssetInstanceOptions): Group | undefined {
    const source = this.loadedAssets.get(id);
    if (!source) {
      return undefined;
    }

    const root = new Group();
    root.name = options.name;

    const instance = source.clone(true);
    instance.name = `${options.name}-mesh`;
    instance.position.set(0, 0, 0);
    instance.rotation.y = options.rotationY ?? 0;
    normalizeInstance(instance, options);
    root.add(instance);
    root.position.copy(options.position);
    root.traverse((child) => {
      child.castShadow = false;
      child.receiveShadow = true;
    });
    this.instanceCounts.set(id, (this.instanceCounts.get(id) ?? 0) + 1);
    return root;
  }

  getLoadedAssetIds(): TownAssetId[] {
    return [...this.loadedAssets.keys()];
  }

  markReferenced(id: TownAssetId): void {
    if (!this.instanceCounts.has(id)) {
      this.instanceCounts.set(id, 0);
    }
  }

  snapshot(): TownAssetSystemSnapshot {
    const records = [...this.loadRecords.values()];
    return {
      failed: records.filter((record) => record.status === 'failed' || record.status === 'missing').map((record) => record.id),
      instanceCounts: Object.fromEntries([...this.instanceCounts.entries()]),
      loaded: this.getLoadedAssetIds(),
      records,
    };
  }

  private async loadAsset(id: TownAssetId): Promise<void> {
    if (this.loadedAssets.has(id)) {
      return;
    }

    const definition = this.definitions.get(id);
    if (!definition) {
      this.loadRecords.set(id, { id, loadMs: 0, status: 'missing' });
      return;
    }

    const startedAt = performance.now();
    try {
      const gltf = await this.loader.loadAsync(definition.url);
      this.loadedAssets.set(id, gltf.scene);
      this.loadRecords.set(id, { id, loadMs: Math.round(performance.now() - startedAt), status: 'loaded' });
    } catch {
      this.loadRecords.set(id, { id, loadMs: Math.round(performance.now() - startedAt), status: 'failed' });
    }
  }
}

function normalizeInstance(instance: Object3D, options: TownAssetInstanceOptions): void {
  const box = new Box3().setFromObject(instance);
  const size = box.getSize(new Vector3());
  const currentLongestSide = Math.max(size.x, size.z, 0.001);
  const scaleFromHeight = options.targetHeight ? options.targetHeight / Math.max(size.y, 0.001) : undefined;
  const scaleFromLongestSide = options.targetLongestSide ? options.targetLongestSide / currentLongestSide : undefined;
  instance.scale.setScalar(scaleFromHeight ?? scaleFromLongestSide ?? 1);
  if (options.flattenY !== undefined) {
    instance.scale.y *= options.flattenY;
  }
  instance.updateMatrixWorld(true);

  const scaledBounds = new Box3().setFromObject(instance);
  instance.position.y = -scaledBounds.min.y + (options.yOffset ?? 0);
}
