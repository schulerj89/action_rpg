import type { ShopId } from './economy';

export interface ShopInteriorAssetDefinition {
  id: ShopId;
  targetLongestSide: number;
  url: string;
}

export const shopInteriorAssetDefinitions: ShopInteriorAssetDefinition[] = [
  {
    id: 'weapons',
    targetLongestSide: 10.6,
    url: '/assets/town/first-town/interiors/weapon-shop-interior.glb',
  },
  {
    id: 'potions',
    targetLongestSide: 10.6,
    url: '/assets/town/first-town/interiors/potion-shop-interior.glb',
  },
];
