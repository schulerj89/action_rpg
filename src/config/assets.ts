import type { HeroAnimationKey } from '../core/types';

const heroBase = '/assets/hero/Meshy_AI_a_small_chibi_boy_kun_biped_Animation_';

export const heroAnimationAssets: Partial<Record<HeroAnimationKey, string>> = {
  explorationIdle: '/assets/hero/Meshy_AI_Animation_Idle_3_withSkin.glb',
  battleIdle: '/assets/hero/Meshy_AI_Animation_Idle_5_withSkin.glb',
  run: `${heroBase}Running_withSkin.glb`,
  attack: `${heroBase}Punch_Combo_2_withSkin.glb`,
  kick: `${heroBase}Spartan_Kick_withSkin.glb`,
  hook: `${heroBase}Left_Short_Hook_from_Guard_withSkin.glb`,
  uppercut: `${heroBase}Right_Uppercut_from_Guard_withSkin.glb`,
  highKick: `${heroBase}Step_in_High_Kick_withSkin.glb`,
  sweepKick: `${heroBase}Sweeping_Kick_withSkin.glb`,
  lungeSpinKick: '/assets/hero/Meshy_AI_Animation_Lunge_Spin_Kick_withSkin.glb',
  chi: `${heroBase}mage_soell_cast_withSkin.glb`,
  slam: `${heroBase}Charged_Ground_Slam_withSkin.glb`,
  hit: `${heroBase}Hit_Reaction_1_withSkin.glb`,
  dead: `${heroBase}Dead_withSkin.glb`,
  victory: `${heroBase}Victory_Cheer_withSkin.glb`,
};

const mageHeroBase = '/assets/hero/mage/Meshy_AI_a_small_chibi_girl_wi_biped_Animation_';

export const mageHeroAnimationAssets: Partial<Record<HeroAnimationKey, string>> = {
  explorationIdle: `${mageHeroBase}Idle_02_withSkin.glb`,
  battleIdle: `${mageHeroBase}Combat_Stance_withSkin.glb`,
  run: `${mageHeroBase}Running_withSkin.glb`,
  chi: `${mageHeroBase}mage_soell_cast_3_withSkin.glb`,
  mageCast7: `${mageHeroBase}mage_soell_cast_7_withSkin.glb`,
  slam: `${mageHeroBase}Charged_Ground_Slam_withSkin.glb`,
  victory: '/assets/hero/mage/Meshy_AI_Animation_Jazz_Hands_inplace_withSkin.glb',
};

export const mageStaffAsset = {
  title: 'Mage Wizard Staff',
  url: '/assets/hero/mage/mage_wizard_staff.glb',
};

export const battleMusicAsset = {
  title: 'Epic Boss Battle',
  url: '/assets/audio/juhani-junkala-epic-boss-battle-loop.wav',
  sourceUrl: 'https://opengameart.org/content/boss-battle-music',
  author: 'SubspaceAudio / Juhani Junkala',
  license: 'CC0',
};

export const bossMusicAsset = {
  title: 'JRPG Epic Rock Battle Theme #1',
  url: '/assets/audio/hydrogene-jrpg-epic-rock-battle-theme-full.mp3',
  sourceUrl: 'https://opengameart.org/content/jrpg-epic-rock-battle-theme-1',
  author: 'HydroGene',
  license: 'CC0',
};

export const titleMusicAsset = {
  title: 'A New Town (RPG Theme)',
  url: '/assets/audio/cynicmusic-a-new-town.mp3',
  sourceUrl: 'https://opengameart.org/content/a-new-town-rpg-theme',
  author: 'cynicmusic',
  license: 'CC0',
};

export const townMusicAsset = {
  title: 'A New Town (RPG Theme)',
  url: '/assets/audio/cynicmusic-a-new-town.mp3',
  sourceUrl: 'https://opengameart.org/content/a-new-town-rpg-theme',
  author: 'cynicmusic',
  license: 'CC0',
};

export const victoryMusicAsset = {
  title: 'Victory Theme for RPG',
  url: '/assets/audio/cynicmusic-victory-theme-for-rpg.mp3',
  sourceUrl: 'https://opengameart.org/content/victory-theme-for-rpg',
  author: 'cynicmusic',
  license: 'CC0',
};

export const gameOverMusicAsset = {
  title: 'Sad game over',
  url: '/assets/audio/emma-ma-sad-game-over.ogg',
  sourceUrl: 'https://opengameart.org/content/sad-game-over',
  author: 'Emma_MA',
  license: 'CC0',
};

export const chiChargeSfxAsset = {
  title: 'Magic Spell SFX - magical_1',
  url: '/assets/audio/jaggedstone-magical-charge.ogg',
  sourceUrl: 'https://opengameart.org/content/magic-spell-sfx',
  author: 'JaggedStone',
  license: 'CC0',
};

export const chiImpactSfxAsset = {
  title: 'Magic Spell SFX - magical_4',
  url: '/assets/audio/jaggedstone-magical-impact.ogg',
  sourceUrl: 'https://opengameart.org/content/magic-spell-sfx',
  author: 'JaggedStone',
  license: 'CC0',
};

export const healingSfxAsset = {
  title: 'Magic Words + Healing Sound Effect - health_restore',
  url: '/assets/audio/springspring-health-restore.wav',
  sourceUrl: 'https://opengameart.org/content/magic-words-healing-sound-effect',
  author: 'Spring Spring',
  license: 'CC0',
};

export const chiBreakerChargeStartSfxAsset = {
  title: 'Electricity Game Sound Pack - chargestart',
  url: '/assets/audio/faxcorp-chi-breaker-charge-start.ogg',
  sourceUrl: 'https://opengameart.org/content/electricity-game-sound-pack',
  author: 'faxcorp',
  license: 'CC0',
};

export const chiBreakerChargeLoopSfxAsset = {
  title: 'Electricity Game Sound Pack - charge',
  url: '/assets/audio/faxcorp-chi-breaker-charge-loop.ogg',
  sourceUrl: 'https://opengameart.org/content/electricity-game-sound-pack',
  author: 'faxcorp',
  license: 'CC0',
};

export const levelUpSfxAsset = {
  title: 'Level up, power up, Coin get - Rise03',
  url: '/assets/audio/wobbleboxx-level-up-rise.wav',
  sourceUrl: 'https://opengameart.org/content/level-up-power-up-coin-get-13-sounds',
  author: 'WobbleBoxx Workshop',
  license: 'CC0',
};

export const punchImpactSfxAsset = {
  title: '37 hits/punches - hit09',
  url: '/assets/audio/qubodup-punch-impact.ogg',
  sourceUrl: 'https://opengameart.org/content/37-hitspunches',
  author: 'Independent.nu / qubodup',
  license: 'CC0',
};

export const kickImpactSfxAsset = {
  title: '37 hits/punches - hit16',
  url: '/assets/audio/qubodup-kick-impact.ogg',
  sourceUrl: 'https://opengameart.org/content/37-hitspunches',
  author: 'Independent.nu / qubodup',
  license: 'CC0',
};

export const enemyImpactSfxAsset = {
  title: '37 hits/punches - hit30',
  url: '/assets/audio/qubodup-enemy-impact.ogg',
  sourceUrl: 'https://opengameart.org/content/37-hitspunches',
  author: 'Independent.nu / qubodup',
  license: 'CC0',
};
