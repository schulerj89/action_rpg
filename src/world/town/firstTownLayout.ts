import { Vector3 } from 'three';
import type { TownAssetId } from '../../config/townAssets';
import type { AabbCollider } from '../CollisionResolver';

export const firstTownSceneId = 'first-town';
export const firstTownSpawn = new Vector3(0, 0, 7.0);
export const firstTownBattleTrigger = new Vector3(0, 0, -27.5);

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

export interface TownAssetPlacement {
  assetId: TownAssetId;
  hiddenInCombat: boolean;
  id: string;
  position: Vector3;
  rotationY?: number;
  targetHeight?: number;
  targetLongestSide?: number;
}

export const firstTownBuildings: TownBuildingLayout[] = [
  {
    accent: '#d8a03d',
    assetId: 'weapon-shop',
    collider: { id: 'weapon-shop', minX: -11.9, maxX: -5.1, minZ: -10.4, maxZ: -4.0 },
    id: 'weapon-shop',
    kind: 'weapons',
    position: new Vector3(-8.5, 0, -7.0),
    roof: '#9c3f32',
    targetHeight: 4.2,
  },
  {
    accent: '#8b5cf6',
    assetId: 'potion-shop',
    collider: { id: 'potion-shop', minX: 5.0, maxX: 12.0, minZ: -10.4, maxZ: -4.0 },
    id: 'potion-shop',
    kind: 'potions',
    position: new Vector3(8.4, 0, -7.0),
    roof: '#6147b7',
    targetHeight: 4.2,
  },
  {
    accent: '#14b8a6',
    assetId: 'village-house',
    collider: { id: 'northwest-house', minX: -15.4, maxX: -10.4, minZ: -1.2, maxZ: 3.9 },
    id: 'northwest-house',
    kind: 'house',
    position: new Vector3(-12.9, 0, 1.3),
    roof: '#0f766e',
    rotationY: -0.12,
    targetHeight: 3.55,
  },
  {
    accent: '#0ea5e9',
    assetId: 'village-house',
    collider: { id: 'northeast-house', minX: 10.3, maxX: 15.3, minZ: -1.1, maxZ: 4.0 },
    id: 'northeast-house',
    kind: 'house',
    position: new Vector3(12.8, 0, 1.4),
    roof: '#0369a1',
    rotationY: 0.16,
    targetHeight: 3.5,
  },
  {
    accent: '#f59e0b',
    assetId: 'village-house',
    collider: { id: 'southwest-house', minX: -10.1, maxX: -5.0, minZ: 5.5, maxZ: 10.8 },
    id: 'southwest-house',
    kind: 'house',
    position: new Vector3(-7.55, 0, 8.0),
    roof: '#b45309',
    rotationY: 0.08,
    targetHeight: 3.35,
  },
  {
    accent: '#f472b6',
    assetId: 'village-house',
    collider: { id: 'southeast-house', minX: 5.1, maxX: 10.2, minZ: 5.6, maxZ: 10.9 },
    id: 'southeast-house',
    kind: 'house',
    position: new Vector3(7.65, 0, 8.1),
    roof: '#be185d',
    rotationY: -0.08,
    targetHeight: 3.35,
  },
];

export const firstTownNpcs: TownNpcLayout[] = [
  {
    accent: '#f59e0b',
    assetId: 'villager-npc',
    body: '#70451f',
    dialogueId: 'weapon_smith',
    id: 'npc-weapon-smith',
    name: 'Taro',
    position: new Vector3(-5.3, 0, -2.4),
    rotationY: 0.35,
  },
  {
    accent: '#a78bfa',
    assetId: 'villager-npc',
    body: '#ffffff',
    dialogueId: 'potion_keeper',
    id: 'npc-potion-keeper',
    name: 'Luma',
    position: new Vector3(5.4, 0, -2.45),
    rotationY: -0.32,
  },
  {
    accent: '#93c5fd',
    assetId: 'villager-npc',
    body: '#3f5f73',
    dialogueId: 'elder',
    id: 'npc-elder',
    name: 'Elder Ren',
    position: new Vector3(-2.9, 0, 3.2),
    rotationY: 0.15,
  },
  {
    accent: '#fca5a5',
    assetId: 'villager-npc',
    body: '#5b3a67',
    dialogueId: 'runner',
    id: 'npc-runner',
    name: 'Pip',
    position: new Vector3(3.15, 0, 3.55),
    rotationY: -0.2,
  },
];

export const firstTownPreloadAssetIds: TownAssetId[] = ['town-ground-tile'];

export const firstTownGroundAssets: TownAssetPlacement[] = [];

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
  ...[-12, -7, 7, 12].map((x) => ({
    assetId: 'town-wall-segment' as const,
    hiddenInCombat: true,
    id: `north-wall-${x}`,
    position: new Vector3(x, 0, -16.9),
    targetLongestSide: 5.2,
  })),
  ...[-12, -6, 0, 6, 12].map((x) => ({
    assetId: 'town-wall-segment' as const,
    hiddenInCombat: true,
    id: `south-wall-${x}`,
    position: new Vector3(x, 0, 14.0),
    targetLongestSide: 5.2,
  })),
  ...[-12, -7, -2, 3, 8, 13].flatMap((z) => [
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

export const firstTownColliders: AabbCollider[] = [
  ...firstTownBuildings.map((building) => building.collider),
  { id: 'well', minX: -0.9, maxX: 0.9, minZ: -2.25, maxZ: -0.6 },
  { id: 'north-wall-left', minX: -18.2, maxX: -2.8, minZ: -17.9, maxZ: -15.8 },
  { id: 'north-wall-right', minX: 2.8, maxX: 18.2, minZ: -17.9, maxZ: -15.8 },
  { id: 'south-wall', minX: -18.2, maxX: 18.2, minZ: 13.1, maxZ: 15.0 },
  { id: 'west-wall', minX: -18.1, maxX: -15.9, minZ: -17.9, maxZ: 15.0 },
  { id: 'east-wall', minX: 15.9, maxX: 18.1, minZ: -17.9, maxZ: 15.0 },
];
