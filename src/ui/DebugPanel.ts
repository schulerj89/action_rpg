import type { PartyDebugOption } from '../battle/BattleDirector';
import type { HeroStats, MoveId, RuntimeDebugInfo } from '../core/types';

type StatKey = keyof HeroStats;

interface MoveDebugOption {
  id: MoveId;
  name: string;
}

interface DebugPanelHandlers {
  onBossModeChange: (enabled: boolean) => void;
  onEquipMove: (heroId: string, slot: number, moveId: MoveId) => void;
  onForceReady: (heroId: string) => void;
  onStartBattle: () => void;
  onStatChange: (heroId: string, key: StatKey, value: number) => void;
  onSupportHeroToggle: (id: string, active: boolean) => void;
  onTestFaint: () => void;
}

const sliders: Array<{ key: StatKey; label: string; max: number; min: number }> = [
  { key: 'strength', label: 'Strength', min: 1, max: 30 },
  { key: 'dexterity', label: 'Dexterity', min: 1, max: 30 },
  { key: 'vitality', label: 'Vitality', min: 1, max: 30 },
  { key: 'focus', label: 'Focus', min: 1, max: 30 },
  { key: 'defense', label: 'Defense', min: 0, max: 24 },
];

export class DebugPanel {
  private readonly heroSelect: HTMLSelectElement;
  private readonly loadoutBox: HTMLElement;
  private readonly moveOptions: MoveDebugOption[];
  private readonly partyBox: HTMLElement;
  private readonly statsBox: HTMLElement;
  private readonly slidersBox: HTMLElement;
  private readonly handlers: DebugPanelHandlers;
  private party: PartyDebugOption[];
  private selectedHeroId: string;

  constructor(
    root: Document,
    party: PartyDebugOption[],
    moveOptions: MoveDebugOption[],
    bossMode: boolean,
    handlers: DebugPanelHandlers,
  ) {
    const statsBox = root.querySelector<HTMLElement>('[data-testid="debug-stats"]');
    const heroSelect = root.querySelector<HTMLSelectElement>('[data-testid="debug-hero-select"]');
    const slidersBox = root.querySelector<HTMLElement>('[data-testid="stat-sliders"]');
    const loadoutBox = root.querySelector<HTMLElement>('[data-testid="debug-loadout"]');
    const partyBox = root.querySelector<HTMLElement>('[data-testid="debug-party"]');
    const startBattle = root.querySelector<HTMLButtonElement>('[data-testid="debug-start-battle"]');
    const forceReady = root.querySelector<HTMLButtonElement>('[data-testid="debug-force-ready"]');
    const testFaint = root.querySelector<HTMLButtonElement>('[data-testid="debug-test-faint"]');
    const bossModeToggle = root.querySelector<HTMLInputElement>('[data-testid="debug-boss-mode"]');

    if (
      !statsBox ||
      !heroSelect ||
      !slidersBox ||
      !loadoutBox ||
      !partyBox ||
      !startBattle ||
      !forceReady ||
      !testFaint ||
      !bossModeToggle
    ) {
      throw new Error('Debug panel markup is missing.');
    }

    this.statsBox = statsBox;
    this.heroSelect = heroSelect;
    this.slidersBox = slidersBox;
    this.loadoutBox = loadoutBox;
    this.partyBox = partyBox;
    this.party = party;
    this.moveOptions = moveOptions;
    this.handlers = handlers;
    this.selectedHeroId = party[0]?.id ?? '';

    bossModeToggle.checked = bossMode;
    bossModeToggle.addEventListener('change', () => {
      handlers.onBossModeChange(bossModeToggle.checked);
    });
    startBattle.addEventListener('click', handlers.onStartBattle);
    forceReady.addEventListener('click', () => {
      handlers.onForceReady(this.selectedHeroId);
    });
    testFaint.addEventListener('click', handlers.onTestFaint);
    this.heroSelect.addEventListener('change', () => {
      this.selectedHeroId = this.heroSelect.value;
      this.renderSelectedHeroControls();
    });

    this.renderHeroSelector();
    this.renderParty();
    this.renderSelectedHeroControls();
  }

  update(info: RuntimeDebugInfo): void {
    const partyLines = info.battle.party.map((member) => {
      const marker = member.id === info.battle.activeActorId ? '*' : '-';
      const resource = member.role === 'Mage' ? 'Mana' : 'Chi';
      const state = member.active
        ? `Lv ${member.level} ${member.hp}/${member.maxHp} HP ${member.chi} ${resource} ${Math.round(
            member.atb,
          )} ATB ${member.xp} XP`
        : 'off';
      return `${marker} ${member.name}: ${state}`;
    });
    const lines = [
      `FPS ${info.fps.toFixed(0)} (${info.frameMs.toFixed(1)} ms)`,
      `Scene ${info.sceneId} Draws ${info.renderCalls}`,
      `GPU Tri ${info.renderTriangles} Geo ${info.renderGeometries} Tex ${info.renderTextures}`,
      `Town GLB ${info.townAssetsLoaded}/9${info.townAssetsLoading ? ' loading' : ''} Fail ${info.townAssetsFailed}`,
      `State ${info.battle.phase}`,
      `Dialogue ${info.dialogueActive ? 'open' : 'closed'}`,
      `Pos ${info.playerX.toFixed(1)}, ${info.playerZ.toFixed(1)}`,
      `Enemy HP ${info.battle.enemy.hp}/${info.battle.enemy.maxHp} ATB ${Math.round(info.battle.enemy.atb)}`,
      `Boss ${info.bossMode ? 'on' : 'off'}`,
      `Audio ${info.audioStatus}`,
      ...partyLines,
    ];

    this.statsBox.textContent = lines.join('\n');
  }

  refreshParty(party: PartyDebugOption[]): void {
    this.party = party;
    if (!this.getSelectedHero()) {
      this.selectedHeroId = party[0]?.id ?? '';
    }
    this.renderHeroSelector();
    this.renderParty();
    this.renderSelectedHeroControls();
  }

  private renderHeroSelector(): void {
    this.heroSelect.innerHTML = '';
    this.party.forEach((hero) => {
      const option = document.createElement('option');
      option.value = hero.id;
      option.textContent = `${hero.name} - ${hero.role}`;
      option.selected = hero.id === this.selectedHeroId;
      this.heroSelect.append(option);
    });
  }

  private renderSelectedHeroControls(): void {
    const hero = this.getSelectedHero();
    if (!hero) {
      this.slidersBox.innerHTML = '';
      this.loadoutBox.innerHTML = '';
      return;
    }

    this.renderSliders(hero);
    this.renderLoadout(hero);
  }

  private renderSliders(hero: PartyDebugOption): void {
    this.slidersBox.innerHTML = '';

    sliders.forEach((slider) => {
      const row = document.createElement('label');
      row.className = 'debug-slider';

      const title = document.createElement('span');
      title.textContent = slider.label;

      const value = document.createElement('output');
      value.textContent = String(hero.stats[slider.key]);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(slider.min);
      input.max = String(slider.max);
      input.value = String(hero.stats[slider.key]);
      input.dataset.testid = `debug-${hero.id}-${slider.key}`;
      input.addEventListener('input', () => {
        const nextValue = Number(input.value);
        value.textContent = String(nextValue);
        hero.stats[slider.key] = nextValue;
        this.handlers.onStatChange(hero.id, slider.key, nextValue);
      });

      row.append(title, input, value);
      this.slidersBox.append(row);
    });
  }

  private renderLoadout(hero: PartyDebugOption): void {
    this.loadoutBox.innerHTML = '';

    hero.equippedMoves.forEach((moveId, index) => {
      const label = document.createElement('label');
      label.className = 'debug-select';

      const title = document.createElement('span');
      title.textContent = `Move ${index + 1}`;

      const select = document.createElement('select');
      select.dataset.testid = `debug-move-slot-${index}`;

      this.moveOptions
        .filter((option) => hero.allowedMoves.includes(option.id))
        .forEach((option) => {
          const element = document.createElement('option');
          element.value = option.id;
          element.textContent = option.name;
          element.selected = option.id === moveId;
          select.append(element);
        });

      select.addEventListener('change', () => {
        hero.equippedMoves[index] = select.value as MoveId;
        this.handlers.onEquipMove(hero.id, index, select.value as MoveId);
      });

      label.append(title, select);
      this.loadoutBox.append(label);
    });
  }

  private renderParty(): void {
    this.partyBox.innerHTML = '';

    this.party.forEach((hero, index) => {
      const label = document.createElement('label');
      label.className = 'debug-toggle';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = hero.active;
      input.disabled = index === 0;
      input.dataset.testid = `debug-party-${hero.id}`;
      input.addEventListener('change', () => {
        hero.active = input.checked;
        this.handlers.onSupportHeroToggle(hero.id, input.checked);
      });

      const text = document.createElement('span');
      text.textContent = `${hero.name} (${hero.role})`;

      label.append(input, text);
      this.partyBox.append(label);
    });
  }

  private getSelectedHero(): PartyDebugOption | undefined {
    return this.party.find((hero) => hero.id === this.selectedHeroId);
  }
}
