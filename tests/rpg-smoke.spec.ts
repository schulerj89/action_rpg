import { expect, test, type Page } from '@playwright/test';

test('RPG sandbox battle path loads, resolves actions, wins, and resets', async ({ page }) => {
  test.setTimeout(180_000);
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

  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('debug-stats')).toBeVisible();
  await expect(page.getByTestId('loading-state')).toBeHidden({ timeout: 45_000 });
  await expect(page.getByTestId('title-screen')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('title-menu-panel')).toBeVisible();
  await page.getByTestId('title-back').click();
  await expect(page.getByTestId('title-menu-panel')).toBeHidden();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('title-screen')).toBeHidden();
  await page.evaluate(() => window.__rpgTest?.muteAudio());

  const canvasBox = await page.getByTestId('game-canvas').boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(300);
  expect(canvasBox?.height).toBeGreaterThan(200);

  await page.waitForTimeout(900);
  const fpsAfter = await page.getByTestId('debug-stats').textContent();
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

  await expect(page.getByTestId('debug-party-mira')).toBeChecked();
  await page.getByTestId('debug-party-mira').uncheck();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual([]);
  await page.getByTestId('debug-party-mira').check();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().supportHeroes)).toEqual(['mira']);

  await page.getByTestId('debug-hero-select').selectOption('mira');
  await expect(page.getByTestId('debug-move-slot-0')).toHaveValue('spiritFlare');
  await expect(page.getByTestId('debug-move-slot-1')).toHaveValue('starfallHex');
  await expect(page.getByTestId('debug-move-slot-2')).toHaveValue('astralCascade');
  await expect(page.getByTestId('debug-mira-dexterity')).toHaveValue('17');
  await page.getByTestId('debug-hero-select').selectOption('ryuji');
  await expect(page.getByTestId('debug-move-slot-2')).toHaveValue('chiBreaker');

  await page.getByTestId('debug-boss-mode').check();
  await expect.poll(() => page.evaluate(() => window.__rpgTest?.getState().bossMode)).toBe(true);

  await page.evaluate(() => window.__rpgTest?.movePlayerToBattleTrigger());
  await expect(page.getByTestId('battle-ui')).toBeVisible();
  await expect(page.getByTestId('ally-slot-0-name')).toHaveText('Mira Sol');
  await expect(page.getByTestId('ally-slot-0-status')).toContainText('Mage');

  await expect
    .poll(() => page.evaluate(() => window.__rpgTest?.getState().battleState))
    .toBe('charging');

  const heroHpBeforeCounter = await playerHp(page);
  await page.evaluate(() => window.__rpgTest?.forceEnemyReady());
  await expect(page.getByTestId('move-banner')).toContainText('Pulse Ram');
  await expect(page.getByTestId('move-banner')).toHaveClass(/enemy/);
  await expect.poll(() => playerHp(page)).toBeLessThan(heroHpBeforeCounter);

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('mira'));
  await expect(page.getByTestId('move-slot-0')).toHaveText('Spirit Flare');
  await expect(page.getByTestId('move-slot-0')).toBeEnabled();
  const enemyHpBeforeMira = await enemyHp(page);
  await page.getByTestId('move-slot-0').click();
  await expect(page.getByTestId('move-banner')).toContainText('Mira Sol: Spirit Flare');
  await expect(page.getByTestId('move-banner')).toHaveClass(/chi/);
  await expect.poll(() => enemyHp(page)).toBeLessThan(enemyHpBeforeMira);
  await waitForActionRecovery(page);

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('mira'));
  await expect(page.getByTestId('move-slot-1')).toHaveText('Starfall Hex');
  await expect(page.getByTestId('move-slot-1')).toBeEnabled();
  const enemyHpBeforeStarfall = await enemyHp(page);
  await page.getByTestId('move-slot-1').click();
  await expect(page.getByTestId('move-banner')).toContainText('Starfall Hex');
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(enemyHpBeforeStarfall);
  await waitForActionRecovery(page);
  await page.evaluate(() => window.__rpgTest?.setEnemyHp(420));

  await page.evaluate(() => window.__rpgTest?.forceHeroReady('mira'));
  await expect(page.getByTestId('move-slot-2')).toHaveText('Astral Cascade');
  await expect(page.getByTestId('move-slot-2')).toBeEnabled();
  const enemyHpBeforeMageSpecial = await enemyHp(page);
  await page.getByTestId('move-slot-2').click();
  await expect(page.getByTestId('move-banner')).toContainText('Astral Cascade');
  await expect(page.getByTestId('move-banner')).toHaveClass(/chi/);
  await expect.poll(() => enemyHp(page), { timeout: 8_000 }).toBeLessThan(enemyHpBeforeMageSpecial);
  await waitForActionRecovery(page);
  await page.evaluate(() => window.__rpgTest?.setEnemyHp(320));

  await page.evaluate(() => window.__rpgTest?.forceReady());
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
  await waitForActionRecovery(page);

  await page.evaluate(() => window.__rpgTest?.forceReady());
  await expect(page.getByTestId('move-slot-1')).toBeEnabled();

  const afterPunchHp = await enemyHp(page);
  await page.getByTestId('move-slot-1').click();
  await expect(page.getByTestId('move-banner')).toContainText('Dragon Heel Kick');
  await expect.poll(() => enemyHp(page)).toBeLessThan(afterPunchHp);
  await waitForActionRecovery(page);

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
  await waitForActionRecovery(page);

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
});

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
