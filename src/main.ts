import './style.css';
import { GameApp } from './GameApp';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="game-canvas" data-testid="game-canvas" aria-label="Action RPG sandbox"></canvas>

  <section class="title-screen" data-testid="title-screen">
    <div class="title-stack">
      <h1>Aetherwake</h1>
      <nav class="title-menu">
        <button type="button" data-testid="title-start">Start</button>
        <button type="button" data-testid="title-menu">Menu</button>
      </nav>
      <div class="title-menu-panel" data-testid="title-menu-panel" hidden>
        <strong>Settings</strong>
        <span>Coming soon</span>
        <button type="button" data-testid="title-back">Back</button>
      </div>
    </div>
  </section>

  <div class="cinematic-darkener" data-testid="cinematic-darkener"></div>
  <div class="cinematic-flash" data-testid="cinematic-flash"></div>
  <div class="move-banner" data-testid="move-banner" hidden></div>
  <section class="dialogue-box" data-testid="dialogue-box" hidden>
    <strong data-testid="dialogue-speaker">Villager</strong>
    <p data-testid="dialogue-text"></p>
    <button type="button" data-testid="dialogue-next">Next</button>
  </section>
  <section class="victory-results" data-testid="victory-results" hidden>
    <div class="victory-kicker">Victory</div>
    <h1 data-testid="victory-level-title">Level Up</h1>
    <div class="victory-level" data-testid="victory-level">Level 1 -> 2</div>
    <div class="victory-stat-gains" data-testid="victory-stat-gains"></div>
    <div class="xp-progress" data-testid="victory-xp-progress">
      <div class="xp-progress-fill" data-testid="victory-xp-fill"></div>
    </div>
    <strong data-testid="victory-xp">+0 XP</strong>
    <span data-testid="victory-total-xp">0 total XP</span>
  </section>

  <section class="game-over-screen" data-testid="game-over-screen" hidden>
    <div class="game-over-kicker">Ryuji has fallen</div>
    <h1>Game Over</h1>
    <button type="button" data-testid="return-debug-room">Return</button>
  </section>

  <section class="battle-ui" data-testid="battle-ui" hidden>
    <div class="combatants">
      <div class="party-roster">
        <div class="combatant party-leader">
          <strong>Ryuji Vale</strong>
          <span><span data-testid="player-hp">0</span>/<span data-testid="player-hp-max">0</span> HP</span>
          <span><span data-testid="player-chi">0</span> Chi</span>
        </div>
        <div class="combatant ally-standby" data-testid="ally-slot-0">
          <strong data-testid="ally-slot-0-name">Mira Sol</strong>
          <span data-testid="ally-slot-0-status">Standby Mage</span>
        </div>
        <div class="combatant ally-standby" data-testid="ally-slot-1">
          <strong data-testid="ally-slot-1-name">Ally 3</strong>
          <span data-testid="ally-slot-1-status">Empty</span>
        </div>
      </div>
      <div class="combatant enemy">
        <strong>Crimson Core</strong>
        <span><span data-testid="enemy-hp">0</span>/<span data-testid="enemy-hp-max">0</span> HP</span>
        <span>ATB <span data-testid="enemy-atb">0</span></span>
      </div>
    </div>
    <div class="turn-row">
      <div class="atb-meter">
        <span>ATB</span>
        <div class="atb-track" aria-hidden="true">
          <div class="atb-fill" data-testid="player-atb-fill"></div>
        </div>
        <b data-testid="player-atb">0</b>
      </div>
      <div class="battle-log" data-testid="battle-log"></div>
    </div>
    <div class="battle-actions">
      <button type="button" data-testid="move-slot-0">Iron Palm</button>
      <button type="button" data-testid="move-slot-1">Dragon Heel</button>
      <button type="button" data-testid="move-slot-2">Chi Breaker</button>
      <button type="button" class="ghost" data-testid="reset-battle">Reset</button>
    </div>
    <div class="victory-state" data-testid="victory-state" hidden>Victory</div>
  </section>

  <aside class="debug-panel" data-testid="debug-panel">
    <pre data-testid="debug-stats">Loading...</pre>
    <label class="debug-select debug-hero-picker">
      <span>Edit</span>
      <select data-testid="debug-hero-select"></select>
    </label>
    <div class="debug-commands">
      <button type="button" data-testid="debug-start-battle">Start</button>
      <button type="button" data-testid="debug-force-ready">Ready</button>
      <button type="button" data-testid="debug-test-faint">Faint</button>
    </div>
    <label class="debug-toggle">
      <input type="checkbox" data-testid="debug-boss-mode" />
      <span>Boss mode</span>
    </label>
    <div class="debug-party" data-testid="debug-party"></div>
    <div class="debug-loadout" data-testid="debug-loadout"></div>
    <div class="stat-sliders" data-testid="stat-sliders"></div>
  </aside>

  <div class="loading" data-testid="loading-state">Loading Ryuji Vale...</div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="game-canvas"]');
const loading = document.querySelector<HTMLElement>('[data-testid="loading-state"]');

if (!canvas || !loading) {
  throw new Error('Game canvas failed to initialize.');
}

GameApp.mount(canvas)
  .then(() => {
    loading.hidden = true;
  })
  .catch((error: unknown) => {
    loading.textContent = error instanceof Error ? error.message : 'Failed to load RPG sandbox.';
  });
