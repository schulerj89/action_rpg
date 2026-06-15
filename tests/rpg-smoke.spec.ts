import { expect, test } from '@playwright/test';

test('RPG sandbox battle path loads, resolves actions, wins, and resets', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.goto('/');
  await page.evaluate(() => window.__rpgTest?.muteAudio());

  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('debug-stats')).toBeVisible();
  await expect(page.getByTestId('loading-state')).toBeHidden({ timeout: 25_000 });

  const canvasBox = await page.getByTestId('game-canvas').boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(300);
  expect(canvasBox?.height).toBeGreaterThan(200);

  const fpsBefore = await page.getByTestId('debug-stats').textContent();
  await page.waitForTimeout(900);
  const fpsAfter = await page.getByTestId('debug-stats').textContent();
  expect(fpsAfter).not.toEqual(fpsBefore);
  expect(fpsAfter).toMatch(/FPS/i);

  await page.evaluate(() => window.__rpgTest?.movePlayerToBattleTrigger());
  await expect(page.getByTestId('battle-ui')).toBeVisible();

  await page.evaluate(() => window.__rpgTest?.forceReady());
  await expect(page.getByTestId('attack-action')).toBeEnabled();

  const initialEnemyHp = await enemyHp(page);
  await page.getByTestId('attack-action').click();
  await expect.poll(() => enemyHp(page)).toBeLessThan(initialEnemyHp);

  await page.evaluate(() => window.__rpgTest?.forceReady());
  await expect(page.getByTestId('chi-action')).toBeEnabled();

  const afterAttackHp = await enemyHp(page);
  await page.getByTestId('chi-action').click();
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(afterAttackHp);

  await page.evaluate(() => {
    window.__rpgTest?.setEnemyHp(1);
    window.__rpgTest?.forceReady();
  });
  await expect(page.getByTestId('attack-action')).toBeEnabled({ timeout: 8_000 });
  await page.getByTestId('attack-action').click();

  await expect(page.getByTestId('victory-state')).toBeVisible({ timeout: 8_000 });
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('victory');

  await page.getByTestId('reset-battle').click();
  await expect(page.getByTestId('battle-ui')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('exploration');

  expect(errors).toEqual([]);
});

async function enemyHp(page: { getByTestId: (testId: string) => { textContent: () => Promise<string | null> } }) {
  return Number(await page.getByTestId('enemy-hp').textContent());
}
