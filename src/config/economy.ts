import type { PartyHeroId } from './heroes';
import type { StatKey } from '../core/types';

export type ShopId = 'potions' | 'weapons';

export interface ItemDefinition {
  description: string;
  id: string;
  name: string;
  price: number;
  shopId: ShopId;
  type: 'consumable' | 'weapon';
}

export interface WeaponDefinition extends ItemDefinition {
  heroId: PartyHeroId;
  statBonuses: Partial<Record<StatKey, number>>;
  type: 'weapon';
}

export interface ConsumableDefinition extends ItemDefinition {
  type: 'consumable';
}

export type ShopItemDefinition = ConsumableDefinition | WeaponDefinition;

export const startingGold = 180;

export const itemDefinitions: ShopItemDefinition[] = [
  {
    id: 'training-wraps',
    name: 'Training Wraps',
    description: 'Ryuji starts with these simple hand wraps.',
    heroId: 'ryuji',
    price: 0,
    shopId: 'weapons',
    statBonuses: {},
    type: 'weapon',
  },
  {
    id: 'copper-handwraps',
    name: 'Copper Handwraps',
    description: 'Cheap reinforced wraps. Strength +2.',
    heroId: 'ryuji',
    price: 60,
    shopId: 'weapons',
    statBonuses: { strength: 2 },
    type: 'weapon',
  },
  {
    id: 'oak-tonfa',
    name: 'Oak Tonfa',
    description: 'Balanced practice tonfa. Strength +1, Defense +1.',
    heroId: 'ryuji',
    price: 90,
    shopId: 'weapons',
    statBonuses: { defense: 1, strength: 1 },
    type: 'weapon',
  },
  {
    id: 'moonlit-staff',
    name: 'Moonlit Staff',
    description: 'Mira keeps this staff when she joins from debug tools.',
    heroId: 'mira',
    price: 0,
    shopId: 'weapons',
    statBonuses: { focus: 1 },
    type: 'weapon',
  },
  {
    id: 'riverwood-staff',
    name: 'Riverwood Staff',
    description: 'A starter casting staff. Focus +2.',
    heroId: 'mira',
    price: 70,
    shopId: 'weapons',
    statBonuses: { focus: 2 },
    type: 'weapon',
  },
  {
    id: 'small-potion',
    name: 'Small Potion',
    description: 'Restores a little HP in future field use. Useful shop stock for now.',
    price: 25,
    shopId: 'potions',
    type: 'consumable',
  },
  {
    id: 'focus-tea',
    name: 'Focus Tea',
    description: 'A quiet tonic for spellcasters. Future mana recovery item.',
    price: 40,
    shopId: 'potions',
    type: 'consumable',
  },
];

export const defaultEquippedWeaponByHero: Record<PartyHeroId, string> = {
  ryuji: 'training-wraps',
  mira: 'moonlit-staff',
};

export const startingInventory: Record<string, number> = {
  'training-wraps': 1,
  'moonlit-staff': 1,
  'small-potion': 2,
};

export function getItemDefinition(id: string): ShopItemDefinition | undefined {
  return itemDefinitions.find((item) => item.id === id);
}

export function getWeaponDefinition(id: string): WeaponDefinition | undefined {
  const item = getItemDefinition(id);
  return item?.type === 'weapon' ? item : undefined;
}

export function getShopStock(shopId: ShopId): ShopItemDefinition[] {
  return itemDefinitions.filter((item) => item.shopId === shopId && item.price > 0);
}
