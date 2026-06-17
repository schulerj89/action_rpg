# Patch Review Decisions

## v0.2.1 - Lock Global Shortcuts by Game State

**Decision:** Gate the `M` game-menu shortcut and `Right Shift` free-camera shortcut behind explicit gameplay-state checks.

**Why:** The code-review pass found that global shortcuts could still fire during title, cinematic, dialogue, shop, and battle states. That risked overlapping the RPG menu with modal UI or switching to free camera while the player was locked into a scripted or combat state.

**Patch type:** Logic fix and small input-state refactor.

**Files:** `src/GameApp.ts`, `tests/patch-regression.spec.ts`, version metadata.

**Smoke coverage:** The patch regression smoke presses `M` and `Right Shift` on title/opening cinematic, during NPC dialogue, with the shop panel open, and during a battle command state. It also verifies that `M` still opens and closes the menu during normal exploration.

## v0.2.2 - Normalize Room State Before Debug Cinematics

**Decision:** Force the game back to a clean town room, and wait for any active loading transition to settle, before replaying the opening cinematic from debug tools.

**Why:** The code-review pass found that replaying the opening cinematic from a shop, asset room, or active battle could leave the wrong room roots visible under the scripted town camera. Screenshot QA also caught stale loading overlay text when the debug replay was triggered immediately after a room transition. The cinematic should always stage Ryuji, Pip, the well, and the north gate inside the first town, regardless of where the debug command was launched.

**Patch type:** Logic fix with test API visibility coverage.

**Files:** `src/GameApp.ts`, `src/core/types.ts`, `tests/patch-regression.spec.ts`, version metadata.

**Smoke coverage:** The patch regression smoke enters the weapon shop, asset inspection room, and battle room, replays the opening cinematic from each state, asserts `currentRoom === 'town'`, and verifies that only the town root remains visible.

## v0.2.3 - Share Version Expectations Across Smoke Tests

**Decision:** Import `gameVersion` into smoke tests and build all expected UI version labels from the same source used by the runtime.

**Why:** The code-review pass found that version text was duplicated across `package.json`, `src/config/version.ts`, and hard-coded Playwright assertions. Every patch bump required manual literal updates in multiple tests, which made patch releases noisier and easier to break.

**Patch type:** Small test refactor and metadata consistency fix.

**Files:** `src/config/version.ts`, `tests/rpg-smoke.spec.ts`, `tests/town-playthrough.spec.ts`, `tests/patch-regression.spec.ts`, version metadata.

**Smoke coverage:** The patch regression smoke verifies the title screen and in-game menu both display the shared `v0.2.3` value, while the long RPG and playthrough tests now reference the same imported version constant.
