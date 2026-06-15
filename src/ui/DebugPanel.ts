import type { HeroStats, RuntimeDebugInfo } from '../core/types';

type StatKey = keyof HeroStats;

interface DebugPanelHandlers {
  onForceReady: () => void;
  onStartBattle: () => void;
  onStatChange: (key: StatKey, value: number) => void;
}

const sliders: Array<{ key: StatKey; label: string; max: number; min: number }> = [
  { key: 'strength', label: 'Strength', min: 1, max: 30 },
  { key: 'dexterity', label: 'Dexterity', min: 1, max: 30 },
  { key: 'vitality', label: 'Vitality', min: 1, max: 30 },
  { key: 'focus', label: 'Focus', min: 1, max: 30 },
  { key: 'defense', label: 'Defense', min: 0, max: 24 },
];

export class DebugPanel {
  private readonly statsBox: HTMLElement;
  private readonly slidersBox: HTMLElement;

  constructor(root: Document, initialStats: HeroStats, handlers: DebugPanelHandlers) {
    const statsBox = root.querySelector<HTMLElement>('[data-testid="debug-stats"]');
    const slidersBox = root.querySelector<HTMLElement>('[data-testid="stat-sliders"]');
    const startBattle = root.querySelector<HTMLButtonElement>('[data-testid="debug-start-battle"]');
    const forceReady = root.querySelector<HTMLButtonElement>('[data-testid="debug-force-ready"]');

    if (!statsBox || !slidersBox || !startBattle || !forceReady) {
      throw new Error('Debug panel markup is missing.');
    }

    this.statsBox = statsBox;
    this.slidersBox = slidersBox;
    startBattle.addEventListener('click', handlers.onStartBattle);
    forceReady.addEventListener('click', handlers.onForceReady);
    this.renderSliders(initialStats, handlers.onStatChange);
  }

  update(info: RuntimeDebugInfo): void {
    const lines = [
      `FPS ${info.fps.toFixed(0)} (${info.frameMs.toFixed(1)} ms)`,
      `State ${info.battle.phase}`,
      `Pos ${info.playerX.toFixed(1)}, ${info.playerZ.toFixed(1)}`,
      `Hero HP ${info.battle.player.hp}/${info.battle.player.maxHp} ATB ${Math.round(info.battle.player.atb)}`,
      `Enemy HP ${info.battle.enemy.hp}/${info.battle.enemy.maxHp} ATB ${Math.round(info.battle.enemy.atb)}`,
      `Audio ${info.audioStatus}`,
    ];

    this.statsBox.textContent = lines.join('\n');
  }

  private renderSliders(initialStats: HeroStats, onStatChange: DebugPanelHandlers['onStatChange']): void {
    this.slidersBox.innerHTML = '';

    sliders.forEach((slider) => {
      const row = document.createElement('label');
      row.className = 'debug-slider';

      const title = document.createElement('span');
      title.textContent = slider.label;

      const value = document.createElement('output');
      value.textContent = String(initialStats[slider.key]);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(slider.min);
      input.max = String(slider.max);
      input.value = String(initialStats[slider.key]);
      input.addEventListener('input', () => {
        const nextValue = Number(input.value);
        value.textContent = String(nextValue);
        onStatChange(slider.key, nextValue);
      });

      row.append(title, input, value);
      this.slidersBox.append(row);
    });
  }
}
