# First-Playthrough Story Arc

## Goal

Build `Aetherwake` around a polished 2-3 hour first playthrough that starts in the first town, teaches the core battle loop, and pays off with a boss victory that visibly changes the town. Keep story labels short and compatible with that one-word title unless the runtime title screen changes.

## Ending First

The ending is a night battle outside the north wall, where the player defeats the Shellback Guardian before it breaks through the training-ring seal and turns the first town into an ember nest. Victory should not imply the whole world is saved. It should make the first town safe, restore its gate lights, reopen both shops, and reveal that the Guardian was only the first creature drawn by a deeper signal beyond the wall.

The final player feeling should be: this town mattered, the party earned its trust, and the road beyond the gate is now deserved.

## Working Backward

1. Final boss need: the player must know why the Shellback Guardian is at the wall.
2. Prior beat: NPCs explain that ember creatures follow heat, ore, and old ward-stones under the town well.
3. Prior beat: the weapon shop and potion shop each contribute one preparation step for the north-wall push.
4. Prior beat: the player learns the ATB battle rhythm against Ember Prowlers in a controlled fight outside town.
5. Opening beat: the first town appears safe, but every practical interaction hints that the wall is already under pressure.

## Critical Path

| Time | Beat | Gameplay | Story Function |
| --- | --- | --- | --- |
| 0-10 min | Title, start, town spawn | Move, camera, interact | Establish `Aetherwake` as immediate action inside a lived-in town. |
| 10-30 min | Well and shop loop | Talk to 3 NPCs, visit weapon and potion shops | Show the town depends on shared routines now disrupted by ember sightings. |
| 30-50 min | First north-wall scare | Training-ring trigger starts an Ember Prowler battle | Teach ATB basics and make the threat visible without leaving the hub. |
| 50-80 min | Repair preparation | Shop errands unlock basic weapon/potion upgrades | Convert shops from menus into story support systems. |
| 80-110 min | Mira optional recruit | Debug/optional party toggle or side beat near the well | Let Mira add tactical flexibility and banter without blocking the solo path. |
| 110-140 min | Second prowler push | Two-wave encounter or stronger prowler variant | Prove the player can survive pressure and preview the boss arena. |
| 140-170 min | Shellback Guardian | Boss battle outside north wall | Pay off town stakes, wall pressure, shop preparation, and enemy escalation. |
| 170-180 min | Town recovery | Short return scene, reopened shops, gate lights | Close the first-town arc and point to the next region. |

## Town Roles

- Town well: The oldest ward-stone sits under the well. It becomes the story reason enemies are drawn inward and gives NPCs a shared gathering point.
- Weapon shop: The smith frames combat as protection, not loot. A repair errand can unlock a basic damage upgrade before the boss.
- Potion shop: The apothecary frames recovery as community care. A herb or vial errand can unlock a small stock refresh or cure tutorial.
- North wall and training ring: This is the only first-arc battle entry point. Keep combat outside the settlement so the town remains readable and safe.
- Village houses: Use them as mood markers. Early lights are warm and normal; after prowler attacks, some lights dim; after victory, gate and house lights return.

## NPC Cast

- Smith: Practical, blunt, worried that the wall guards are under-equipped. Gameplay job: weapon upgrade or attack tutorial. Story job: make the player responsible for town defense.
- Apothecary: Calm under pressure, tracks ember burns and panic. Gameplay job: potion/cure tutorial. Story job: make recovery part of the town's identity.
- Gate Watcher: Posted near the north wall. Gameplay job: battle trigger and warning state. Story job: externalize the rising threat.
- Well Keeper: Knows the ward-stone history but avoids saying too much early. Gameplay job: points the player between shops and well. Story job: links the town's daily life to the final boss motive.
- Mira: Optional/debug recruit. Gameplay job: optional ally for party tests, support actions, and banter coverage. Story job: show another person choosing to help, but do not require her for any critical objective.

## Battle Progression

First battle: One Ember Prowler. It should read as fast, hungry, and fragile. Use it to teach normal attacks, enemy turns, damage feedback, and victory recovery.

Second battle: Two Ember Prowlers or one stronger prowler with a short charge tell. Use this to teach target priority, potion timing, and the value of any shop upgrades.

Final battle: Shellback Guardian. The Guardian should be slow, heavy, and protective of the ember signal. It should alternate shell-guard turns with high-impact attacks so the player learns when to attack, recover, and wait.

Mira variant: If Mira is present, add one optional support prompt or reactive line. Do not change boss health or objective requirements solely because she is recruited.

## Generated Enemy Direction

Ember Prowler:

- Small fox-cat quadruped with ember orange fur, charcoal paws, flame-tipped tail, and glowing teal eyes.
- Combat role: quick pressure enemy with low health and visible windup.
- Animation need: idle prowl, leap/strike, hit recoil, defeat fade or collapse.
- VFX need: small ember trail on attack, brief teal eye flare before charge.

Shellback Guardian:

- Stout boss beast with mossy gray stone shell, deep green body, amber horn accents, horned mask face, and glowing purple eyes.
- Combat role: first-arc boss that alternates defense and burst damage.
- Animation need: heavy idle, shell brace, horn slam, stagger, defeat kneel.
- VFX need: dust ring on slam, purple eye pulse when guarding, ember cracks fading after victory.

Both enemies should remain readable from the battle camera at small scale. Avoid readable text, logos, thin spikes, or noisy surface detail that would disappear in motion.

## Implementation Handoff

- Add dialogue in scene data only after the runtime owner is ready; keep this doc as the source of intent for now.
- Use stable debug names for smoke coverage: `story-well`, `story-weapon-shop`, `story-potion-shop`, `story-north-wall`, `battle-ember-prowler`, and `battle-shellback-guardian`.
- Keep first-town primitive fallbacks valid. Story beats should not require Meshy props to load before the player can progress.
- Treat Mira as a testable optional branch: solo path, Mira path, and debug-recruited path should all reach the same ending.
- The first playable milestone is complete when a tester can summarize the town's problem, use both shops, win two prowler encounters, optionally recruit Mira, defeat the Guardian, and see the town recover.
