# Patch Review Decisions

## v0.2.1 - Lock Global Shortcuts by Game State

**Decision:** Gate the `M` game-menu shortcut and `Right Shift` free-camera shortcut behind explicit gameplay-state checks.

**Why:** The code-review pass found that global shortcuts could still fire during title, cinematic, dialogue, shop, and battle states. That risked overlapping the RPG menu with modal UI or switching to free camera while the player was locked into a scripted or combat state.

**Patch type:** Logic fix and small input-state refactor.

**Files:** `src/GameApp.ts`, `tests/patch-regression.spec.ts`, version metadata.

**Smoke coverage:** The patch regression smoke presses `M` and `Right Shift` on title/opening cinematic, during NPC dialogue, with the shop panel open, and during a battle command state. It also verifies that `M` still opens and closes the menu during normal exploration.
