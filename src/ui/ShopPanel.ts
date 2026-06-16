import type { ShopId, ShopItemDefinition, WeaponDefinition } from '../config/economy';

export interface EconomySnapshot {
  equippedWeaponByHero: Record<string, string>;
  gold: number;
  inventory: Record<string, number>;
}

interface ShopPanelHandlers {
  onBuy: (itemId: string) => void;
  onClose: () => void;
  onEquip: (itemId: string) => void;
}

export class ShopPanel {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly gold: HTMLElement;
  private readonly list: HTMLElement;
  private readonly close: HTMLButtonElement;
  private readonly handlers: ShopPanelHandlers;
  private lastRenderKey = '';
  private economy: EconomySnapshot = {
    equippedWeaponByHero: {},
    gold: 0,
    inventory: {},
  };
  private shopId: ShopId = 'weapons';
  private stock: ShopItemDefinition[] = [];

  constructor(root: Document, handlers: ShopPanelHandlers) {
    const panel = root.querySelector<HTMLElement>('[data-testid="shop-panel"]');
    const title = root.querySelector<HTMLElement>('[data-testid="shop-title"]');
    const gold = root.querySelector<HTMLElement>('[data-testid="shop-gold"]');
    const list = root.querySelector<HTMLElement>('[data-testid="shop-list"]');
    const close = root.querySelector<HTMLButtonElement>('[data-testid="shop-close"]');
    if (!panel || !title || !gold || !list || !close) {
      throw new Error('Shop panel markup is missing.');
    }

    this.root = panel;
    this.title = title;
    this.gold = gold;
    this.list = list;
    this.close = close;
    this.handlers = handlers;
    this.close.addEventListener('click', () => handlers.onClose());
  }

  show(shopId: ShopId, stock: ShopItemDefinition[], economy: EconomySnapshot): void {
    this.shopId = shopId;
    this.stock = stock;
    this.economy = economy;
    this.root.hidden = false;
    this.render(true);
  }

  update(economy: EconomySnapshot): void {
    this.economy = economy;
    if (!this.root.hidden && this.getRenderKey() !== this.lastRenderKey) {
      this.render();
    }
  }

  hide(): void {
    this.root.hidden = true;
  }

  isActive(): boolean {
    return !this.root.hidden;
  }

  private render(force = false): void {
    const renderKey = this.getRenderKey();
    if (!force && renderKey === this.lastRenderKey) {
      return;
    }
    this.lastRenderKey = renderKey;
    this.title.textContent = this.shopId === 'weapons' ? 'Weapon Shop' : 'Potion Store';
    this.gold.textContent = `${this.economy.gold} gold`;
    this.list.innerHTML = '';
    this.stock.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'shop-item';
      row.dataset.testid = `shop-item-${item.id}`;

      const body = document.createElement('div');
      body.className = 'shop-item-body';
      const owned = this.economy.inventory[item.id] ?? 0;
      body.innerHTML = `
        <strong>${item.name}</strong>
        <span>${item.description}</span>
        <small>${item.price} gold | Owned ${owned}</small>
      `;

      const actions = document.createElement('div');
      actions.className = 'shop-actions';

      const buy = document.createElement('button');
      buy.type = 'button';
      buy.textContent = 'Buy';
      buy.disabled = this.economy.gold < item.price;
      buy.dataset.testid = `shop-buy-${item.id}`;
      buy.addEventListener('click', () => this.handlers.onBuy(item.id));
      actions.append(buy);

      if (item.type === 'weapon') {
        const equip = document.createElement('button');
        equip.type = 'button';
        equip.textContent = this.isEquipped(item) ? 'Equipped' : 'Equip';
        equip.disabled = owned <= 0 || this.isEquipped(item);
        equip.dataset.testid = `shop-equip-${item.id}`;
        equip.addEventListener('click', () => this.handlers.onEquip(item.id));
        actions.append(equip);
      }

      row.append(body, actions);
      this.list.append(row);
    });
  }

  private isEquipped(item: WeaponDefinition): boolean {
    return this.economy.equippedWeaponByHero[item.heroId] === item.id;
  }

  private getRenderKey(): string {
    return JSON.stringify({
      equipped: this.economy.equippedWeaponByHero,
      gold: this.economy.gold,
      inventory: this.economy.inventory,
      shopId: this.shopId,
      stock: this.stock.map((item) => item.id),
    });
  }
}
