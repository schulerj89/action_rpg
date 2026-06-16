import type { BattleSnapshot, PartyCombatantSnapshot } from '../core/types';
import { gameVersion } from '../config/version';
import { getItemDefinition } from '../config/economy';
import type { EconomySnapshot } from './ShopPanel';

type MenuTab = 'equipment' | 'help' | 'items' | 'party' | 'skills' | 'status' | 'system';

const menuDescriptions: Record<MenuTab, string> = {
  equipment: 'Weapons, equipped moves, and combat loadouts.',
  help: 'Controls and debug-room shortcuts.',
  items: 'Inventory, gold, and field supplies.',
  party: 'Formation and active party state.',
  skills: 'Current combat commands by character.',
  status: 'Party health, resources, and core stats.',
  system: 'Version, save status, and debug access.',
};

const statLabels = {
  defense: 'DEF',
  dexterity: 'DEX',
  focus: 'FOC',
  strength: 'STR',
  vitality: 'VIT',
};

export class GameMenu {
  private readonly root: HTMLElement;
  private readonly content: HTMLElement;
  private readonly tabButtons: HTMLButtonElement[];
  private activeTab: MenuTab = 'status';
  private latestEconomy?: EconomySnapshot;
  private latestSnapshot?: BattleSnapshot;

  constructor(root: Document) {
    const menu = root.querySelector<HTMLElement>('[data-testid="game-menu"]');
    const content = root.querySelector<HTMLElement>('[data-testid="menu-content"]');
    const close = root.querySelector<HTMLButtonElement>('[data-testid="menu-close"]');
    const tabButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-menu-tab]'));

    if (!menu || !content || !close || tabButtons.length === 0) {
      throw new Error('Game menu markup is missing.');
    }

    this.root = menu;
    this.content = content;
    this.tabButtons = tabButtons;
    close.addEventListener('click', () => {
      this.hide();
    });
    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.setTab(button.dataset.menuTab as MenuTab);
      });
    });
    this.render();
  }

  toggle(): void {
    if (this.isActive()) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    this.root.hidden = false;
    this.render();
  }

  hide(): void {
    this.root.hidden = true;
  }

  isActive(): boolean {
    return !this.root.hidden;
  }

  update(snapshot: BattleSnapshot, economy?: EconomySnapshot): void {
    this.latestSnapshot = snapshot;
    this.latestEconomy = economy;
    if (this.isActive()) {
      this.render();
    }
  }

  private setTab(tab: MenuTab): void {
    this.activeTab = tab;
    this.render();
  }

  private render(): void {
    this.tabButtons.forEach((button) => {
      const tab = button.dataset.menuTab as MenuTab;
      button.classList.toggle('selected', tab === this.activeTab);
      button.title = menuDescriptions[tab];
    });

    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      this.content.innerHTML = '<div class="menu-empty">Loading party data...</div>';
      return;
    }

    this.content.innerHTML = '';
    const panel = document.createElement('section');
    panel.className = 'menu-detail-panel';
    panel.append(this.createPanelHeader(this.activeTab));

    if (this.activeTab === 'status') {
      this.renderStatus(panel, snapshot);
    } else if (this.activeTab === 'items') {
      this.renderItems(panel);
    } else if (this.activeTab === 'equipment') {
      this.renderEquipment(panel, snapshot);
    } else if (this.activeTab === 'skills') {
      this.renderSkills(panel, snapshot);
    } else if (this.activeTab === 'party') {
      this.renderParty(panel, snapshot);
    } else if (this.activeTab === 'system') {
      this.renderSystem(panel, snapshot);
    } else {
      this.renderHelp(panel);
    }

    this.content.append(panel);
  }

  private createPanelHeader(tab: MenuTab): HTMLElement {
    const header = document.createElement('header');
    header.className = 'menu-panel-header';
    header.innerHTML = `
      <strong>${labelForTab(tab)}</strong>
      <span>${menuDescriptions[tab]}</span>
    `;
    return header;
  }

  private renderStatus(panel: HTMLElement, snapshot: BattleSnapshot): void {
    const grid = document.createElement('div');
    grid.className = 'menu-party-grid';
    snapshot.party.forEach((member) => {
      const card = this.createMemberCard(member);
      card.append(this.createResourceBars(member), this.createStatGrid(member));
      grid.append(card);
    });
    panel.append(grid);
  }

  private renderItems(panel: HTMLElement): void {
    const economy = this.latestEconomy;
    const list = document.createElement('div');
    list.className = 'menu-list';
    const gold = document.createElement('article');
    gold.className = 'menu-row menu-row-emphasis';
    gold.innerHTML = `<strong>Gold</strong><span>${economy?.gold ?? 0}</span><small>Current town wallet</small>`;
    list.append(gold);

    const inventory = Object.entries(economy?.inventory ?? {});
    if (!inventory.length) {
      const empty = document.createElement('article');
      empty.className = 'menu-row';
      empty.innerHTML = '<strong>Inventory</strong><span>Empty</span><small>No items are currently carried.</small>';
      list.append(empty);
    } else {
      inventory.forEach(([id, count]) => {
        const item = getItemDefinition(id);
        const row = document.createElement('article');
        row.className = 'menu-row';
        row.innerHTML = `
          <strong>${item?.name ?? id}</strong>
          <span>x${count}</span>
          <small>${item?.description ?? 'Debug inventory item.'}</small>
        `;
        list.append(row);
      });
    }
    panel.append(list);
  }

  private renderEquipment(panel: HTMLElement, snapshot: BattleSnapshot): void {
    const list = document.createElement('div');
    list.className = 'menu-list';
    const economy = this.latestEconomy;

    const gold = document.createElement('article');
    gold.className = 'menu-row menu-row-emphasis';
    gold.innerHTML = `<strong>Gold</strong><span>${economy?.gold ?? 0}</span><small>Buy weapons in town shops.</small>`;
    list.append(gold);

    snapshot.party.forEach((member) => {
      const equippedId = economy?.equippedWeaponByHero[member.id];
      const weapon = equippedId ? (getItemDefinition(equippedId)?.name ?? equippedId) : 'None';
      const row = document.createElement('article');
      row.className = 'menu-row menu-loadout-row';
      row.innerHTML = `
        <strong>${member.name}</strong>
        <span>${weapon}</span>
        <small>${member.equippedMoves.map((move) => move.name).join(' / ')}</small>
      `;
      list.append(row);
    });
    panel.append(list);
  }

  private renderSkills(panel: HTMLElement, snapshot: BattleSnapshot): void {
    const grid = document.createElement('div');
    grid.className = 'menu-card-grid';
    snapshot.party.forEach((member) => {
      const card = document.createElement('article');
      card.className = 'menu-skill-card';
      card.innerHTML = `<strong>${member.name}</strong><span>${member.role}</span>`;
      const moves = document.createElement('div');
      moves.className = 'menu-command-list';
      member.equippedMoves.forEach((move, index) => {
        const row = document.createElement('div');
        row.className = 'menu-command-row';
        row.innerHTML = `<b>${index + 1}</b><span>${move.name}</span><small>${move.chiCost ? `${move.chiCost} cost` : 'Free'}</small>`;
        moves.append(row);
      });
      card.append(moves);
      grid.append(card);
    });
    panel.append(grid);
  }

  private renderParty(panel: HTMLElement, snapshot: BattleSnapshot): void {
    const list = document.createElement('div');
    list.className = 'menu-list';
    snapshot.party.forEach((member, index) => {
      const row = document.createElement('article');
      row.className = 'menu-row menu-party-row';
      row.innerHTML = `
        <strong>${index === 0 ? 'Leader' : 'Ally'}: ${member.name}</strong>
        <span>${member.active ? 'Active' : 'Reserve'}</span>
        <small>${member.role} | ATB ${Math.round(member.atb)} | Last XP +${member.lastXpGained}</small>
      `;
      list.append(row);
    });
    panel.append(list);
  }

  private renderSystem(panel: HTMLElement, snapshot: BattleSnapshot): void {
    const list = document.createElement('div');
    list.className = 'menu-list';
    const rows = [
      ['Version', `v${gameVersion}`, 'First-town vertical slice build.'],
      ['Scene', snapshot.phase === 'exploration' ? 'Town' : 'Battle', 'Runtime state for debugging and smoke tests.'],
      ['Save', 'Coming soon', 'No persistent save file is wired yet.'],
      ['Debug Rooms', 'Available', 'Use the debug panel for shops, assets, cinematic, battle, and poses.'],
    ];
    rows.forEach(([title, value, detail]) => {
      const row = document.createElement('article');
      row.className = 'menu-row';
      row.innerHTML = `<strong>${title}</strong><span>${value}</span><small>${detail}</small>`;
      list.append(row);
    });
    panel.append(list);
  }

  private renderHelp(panel: HTMLElement): void {
    const list = document.createElement('div');
    list.className = 'menu-list';
    [
      ['Move', 'W or Up moves forward. A/D or Left/Right pivot. S or Down turns around.'],
      ['Interact', 'E, Space, or Enter talks, advances dialogue, exits shops, or confirms title choices.'],
      ['Menu', 'M opens this RPG menu. Escape or Close returns to the game.'],
      ['Camera', 'Right click enters free camera. Right Shift toggles it; WASD/QE fly and Left Shift speeds up.'],
      ['Debug', 'Use the debug panel to teleport, test battles, replay the opening, inspect assets, and open shops.'],
    ].forEach(([title, detail]) => {
      const row = document.createElement('article');
      row.className = 'menu-row';
      row.innerHTML = `<strong>${title}</strong><span>${detail}</span><small>Available in the current sandbox build.</small>`;
      list.append(row);
    });
    panel.append(list);
  }

  private createMemberCard(member: PartyCombatantSnapshot): HTMLElement {
    const card = document.createElement('article');
    card.className = 'menu-character-card';
    card.innerHTML = `
      <img src="${member.portraitUrl}" alt="${member.name}" />
      <div class="menu-character-main">
        <strong>${member.name}</strong>
        <span>${member.role} | Level ${member.level} | ${member.xp} XP</span>
        <small>${member.active ? 'Active party member' : 'Reserve party member'}</small>
      </div>
    `;
    return card;
  }

  private createResourceBars(member: PartyCombatantSnapshot): HTMLElement {
    const resources = document.createElement('div');
    resources.className = 'menu-resource-list';
    const resourceName = member.role === 'Mage' ? 'Mana' : 'Chi';
    resources.innerHTML = `
      ${resourceBar('HP', member.hp, member.maxHp)}
      ${resourceBar(resourceName, member.chi, member.maxChi)}
    `;
    return resources;
  }

  private createStatGrid(member: PartyCombatantSnapshot): HTMLElement {
    const stats = document.createElement('div');
    stats.className = 'menu-stat-list';
    Object.entries(statLabels).forEach(([key, label]) => {
      const value = member.stats[key as keyof typeof member.stats];
      const stat = document.createElement('span');
      stat.innerHTML = `<b>${label}</b>${value}`;
      stats.append(stat);
    });
    return stats;
  }
}

function labelForTab(tab: MenuTab): string {
  return tab[0].toUpperCase() + tab.slice(1);
}

function resourceBar(label: string, value: number, max: number): string {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `
    <div class="menu-resource">
      <span>${label} ${value}/${max}</span>
      <div class="menu-resource-track"><div style="--resource: ${percent.toFixed(1)}%"></div></div>
    </div>
  `;
}
