# Loading, Asset, and Memory Strategy

## Current Direction

The first town uses lightweight Three.js primitives first. Meshy-generated models should be treated as offline art-source assets, then optimized and imported as swappable props. This keeps the runtime predictable while the town layout, collision, dialogue, and camera behavior are still changing.

Concept references are stored at:

- `public/assets/concepts/first-town-layout.png`
- `public/assets/concepts/first-town-shops.png`

The local Meshy key file was available at `C:/Users/joshs/Projects/meshy-api-key.txt`, so the first low-poly prop pass was generated through Meshy's Text to 3D API and imported as optional runtime GLBs.

Meshy preview tasks are geometry-only. Textures come from the refine task, so the active town workflow now uses refined GLBs by default.

- `public/assets/town/first-town/town-well.glb`
- `public/assets/town/first-town/weapon-shop-sign.glb`
- `public/assets/town/first-town/potion-shop-sign.glb`
- `public/assets/town/first-town/weapon-shop.glb`
- `public/assets/town/first-town/potion-shop.glb`
- `public/assets/town/first-town/village-house.glb`
- `public/assets/town/first-town/villager-npc.glb`
- `public/assets/town/first-town/npcs/npc-weapon-smith.glb`
- `public/assets/town/first-town/npcs/npc-potion-keeper.glb`
- `public/assets/town/first-town/npcs/npc-elder.glb`
- `public/assets/town/first-town/npcs/npc-runner.glb`
- `public/assets/town/first-town/town-wall-segment.glb`
- `public/assets/town/first-town/town-ground-tile.glb`

The current town still builds primitive fallbacks first. Meshy props replace those fallbacks when they load, and town occluders are hidden during battle to keep camera readability high.

The original generic `villager-npc.glb` stays available as an inspection reference. Four per-role NPC Meshy assets now replace the primitive NPC fallbacks when they load; each NPC still has a procedural fallback if an asset request fails or a future generated model is rejected by screenshot QA.

## Loading Order

1. Create renderer, camera, lights, and the loading overlay.
2. Build the first-town primitive scene synchronously.
3. Load player and party GLBs.
4. Load scene dialogue from `public/assets/scenes/first-town/dialogue.json`.
5. Start title music and show the title screen.
6. After Start, run exploration in `first-town`.
7. Load first-town Meshy props through `FirstTownScene.loadMeshyProps()`.
8. Instantiate town placements through `TownAssetSystem` from declarative layout data.
9. Load future larger Meshy props lazily by scene or district, not all at boot.

## Scene Ownership

`FirstTownScene` owns:

- Scene root.
- Spawn point.
- Battle training-ring trigger outside the north wall.
- Static colliders.
- NPC placeholders.
- Shop interior roots.
- Asset inspection room root for generated model QA.
- Interaction trigger positions.
- Meshy asset placements and primitive fallbacks.

`GameApp` owns:

- Current hero and party roots.
- Movement and camera updates.
- Scene interaction routing.
- Battle transition wiring.
- Test API state.

Battle reset should return the player to the current scene spawn, not a hard-coded origin. Battle anchors should stay outside the town wall so combat never starts inside the settlement.

## Town Asset Building System

`src/config/townAssets.ts` is the asset registry. It maps stable `TownAssetId` values to GLB URLs.

`src/world/town/firstTownLayout.ts` is the layout source. It declares:

- Building placements and their collision boxes.
- NPC placements and dialogue IDs.
- Named debug screenshot poses for buildings, collision edges, wall seams, NPC close-ups, and battle starts.
- Ground overlay placements.
- Detail prop placements.
- Duplicated wall segment placements.

`src/world/town/TownAssetSystem.ts` loads each GLB once, clones it for each placement, normalizes scale, and aligns the model base to the placement root. This is intentionally separate from Meshy generation so runtime code never calls Meshy directly.

`src/world/town/TownPrimitiveFactory.ts` supplies fallbacks for every required gameplay object. If a generated asset is missing or too heavy, the scene still boots and smoke tests can catch the missing `/assets/` request.

## Performance Rules

- Target 60 FPS in the visible browser; treat headless FPS as unreliable for WebGL.
- Keep exploration under about 140 render calls, with 100 as the working target.
- Keep battle under about 80 render calls after town occluders are hidden.
- Keep rendered triangles under 300k when possible and under 450k as a hard cap for this sandbox.
- Keep repeatable first-town prop kits under 25 MB when possible; unique character/NPC kits can exceed that only when they are visible value and still keep the visible browser at 60 FPS.
- Use instancing for grass or repeated foliage.
- Avoid real-time shadows until the scene is stable.
- Reuse materials and geometries for primitive props.
- Keep Meshy models as separate props rather than one monolithic town GLB.
- Duplicate small props like walls from one source GLB instead of generating one large wall model.
- Prefer collision proxies over mesh collision.
- Avoid per-frame `Box3`, raycast, or allocation-heavy logic.
- Track renderer memory through `window.__rpgTest.getState().renderInfo`.
- Track town asset loading through `window.__rpgTest.getState().townAssetInfo`.

## Current Asset Budget Notes

The first refined Meshy assets have readable textures but are heavier than the target for repeated production props. Keep using them for art direction, but treat the next pass as an optimization pass:

- Resize textures: buildings at 1024px max, signs/walls/NPC/ground at 512px max.
- Avoid HD/PBR textures until the style is locked.
- Add an offline GLB scanner for file size, image bytes, triangle count, material count, animations, and skins.
- Do not let repeated wall and prop assets become unique GLBs; load one source and duplicate it in layout.
- The larger long-term memory issue is hero animation loading: move toward one visual model per hero plus animation-only clips.
- The per-role NPC kit adds about 11.2 MB total (`2.7-3.3 MB` per GLB), which is acceptable for the current first town but should be texture-resized before adding many more towns.

## Meshy Pipeline

Meshy should stay an offline/source-art pipeline, not a runtime API dependency. The current generator is:

`tools/meshy/generate-first-town-assets.mjs`

It reads `MESHY_API_KEY` first, then falls back to `C:/Users/joshs/Projects/meshy-api-key.txt`. It uses preview plus refine by default so runtime GLBs are textured. Use `--preview-only` only for shape checks.

The enemy kit generator is:

`tools/meshy/generate-enemy-assets.mjs`

It reads `tools/meshy/manifests/enemies.json` by default. Meshy animation is a separate pipeline: the official Animation API applies an action to a completed rigging task, so current enemy runtime idle/attack motion remains procedural until rigged enemy outputs exist.

The unique first-town NPC generator is:

`tools/meshy/generate-town-npc-assets.mjs`

It reads `tools/meshy/manifests/first-town-npcs.json` and writes textured GLBs to `public/assets/town/first-town/npcs`. Generated NPCs should be inspected in the asset room and close-up debug poses before being trusted as the visible town models.

Source structure:

- `tools/meshy/prompts/first-town/*.json`
- `tools/meshy/manifests/enemies.json`
- `tools/meshy/manifests/first-town-npcs.json`
- `public/assets/meshy/raw/<asset-id>/...`
- `public/assets/town/first-town/*.glb`
- `public/assets/enemies/first-town/*.glb`
- `src/config/townAssets.ts`

Generated or planned first-town kit:

- Weapons shop sign.
- Potion shop sign.
- Town well.
- Full weapon shop.
- Full potion shop.
- Reusable villager NPC shell.
- Reusable village house.
- Reusable wall segment.
- Textured ground tile.

Good next Meshy targets:

- Anvil.
- Potion shelf.
- Market cart.
- Lantern props.
- Gate arch.
- Training dummy.
- Barrel/crate cluster.
- Lantern/banner post.
- Distinct NPC variants.

Keep collision primitive even when buildings become Meshy models. Runtime collision should use AABB proxies from the layout, not mesh collision.

Note: `town-ground-tile.glb` is now placed as flattened decorative overlays. Primitive terrain remains the broad walking surface so character feet stay grounded and collision stays stable.

## Optimization Checklist For Imported GLBs

1. Download raw GLB from Meshy.
2. Create a collision proxy manually.
3. Compress and resize textures.
4. Remove unused nodes and animations.
5. Verify scale and pivot.
6. Add the final file under `public/assets/town/first-town`.
7. Add a typed entry in `src/config/townAssets.ts`.
8. Verify the browser FPS and render-call budget.

## Dialogue Data

Scene dialogue is JSON-loaded by scene ID from:

`public/assets/scenes/<scene-id>/dialogue.json`

Each NPC entry must include:

- `displayName`
- `start`
- `nodes`

Each node must include non-empty `text` and either a valid `next` node ID or `null`.
