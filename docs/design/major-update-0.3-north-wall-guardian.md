# Major Update Direction: v0.3.0 North Wall Guardian

## Expert Playthrough Decision

The RPG direction review recommends the next major update should close the current first-town loop instead of expanding sideways into a full second town. The best target is `v0.3.0 - North Wall Guardian`: after the player prepares in Aetherwake, defeats the visible prowler, and reaches the Stonewake trail marker, the route should escalate into a Shellback Guardian boss encounter outside the north wall. After victory, Aetherwake should enter a short recovery state with updated NPC/shop dialogue.

This gives the vertical slice a full RPG arc:

1. Learn the threat in town.
2. Prepare at shops.
3. Fight the north-road prowler.
4. Hear Pip point the player toward Stonewake.
5. Face the guardian threat on the road.
6. Return to a town that visibly reacts.

## Why This Update

The current build already has the expensive pieces needed for this arc: first-town layout, shops, equipment, NPC dialogue, an ATB battle loop, boss music, Shellback Guardian asset support, XP/level-up results, debug poses, region map metadata, and screenshot smoke tests. A full new town would spread polish too thin. More title/menu polish would not give the player a stronger reason to care about shops, objectives, or the north road.

The guardian update makes the existing systems matter.

## v0.2.0 Enabling Work

This patch ships the first slice needed for the v0.3.0 plan:

- Adds a first-town objective tracker during exploration.
- Adds a Journal tab to the RPG menu.
- Exposes objective state through the smoke-test API.
- Tracks town preparation, prowler victory, Pip's Stonewake callout, and the trail marker.
- Bumps the visible build version to `v0.2.0`.

## v0.3.0 Implementation Checklist

- Extend route state with second-pressure encounter, guardian unlocked, guardian defeated, and town recovered flags.
- Add objectives for "Survive the second prowler," "Defeat the Shellback Guardian," and "Return to Aetherwake."
- Wire a boss trigger after `route.north.stonewake_trail`.
- Use the existing `shellback-guardian` asset and boss mode for the encounter.
- Make preparation matter through Copper Handwraps, Small Potions, or basic item use.
- Add post-boss recovery visuals in `FirstTownScene`: gate lights, clear road, thankful NPCs, and calmer shop dialogue.
- Expand `public/assets/scenes/first-town/dialogue.json` with pre-boss and post-recovery lines.
- Extend smoke tests for objective progression, boss battle loading, victory, and recovered town state.

## Smoke Coverage Needed

- Title/help/menu at the current version.
- Objective tracker visible after the opening cinematic.
- Journal shows the same objective checklist as the exploration HUD.
- Elder, weapon shop, and potion store complete preparation checklist items.
- Fixed prowler appears before battle and disappears after victory.
- Pip's post-battle dialogue advances the objective.
- Stonewake trail marker completes the route preview.
- Guardian battle loads Shellback Guardian, boss music, boss HUD, and readable camera angles.
- Victory XP resolves and the town recovery state appears.
