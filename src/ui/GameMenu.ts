import type { BattleSnapshot } from '../core/types';

type MenuTab = 'equipment' | 'help' | 'party' | 'stats';

export class GameMenu {
  private readonly root: HTMLElement;
  private readonly content: HTMLElement;
  private readonly tabButtons: HTMLButtonElement[];
  private activeTab: MenuTab = 'stats';
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

  update(snapshot: BattleSnapshot): void {
    this.latestSnapshot = snapshot;
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
      button.classList.toggle('selected', button.dataset.menuTab === this.activeTab);
    });

    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      this.content.textContent = 'Loading party data...';
      return;
    }

    if (this.activeTab === 'stats') {
      this.renderStats(snapshot);
    } else if (this.activeTab === 'equipment') {
      this.renderEquipment(snapshot);
    } else if (this.activeTab === 'party') {
      this.renderParty(snapshot);
    } else {
      this.renderHelp();
    }
  }

  private renderStats(snapshot: BattleSnapshot): void {
    this.content.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'menu-card-grid';
    snapshot.party.forEach((member) => {
      const card = document.createElement('article');
      card.className = 'menu-character-card';
      card.innerHTML = `
        <strong>${member.name}</strong>
        <span>${member.role} | Level ${member.level} | ${member.xp} XP</span>
        <div class="menu-stat-list">
          <span>HP ${member.hp}/${member.maxHp}</span>
          <span>${member.role === 'Mage' ? 'Mana' : 'Chi'} ${member.chi}/${member.maxChi}</span>
          <span>STR ${member.stats.strength}</span>
          <span>DEX ${member.stats.dexterity}</span>
          <span>VIT ${member.stats.vitality}</span>
          <span>FOC ${member.stats.focus}</span>
          <span>DEF ${member.stats.defense}</span>
        </div>
      `;
      grid.append(card);
    });
    this.content.append(grid);
  }

  private renderEquipment(snapshot: BattleSnapshot): void {
    this.content.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'menu-list';
    snapshot.party.forEach((member) => {
      const row = document.createElement('article');
      row.className = 'menu-row';
      const weapon = member.role === 'Mage' ? 'Moonlit Staff' : 'Training Wraps';
      row.innerHTML = `<strong>${member.name}</strong><span>${weapon}</span><small>${member.equippedMoves
        .map((move) => move.name)
        .join(' / ')}</small>`;
      list.append(row);
    });
    this.content.append(list);
  }

  private renderParty(snapshot: BattleSnapshot): void {
    this.content.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'menu-list';
    snapshot.party.forEach((member, index) => {
      const row = document.createElement('article');
      row.className = 'menu-row';
      row.innerHTML = `<strong>${index === 0 ? 'Leader' : 'Ally'}: ${member.name}</strong><span>${
        member.active ? 'Active' : 'Reserve'
      }</span><small>${member.role}</small>`;
      list.append(row);
    });
    this.content.append(list);
  }

  private renderHelp(): void {
    this.content.innerHTML = `
      <div class="menu-list">
        <article class="menu-row"><strong>Move</strong><span>W/Up moves forward. A/D or arrows pivot. S/Down turns around.</span></article>
        <article class="menu-row"><strong>Interact</strong><span>E, Space, or Enter talks to nearby people.</span></article>
        <article class="menu-row"><strong>Camera</strong><span>Right Shift toggles free camera. Hold right mouse to look, WASD/QE to fly.</span></article>
        <article class="menu-row"><strong>Debug</strong><span>Use the debug panel to jump to tests, start battles, and replay scenes.</span></article>
      </div>
    `;
  }
}
