import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, rmSync } from 'node:fs';

const playthroughScreenshotDir = 'test-results/playthrough/current';

test('scripted first town playthrough hides debug and reaches shops, NPCs, and battle', async ({ page }) => {
  test.setTimeout(420_000);
  const errors: string[] = [];
  const assetErrors: string[] = [];
  rmSync(playthroughScreenshotDir, { force: true, recursive: true });
  mkdirSync(playthroughScreenshotDir, { recursive: true });

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

  await page.goto('/');
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('loading-state')).toBeHidden({ timeout: 45_000 });
  await page.evaluate(() => {
    document.body.classList.add('playthrough-capture-mode');
    window.__rpgTest?.muteAudio();
  });
  await expect(page.getByTestId('debug-panel')).toBeHidden();
  await expect(page.getByTestId('title-version')).toContainText('v0.2.2');
  await waitForTownAssets(page);

  await capture(page, 'playthrough-01-title-screen.png');
  await page.getByTestId('title-start').click();
  await expect(page.getByTestId('title-screen')).toBeHidden();
  await expect(page.getByTestId('opening-caption')).toBeVisible({ timeout: 5_000 });
  await capture(page, 'playthrough-02-opening-cinematic.png');
  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 18_000 });
  await expect(page.getByTestId('objective-title')).toHaveText('Prepare for the north gate');

  await placeHero(page, 0, 7.0);
  await capture(page, 'playthrough-03-town-square.png');

  await talkToNpc(page, { expectedText: 'ember eyes', fileName: 'playthrough-04-talk-pip.png', speaker: 'Pip', x: 3.15, z: 3.35 });
  await talkToNpc(page, {
    expectedText: 'ward-stone',
    fileName: 'playthrough-05-talk-elder.png',
    speaker: 'Elder Ren',
    x: -2.9,
    z: 3.05,
  });

  await enterTownShop(page, {
    entranceX: -8.5,
    entranceZ: -3.37,
    interiorFileName: 'playthrough-06-enter-weapon-shop.png',
    menuFileName: 'playthrough-08-weapon-shop-menu.png',
    menuTitle: 'Weapon Shop',
    speaker: 'Taro',
    vendorFileName: 'playthrough-07-weapon-shopkeeper-dialogue.png',
  });
  await page.getByTestId('shop-buy-copper-handwraps').click();
  await page.getByTestId('shop-equip-copper-handwraps').click();
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().economy.equippedWeaponByHero.ryuji))
    .toBe('copper-handwraps');
  await page.getByTestId('shop-close').click();
  await exitShopToTown(page);

  await enterTownShop(page, {
    entranceX: 8.4,
    entranceZ: -3.37,
    interiorFileName: 'playthrough-09-enter-potion-shop.png',
    menuFileName: 'playthrough-11-potion-shop-menu.png',
    menuTitle: 'Potion Store',
    speaker: 'Luma',
    vendorFileName: 'playthrough-10-potion-shopkeeper-dialogue.png',
  });
  await page.getByTestId('shop-buy-small-potion').click();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().economy.inventory['small-potion'])).toBe(3);
  await page.getByTestId('shop-close').click();
  await exitShopToTown(page);

  await page.evaluate(() => window.__rpgTest?.setDebugPose('route.north.field_enemy'));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().routeInfo.fieldEnemyVisible)).toBe(true);
  await capture(page, 'playthrough-12-north-route-field-enemy.png');
  await page.evaluate(() => window.__rpgTest?.setFreeCamera(false));
  await placeHero(page, 0, -25.6);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(760);
  await page.keyboard.up('ArrowUp');
  await expect(page.getByTestId('battle-ui')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townOccludersVisible)).toBe(false);
  await forceHeroReady(page, 'ryuji');
  await expect(page.getByTestId('battle-active-actor')).toHaveText('Ryuji Vale');
  await capture(page, 'playthrough-13-battle-command.png');

  const enemyHpBefore = await enemyHp(page);
  await page.getByTestId('move-slot-0').click();
  await expect(page.getByTestId('move-banner')).toContainText('Iron Palm Rush');
  await expect.poll(() => enemyHp(page)).toBeLessThan(enemyHpBefore);
  await page.waitForTimeout(220);
  await capture(page, 'playthrough-14-battle-attack.png');
  await waitForActionRecovery(page);

  await page.evaluate(() => window.__rpgTest?.setEnemyHp(1));
  await forceHeroReady(page, 'ryuji');
  await page.getByTestId('move-slot-0').click();
  await expect(page.getByTestId('victory-results')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByTestId('victory-level-title')).toHaveText('Level Up');
  await capture(page, 'playthrough-15-victory-results.png');

  await expect(page.getByTestId('dialogue-speaker')).toHaveText('Pip', { timeout: 35_000 });
  await expect(page.getByTestId('dialogue-text')).toContainText('Stonewake');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().routeInfo.fixedFieldEnemyDefeated)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().routeInfo.fieldEnemyVisible)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().objectiveInfo.id)).toBe('stonewake-road');
  await capture(page, 'playthrough-16-post-battle-thanks.png');
  await page.getByTestId('dialogue-next').click();
  await expect(page.getByTestId('dialogue-box')).toBeHidden();
  await page.evaluate(() => window.__rpgTest?.setDebugPose('route.north.stonewake_trail'));
  await page.waitForTimeout(350);
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().objectiveInfo.checklist.find((item) => item.id === 'trail')?.complete))
    .toBe(true);
  await capture(page, 'playthrough-17-stonewake-trail-preview.png');

  expect(errors).toEqual([]);
  expect(assetErrors).toEqual([]);
});

async function waitForTownAssets(page: Page) {
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().sceneId)).toBe('first-town');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townAssetInfo.loading), { timeout: 180_000 }).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().townAssetInfo.failed)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().enemyVisual.loading), { timeout: 90_000 }).toBe(false);
}

async function capture(page: Page, fileName: string) {
  await expect(page.getByTestId('debug-panel')).toBeHidden();
  await page.screenshot({ path: `${playthroughScreenshotDir}/${fileName}` });
}

async function placeHero(page: Page, x: number, z: number, yaw = Math.PI) {
  await page.evaluate(
    (pose) => {
      window.__rpgTest?.setPlayerPosition(pose.x, pose.z);
      window.__rpgTest?.setHeroYaw(pose.yaw);
    },
    { x, yaw, z },
  );
  await page.waitForTimeout(220);
}

async function talkToNpc(
  page: Page,
  config: { expectedText: string; fileName: string; speaker: string; x: number; z: number },
) {
  await placeHero(page, config.x, config.z);
  await page.keyboard.press('KeyE');
  await expect(page.getByTestId('dialogue-box')).toBeVisible();
  await expect(page.getByTestId('dialogue-speaker')).toHaveText(config.speaker);
  await expect(page.getByTestId('dialogue-text')).toContainText(config.expectedText);
  await capture(page, config.fileName);
  while (await page.getByTestId('dialogue-box').isVisible()) {
    await page.getByTestId('dialogue-next').click();
  }
}

async function enterTownShop(
  page: Page,
  config: {
    entranceX: number;
    entranceZ: number;
    interiorFileName: string;
    menuFileName: string;
    menuTitle: string;
    speaker: string;
    vendorFileName: string;
  },
) {
  await placeHero(page, config.entranceX, config.entranceZ);
  await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom), { timeout: 90_000 }).toBe('shop');
  await expect(page.getByTestId('scene-loading')).toBeHidden();
  await page.waitForTimeout(350);
  await capture(page, config.interiorFileName);

  await placeHero(page, 0, -0.65);
  await page.keyboard.press('KeyE');
  await expect(page.getByTestId('dialogue-box')).toBeVisible();
  await expect(page.getByTestId('dialogue-speaker')).toHaveText(config.speaker);
  await capture(page, config.vendorFileName);
  await page.getByTestId('dialogue-next').click();
  await expect(page.getByTestId('shop-panel')).toBeVisible();
  await expect(page.getByTestId('shop-title')).toHaveText(config.menuTitle);
  await capture(page, config.menuFileName);
}

async function exitShopToTown(page: Page) {
  await expect(page.getByTestId('shop-panel')).toBeHidden();
  await placeHero(page, 0, 4.25);
  await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom), { timeout: 90_000 }).toBe('town');
  await expect(page.getByTestId('scene-loading')).toBeHidden();
}

async function enemyHp(page: Page) {
  return Number(await page.getByTestId('enemy-hp').textContent());
}

async function waitForActionRecovery(page: Page) {
  await page.waitForTimeout(180);
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__rpgTest?.getState().battleState);
        return state === 'charging' || state === 'awaitingCommand';
      },
      { timeout: 25_000 },
    )
    .toBe(true);
}

async function forceHeroReady(page: Page, heroId: 'mira' | 'ryuji') {
  await waitForActionRecovery(page);
  await expect
    .poll(
      async () => {
        await page.evaluate((id) => window.__rpgTest?.forceHeroReady(id), heroId);
        return page.evaluate(() => window.__rpgTest?.getState().activeActorId);
      },
      { timeout: 10_000 },
    )
    .toBe(heroId);
}
