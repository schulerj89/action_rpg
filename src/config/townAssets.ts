export type TownAssetId =
  | 'town-ground-tile'
  | 'town-wall-segment'
  | 'town-well'
  | 'weapon-shop'
  | 'weapon-shop-sign'
  | 'potion-shop'
  | 'potion-shop-sign'
  | 'village-house'
  | 'villager-npc'
  | 'npc-weapon-smith'
  | 'npc-potion-keeper'
  | 'npc-elder'
  | 'npc-runner';

export interface TownAssetDefinition {
  id: TownAssetId;
  url: string;
}

export const firstTownAssetDefinitions: TownAssetDefinition[] = [
  { id: 'town-ground-tile', url: '/assets/town/first-town/town-ground-tile.glb' },
  { id: 'town-wall-segment', url: '/assets/town/first-town/town-wall-segment.glb' },
  { id: 'town-well', url: '/assets/town/first-town/town-well.glb' },
  { id: 'weapon-shop', url: '/assets/town/first-town/weapon-shop.glb' },
  { id: 'weapon-shop-sign', url: '/assets/town/first-town/weapon-shop-sign.glb' },
  { id: 'potion-shop', url: '/assets/town/first-town/potion-shop.glb' },
  { id: 'potion-shop-sign', url: '/assets/town/first-town/potion-shop-sign.glb' },
  { id: 'village-house', url: '/assets/town/first-town/village-house.glb' },
  { id: 'villager-npc', url: '/assets/town/first-town/villager-npc.glb' },
  { id: 'npc-weapon-smith', url: '/assets/town/first-town/npcs/npc-weapon-smith.glb' },
  { id: 'npc-potion-keeper', url: '/assets/town/first-town/npcs/npc-potion-keeper.glb' },
  { id: 'npc-elder', url: '/assets/town/first-town/npcs/npc-elder.glb' },
  { id: 'npc-runner', url: '/assets/town/first-town/npcs/npc-runner.glb' },
];
