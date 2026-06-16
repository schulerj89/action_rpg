import {
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ShopId } from '../../config/economy';
import { shopInteriorAssetDefinitions } from '../../config/shopInteriorAssets';

const box = new BoxGeometry(1, 1, 1);
const cylinder = new CylinderGeometry(0.5, 0.5, 1, 16);
const sphere = new SphereGeometry(0.5, 16, 10);

const materials = {
  bottleBlue: new MeshStandardMaterial({ color: '#60a5fa', emissive: '#0f2f59', roughness: 0.42 }),
  bottleGreen: new MeshStandardMaterial({ color: '#86efac', emissive: '#123d24', roughness: 0.42 }),
  brass: new MeshStandardMaterial({ color: '#d9a441', metalness: 0.18, roughness: 0.55 }),
  counter: new MeshStandardMaterial({ color: '#8b5a34', roughness: 0.78 }),
  floor: new MeshStandardMaterial({ color: '#455a64', roughness: 0.88 }),
  forge: new MeshStandardMaterial({ color: '#ef4444', emissive: '#5f0d0d', roughness: 0.52 }),
  rugPurple: new MeshStandardMaterial({ color: '#7c3aed', roughness: 0.82 }),
  shelf: new MeshStandardMaterial({ color: '#6b4428', roughness: 0.84 }),
  wall: new MeshStandardMaterial({ color: '#d8c6a3', roughness: 0.78 }),
  weapon: new MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.24, roughness: 0.48 }),
};

export class ShopInteriorScene {
  readonly root = new Group();
  readonly entry = new Vector3(0, 0, 4.5);
  readonly camera = new Vector3(0, 4.2, 8.2);
  readonly lookAt = new Vector3(0, 1.2, 0.2);

  private readonly weaponRoot = new Group();
  private readonly potionRoot = new Group();
  private readonly generatedRoot = new Group();
  private readonly generatedShopRoots = new Map<ShopId, Group>();
  private readonly loader = new GLTFLoader();
  private activeShopId?: ShopId;
  private loadPromise?: Promise<void>;

  constructor() {
    this.root.name = 'shop-interiors';
    this.root.visible = false;
    this.generatedRoot.name = 'generated-shop-interiors';
    this.root.add(createRoomShell(), this.weaponRoot, this.potionRoot, this.generatedRoot);
    this.weaponRoot.add(createWeaponShopInterior());
    this.potionRoot.add(createPotionShopInterior());
    this.showShop('weapons');
    this.root.visible = false;
  }

  showShop(shopId: ShopId): void {
    this.activeShopId = shopId;
    const generated = this.generatedShopRoots.get(shopId);
    this.weaponRoot.visible = shopId === 'weapons' && !generated;
    this.potionRoot.visible = shopId === 'potions' && !generated;
    this.generatedShopRoots.forEach((root, id) => {
      root.visible = id === shopId;
    });
    this.root.visible = true;
  }

  hide(): void {
    this.root.visible = false;
    this.activeShopId = undefined;
  }

  getActiveShopId(): ShopId | undefined {
    return this.activeShopId;
  }

  async loadGeneratedAssets(): Promise<void> {
    this.loadPromise ??= this.loadAllGeneratedAssets();
    await this.loadPromise;
  }

  private async loadAllGeneratedAssets(): Promise<void> {
    await Promise.all(
      shopInteriorAssetDefinitions.map(async (definition) => {
        try {
          const gltf = await this.loader.loadAsync(definition.url);
          const model = createGeneratedInterior(definition.id, gltf.scene, definition.targetLongestSide);
          this.generatedShopRoots.set(definition.id, model);
          this.generatedRoot.add(model);
        } catch {
          this.generatedShopRoots.delete(definition.id);
        }
      }),
    );

    if (this.activeShopId) {
      this.showShop(this.activeShopId);
    }
  }
}

function createGeneratedInterior(shopId: ShopId, source: Object3D, targetLongestSide: number): Group {
  const root = new Group();
  root.name = `${shopId}-generated-interior`;
  root.visible = false;
  const model = source.clone(true);
  model.name = `${shopId}-generated-interior-mesh`;
  normalizeGeneratedInterior(model, targetLongestSide);
  model.traverse((child) => {
    child.castShadow = false;
    child.receiveShadow = true;
  });
  root.add(model);
  return root;
}

function normalizeGeneratedInterior(model: Object3D, targetLongestSide: number): void {
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const longestSide = Math.max(size.x, size.z, 0.001);
  model.scale.setScalar(targetLongestSide / longestSide);
  model.updateMatrixWorld(true);
  const scaledBounds = new Box3().setFromObject(model);
  model.position.set(
    -(scaledBounds.min.x + scaledBounds.max.x) / 2,
    -scaledBounds.min.y + 0.02,
    -(scaledBounds.min.z + scaledBounds.max.z) / 2 - 0.55,
  );
}

function createRoomShell(): Group {
  const root = new Group();
  const floor = new Mesh(new PlaneGeometry(13, 11), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  const backWall = new Mesh(box, materials.wall);
  backWall.scale.set(13, 4.2, 0.28);
  backWall.position.set(0, 2.1, -4.8);

  const leftWall = new Mesh(box, materials.wall);
  leftWall.scale.set(0.28, 4.2, 11);
  leftWall.position.set(-6.5, 2.1, 0);

  const rightWall = leftWall.clone();
  rightWall.position.x = 6.5;

  const exitRug = new Mesh(box, materials.rugPurple);
  exitRug.scale.set(2.3, 0.035, 1.15);
  exitRug.position.set(0, 0.035, 4.2);

  root.add(floor, backWall, leftWall, rightWall, exitRug);
  return root;
}

function createWeaponShopInterior(): Group {
  const root = new Group();
  root.name = 'weapon-shop-interior';
  root.add(createCounter('#9b3412'), createWeaponRack(-3.8, -2.25), createWeaponRack(3.8, -2.25), createForge());

  const sign = new Mesh(box, materials.brass);
  sign.scale.set(2.3, 0.44, 0.12);
  sign.position.set(0, 2.9, -4.58);

  const crossed = createCrossedWeapons();
  crossed.position.set(0, 2.95, -4.42);
  crossed.scale.setScalar(0.9);
  root.add(sign, crossed);
  return root;
}

function createPotionShopInterior(): Group {
  const root = new Group();
  root.name = 'potion-shop-interior';
  root.add(createCounter('#4c1d95'), createPotionShelf(-3.9, -2.4), createPotionShelf(3.9, -2.4));

  const cauldron = new Mesh(cylinder, new MeshStandardMaterial({ color: '#1f2937', roughness: 0.55 }));
  cauldron.scale.set(0.95, 0.62, 0.95);
  cauldron.position.set(0, 0.42, -1.3);

  const glow = new Mesh(sphere, materials.bottleGreen);
  glow.scale.set(0.68, 0.18, 0.68);
  glow.position.set(0, 0.95, -1.3);

  const sign = new Mesh(box, new MeshStandardMaterial({ color: '#c4b5fd', roughness: 0.62 }));
  sign.scale.set(2.3, 0.44, 0.12);
  sign.position.set(0, 2.9, -4.58);

  root.add(cauldron, glow, sign);
  return root;
}

function createCounter(color: string): Group {
  const root = new Group();
  const top = new Mesh(box, materials.counter);
  top.scale.set(5.2, 0.28, 1.05);
  top.position.set(0, 1.0, -3.25);
  const front = new Mesh(box, new MeshStandardMaterial({ color, roughness: 0.78 }));
  front.scale.set(5.3, 1.15, 0.18);
  front.position.set(0, 0.48, -2.68);
  root.add(top, front);
  return root;
}

function createWeaponRack(x: number, z: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  const rack = new Mesh(box, materials.shelf);
  rack.scale.set(1.4, 1.75, 0.18);
  rack.position.y = 1.0;
  root.add(rack);
  for (let index = 0; index < 3; index += 1) {
    const blade = new Mesh(box, materials.weapon);
    blade.scale.set(0.08, 1.35, 0.08);
    blade.position.set(-0.42 + index * 0.42, 1.1, 0.18);
    blade.rotation.z = -0.22 + index * 0.22;
    const grip = new Mesh(box, materials.counter);
    grip.scale.set(0.22, 0.07, 0.08);
    grip.position.set(blade.position.x, 0.46, 0.18);
    root.add(blade, grip);
  }
  return root;
}

function createCrossedWeapons(): Group {
  const root = new Group();
  const a = new Mesh(box, materials.weapon);
  a.scale.set(0.09, 1.25, 0.08);
  a.rotation.z = 0.72;
  const b = a.clone();
  b.rotation.z = -0.72;
  root.add(a, b);
  return root;
}

function createForge(): Group {
  const root = new Group();
  root.position.set(-4.7, 0, 1.9);
  const base = new Mesh(box, materials.counter);
  base.scale.set(1.6, 0.7, 1.2);
  base.position.y = 0.36;
  const heat = new Mesh(sphere, materials.forge);
  heat.scale.set(0.62, 0.24, 0.62);
  heat.position.y = 0.88;
  root.add(base, heat);
  return root;
}

function createPotionShelf(x: number, z: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  const shelf = new Mesh(box, materials.shelf);
  shelf.scale.set(1.7, 1.9, 0.22);
  shelf.position.y = 1.05;
  root.add(shelf);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const bottle = new Mesh(cylinder, (row + col) % 2 === 0 ? materials.bottleBlue : materials.bottleGreen);
      bottle.scale.set(0.13, 0.32, 0.13);
      bottle.position.set(-0.48 + col * 0.48, 0.54 + row * 0.48, 0.24);
      root.add(bottle);
    }
  }
  return root;
}
