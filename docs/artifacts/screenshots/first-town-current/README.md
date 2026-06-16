# First Town Screenshot Artifacts

Generated on 2026-06-16 from `npm run smoke`.

Source capture directory: `test-results/qa-screens/current`

These screenshots are intentionally committed as browseable QA artifacts for the current first-town sandbox state. The source smoke run passed before copying these files. Headless Playwright captures can show lower FPS overlays than the visible in-app browser; use the visible browser for performance judgment. This pass includes high-detail Meshy NPC replacements, generated shop interior GLBs, walkable shop rooms, shopkeeper-driven full-screen shop menus, multi-party ATB HUD coverage, and enemy attack camera windup/impact frames.

## Coverage

- `town/` - first-town gate view, opening caption, free-camera check, and visible in-app browser title check.
- `shops/` - weapon shop walkable room plus full-screen weapon/potion shop menus.
- `battle/` - boss battle HUD, multi-party ATB, enemy Pulse Ram camera, mage Thunderfall, Ryuji Cure, Ryuji Chi Breaker, victory XP, and game over.
- `npcs/` - generated NPC closeups plus the asset-room NPC lineup.
- `buildings/` - front and collision-edge checks for each town building.
- `walls/` - wall/corner/gate checks including the south wall near `x=-2.8, z=12.7`.
- `menus/` - title screen, title settings/help panels, equipment menu, and party menu.

## Files

### Town

- `town/cinematic-opening-caption.png`
- `town/debug-free-camera-view.png`
- `town/browser-visible-title.png`
- `town/town-north_gate-inside.png`

### Shops

- `shops/shop-potion-interior.png`
- `shops/shop-potion-menu-fullscreen.png`
- `shops/shop-weapon-interior.png`
- `shops/shop-weapon-menu-fullscreen.png`
- `shops/shop-weapon-walkable.png`

### Battle

- `battle/battle-enemy-pulse-ram-impact.png`
- `battle/battle-enemy-pulse-ram-windup.png`
- `battle/battle-game-over-screen.png`
- `battle/battle-hud-boss-party.png`
- `battle/battle-hud-mobile-party-atb.png`
- `battle/battle-hud-multi-atb-ready.png`
- `battle/battle-mage-thunderfall-charge.png`
- `battle/battle-mage-thunderfall-impact.png`
- `battle/battle-mage-thunderfall-overhead.png`
- `battle/battle-ryuji-chi-breaker-charge.png`
- `battle/battle-ryuji-chi-breaker-impact.png`
- `battle/battle-ryuji-cure-effect.png`
- `battle/battle-victory-xp-results.png`

### NPCs

- `npcs/asset-room-generated-npc-front.png`
- `npcs/npc-close-elder.png`
- `npcs/npc-close-potion_keeper.png`
- `npcs/npc-close-runner.png`
- `npcs/npc-close-weapon_smith.png`

### Buildings

- `buildings/building-northeast-house-collision.png`
- `buildings/building-northeast-house-front.png`
- `buildings/building-northwest-house-collision.png`
- `buildings/building-northwest-house-front.png`
- `buildings/building-potion-shop-collision.png`
- `buildings/building-potion-shop-front.png`
- `buildings/building-southeast-house-collision.png`
- `buildings/building-southeast-house-front.png`
- `buildings/building-southwest-house-collision.png`
- `buildings/building-southwest-house-front.png`
- `buildings/building-weapon-shop-collision.png`
- `buildings/building-weapon-shop-front.png`

### Walls

- `walls/wall-corner-ne.png`
- `walls/wall-corner-nw.png`
- `walls/wall-corner-se.png`
- `walls/wall-corner-sw.png`
- `walls/wall-north-left_gate.png`
- `walls/wall-north-right_gate.png`
- `walls/wall-south-center.png`
- `walls/wall-south-left_run.png`
- `walls/wall-south-right_run.png`
- `walls/wall-south-x_minus_2_8.png`

### Menus

- `menus/menu-game-equipment.png`
- `menus/menu-game-party.png`
- `menus/menu-title-help.png`
- `menus/menu-title-panel.png`
- `menus/menu-title-screen.png`
