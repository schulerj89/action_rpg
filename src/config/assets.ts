import type { HeroAnimationKey } from '../core/types';

const heroBase = '/assets/hero/Meshy_AI_a_small_chibi_boy_kun_biped_Animation_';

export const heroAnimationAssets: Record<HeroAnimationKey, string> = {
  idle: `${heroBase}Boxing_Warmup_withSkin.glb`,
  run: `${heroBase}Running_withSkin.glb`,
  attack: `${heroBase}Punch_Combo_2_withSkin.glb`,
  chi: `${heroBase}mage_soell_cast_withSkin.glb`,
  slam: `${heroBase}Charged_Ground_Slam_withSkin.glb`,
  hit: `${heroBase}Hit_Reaction_1_withSkin.glb`,
  victory: `${heroBase}Victory_Cheer_withSkin.glb`,
};

export const battleMusicAsset = {
  title: 'Epic Boss Battle',
  url: '/assets/audio/juhani-junkala-epic-boss-battle-loop.wav',
  sourceUrl: 'https://opengameart.org/content/boss-battle-music',
  author: 'SubspaceAudio / Juhani Junkala',
  license: 'CC0',
};
