import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const qaScreenshotDir = 'test-results/qa-screens/current';

test('RPG sandbox battle path loads, resolves actions, wins, and resets', async ({ page }) => {
  test.setTimeout(360_000);
  const errors: string[] = [];
  const assetErrors: string[] = [];
  mkdirSync(qaScreenshotDir, { recursive: true });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && /\/assets\//.test(response.url())) {
      assetErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.route('**/town-ground-tile.glb', async (route) => {
    await page.waitForTimeout(900);
    await route.continue();
  });

  await page.goto('/');

  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('debug-stats')).toBeVisible();
  await expect(page.getByTestId('loading-state')).toBeHidden({ timeout: 45_000 });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().sceneId)).toBe('first-town');
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().npcIds))
    .toEqual(['weapon_smith', 'potion_keeper', 'elder', 'runner']);
  await expect(page.getByTestId('title-screen')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townAssetInfo.loading)).toBe(true);
  await expect
    .poll(() => page.evaluate(() => [...(window.__rpgTest?.getState().meshyProps ?? [])].sort()), { timeout: 90_000 })
    .toEqual([
      'potion-shop',
      'potion-shop-sign',
      'town-ground-tile',
      'town-wall-segment',
      'town-well',
      'village-house',
      'villager-npc',
      'weapon-shop',
      'weapon-shop-sign',
    ]);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townAssetInfo.failed)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townAssetInfo.loading)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().enemyVisual.loading), { timeout: 90_000 }).toBe(false);
  await expect
    .poll(() => page.evaluate(() => [...(window.__rpgTest?.getState().enemyVisual.loaded ?? [])].sort()))
    .toEqual(['ember-prowler', 'shellback-guardian']);
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().townAssetInfo.instanceCounts['town-wall-segment']))
    .toBeGreaterThan(10);
  const titleBox = await page.locator('.title-stack h1').boundingBox();
  const startBox = await page.getByTestId('title-start').boundingBox();
  expect(Math.abs((titleBox?.x ?? 0) + (titleBox?.width ?? 0) / 2 - ((startBox?.x ?? 0) + (startBox?.width ?? 0) / 2))).toBeLessThan(12);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobileTitleBox = await page.locator('.title-stack h1').boundingBox();
  const mobileStartBox = await page.getByTestId('title-start').boundingBox();
  expect(
    Math.abs(
      (mobileTitleBox?.x ?? 0) +
        (mobileTitleBox?.width ?? 0) / 2 -
        ((mobileStartBox?.x ?? 0) + (mobileStartBox?.width ?? 0) / 2),
    ),
  ).toBeLessThan(12);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('title-menu-panel')).toBeVisible();
  await page.getByTestId('title-back').click();
  await expect(page.getByTestId('title-menu-panel')).toBeHidden();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('title-screen')).toBeHidden();
  await expect(page.getByTestId('opening-caption')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 14_000 });
  await page.evaluate(() => window.__rpgTest?.muteAudio());

  const canvasBox = await page.getByTestId('game-canvas').boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(300);
  expect(canvasBox?.height).toBeGreaterThan(200);

  await page.waitForTimeout(900);
  const fpsAfter = await page.getByTestId('debug-stats').textContent();
  expect(fpsAfter).toMatch(/FPS/i);
  expect(await page.evaluate(() => window.__rpgTest?.getState().renderInfo.calls)).toBeLessThan(140);

  await page.evaluate(() => window.__rpgTest?.cycleWeather());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().weatherInfo.mode)).toBe('mist');
  await page.evaluate(() => window.__rpgTest?.cycleWeather());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().weatherInfo.mode)).toBe('rain');
  await page.evaluate(() => window.__rpgTest?.cycleWeather());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().weatherInfo.mode)).toBe('clear');

  await page.evaluate(() => window.__rpgTest?.toggleMenu());
  await expect(page.getByTestId('game-menu')).toBeVisible();
  await page.getByTestId('menu-tab-equipment').click();
  await expect(page.getByTestId('menu-content')).toContainText('Moonlit Staff');
  await expect(page.getByTestId('menu-content')).toContainText('Gold');
  await page.getByTestId('menu-tab-party').click();
  await expect(page.getByTestId('menu-content')).toContainText('Mira Sol');
  await page.getByTestId('menu-tab-help').click();
  await expect(page.getByTestId('menu-content')).toContainText('Right Shift');
  await page.getByTestId('menu-close').click();
  await expect(page.getByTestId('game-menu')).toBeHidden();

  await page.evaluate(() => window.__rpgTest?.enterShop('weapons'));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom)).toBe('shop');
  await expect(page.getByTestId('shop-panel')).toBeVisible();
  await expect(page.getByTestId('shop-title')).toHaveText('Weapon Shop');
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(true, true));
  await page.screenshot({ path: `${qaScreenshotDir}/shop-weapon-interior.png` });
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(false));
  await page.getByTestId('shop-buy-copper-handwraps').click();
  await page.getByTestId('shop-equip-copper-handwraps').click();
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().economy.equippedWeaponByHero.ryuji))
    .toBe('copper-handwraps');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().economy.gold)).toBe(120);
  await page.getByTestId('shop-close').click();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom)).toBe('town');

  await page.evaluate(() => window.__rpgTest?.enterShop('potions'));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().shopId)).toBe('potions');
  await expect(page.getByTestId('shop-title')).toHaveText('Potion Store');
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(true, true));
  await page.screenshot({ path: `${qaScreenshotDir}/shop-potion-interior.png` });
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(false));
  await page.getByTestId('shop-buy-small-potion').click();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().economy.inventory['small-potion'])).toBe(3);
  await page.evaluate(() => window.__rpgTest?.exitSpecialRoom());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom)).toBe('town');

  await page.evaluate(() => window.__rpgTest?.enterAssetRoom());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom), { timeout: 45_000 }).toBe('asset-room');
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().assetRoomInfo.every((item) => item.status === 'loaded')))
    .toBe(true);
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(true, true));
  await page.screenshot({ path: `${qaScreenshotDir}/asset-room-generated-npc-front.png` });
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(false));
  await page.evaluate(() => window.__rpgTest?.exitSpecialRoom());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom)).toBe('town');

  await page.evaluate(() => window.__rpgTest?.setFreeCamera(true));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.mode)).toBe('free');
  await page.evaluate(() => window.__rpgTest?.setFreeCamera(false));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.mode)).toBe('exploration');
  await page.mouse.move((canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2, (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(
    (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2 + 84,
    (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2 - 16,
  );
  await page.mouse.up({ button: 'right' });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.mode)).toBe('free');
  await page.evaluate(() => window.__rpgTest?.setFreeCamera(false));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.mode)).toBe('exploration');

  await captureTownQaScreenshots(page);

  await page.evaluate(() => window.__rpgTest?.interactWithNpc('elder'));
  await expect(page.getByTestId('dialogue-box')).toBeVisible();
  await expect(page.getByTestId('dialogue-speaker')).toHaveText('Elder Ren');
  await expect(page.getByTestId('dialogue-text')).toContainText('Aetherwake');
  const dialogueBox = await page.getByTestId('dialogue-box').boundingBox();
  const debugBox = await page.getByTestId('debug-panel').boundingBox();
  expect((dialogueBox?.x ?? 0) + (dialogueBox?.width ?? 0)).toBeLessThan((debugBox?.x ?? 0) - 8);
  await page.getByTestId('dialogue-next').click();
  await expect(page.getByTestId('dialogue-text')).toContainText('thunder');
  await page.getByTestId('dialogue-next').click();
  await expect(page.getByTestId('dialogue-box')).toBeHidden();

  const startPosition = await page.evaluate(() => window.__rpgTest?.getState().position);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowUp');
  const afterForward = await page.evaluate(() => window.__rpgTest?.getState().position);
  expect(afterForward?.z).toBeLessThan((startPosition?.z ?? 0) - 0.35);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(420);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowUp');
  const afterPivotForward = await page.evaluate(() => window.__rpgTest?.getState().position);
  expect(afterPivotForward?.x).toBeGreaterThan((afterForward?.x ?? 0) + 0.2);

  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowDown');
  const afterTurnAround = await page.evaluate(() => window.__rpgTest?.getState().position);
  expect(Math.hypot((afterTurnAround?.x ?? 0) - (afterPivotForward?.x ?? 0), (afterTurnAround?.z ?? 0) - (afterPivotForward?.z ?? 0))).toBeLessThan(0.08);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowUp');
  const afterTurnAroundForward = await page.evaluate(() => window.__rpgTest?.getState().position);
  expect(afterTurnAroundForward?.x).toBeLessThan((afterTurnAround?.x ?? 0) - 0.2);

  await expect(page.getByTestId('debug-party-mira')).not.toBeChecked();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual([]);
  await page.getByTestId('debug-party-mira').check();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual(['mira']);
  await page.getByTestId('debug-party-mira').uncheck();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual([]);
  await page.getByTestId('debug-party-mira').check();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual(['mira']);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual(['mira']);

  await page.getByTestId('debug-hero-select').selectOption('mira');
  await expect(page.getByTestId('debug-move-slot-0')).toHaveValue('spiritFlare');
  await expect(page.getByTestId('debug-move-slot-1')).toHaveValue('thunderfall');
  await expect(page.getByTestId('debug-move-slot-2')).toHaveValue('astralCascade');
  await expect(page.getByTestId('debug-mira-dexterity')).toHaveValue('17');
  await page.getByTestId('debug-hero-select').selectOption('ryuji');
  await expect(page.getByTestId('debug-move-slot-2')).toHaveValue('chiBreaker');

  await page.getByTestId('debug-boss-mode').check();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().bossMode)).toBe(true);

  await page.evaluate(() => window.__rpgTest?.movePlayerToBattleTrigger());
  await expect(page.getByTestId('battle-ui')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().enemyVisual.modelId)).toBe('shellback-guardian');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townOccludersVisible)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().position.z)).toBeLessThan(-18);
  await expect(page.getByTestId('ally-slot-0-name')).toHaveText('Mira Sol');
  await expect(page.getByTestId('ally-slot-0-status')).toContainText('Mage');
  await expect(page.getByTestId('ally-slot-0-status')).toContainText('Mana');
  await expect(page.getByTestId('ally-slot-0-status')).not.toContainText('Chi');
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().visualState.attachments.mira?.find((item) => item.id === 'staff')?.visible))
    .toBe(true);
  const staffBounds = await page.evaluate(() =>
    window.__rpgTest?.getState().visualState.attachments.mira?.find((item) => item.id === 'staff')?.bounds,
  );
  expect((staffBounds?.max.y ?? 0) - (staffBounds?.min.y ?? 0)).toBeGreaterThan(0.4);

  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toMatch(/charging|awaitingCommand/);

  const heroHpBeforeCounter = await playerHp(page);
  await page.evaluate(() => window.__rpgTest?.forceEnemyReady());
  await expect(page.getByTestId('move-banner')).toContainText('Pulse Ram');
  await expect(page.getByTestId('move-banner')).toHaveClass(/enemy/);
  await expect.poll(() => playerHp(page)).toBeLessThan(heroHpBeforeCounter);
  await waitForActionRecovery(page);

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('mira'));
  await expect(page.getByTestId('move-slot-0')).toHaveText('Spirit Flare');
  await expect(page.getByTestId('move-slot-0')).toBeEnabled();
  const enemyHpBeforeMira = await enemyHp(page);
  await page.getByTestId('move-slot-0').click();
  await expect(page.getByTestId('move-banner')).toContainText('Mira Sol: Spirit Flare');
  await expect(page.getByTestId('move-banner')).toHaveClass(/magic/);
  await expect(page.getByTestId('move-banner')).not.toContainText('Chi');
  await expect.poll(() => enemyHp(page)).toBeLessThan(enemyHpBeforeMira);
  await waitForActionRecovery(page);

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('mira'));
  await expect(page.getByTestId('move-slot-1')).toHaveText('Thunderfall');
  await expect(page.getByTestId('move-slot-1')).toBeEnabled();
  const enemyHpBeforeThunder = await enemyHp(page);
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(true));
  await page.getByTestId('move-slot-1').click();
  await expect(page.getByTestId('move-banner')).toContainText('Thunderfall');
  await expect(page.getByTestId('move-banner')).toHaveClass(/thunder/);
  await page.screenshot({ path: `${qaScreenshotDir}/battle-mage-thunderfall-charge.png` });
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.preset), { timeout: 7_000 })
    .toBe('battle.mage.thunder.overhead');
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().vfxInfo.activeEffects.includes('thunder')), {
      timeout: 8_000,
    })
    .toBe(true);
  await page.screenshot({ path: `${qaScreenshotDir}/battle-mage-thunderfall-overhead.png` });
  await page.waitForTimeout(460);
  await page.screenshot({ path: `${qaScreenshotDir}/battle-mage-thunderfall-impact.png` });
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(false));
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(enemyHpBeforeThunder);
  await waitForActionRecovery(page);
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().visualState.attachments.mira?.find((item) => item.id === 'staff')?.visible))
    .toBe(true);
  await page.evaluate(() => {
    window.__rpgTest?.setEnemyHp(460);
    window.__rpgTest?.equipHeroMove('mira', 1, 'starfallHex');
    window.__rpgTest?.forceHeroReady('mira');
  });
  await expect(page.getByTestId('move-slot-1')).toHaveText('Starfall Hex');
  await expect(page.getByTestId('move-slot-1')).toBeEnabled();
  const enemyHpBeforeStarfall = await enemyHp(page);
  await page.getByTestId('move-slot-1').click();
  await expect(page.getByTestId('move-banner')).toContainText('Starfall Hex');
  await expect(page.getByTestId('move-banner')).toHaveClass(/magic/);
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(enemyHpBeforeStarfall);
  await waitForActionRecovery(page);
  await page.evaluate(() => window.__rpgTest?.setEnemyHp(420));

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('mira'));
  await expect(page.getByTestId('move-slot-2')).toHaveText('Astral Cascade');
  await expect(page.getByTestId('move-slot-2')).toBeEnabled();
  const enemyHpBeforeMageSpecial = await enemyHp(page);
  await page.getByTestId('move-slot-2').click();
  await expect(page.getByTestId('move-banner')).toContainText('Astral Cascade');
  await expect(page.getByTestId('move-banner')).toHaveClass(/magic/);
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(enemyHpBeforeMageSpecial);
  await waitForActionRecovery(page);
  await page.evaluate(() => window.__rpgTest?.setEnemyHp(320));

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('ryuji'));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().activeActorId)).toBe('ryuji');
  await expect(page.getByTestId('move-slot-0')).toBeEnabled();
  await expect(page.getByTestId('player-atb-fill')).toHaveAttribute('style', /--atb-progress: 100%/);

  const initialEnemyHp = await enemyHp(page);
  expect(initialEnemyHp).toBeGreaterThan(0);
  await page.getByTestId('move-slot-0').click();
  await expect(page.getByTestId('move-banner')).toContainText('Iron Palm Rush');
  await expect(page.getByTestId('move-banner')).toHaveClass(/player/);
  await expect.poll(() => enemyHp(page)).toBeLessThan(initialEnemyHp);
  await waitForActionRecovery(page);

  await page.evaluate(() => {
    window.__rpgTest?.equipHeroMove('ryuji', 2, 'healingChi');
    window.__rpgTest?.forceHeroReady('ryuji');
  });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().activeActorId)).toBe('ryuji');
  await expect(page.getByTestId('move-slot-2')).toHaveText('Cure');
  await expect(page.getByTestId('move-slot-2')).toBeEnabled();

  const heroHpBeforeHeal = await playerHp(page);
  await page.getByTestId('move-slot-2').click();
  await expect(page.getByTestId('move-banner')).toContainText('Cure');
  await expect(page.getByTestId('move-banner')).toHaveClass(/healing/);
  await expect.poll(() => playerHp(page)).toBeGreaterThan(heroHpBeforeHeal);
  await waitForActionRecovery(page);

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('ryuji'));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().activeActorId)).toBe('ryuji');
  await expect(page.getByTestId('move-slot-1')).toBeEnabled();

  const afterPunchHp = await enemyHp(page);
  await page.getByTestId('move-slot-1').click();
  await expect(page.getByTestId('move-banner')).toContainText('Dragon Heel Kick');
  await expect.poll(() => enemyHp(page)).toBeLessThan(afterPunchHp);
  await waitForActionRecovery(page);

  await page.evaluate(() => {
    window.__rpgTest?.equipHeroMove('ryuji', 2, 'chiBreaker');
    window.__rpgTest?.forceHeroReady('ryuji');
  });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().activeActorId)).toBe('ryuji');
  await expect(page.getByTestId('move-slot-2')).toHaveText('Chi Breaker');
  await expect(page.getByTestId('move-slot-2')).toBeEnabled();

  const afterKickHp = await enemyHp(page);
  await page.getByTestId('move-slot-2').click();
  await expect(page.getByTestId('move-banner')).toContainText('Chi Breaker');
  await expect(page.getByTestId('move-banner')).toHaveClass(/chi/);
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(afterKickHp);
  await waitForActionRecovery(page);

  await page.evaluate(() => {
    window.__rpgTest?.setEnemyHp(1);
    window.__rpgTest?.forceHeroReady('ryuji');
  });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().activeActorId)).toBe('ryuji');
  await expect(page.getByTestId('move-slot-0')).toBeEnabled({ timeout: 8_000 });
  await page.getByTestId('move-slot-0').click();

  await expect(page.getByTestId('victory-state')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByTestId('victory-results')).toBeVisible();
  await expect(page.getByTestId('victory-level-title')).toHaveText('Level Up');
  await expect(page.getByTestId('victory-level')).toContainText('Level 1 -> 2');
  await expect(page.getByTestId('victory-xp-progress')).toBeVisible();
  await expect(page.getByTestId('victory-stat-gains')).toContainText('Strength');
  await expect(page.getByTestId('victory-stat-gains')).toContainText('Dexterity');
  await expect(page.getByTestId('victory-xp')).toContainText('Mira Sol');
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().party.find((member) => member.id === 'mira')?.xp))
    .toBeGreaterThan(0);
  await expect.poll(() => page.getByTestId('victory-xp-fill').getAttribute('style')).toContain('--xp-progress: 0%');
  await expect(page.getByTestId('victory-xp')).toContainText('XP');
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('victory');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().level)).toBe(2);

  await page.getByTestId('reset-battle').click();
  await expect(page.getByTestId('battle-ui')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('exploration');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townOccludersVisible)).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().position.z))
    .toBeGreaterThan(6);

  await expect(page.getByTestId('debug-test-faint')).toBeVisible();
  await page.getByTestId('debug-test-faint').click();
  await expect(page.getByTestId('game-over-screen')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByTestId('battle-ui')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('gameOver');

  await page.getByTestId('return-debug-room').click();
  await expect(page.getByTestId('game-over-screen')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('exploration');

  expect(errors).toEqual([]);
  expect(assetErrors).toEqual([]);
});

async function captureTownQaScreenshots(page: Page) {
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(true));
  const poses = await page.evaluate(() => window.__rpgTest?.getState().debugPoses ?? []);
  const poseIds = poses.map((pose) => pose.id);
  const requested = [
    ...poseIds.filter((id) => id.startsWith('building.') && (id.endsWith('.front') || id.endsWith('.collision'))),
    ...poseIds.filter((id) => id.startsWith('wall.')),
    ...poseIds.filter((id) => id.startsWith('npc.close.')),
    'town.north_gate.inside',
  ];

  for (const poseId of requested) {
    await page.evaluate((id) => window.__rpgTest?.setDebugPose(id), poseId);
    await page.waitForTimeout(160);
    if (poseId.includes('.collision') || poseId.startsWith('wall.')) {
      await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().collisionOverlay)).toBe(true);
    }
    await page.screenshot({ path: `${qaScreenshotDir}/${poseId.replaceAll('.', '-')}.png` });
  }

  await page.evaluate(() => window.__rpgTest?.setDebugPose('town.spawn.default'));
  await page.waitForTimeout(120);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().collisionOverlay)).toBe(false);
  await page.evaluate(() => window.__rpgTest?.setQaCaptureMode(false));
}

async function enemyHp(page: { getByTestId: (testId: string) => { textContent: () => Promise<string | null> } }) {
  return Number(await page.getByTestId('enemy-hp').textContent());
}

async function playerHp(page: { getByTestId: (testId: string) => { textContent: () => Promise<string | null> } }) {
  return Number(await page.getByTestId('player-hp').textContent());
}

async function waitForActionRecovery(page: Page) {
  await page.waitForTimeout(180);
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__rpgTest?.getState().battleState);
        return state === 'charging' || state === 'awaitingCommand';
      },
      { timeout: 25_000 }
    )
    .toBe(true);
}
