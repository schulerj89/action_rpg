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

  await page.getByTestId('debug-boss-mode').check();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().bossMode)).toBe(true);

  await page.evaluate(() => window.__rpgTest?.movePlayerToBattleTrigger());
  await expect(page.getByTestId('battle-ui')).toBeVisible();

  await page.evaluate(() => window.__rpgTest?.forceReady());
  await expect(page.getByTestId('move-slot-0')).toBeEnabled();
  await expect(page.getByTestId('player-atb-fill')).toHaveAttribute('style', /--atb-progress: 100%/);

  const initialEnemyHp = await enemyHp(page);
  expect(initialEnemyHp).toBeGreaterThan(500);
  await page.getByTestId('move-slot-0').click();
  await expect(page.getByTestId('move-banner')).toContainText('Iron Palm Rush');
  await expect(page.getByTestId('move-banner')).toHaveClass(/player/);
  await expect.poll(() => enemyHp(page)).toBeLessThan(initialEnemyHp);

  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('charging');

  const heroHpBeforeCounter = await playerHp(page);
  await page.evaluate(() => window.__rpgTest?.forceEnemyReady());
  await expect(page.getByTestId('move-banner')).toContainText('Pulse Ram');
  await expect(page.getByTestId('move-banner')).toHaveClass(/enemy/);
  await expect.poll(() => playerHp(page)).toBeLessThan(heroHpBeforeCounter);

  await page.evaluate(() => {
    window.__rpgTest?.equipMove(2, 'healingChi');
    window.__rpgTest?.forceReady();
  });
  await expect(page.getByTestId('move-slot-2')).toHaveText('Healing Chi');
  await expect(page.getByTestId('move-slot-2')).toBeEnabled();

  const heroHpBeforeHeal = await playerHp(page);
  await page.getByTestId('move-slot-2').click();
  await expect(page.getByTestId('move-banner')).toContainText('Healing Chi');
  await expect(page.getByTestId('move-banner')).toHaveClass(/healing/);
  await expect.poll(() => playerHp(page)).toBeGreaterThan(heroHpBeforeHeal);

  await page.evaluate(() => window.__rpgTest?.forceReady());
  await expect(page.getByTestId('move-slot-1')).toBeEnabled();

  const afterPunchHp = await enemyHp(page);
  await page.getByTestId('move-slot-1').click();
  await expect(page.getByTestId('move-banner')).toContainText('Dragon Heel Kick');
  await expect.poll(() => enemyHp(page)).toBeLessThan(afterPunchHp);

  await page.evaluate(() => {
    window.__rpgTest?.equipMove(2, 'chiBreaker');
    window.__rpgTest?.forceReady();
  });
  await expect(page.getByTestId('move-slot-2')).toHaveText('Chi Breaker');
  await expect(page.getByTestId('move-slot-2')).toBeEnabled();

  const afterKickHp = await enemyHp(page);
  await page.getByTestId('move-slot-2').click();
  await expect(page.getByTestId('move-banner')).toContainText('Chi Breaker');
  await expect(page.getByTestId('move-banner')).toHaveClass(/chi/);
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(afterKickHp);

  await page.evaluate(() => {
    window.__rpgTest?.setEnemyHp(1);
    window.__rpgTest?.forceReady();
  });
  await expect(page.getByTestId('move-slot-0')).toBeEnabled({ timeout: 8_000 });
  await page.getByTestId('move-slot-0').click();

  await expect(page.getByTestId('victory-state')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByTestId('victory-results')).toBeVisible();
  await expect(page.getByTestId('victory-level-title')).toHaveText('Level Up');
  await expect(page.getByTestId('victory-level')).toContainText('Level 1 -> 2');
  await expect(page.getByTestId('victory-xp-progress')).toBeVisible();
  await expect(page.getByTestId('victory-stat-gains')).toContainText('Strength');
  await expect(page.getByTestId('victory-stat-gains')).toContainText('Dexterity');
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

  expect(errors).toEqual([]);
});

async function enemyHp(page: { getByTestId: (testId: string) => { textContent: () => Promise<string | null> } }) {
  return Number(await page.getByTestId('enemy-hp').textContent());
}

async function playerHp(page: { getByTestId: (testId: string) => { textContent: () => Promise<string | null> } }) {
  return Number(await page.getByTestId('player-hp').textContent());
}
