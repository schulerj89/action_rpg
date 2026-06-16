import type { BattleSnapshot } from '../core/types';

type MoveSlotHandler = (slotIndex: number) => void;
type ActionHandler = () => void;

export class BattleHud {
  private readonly root: HTMLElement;
  private readonly playerHp: HTMLElement;
  private readonly playerHpMax: HTMLElement;
  private readonly enemyHp: HTMLElement;
  private readonly enemyHpMax: HTMLElement;
  private readonly playerAtb: HTMLElement;
  private readonly playerChi: HTMLElement;
  private readonly enemyAtb: HTMLElement;
  private readonly log: HTMLElement;
  private readonly moveButtons: HTMLButtonElement[];
  private readonly resetButton: HTMLButtonElement;
  private readonly victoryState: HTMLElement;
  private readonly victoryResults: HTMLElement;
  private readonly victoryLevelTitle: HTMLElement;
  private readonly victoryLevel: HTMLElement;
  private readonly victoryXpFill: HTMLElement;
  private readonly victoryXp: HTMLElement;
  private readonly victoryTotalXp: HTMLElement;
  private readonly darkener: HTMLElement;
  private readonly flash: HTMLElement;
  private readonly moveBanner: HTMLElement;
  private bannerTimer = 0;

  constructor(root: Document) {
    const battleUi = root.querySelector<HTMLElement>('[data-testid="battle-ui"]');
    const playerHp = root.querySelector<HTMLElement>('[data-testid="player-hp"]');
    const playerHpMax = root.querySelector<HTMLElement>('[data-testid="player-hp-max"]');
    const enemyHp = root.querySelector<HTMLElement>('[data-testid="enemy-hp"]');
    const enemyHpMax = root.querySelector<HTMLElement>('[data-testid="enemy-hp-max"]');
    const playerAtb = root.querySelector<HTMLElement>('[data-testid="player-atb"]');
    const playerChi = root.querySelector<HTMLElement>('[data-testid="player-chi"]');
    const enemyAtb = root.querySelector<HTMLElement>('[data-testid="enemy-atb"]');
    const log = root.querySelector<HTMLElement>('[data-testid="battle-log"]');
    const moveButtons = [
      root.querySelector<HTMLButtonElement>('[data-testid="move-slot-0"]'),
      root.querySelector<HTMLButtonElement>('[data-testid="move-slot-1"]'),
      root.querySelector<HTMLButtonElement>('[data-testid="move-slot-2"]'),
    ];
    const resetButton = root.querySelector<HTMLButtonElement>('[data-testid="reset-battle"]');
    const victoryState = root.querySelector<HTMLElement>('[data-testid="victory-state"]');
    const victoryResults = root.querySelector<HTMLElement>('[data-testid="victory-results"]');
    const victoryLevelTitle = root.querySelector<HTMLElement>('[data-testid="victory-level-title"]');
    const victoryLevel = root.querySelector<HTMLElement>('[data-testid="victory-level"]');
    const victoryXpFill = root.querySelector<HTMLElement>('[data-testid="victory-xp-fill"]');
    const victoryXp = root.querySelector<HTMLElement>('[data-testid="victory-xp"]');
    const victoryTotalXp = root.querySelector<HTMLElement>('[data-testid="victory-total-xp"]');
    const darkener = root.querySelector<HTMLElement>('[data-testid="cinematic-darkener"]');
    const flash = root.querySelector<HTMLElement>('[data-testid="cinematic-flash"]');
    const moveBanner = root.querySelector<HTMLElement>('[data-testid="move-banner"]');

    if (
      !battleUi ||
      !playerHp ||
      !playerHpMax ||
      !enemyHp ||
      !enemyHpMax ||
      !playerAtb ||
      !playerChi ||
      !enemyAtb ||
      !log ||
      moveButtons.some((button) => !button) ||
      !resetButton ||
      !victoryState ||
      !victoryResults ||
      !victoryLevelTitle ||
      !victoryLevel ||
      !victoryXpFill ||
      !victoryXp ||
      !victoryTotalXp ||
      !darkener ||
      !flash ||
      !moveBanner
    ) {
      throw new Error('Battle HUD markup is missing.');
    }

    this.root = battleUi;
    this.playerHp = playerHp;
    this.playerHpMax = playerHpMax;
    this.enemyHp = enemyHp;
    this.enemyHpMax = enemyHpMax;
    this.playerAtb = playerAtb;
    this.playerChi = playerChi;
    this.enemyAtb = enemyAtb;
    this.log = log;
    this.moveButtons = moveButtons as HTMLButtonElement[];
    this.resetButton = resetButton;
    this.victoryState = victoryState;
    this.victoryResults = victoryResults;
    this.victoryLevelTitle = victoryLevelTitle;
    this.victoryLevel = victoryLevel;
    this.victoryXpFill = victoryXpFill;
    this.victoryXp = victoryXp;
    this.victoryTotalXp = victoryTotalXp;
    this.darkener = darkener;
    this.flash = flash;
    this.moveBanner = moveBanner;
  }

  onMoveSlot(handler: MoveSlotHandler): void {
    this.moveButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        handler(index);
      });
    });
  }

  onReset(handler: ActionHandler): void {
    this.resetButton.addEventListener('click', handler);
  }

  setBattleVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  showVictoryResults(xpGained: number, totalXp: number, previousLevel: number, nextLevel: number): void {
    this.victoryLevelTitle.textContent = 'Level Up';
    this.victoryLevel.textContent = `Level ${previousLevel} -> ${nextLevel}`;
    this.victoryXp.textContent = `+${xpGained} XP`;
    this.victoryTotalXp.textContent = `${totalXp} total XP`;
    this.victoryXpFill.classList.remove('fill');
    this.victoryXpFill.style.setProperty('--xp-progress', '100%');
    this.victoryResults.hidden = false;
    void this.victoryXpFill.offsetWidth;
    this.victoryXpFill.classList.add('fill');
  }

  hideVictoryResults(): void {
    this.victoryResults.hidden = true;
    this.victoryXpFill.classList.remove('fill');
    this.victoryXpFill.style.setProperty('--xp-progress', '0%');
  }

  setDarkened(darkened: boolean): void {
    this.darkener.classList.toggle('active', darkened);
  }

  pulseFlash(): void {
    this.flash.classList.remove('pulse');
    void this.flash.offsetWidth;
    this.flash.classList.add('pulse');
  }

  showMoveBanner(actorName: string, moveName: string): void {
    window.clearTimeout(this.bannerTimer);
    this.moveBanner.textContent = `${actorName}: ${moveName}`;
    this.moveBanner.hidden = false;
    this.moveBanner.classList.remove('pop');
    void this.moveBanner.offsetWidth;
    this.moveBanner.classList.add('pop');
    this.bannerTimer = window.setTimeout(() => {
      this.moveBanner.hidden = true;
    }, 1450);
  }

  update(snapshot: BattleSnapshot): void {
    this.playerHp.textContent = String(snapshot.player.hp);
    this.playerHpMax.textContent = String(snapshot.player.maxHp);
    this.enemyHp.textContent = String(snapshot.enemy.hp);
    this.enemyHpMax.textContent = String(snapshot.enemy.maxHp);
    this.playerAtb.textContent = String(Math.round(snapshot.player.atb));
    this.playerChi.textContent = String(snapshot.player.chi);
    this.enemyAtb.textContent = String(Math.round(snapshot.enemy.atb));
    this.log.textContent = snapshot.logLine;

    this.moveButtons.forEach((button, index) => {
      const move = snapshot.equippedMoves[index];
      button.textContent = move?.name ?? 'Empty';
      button.disabled = !snapshot.canAct || !move || snapshot.player.chi < move.chiCost;
      button.dataset.moveId = move?.id ?? '';
    });
    this.victoryState.hidden = snapshot.phase !== 'victory';
  }
}
