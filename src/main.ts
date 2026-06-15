import './style.css';
import { GameApp } from './GameApp';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="game-canvas" data-testid="game-canvas" aria-label="Action RPG sandbox"></canvas>

  <div class="cinematic-darkener" data-testid="cinematic-darkener"></div>
  <div class="cinematic-flash" data-testid="cinematic-flash"></div>

  <section class="battle-ui" data-testid="battle-ui" hidden>
    <div class="combatants">
      <div class="combatant">
        <strong>Ryuji Vale</strong>
        <span><span data-testid="player-hp">0</span>/<span data-testid="player-hp-max">0</span> HP</span>
        <span><span data-testid="player-chi">0</span> Chi</span>
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
        <b data-testid="player-atb">0</b>
      </div>
      <div class="battle-log" data-testid="battle-log"></div>
    </div>
    <div class="battle-actions">
      <button type="button" data-testid="attack-action">Attack</button>
      <button type="button" data-testid="chi-action">Chi Breaker</button>
      <button type="button" class="ghost" data-testid="reset-battle">Reset</button>
    </div>
    <div class="victory-state" data-testid="victory-state" hidden>Victory</div>
  </section>

  <aside class="debug-panel">
    <pre data-testid="debug-stats">Loading...</pre>
    <div class="debug-commands">
      <button type="button" data-testid="debug-start-battle">Start</button>
      <button type="button" data-testid="debug-force-ready">Ready</button>
    </div>
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
