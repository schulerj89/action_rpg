import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import type { TownAssetPlacement, TownBuildingLayout, TownNpcLayout } from './firstTownLayout';
import type { AabbCollider } from '../CollisionResolver';

const materials = {
  bottle: new MeshStandardMaterial({ color: '#a78bfa', roughness: 0.55 }),
  grass: new MeshStandardMaterial({ color: '#3f7f49', roughness: 0.92 }),
  ground: new MeshStandardMaterial({ color: '#4a7c4d', roughness: 0.9 }),
  path: new MeshStandardMaterial({ color: '#8b8476', roughness: 0.86 }),
  stone: new MeshStandardMaterial({ color: '#777b80', roughness: 0.82 }),
  wall: new MeshStandardMaterial({ color: '#d7b88d', roughness: 0.78 }),
  wood: new MeshStandardMaterial({ color: '#7a4a2b', roughness: 0.8 }),
};

const box = new BoxGeometry(1, 1, 1);
const cylinder = new CylinderGeometry(0.5, 0.5, 1, 16);
const cone = new ConeGeometry(0.6, 1, 4);
const sphere = new SphereGeometry(0.5, 16, 10);

export function createTownGround(): Group {
  const root = new Group();
  const ground = new Mesh(new PlaneGeometry(80, 80), materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  root.add(createPath(0, -6.8, 5.2, 46));
  root.add(createPath(0, -4.2, 24, 4.2));
  root.add(createPath(-9.2, 1.8, 4.2, 14.4));
  root.add(createPath(9.2, 1.8, 4.2, 14.4));
  root.add(createPath(0, 7.8, 18, 4.0));
  return root;
}

export function createGrassField(): InstancedMesh {
  const bladeGeometry = new ConeGeometry(0.035, 0.34, 5);
  const grass = new InstancedMesh(bladeGeometry, materials.grass, 430);
  const matrix = new Matrix4();

  for (let index = 0; index < 430; index += 1) {
    const x = seededRandom(index * 13.1) * 72 - 36;
    const z = seededRandom(index * 19.7 + 2) * 72 - 36;
    if (Math.abs(x) < 3.6 && z > -30 && z < 15) {
      matrix.makeScale(0.8, 0.8, 0.8);
      matrix.setPosition(34, -4, 34);
      grass.setMatrixAt(index, matrix);
      continue;
    }

    const scale = 0.6 + seededRandom(index * 7.3) * 0.8;
    matrix.makeRotationY(seededRandom(index * 5.9) * Math.PI);
    matrix.scale(new Vector3(scale, scale, scale));
    matrix.setPosition(x, 0.17, z);
    grass.setMatrixAt(index, matrix);
  }

  grass.instanceMatrix.needsUpdate = true;
  grass.frustumCulled = false;
  return grass;
}

export function createTownBuilding(layout: TownBuildingLayout): Group {
  const root = new Group();
  root.name = layout.id;
  root.position.copy(layout.position);
  const heightScale = Math.max(layout.targetHeight / 4.2, 1);

  const walls = new Mesh(box, materials.wall);
  walls.scale.set(4.8 * heightScale, 2.55 * heightScale, 3.95 * heightScale);
  walls.position.y = 1.28 * heightScale;
  walls.castShadow = true;
  walls.receiveShadow = true;

  const roofMaterial = new MeshStandardMaterial({ color: layout.roof, roughness: 0.72 });
  const roof = new Mesh(cone, roofMaterial);
  roof.scale.set(4.32 * heightScale, 1.22 * heightScale, 3.65 * heightScale);
  roof.position.y = 3.18 * heightScale;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;

  const door = new Mesh(box, materials.wood);
  door.scale.set(0.9 * heightScale, 1.38 * heightScale, 0.08);
  door.position.set(0, 0.74 * heightScale, 2.0 * heightScale);

  const sign =
    layout.kind === 'weapons'
      ? createWeaponSign(layout.accent)
      : layout.kind === 'potions'
        ? createPotionSign(layout.accent)
        : createHouseSign(layout.accent);
  sign.position.set(0, 2.16 * heightScale, 2.18 * heightScale);
  sign.scale.setScalar(heightScale);

  root.add(walls, roof, door, sign);
  if (layout.kind === 'potions') {
    root.add(createPotionShelf());
  } else if (layout.kind === 'weapons') {
    root.add(createAnvil());
  } else {
    root.add(createFlowerBox(layout.accent));
  }
  root.rotation.y = layout.rotationY ?? 0;
  return root;
}

export function createTownNpc(layout: TownNpcLayout): Group {
  const root = new Group();
  root.name = layout.id;
  root.position.copy(layout.position);

  const bodyMaterial = new MeshStandardMaterial({ color: layout.body, roughness: 0.78 });
  const accentMaterial = new MeshStandardMaterial({ color: layout.accent, roughness: 0.7 });

  const body = new Mesh(cylinder, bodyMaterial);
  body.scale.set(0.38, 0.82, 0.38);
  body.position.y = 0.66;
  body.castShadow = true;

  const head = new Mesh(sphere, new MeshStandardMaterial({ color: '#f4c7a1', roughness: 0.72 }));
  head.scale.setScalar(0.34);
  head.position.y = 1.42;
  head.castShadow = true;

  const leftEye = new Mesh(new SphereGeometry(0.035, 10, 8), new MeshStandardMaterial({ color: '#101827', roughness: 0.4 }));
  const rightEye = leftEye.clone();
  leftEye.position.set(-0.095, 1.47, 0.305);
  rightEye.position.set(0.095, 1.47, 0.305);

  const accent = new Mesh(cone, accentMaterial);
  accent.scale.set(0.34, 0.3, 0.34);
  accent.position.y = 1.78;
  accent.rotation.y = Math.PI / 4;
  accent.castShadow = true;

  const marker = new Mesh(new RingGeometry(0.48, 0.54, 28), new MeshStandardMaterial({ color: '#fef3c7', emissive: '#7c4f00' }));
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.03;

  root.add(body, head, leftEye, rightEye, accent, createNpcIdentityAccessories(layout), marker);
  root.rotation.y = layout.rotationY ?? 0;
  return root;
}

export function createNpcIdentityAccessories(layout: TownNpcLayout): Group {
  const root = new Group();
  root.name = `${layout.id}-identity`;
  const accentMaterial = new MeshStandardMaterial({ color: layout.accent, roughness: 0.64 });
  const darkMaterial = new MeshStandardMaterial({ color: '#1f2937', roughness: 0.8 });
  const woodMaterial = new MeshStandardMaterial({ color: '#7a4a2b', roughness: 0.82 });

  const scarf = new Mesh(new TorusGeometry(0.25, 0.035, 8, 24), accentMaterial);
  scarf.position.set(0, 1.11, 0.02);
  scarf.scale.set(1, 0.32, 0.75);
  root.add(scarf);

  if (layout.dialogueId === 'weapon_smith') {
    const apron = new Mesh(box, darkMaterial);
    apron.scale.set(0.32, 0.46, 0.035);
    apron.position.set(0, 0.75, 0.36);
    const hammerHandle = new Mesh(box, woodMaterial);
    hammerHandle.scale.set(0.035, 0.36, 0.035);
    hammerHandle.position.set(0.34, 0.82, 0.36);
    hammerHandle.rotation.z = -0.45;
    const hammerHead = new Mesh(box, materials.stone);
    hammerHead.scale.set(0.18, 0.055, 0.06);
    hammerHead.position.set(0.42, 1.04, 0.36);
    hammerHead.rotation.z = -0.45;
    root.add(apron, hammerHandle, hammerHead);
  } else if (layout.dialogueId === 'potion_keeper') {
    const satchel = new Mesh(cylinder, new MeshStandardMaterial({ color: '#6d28d9', roughness: 0.66 }));
    satchel.scale.set(0.12, 0.24, 0.12);
    satchel.position.set(-0.34, 0.78, 0.26);
    satchel.rotation.z = 0.28;
    const bottle = new Mesh(cylinder, materials.bottle);
    bottle.scale.set(0.065, 0.18, 0.065);
    bottle.position.set(0.33, 0.95, 0.33);
    root.add(satchel, bottle);
  } else if (layout.dialogueId === 'elder') {
    const staff = new Mesh(cylinder, woodMaterial);
    staff.scale.set(0.035, 0.95, 0.035);
    staff.position.set(0.38, 0.88, 0.22);
    staff.rotation.z = -0.08;
    const gem = new Mesh(sphere, accentMaterial);
    gem.scale.setScalar(0.09);
    gem.position.set(0.46, 1.78, 0.22);
    root.add(staff, gem);
  } else {
    const headband = new Mesh(new TorusGeometry(0.27, 0.025, 8, 24), accentMaterial);
    headband.position.set(0, 1.53, 0.02);
    headband.scale.set(1.04, 0.24, 0.78);
    const sash = new Mesh(box, accentMaterial);
    sash.scale.set(0.08, 0.54, 0.04);
    sash.position.set(-0.18, 0.82, 0.35);
    sash.rotation.z = -0.58;
    root.add(headband, sash);
  }

  return root;
}

export function createCollisionOverlay(colliders: AabbCollider[]): Group {
  const root = new Group();
  root.name = 'collision-overlay';
  const material = new MeshStandardMaterial({
    color: '#ff4fd8',
    emissive: '#581c87',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  colliders.forEach((collider) => {
    const width = collider.maxX - collider.minX;
    const depth = collider.maxZ - collider.minZ;
    const mesh = new Mesh(box, material);
    mesh.name = `${collider.id}-overlay`;
    mesh.scale.set(width, 0.08, depth);
    mesh.position.set((collider.minX + collider.maxX) / 2, 0.08, (collider.minZ + collider.maxZ) / 2);
    root.add(mesh);
  });

  root.visible = false;
  return root;
}

export function createWallSegmentFallback(layout: TownAssetPlacement): Group {
  const root = new Group();
  root.name = layout.id;
  root.position.copy(layout.position);
  root.rotation.y = layout.rotationY ?? 0;

  const stone = new Mesh(box, materials.stone);
  stone.scale.set(5.2, 1.05, 0.46);
  stone.position.y = 0.52;
  stone.receiveShadow = true;

  const postA = new Mesh(box, materials.wood);
  postA.scale.set(0.28, 1.48, 0.62);
  postA.position.set(-2.42, 0.74, 0);
  const postB = postA.clone();
  postB.position.x = 2.42;

  root.add(stone, postA, postB);
  return root;
}

export function createBattleTriggerPad(position: Vector3): Mesh {
  const triggerPad = new Mesh(
    new RingGeometry(1.15, 1.42, 48),
    new MeshStandardMaterial({
      color: '#50e3c2',
      emissive: '#0a6f5f',
      transparent: true,
      opacity: 0.72,
    }),
  );
  triggerPad.rotation.x = -Math.PI / 2;
  triggerPad.position.copy(position);
  triggerPad.position.y = 0.08;
  return triggerPad;
}

export function createTownWell(): Group {
  const root = new Group();
  root.name = 'town-well';
  root.position.set(0, 0, -1.4);
  const base = new Mesh(new CylinderGeometry(0.75, 0.85, 0.65, 20), materials.stone);
  base.position.y = 0.32;
  base.castShadow = true;
  base.receiveShadow = true;
  const roof = new Mesh(box, materials.wood);
  roof.scale.set(1.9, 0.18, 1.2);
  roof.position.y = 1.55;
  roof.rotation.z = 0.08;
  roof.castShadow = true;
  root.add(base, roof);
  return root;
}

function createPath(x: number, z: number, width: number, depth: number): Mesh {
  const path = new Mesh(new PlaneGeometry(width, depth), materials.path);
  path.rotation.x = -Math.PI / 2;
  path.position.set(x, 0.012, z);
  path.receiveShadow = true;
  return path;
}

function createWeaponSign(accent: string): Group {
  const sign = new Group();
  const plate = new Mesh(box, new MeshStandardMaterial({ color: accent, roughness: 0.62 }));
  plate.scale.set(1.2, 0.48, 0.1);
  const swordA = new Mesh(box, materials.stone);
  swordA.scale.set(0.08, 0.75, 0.08);
  swordA.rotation.z = 0.68;
  const swordB = swordA.clone();
  swordB.rotation.z = -0.68;
  sign.add(plate, swordA, swordB);
  return sign;
}

function createPotionSign(accent: string): Group {
  const sign = new Group();
  const plate = new Mesh(box, new MeshStandardMaterial({ color: accent, roughness: 0.62 }));
  plate.scale.set(1.2, 0.48, 0.1);
  const bottle = new Mesh(cylinder, materials.bottle);
  bottle.scale.set(0.16, 0.38, 0.16);
  bottle.position.y = 0.02;
  sign.add(plate, bottle);
  return sign;
}

function createHouseSign(accent: string): Group {
  const sign = new Group();
  const plate = new Mesh(box, new MeshStandardMaterial({ color: accent, roughness: 0.62 }));
  plate.scale.set(0.94, 0.42, 0.1);
  const roofMark = new Mesh(cone, materials.wood);
  roofMark.scale.set(0.22, 0.26, 0.22);
  roofMark.rotation.y = Math.PI / 4;
  roofMark.position.y = 0.02;
  sign.add(plate, roofMark);
  return sign;
}

function createPotionShelf(): Group {
  const shelf = new Group();
  shelf.position.set(1.35, 0.65, 2.04);
  const plank = new Mesh(box, materials.wood);
  plank.scale.set(1.2, 0.08, 0.12);
  shelf.add(plank);
  for (let index = 0; index < 4; index += 1) {
    const bottle = new Mesh(cylinder, materials.bottle);
    bottle.scale.set(0.09, 0.22, 0.09);
    bottle.position.set(-0.45 + index * 0.3, 0.2, 0);
    shelf.add(bottle);
  }
  return shelf;
}

function createAnvil(): Group {
  const anvil = new Group();
  anvil.position.set(-1.4, 0.32, 2.02);
  const body = new Mesh(box, materials.stone);
  body.scale.set(0.75, 0.28, 0.32);
  const horn = new Mesh(cone, materials.stone);
  horn.scale.set(0.23, 0.42, 0.23);
  horn.rotation.z = Math.PI / 2;
  horn.position.x = 0.52;
  anvil.add(body, horn);
  return anvil;
}

function createFlowerBox(accent: string): Group {
  const flowers = new Group();
  flowers.position.set(1.35, 0.95, 2.02);
  const boxBase = new Mesh(box, materials.wood);
  boxBase.scale.set(1.2, 0.16, 0.18);
  flowers.add(boxBase);
  for (let index = 0; index < 4; index += 1) {
    const flower = new Mesh(sphere, new MeshStandardMaterial({ color: accent, roughness: 0.72 }));
    flower.scale.setScalar(0.1);
    flower.position.set(-0.45 + index * 0.3, 0.18, 0.02);
    flowers.add(flower);
  }
  return flowers;
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}
