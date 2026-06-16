import { Vector3 } from 'three';
import type { TownAssetId } from '../../config/townAssets';
import type { AabbCollider } from '../CollisionResolver';

export const firstTownSceneId = 'first-town';
export const firstTownSpawn = new Vector3(0, 0, 7.0);
export const firstTownBattleTrigger = new Vector3(0, 0, -27.5);
export const firstTownNorthRouteStart = -18.4;
export const firstTownNextTownName = 'Stonewake';

export interface TownBuildingLayout {
  accent: string;
  assetId: TownAssetId;
  collider: AabbCollider;
  id: string;
  kind: 'house' | 'potions' | 'weapons';
  position: Vector3;
  roof: string;
  rotationY?: number;
  targetHeight: number;
}

export interface TownNpcLayout {
  accent: string;
  assetId: TownAssetId;
  body: string;
  dialogueId: string;
  id: string;
  name: string;
  position: Vector3;
  rotationY?: number;
}

export interface TownNpcPose {
  position: Vector3;
  rotationY: number;
}

export interface TownAssetPlacement {
  assetId: TownAssetId;
  flattenY?: number;
  hiddenInCombat: boolean;
  id: string;
  position: Vector3;
  rotationY?: number;
  targetHeight?: number;
  targetLongestSide?: number;
  yOffset?: number;
}

export interface TownDebugPose {
  camera: Vector3;
  collisionOverlay?: boolean;
  fov?: number;
  id: string;
  label: string;
  lookAt: Vector3;
  player: Vector3;
  yaw: number;
}

export const firstTownBuildings: TownBuildingLayout[] = [
  {
    accent: '#d8a03d',
    assetId: 'weapon-shop',
    collider: { id: 'weapon-shop', minX: -11.55, maxX: -5.45, minZ: -9.95, maxZ: -4.42 },
    id: 'weapon-shop',
    kind: 'weapons',
    position: new Vector3(-8.5, 0, -7.0),
    roof: '#9c3f32',
    targetHeight: 5.35,
  },
  {
    accent: '#8b5cf6',
    assetId: 'potion-shop',
    collider: { id: 'potion-shop', minX: 5.45, maxX: 11.55, minZ: -9.95, maxZ: -4.42 },
    id: 'potion-shop',
    kind: 'potions',
    position: new Vector3(8.4, 0, -7.0),
    roof: '#6147b7',
    targetHeight: 5.35,
  },
  {
    accent: '#14b8a6',
    assetId: 'village-house',
    collider: { id: 'northwest-house', minX: -15.0, maxX: -10.8, minZ: -0.75, maxZ: 3.55 },
    id: 'northwest-house',
    kind: 'house',
    position: new Vector3(-12.9, 0, 1.3),
    roof: '#0f766e',
    rotationY: -0.12,
    targetHeight: 4.55,
  },
  {
    accent: '#0ea5e9',
    assetId: 'village-house',
    collider: { id: 'northeast-house', minX: 10.7, maxX: 14.9, minZ: -0.72, maxZ: 3.6 },
    id: 'northeast-house',
    kind: 'house',
    position: new Vector3(12.8, 0, 1.4),
    roof: '#0369a1',
    rotationY: 0.16,
    targetHeight: 4.5,
  },
  {
    accent: '#f59e0b',
    assetId: 'village-house',
    collider: { id: 'southwest-house', minX: -9.7, maxX: -5.38, minZ: 5.95, maxZ: 10.35 },
    id: 'southwest-house',
    kind: 'house',
    position: new Vector3(-7.55, 0, 8.0),
    roof: '#b45309',
    rotationY: 0.08,
    targetHeight: 4.38,
  },
  {
    accent: '#f472b6',
    assetId: 'village-house',
    collider: { id: 'southeast-house', minX: 5.48, maxX: 9.82, minZ: 6.0, maxZ: 10.42 },
    id: 'southeast-house',
    kind: 'house',
    position: new Vector3(7.65, 0, 8.1),
    roof: '#be185d',
    rotationY: -0.08,
    targetHeight: 4.38,
  },
];

export const firstTownNpcs: TownNpcLayout[] = [
  {
    accent: '#f59e0b',
    assetId: 'npc-weapon-smith',
    body: '#70451f',
    dialogueId: 'weapon_smith',
    id: 'npc-weapon-smith',
    name: 'Taro',
    position: new Vector3(-5.3, 0, -2.4),
    rotationY: 0.35,
  },
  {
    accent: '#a78bfa',
    assetId: 'npc-potion-keeper',
    body: '#ffffff',
    dialogueId: 'potion_keeper',
    id: 'npc-potion-keeper',
    name: 'Luma',
    position: new Vector3(5.4, 0, -2.45),
    rotationY: -0.32,
  },
  {
    accent: '#93c5fd',
    assetId: 'npc-elder',
    body: '#3f5f73',
    dialogueId: 'elder',
    id: 'npc-elder',
    name: 'Elder Ren',
    position: new Vector3(-2.9, 0, 3.2),
    rotationY: 0.15,
  },
  {
    accent: '#fca5a5',
    assetId: 'npc-runner',
    body: '#5b3a67',
    dialogueId: 'runner',
    id: 'npc-runner',
    name: 'Pip',
    position: new Vector3(3.15, 0, 3.55),
    rotationY: -0.2,
  },
];

export const firstTownPreloadAssetIds: TownAssetId[] = ['town-ground-tile', 'villager-npc'];

export const firstTownGroundAssets: TownAssetPlacement[] = [
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-plaza',
    position: new Vector3(0, 0, -1.1),
    targetLongestSide: 17.5,
    yOffset: 0.016,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-south-lane',
    position: new Vector3(0, 0, 8.1),
    targetLongestSide: 18.2,
    yOffset: 0.018,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-north-lane',
    position: new Vector3(0, 0, -11.0),
    targetLongestSide: 18.2,
    yOffset: 0.018,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-west-shop-lane',
    position: new Vector3(-8.9, 0, 1.4),
    rotationY: Math.PI / 2,
    targetLongestSide: 13.5,
    yOffset: 0.02,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-east-shop-lane',
    position: new Vector3(8.9, 0, 1.4),
    rotationY: Math.PI / 2,
    targetLongestSide: 13.5,
    yOffset: 0.02,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-west-edge-fill',
    position: new Vector3(-14.4, 0, -7.8),
    rotationY: Math.PI / 2,
    targetLongestSide: 12.4,
    yOffset: 0.019,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-east-edge-fill',
    position: new Vector3(14.4, 0, -7.8),
    rotationY: Math.PI / 2,
    targetLongestSide: 12.4,
    yOffset: 0.019,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-southwest-fill',
    position: new Vector3(-12.0, 0, 9.0),
    rotationY: Math.PI / 2,
    targetLongestSide: 11.8,
    yOffset: 0.019,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-southeast-fill',
    position: new Vector3(12.0, 0, 9.0),
    rotationY: Math.PI / 2,
    targetLongestSide: 11.8,
    yOffset: 0.019,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-north-gate-fill',
    position: new Vector3(0, 0, -18.6),
    targetLongestSide: 18.8,
    yOffset: 0.018,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-north-outskirts-a',
    position: new Vector3(0, 0, -28.2),
    targetLongestSide: 20.4,
    yOffset: 0.018,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-north-outskirts-b',
    position: new Vector3(0, 0, -39.5),
    targetLongestSide: 21.0,
    yOffset: 0.018,
  },
  {
    assetId: 'town-ground-tile',
    flattenY: 0.035,
    hiddenInCombat: true,
    id: 'ground-stonewake-trail',
    position: new Vector3(0, 0, -51.0),
    targetLongestSide: 20.8,
    yOffset: 0.018,
  },
];

export const firstTownDetailAssets: TownAssetPlacement[] = [
  {
    assetId: 'town-well',
    hiddenInCombat: true,
    id: 'town-well',
    position: new Vector3(0, 0, -1.6),
    targetHeight: 1.65,
  },
  {
    assetId: 'weapon-shop-sign',
    hiddenInCombat: true,
    id: 'weapon-shop-sign',
    position: new Vector3(-8.5, 2.1, -4.45),
    targetHeight: 0.54,
  },
  {
    assetId: 'potion-shop-sign',
    hiddenInCombat: true,
    id: 'potion-shop-sign',
    position: new Vector3(8.4, 2.1, -4.45),
    targetHeight: 0.54,
  },
];

export const firstTownWallSegments: TownAssetPlacement[] = [
  ...[-16.6, -12, -7, 7, 12, 16.6].map((x) => ({
    assetId: 'town-wall-segment' as const,
    hiddenInCombat: true,
    id: `north-wall-${x}`,
    position: new Vector3(x, 0, -16.9),
    targetLongestSide: 5.2,
  })),
  ...[-15, -9, -3, 3, 9, 15].map((x) => ({
    assetId: 'town-wall-segment' as const,
    hiddenInCombat: true,
    id: `south-wall-${x}`,
    position: new Vector3(x, 0, 14.0),
    targetLongestSide: 6.25,
  })),
  ...[-15.2, -12, -7, -2, 3, 8, 13].flatMap((z) => [
    {
      assetId: 'town-wall-segment' as const,
      hiddenInCombat: true,
      id: `west-wall-${z}`,
      position: new Vector3(-17.0, 0, z),
      rotationY: Math.PI / 2,
      targetLongestSide: 5.2,
    },
    {
      assetId: 'town-wall-segment' as const,
      hiddenInCombat: true,
      id: `east-wall-${z}`,
      position: new Vector3(17.0, 0, z),
      rotationY: Math.PI / 2,
      targetLongestSide: 5.2,
    },
  ]),
];

export const firstTownNpcColliders: AabbCollider[] = firstTownNpcs.map((npc) => ({
  id: `npc-${npc.dialogueId}`,
  maxX: npc.position.x + 0.48,
  maxZ: npc.position.z + 0.48,
  minX: npc.position.x - 0.48,
  minZ: npc.position.z - 0.48,
}));

export const firstTownColliders: AabbCollider[] = [
  ...firstTownBuildings.map((building) => building.collider),
  ...firstTownNpcColliders,
  { id: 'well', minX: -0.9, maxX: 0.9, minZ: -2.25, maxZ: -0.6 },
  { id: 'north-wall-left', minX: -18.2, maxX: -4.35, minZ: -17.9, maxZ: -15.8 },
  { id: 'north-wall-right', minX: 4.35, maxX: 18.2, minZ: -17.9, maxZ: -15.8 },
  { id: 'south-wall', minX: -18.2, maxX: 18.2, minZ: 12.75, maxZ: 15.08 },
  { id: 'west-wall', minX: -18.1, maxX: -15.9, minZ: -17.9, maxZ: 15.0 },
  { id: 'east-wall', minX: 15.9, maxX: 18.1, minZ: -17.9, maxZ: 15.0 },
];

const buildingFrontPoses = firstTownBuildings.flatMap((building) => {
  const frontZ = building.collider.maxZ + 0.62;
  const centerX = (building.collider.minX + building.collider.maxX) / 2;
  const player = new Vector3(centerX, 0, frontZ);
  const lookAt = building.position.clone().setY(1.65);
  const isSouthHouse = building.id === 'southwest-house' || building.id === 'southeast-house';
  const cameraFrontZ = isSouthHouse ? building.collider.minZ - 4.35 : frontZ + 4.5;
  const cameraCollisionZ = isSouthHouse ? building.collider.minZ - 3.6 : frontZ + 3.65;
  const collisionEdgeZ = isSouthHouse ? building.collider.minZ + 0.08 : frontZ - 0.1;
  return [
    {
      id: `building.${building.id}.front`,
      label: `${building.id} front`,
      player,
      yaw: isSouthHouse ? 0 : Math.PI,
      camera: new Vector3(centerX, 2.25, cameraFrontZ),
      lookAt,
      fov: 48,
    },
    {
      id: `building.${building.id}.collision`,
      label: `${building.id} collision edge`,
      player: new Vector3(centerX, 0, collisionEdgeZ),
      yaw: isSouthHouse ? 0 : Math.PI,
      camera: new Vector3(centerX + 2.15, 2.1, cameraCollisionZ),
      lookAt: new Vector3(centerX, 0.75, isSouthHouse ? building.collider.minZ : building.collider.maxZ),
      collisionOverlay: true,
      fov: 46,
    },
  ] satisfies TownDebugPose[];
});

const wallPoses: TownDebugPose[] = [
  {
    id: 'wall.north.left_gate',
    label: 'north gate left edge',
    player: new Vector3(-4.55, 0, -16.72),
    yaw: Math.PI,
    camera: new Vector3(-0.8, 3.55, -10.4),
    lookAt: new Vector3(-4.35, 0.9, -16.9),
    collisionOverlay: true,
    fov: 46,
  },
  {
    id: 'wall.north.right_gate',
    label: 'north gate right edge',
    player: new Vector3(4.55, 0, -16.72),
    yaw: Math.PI,
    camera: new Vector3(0.8, 3.55, -10.4),
    lookAt: new Vector3(4.35, 0.9, -16.9),
    collisionOverlay: true,
    fov: 46,
  },
  {
    id: 'wall.corner.nw',
    label: 'northwest wall corner',
    player: new Vector3(-15.7, 0, -16.15),
    yaw: Math.PI * 0.75,
    camera: new Vector3(-11.2, 3.7, -11.1),
    lookAt: new Vector3(-16.5, 0.9, -16.7),
    collisionOverlay: true,
    fov: 48,
  },
  {
    id: 'wall.corner.ne',
    label: 'northeast wall corner',
    player: new Vector3(15.7, 0, -16.15),
    yaw: -Math.PI * 0.75,
    camera: new Vector3(11.2, 3.7, -11.1),
    lookAt: new Vector3(16.5, 0.9, -16.7),
    collisionOverlay: true,
    fov: 48,
  },
  {
    id: 'wall.corner.sw',
    label: 'southwest wall corner',
    player: new Vector3(-15.7, 0, 13.65),
    yaw: Math.PI * 0.28,
    camera: new Vector3(-11.2, 3.7, 9.1),
    lookAt: new Vector3(-16.5, 0.9, 14.0),
    collisionOverlay: true,
    fov: 48,
  },
  {
    id: 'wall.corner.se',
    label: 'southeast wall corner',
    player: new Vector3(15.7, 0, 13.65),
    yaw: -Math.PI * 0.28,
    camera: new Vector3(11.2, 3.7, 9.1),
    lookAt: new Vector3(16.5, 0.9, 14.0),
    collisionOverlay: true,
    fov: 48,
  },
  {
    id: 'wall.south.x_minus_2_8',
    label: 'south wall x -2.8 edge',
    player: new Vector3(-2.8, 0, 12.32),
    yaw: Math.PI * 0.08,
    camera: new Vector3(-2.8, 3.35, 8.5),
    lookAt: new Vector3(-2.8, 0.86, 13.62),
    collisionOverlay: true,
    fov: 44,
  },
  {
    id: 'wall.south.center',
    label: 'south wall center seam check',
    player: new Vector3(0.25, 0, 12.32),
    yaw: 0,
    camera: new Vector3(0.25, 3.35, 8.35),
    lookAt: new Vector3(0.25, 0.86, 13.78),
    collisionOverlay: true,
    fov: 44,
  },
  {
    id: 'wall.south.left_run',
    label: 'south wall west run',
    player: new Vector3(-10.9, 0, 12.32),
    yaw: 0.18,
    camera: new Vector3(-10.9, 3.35, 8.4),
    lookAt: new Vector3(-10.9, 0.86, 13.78),
    collisionOverlay: true,
    fov: 44,
  },
  {
    id: 'wall.south.right_run',
    label: 'south wall east run',
    player: new Vector3(10.9, 0, 12.32),
    yaw: -0.18,
    camera: new Vector3(10.9, 3.35, 8.4),
    lookAt: new Vector3(10.9, 0.86, 13.78),
    collisionOverlay: true,
    fov: 44,
  },
];

const npcPoses = firstTownNpcs.flatMap((npc, index) => {
  const yaw = npc.rotationY ?? 0;
  const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
  const right = new Vector3(forward.z, 0, -forward.x).normalize();
  return [
    {
      id: `npc.close.${npc.dialogueId}`,
      label: `${npc.name} full-body`,
      player: npc.position.clone().addScaledVector(forward, 2.25).addScaledVector(right, -0.55),
      yaw: yaw + Math.PI,
      camera: npc.position.clone().addScaledVector(forward, 3.05).addScaledVector(right, 0.42).setY(1.72),
      lookAt: npc.position.clone().add(new Vector3(0, 0.9, 0)),
      fov: 32,
    },
    {
      id: `npc.line.${npc.dialogueId}`,
      label: `${npc.name} lineup angle`,
      player: new Vector3(-1.8 + index * 1.2, 0, 5.0),
      yaw: Math.PI,
      camera: new Vector3(0, 2.35, 7.1),
      lookAt: new Vector3(0, 1.05, 2.45),
      fov: 45,
    },
  ] satisfies TownDebugPose[];
});

export const firstTownDebugPoses: TownDebugPose[] = [
  {
    id: 'town.spawn.default',
    label: 'spawn default',
    player: firstTownSpawn.clone(),
    yaw: Math.PI,
    camera: new Vector3(0, 3.1, 12.6),
    lookAt: new Vector3(0, 1.25, 7),
    fov: 54,
  },
  {
    id: 'town.north_gate.inside',
    label: 'north gate inside',
    player: new Vector3(0, 0, -14.2),
    yaw: Math.PI,
    camera: new Vector3(0, 3.1, -8.6),
    lookAt: new Vector3(0, 1.25, -14.2),
    fov: 50,
  },
  ...buildingFrontPoses,
  ...wallPoses,
  ...npcPoses,
  {
    id: 'battle.default.party',
    label: 'battle party default',
    player: firstTownBattleTrigger.clone(),
    yaw: Math.PI,
    camera: new Vector3(0, 3.05, -19.2),
    lookAt: new Vector3(0, 1.2, -28.4),
    fov: 50,
  },
  {
    id: 'route.north.field_enemy',
    label: 'north route field enemy',
    player: new Vector3(0, 0, -25.45),
    yaw: Math.PI,
    camera: new Vector3(3.7, 3.15, -20.0),
    lookAt: new Vector3(0, 0.95, -27.5),
    fov: 47,
  },
  {
    id: 'route.north.stonewake_trail',
    label: 'Stonewake trail preview',
    player: new Vector3(0, 0, -42.0),
    yaw: Math.PI,
    camera: new Vector3(7.8, 5.15, -32.2),
    lookAt: new Vector3(0, 0.95, -47.0),
    fov: 50,
  },
  {
    id: 'title.cinematic.gate',
    label: 'title gate cinematic',
    player: new Vector3(0, 0, -14.2),
    yaw: Math.PI,
    camera: new Vector3(0, 4.2, -8.4),
    lookAt: new Vector3(0, 1.2, -16.9),
    fov: 46,
  },
];
