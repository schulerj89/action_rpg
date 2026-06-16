# AGENTS.md

## Project

This repo is a browser-based Three.js RPG sandbox. Current focus is a turn-based ATB battle prototype, party members, debug-driven testing, Meshy-generated world assets, and a first town scene.

## Working Rules

- Prefer small, componentized systems under `src/` instead of adding large feature blocks to `GameApp.ts`.
- Keep gameplay fallbacks primitive and synchronous; stream GLB/Meshy detail after the playable scene starts.
- Do not use headless FPS as the final performance signal. Use headed/in-app browser QA for FPS, framing, screenshots, and WebGL visibility.
- Keep `npm run build` and `npm run smoke` green before committing.
- Do not commit raw API keys, generated logs, temporary screenshots, or source zip files.
- Leave unrelated user files untouched. `public/assets/hero/mage_hero.zip` may exist locally as an untracked source archive.

## Useful Commands

- `npm run dev` - start Vite on `127.0.0.1`.
- `npm run build` - TypeScript plus production build.
- `npm run smoke` - Playwright smoke test.
- `npm run smoke:headed` - headed smoke run when visual behavior matters.
- `npm run assets:meshy-town` - generate/refine first-town Meshy assets from the manifest.

## Architecture Notes

- `src/GameApp.ts` wires systems together and exposes `window.__rpgTest` for smoke/debug automation.
- `src/world/town/firstTownLayout.ts` owns first-town layout data, colliders, NPC placements, wall placements, and debug pose coordinates.
- `src/world/town/FirstTownScene.ts` builds the town from primitive fallbacks plus streamed Meshy assets.
- `src/world/town/TownAssetSystem.ts` loads and clones GLB assets; repeated walls/props should reuse one source asset.
- `src/world/CameraRig.ts` owns exploration, battle, special move, victory, free/debug, and screenshot camera behavior.
- `src/battle/` owns ATB, combat resolution, battle flow, and animation orchestration.
- `src/vfx/VfxController.ts` owns battle VFX primitives and should expose visible state when smoke tests need to verify effects.
- `src/ui/DebugPanel.ts` should stay practical and compact, but can grow into tabs for teleport, battle, party, scene, camera, and memory tools.

## Debug And Test API

Maintain or extend `window.__rpgTest` when adding gameplay features. It should support:

- Reading scene id, player position, battle phase, party state, renderer stats, asset load status, NPC ids, and active camera mode.
- Teleporting to named debug poses such as building fronts, collision edges, wall checks, NPC close-ups, battle starts, menu/title, cutscenes, victory, and game-over.
- Starting specific battles and forcing specific hero/enemy turns.
- Triggering named cutscenes and visual effects.
- Toggling party members, boss mode, weather/sky, free camera, collision/debug overlays, and music mute.

## Visual QA Standards

- Capture screenshots from repeatable named debug poses, not manual camera guesses.
- For each town pass, capture the hero in front of every building and just outside each building collision box.
- For wall passes, capture 4-5 positions around the wall, including corners, seams, and gates.
- For NPC passes, use a debug camera that frames the full body and face/eyes.
- For battle passes, capture mage cure/thunder/special VFX, Ryuji Chi Breaker charge/impact, victory poses, XP screen, and multi-ally HUD.

## Asset And Memory Budgets

- Exploration scene target: under 140 draw calls until streaming/culling is more mature.
- Battle scene target: under 100 draw calls.
- Track renderer calls, triangles, geometries, textures, and loaded GLB ids in the debug overlay.
- Prefer reusable modular assets, instancing, and primitive collision proxies.
- Meshy preview assets are not textured; use refine output for textured GLBs.
- Remesh or regenerate heavy assets before duplicating them. Avoid multiple unique heavy GLBs for repeated walls, crates, grass, fences, or signs.

## Local Codex Skills

These local skills support future passes:

- `C:/Users/joshs/.codex/skills/meshy-asset-pipeline`
- `C:/Users/joshs/.codex/skills/game-asset-budget`
- `C:/Users/joshs/.codex/skills/game-direction-review`
- `C:/Users/joshs/.codex/skills/game-screenshot-qa`

Use sub-agents for bounded reviews or disjoint implementation slices. Close sub-agents when their result is integrated.
