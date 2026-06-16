import './style.css';
import { GameApp } from './GameApp';
import { gameVersion } from './config/version';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="game-canvas" data-testid="game-canvas" aria-label="Action RPG sandbox"></canvas>

  <section class="title-screen" data-testid="title-screen">
    <div class="title-stack">
      <h1>Aetherwake</h1>
      <span class="title-version" data-testid="title-version">v${gameVersion}</span>
      <nav class="title-menu">
        <button type="button" data-testid="title-start">Start</button>
        <button type="button" data-testid="title-menu">Settings</button>
        <button type="button" data-testid="title-help">Help</button>
      </nav>
      <div class="title-menu-panel" data-testid="title-menu-panel" hidden>
        <strong>Settings</strong>
        <span>Coming soon</span>
        <button type="button" data-title-panel-back data-testid="title-back">Back</button>
      </div>
      <div class="title-menu-panel title-help-panel" data-testid="title-help-panel" hidden>
        <strong>Controls</strong>
        <span>Move: W or Up</span>
        <span>Turn: A/D or Left/Right</span>
        <span>Interact: E, Space, or Enter</span>
        <span>Menu: M</span>
        <span>Free Camera: Right Click or Right Shift</span>
        <button type="button" data-title-panel-back data-testid="title-help-back">Back</button>
      </div>
    </div>
  </section>

  <div class="cinematic-darkener" data-testid="cinematic-darkener"></div>
  <div class="cinematic-flash" data-testid="cinematic-flash"></div>
  <div class="transition-iris" data-testid="transition-iris"></div>
  <section class="scene-loading" data-testid="scene-loading" hidden>
    <div>
      <strong data-testid="scene-loading-title">Loading</strong>
      <span data-testid="scene-loading-detail">Preparing scene...</span>
    </div>
  </section>
  <div class="qa-caption" data-testid="qa-caption" hidden></div>
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

  <section class="opening-caption" data-testid="opening-caption" hidden>
    <strong>Aetherwake</strong>
    <span data-testid="opening-caption-text">Ryuji reaches the well as the north wall alarm fades.</span>
  </section>

  <section class="game-menu" data-testid="game-menu" hidden>
    <div class="game-menu-shell">
      <header>
        <div>
          <strong>Aetherwake</strong>
          <span data-testid="menu-version">v${gameVersion}</span>
        </div>
        <button type="button" class="ghost" data-testid="menu-close">Close</button>
      </header>
      <div class="game-menu-layout">
      <nav class="game-menu-tabs" aria-label="Game menu">
        <button type="button" data-menu-tab="status" data-testid="menu-tab-stats">Status</button>
        <button type="button" data-menu-tab="items" data-testid="menu-tab-items">Items</button>
        <button type="button" data-menu-tab="equipment" data-testid="menu-tab-equipment">Equipment</button>
        <button type="button" data-menu-tab="skills" data-testid="menu-tab-skills">Skills</button>
        <button type="button" data-menu-tab="party" data-testid="menu-tab-party">Party</button>
        <button type="button" data-menu-tab="system" data-testid="menu-tab-system">System</button>
        <button type="button" data-menu-tab="help" data-testid="menu-tab-help">Help</button>
      </nav>
      <div class="game-menu-content" data-testid="menu-content"></div>
      </div>
      <footer class="game-menu-footer">M: close | Enter/Click: select | Gold and party state update live</footer>
    </div>
  </section>

  <section class="shop-panel" data-testid="shop-panel" hidden>
    <div class="shop-shell">
      <header>
        <div>
          <strong data-testid="shop-title">Shop</strong>
          <span>Talk to the counter keeper to buy or equip.</span>
        </div>
        <b data-testid="shop-gold">0 gold</b>
      </header>
      <div class="shop-list" data-testid="shop-list"></div>
      <button type="button" class="ghost" data-testid="shop-close">Back</button>
    </div>
  </section>

  <section class="game-over-screen" data-testid="game-over-screen" hidden>
    <div class="game-over-kicker">Ryuji has fallen</div>
    <h1>Game Over</h1>
    <button type="button" data-testid="return-debug-room">Return</button>
  </section>

  <section class="battle-ui" data-testid="battle-ui" hidden>
    <div class="battle-help" data-testid="battle-help">
      <span>Help</span>
      <strong data-testid="battle-help-text">ATB gauges are charging.</strong>
    </div>
    <div class="battle-turn-ladder" data-testid="battle-turn-ladder"></div>
    <div class="battle-command-panel">
      <header>
        <span>Command</span>
        <strong data-testid="battle-active-actor">Waiting</strong>
        <small data-testid="battle-action-hint">ATB charging</small>
      </header>
      <div class="battle-move-grid">
        <button type="button" data-testid="move-slot-0">Iron Palm</button>
        <button type="button" data-testid="move-slot-1">Dragon Heel</button>
        <button type="button" data-testid="move-slot-2">Chi Breaker</button>
      </div>
      <button type="button" class="ghost" data-testid="reset-battle">Reset</button>
    </div>
    <div class="battle-status-panel">
      <div class="party-atb-list" data-testid="party-atb-list"></div>
      <div class="legacy-atb-meter" aria-hidden="true">
        <span data-testid="player-atb">0</span>
        <div data-testid="player-atb-fill"></div>
      </div>
      <div class="battle-log" data-testid="battle-log"></div>
    </div>
    <div class="legacy-battle-values" aria-hidden="true">
      <span data-testid="player-hp">0</span>
      <span data-testid="player-hp-max">0</span>
      <span data-testid="player-chi">0</span>
      <span data-testid="enemy-hp">0</span>
      <span data-testid="enemy-hp-max">0</span>
      <span data-testid="enemy-atb">0</span>
      <span data-testid="ally-slot-0"><span data-testid="ally-slot-0-name">Mira Sol</span><span data-testid="ally-slot-0-status">Standby Mage</span></span>
      <span data-testid="ally-slot-1"><span data-testid="ally-slot-1-name">Ally 3</span><span data-testid="ally-slot-1-status">Empty</span></span>
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
    <div class="debug-commands debug-commands-wide">
      <button type="button" data-testid="debug-free-camera">Free Cam</button>
      <button type="button" data-testid="debug-collision">Collision</button>
      <button type="button" data-testid="debug-weather">Weather</button>
    </div>
    <label class="debug-select debug-pose-picker">
      <span>Pose</span>
      <select data-testid="debug-pose-select"></select>
    </label>
    <div class="debug-commands debug-commands-wide">
      <button type="button" data-testid="debug-teleport-pose">Teleport</button>
      <button type="button" data-testid="debug-camera-pose">Camera</button>
      <button type="button" data-testid="debug-opening-cinematic">Cinematic</button>
    </div>
    <div class="debug-commands debug-commands-wide">
      <button type="button" data-testid="debug-asset-room">Assets</button>
      <button type="button" data-testid="debug-weapon-shop">Weapon</button>
      <button type="button" data-testid="debug-potion-shop">Potion</button>
    </div>
    <button type="button" class="ghost debug-menu-button" data-testid="debug-open-menu">Menu</button>
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
