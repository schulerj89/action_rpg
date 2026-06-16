import type { HeroStats, MoveId, RuntimeDebugInfo } from '../core/types';

type StatKey = keyof HeroStats;

interface MoveDebugOption {
  id: MoveId;
  name: string;
}

interface DebugPanelHandlers {
  onBossModeChange: (enabled: boolean) => void;
  onEquipMove: (slot: number, moveId: MoveId) => void;
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
  private readonly loadoutBox: HTMLElement;
  private readonly statsBox: HTMLElement;
  private readonly slidersBox: HTMLElement;

  constructor(
    root: Document,
    initialStats: HeroStats,
    moveOptions: MoveDebugOption[],
    equippedMoves: MoveId[],
    bossMode: boolean,
    handlers: DebugPanelHandlers,
  ) {
    const statsBox = root.querySelector<HTMLElement>('[data-testid="debug-stats"]');
    const slidersBox = root.querySelector<HTMLElement>('[data-testid="stat-sliders"]');
    const loadoutBox = root.querySelector<HTMLElement>('[data-testid="debug-loadout"]');
    const startBattle = root.querySelector<HTMLButtonElement>('[data-testid="debug-start-battle"]');
    const forceReady = root.querySelector<HTMLButtonElement>('[data-testid="debug-force-ready"]');
    const bossModeToggle = root.querySelector<HTMLInputElement>('[data-testid="debug-boss-mode"]');

    if (!statsBox || !slidersBox || !loadoutBox || !startBattle || !forceReady || !bossModeToggle) {
      throw new Error('Debug panel markup is missing.');
    }

    this.statsBox = statsBox;
    this.slidersBox = slidersBox;
    this.loadoutBox = loadoutBox;
    bossModeToggle.checked = bossMode;
    bossModeToggle.addEventListener('change', () => {
      handlers.onBossModeChange(bossModeToggle.checked);
    });
    startBattle.addEventListener('click', handlers.onStartBattle);
    forceReady.addEventListener('click', handlers.onForceReady);
    this.renderLoadout(moveOptions, equippedMoves, handlers.onEquipMove);
    this.renderSliders(initialStats, handlers.onStatChange);
  }

  update(info: RuntimeDebugInfo): void {
    const lines = [
      `FPS ${info.fps.toFixed(0)} (${info.frameMs.toFixed(1)} ms)`,
      `State ${info.battle.phase}`,
      `Pos ${info.playerX.toFixed(1)}, ${info.playerZ.toFixed(1)}`,
      `Hero HP ${info.battle.player.hp}/${info.battle.player.maxHp} ATB ${Math.round(info.battle.player.atb)}`,
      `Enemy HP ${info.battle.enemy.hp}/${info.battle.enemy.maxHp} ATB ${Math.round(info.battle.enemy.atb)}`,
      `Boss ${info.bossMode ? 'on' : 'off'}`,
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

  private renderLoadout(
    moveOptions: MoveDebugOption[],
    equippedMoves: MoveId[],
    onEquipMove: DebugPanelHandlers['onEquipMove'],
  ): void {
    this.loadoutBox.innerHTML = '';

    equippedMoves.forEach((moveId, index) => {
      const label = document.createElement('label');
      label.className = 'debug-select';

      const title = document.createElement('span');
      title.textContent = `Move ${index + 1}`;

      const select = document.createElement('select');
      select.dataset.testid = `debug-move-slot-${index}`;

      moveOptions.forEach((option) => {
        const element = document.createElement('option');
        element.value = option.id;
        element.textContent = option.name;
        element.selected = option.id === moveId;
        select.append(element);
      });

      select.addEventListener('change', () => {
        onEquipMove(index, select.value as MoveId);
      });

      label.append(title, select);
      this.loadoutBox.append(label);
    });
  }
}
