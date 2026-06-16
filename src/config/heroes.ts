import type { HeroAnimationKey, HeroStats, MoveId } from '../core/types';
import { heroAnimationAssets, mageHeroAnimationAssets, mageStaffAsset } from './assets';
import {
  defaultEquippedMoves,
  heroBaseStats,
  mageBaseStats,
  mageDefaultEquippedMoves,
  moveDebugOptions,
} from './combatConfig';

export type SupportHeroId = 'mira';
export type PlayerHeroId = 'ryuji';
export type PartyHeroId = PlayerHeroId | SupportHeroId;

interface HeroBattleDefinition {
  allowedMoves: MoveId[];
  defaultMoves: MoveId[];
  stats: HeroStats;
}

interface BaseHeroDefinition extends HeroBattleDefinition {
  animations: Partial<Record<HeroAnimationKey, string>>;
  attachments?: Array<{
    boneName: string;
    followMode?: 'bone' | 'handWorld';
    id?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    url: string;
  }>;
  id: PartyHeroId;
  name: string;
  portraitUrl: string;
  role: string;
}

export interface PlayerHeroDefinition extends BaseHeroDefinition {
  id: PlayerHeroId;
}

export interface SupportHeroDefinition extends BaseHeroDefinition {
  id: SupportHeroId;
  animations: Partial<Record<HeroAnimationKey, string>>;
  battleOffset: {
    back: number;
    side: number;
  };
  explorationOffset: {
    back: number;
    side: number;
  };
}

const allMoveIds = moveDebugOptions.map((option) => option.id);

export const playerHeroDefinition: PlayerHeroDefinition = {
  id: 'ryuji',
  name: 'Ryuji Vale',
  portraitUrl: '/assets/portraits/ryuji.png',
  role: 'Martial Artist',
  animations: heroAnimationAssets,
  stats: heroBaseStats,
  defaultMoves: defaultEquippedMoves,
  allowedMoves: allMoveIds,
};

export const supportHeroDefinitions: SupportHeroDefinition[] = [
  {
    id: 'mira',
    name: 'Mira Sol',
    portraitUrl: '/assets/portraits/mira.png',
    role: 'Mage',
    animations: mageHeroAnimationAssets,
    attachments: [
      {
        boneName: 'RightHand',
        followMode: 'handWorld',
        id: 'staff',
        position: [0.62, -0.2, -0.12],
        rotation: [0.08, -0.28, -0.44],
        scale: 2.15,
        url: mageStaffAsset.url,
      },
    ],
    stats: mageBaseStats,
    defaultMoves: mageDefaultEquippedMoves,
    allowedMoves: ['spiritFlare', 'thunderfall', 'starfallHex', 'healingChi', 'astralCascade'],
    battleOffset: {
      side: -1.35,
      back: 0.72,
    },
    explorationOffset: {
      side: -0.95,
      back: 0.86,
    },
  },
];

export const defaultActiveSupportHeroIds: SupportHeroId[] = ['mira'];
