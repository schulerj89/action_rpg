import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, rmSync } from 'node:fs';
import { gameVersion } from '../src/config/version';

const patchScreenshotRoot = 'test-results/patches';
const expectedGameVersion = `v${gameVersion}`;

test('v0.2.1 blocks global shortcuts during modal and battle states', async ({ page }) => {
  test.setTimeout(180_000);
  const screenshotDir = `${patchScreenshotRoot}/0.2.1`;
  rmSync(screenshotDir, { force: true, recursive: true });
  mkdirSync(screenshotDir, { recursive: true });

  await page.goto('/');
  await expect(page.getByTestId('title-version')).toContainText(expectedGameVersion);
  await expect.poll(() => page.evaluate(() => Boolean(window.__rpgTest)), { timeout: 120_000 }).toBe(true);
  await page.evaluate(() => window.__rpgTest?.muteAudio());

  await page.keyboard.press('KeyM');
  await expect(page.getByTestId('game-menu')).toBeHidden();
  await page.keyboard.press('ShiftRight');
  await expectCameraNotFree(page);

  await page.getByTestId('title-start').click();
  await expect(page.getByTestId('title-screen')).toBeHidden({ timeout: 10_000 });
  await expect(page.getByTestId('opening-caption')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('KeyM');
  await page.keyboard.press('ShiftRight');
  await expect(page.getByTestId('game-menu')).toBeHidden();
  await expectCameraNotFree(page);
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.1-opening-shortcuts-blocked.png` });

  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 18_000 });
  await page.keyboard.press('KeyM');
  await expect(page.getByTestId('game-menu')).toBeVisible();
  await page.keyboard.press('KeyM');
  await expect(page.getByTestId('game-menu')).toBeHidden();

  await page.evaluate(() => window.__rpgTest?.interactWithNpc('runner'));
  await expect(page.getByTestId('dialogue-box')).toBeVisible();
  await page.keyboard.press('KeyM');
  await page.keyboard.press('ShiftRight');
  await expect(page.getByTestId('game-menu')).toBeHidden();
  await expectCameraNotFree(page);
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.1-dialogue-shortcuts-blocked.png` });
  await page.getByTestId('dialogue-next').click();

  await page.evaluate(() => window.__rpgTest?.openShopMenu('weapons'));
  await expect(page.getByTestId('shop-panel')).toBeVisible();
  await page.keyboard.press('KeyM');
  await expect(page.getByTestId('game-menu')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('shop-panel')).toBeHidden();

  await page.evaluate(() => window.__rpgTest?.movePlayerToBattleTrigger());
  await expect(page.getByTestId('battle-ui')).toBeVisible({ timeout: 25_000 });
  await page.evaluate(() => window.__rpgTest?.forceReady());
  await expect(page.getByTestId('battle-active-actor')).toHaveText('Ryuji Vale');
  await page.keyboard.press('KeyM');
  await page.keyboard.press('ShiftRight');
  await expect(page.getByTestId('game-menu')).toBeHidden();
  await expectCameraMode(page, 'battle');
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.1-battle-shortcuts-blocked.png` });
});

test('v0.2.2 normalizes room visibility before replaying opening cinematic', async ({ page }) => {
  test.setTimeout(240_000);
  const screenshotDir = `${patchScreenshotRoot}/0.2.2`;
  rmSync(screenshotDir, { force: true, recursive: true });
  mkdirSync(screenshotDir, { recursive: true });

  await page.goto('/');
  await expect(page.getByTestId('title-version')).toContainText(expectedGameVersion);
  await expect.poll(() => page.evaluate(() => Boolean(window.__rpgTest)), { timeout: 120_000 }).toBe(true);
  await page.evaluate(() => window.__rpgTest?.muteAudio());

  await page.getByTestId('title-start').click();
  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 18_000 });

  await page.evaluate(() => window.__rpgTest?.enterShop('weapons'));
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom), { timeout: 90_000 }).toBe('shop');
  await page.evaluate(() => window.__rpgTest?.playOpeningCinematic());
  await expectTownRoomNormalized(page);
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.2-shop-cinematic-normalized.png` });
  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 18_000 });

  await page.evaluate(() => window.__rpgTest?.enterAssetRoom());
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom), { timeout: 90_000 }).toBe('asset-room');
  await page.evaluate(() => window.__rpgTest?.playOpeningCinematic());
  await expectTownRoomNormalized(page);
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.2-asset-room-cinematic-normalized.png` });
  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 18_000 });

  await page.evaluate(() => window.__rpgTest?.movePlayerToBattleTrigger());
  await expect(page.getByTestId('battle-ui')).toBeVisible({ timeout: 25_000 });
  await page.evaluate(() => window.__rpgTest?.playOpeningCinematic());
  await expectTownRoomNormalized(page);
  await expect(page.getByTestId('battle-ui')).toBeHidden();
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.2-battle-cinematic-normalized.png` });
});

test('v0.2.3 displays the shared game version on title and menu surfaces', async ({ page }) => {
  test.setTimeout(120_000);
  const screenshotDir = `${patchScreenshotRoot}/0.2.3`;
  rmSync(screenshotDir, { force: true, recursive: true });
  mkdirSync(screenshotDir, { recursive: true });

  await page.goto('/');
  await expect(page.getByTestId('title-version')).toContainText(expectedGameVersion);
  await expect.poll(() => page.evaluate(() => Boolean(window.__rpgTest)), { timeout: 120_000 }).toBe(true);
  await page.evaluate(() => window.__rpgTest?.muteAudio());

  await page.getByTestId('title-start').click();
  await expect(page.getByTestId('opening-caption')).toBeHidden({ timeout: 18_000 });
  await page.keyboard.press('KeyM');
  await expect(page.getByTestId('game-menu')).toBeVisible();
  await expect(page.getByTestId('menu-version')).toContainText(expectedGameVersion);
  await page.screenshot({ path: `${screenshotDir}/patch-0.2.3-shared-version-menu.png` });
});

async function expectCameraMode(page: Page, mode: string): Promise<void> {
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.mode)).toBe(mode);
}

async function expectCameraNotFree(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().cameraInfo.mode)).not.toBe('free');
}

async function expectTownRoomNormalized(page: Page): Promise<void> {
  await expect(page.getByTestId('opening-caption')).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().currentRoom)).toBe('town');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const room = window.__rpgTest?.getState().roomInfo;
        return Boolean(room?.townVisible && !room.shopRoomVisible && !room.assetRoomVisible && !room.battleRoomVisible);
      }),
    )
    .toBe(true);
}
