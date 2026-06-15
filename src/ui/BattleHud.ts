import type { BattleSnapshot } from '../core/types';

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
  private readonly attackButton: HTMLButtonElement;
  private readonly chiButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly victoryState: HTMLElement;
  private readonly darkener: HTMLElement;
  private readonly flash: HTMLElement;

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
    const attackButton = root.querySelector<HTMLButtonElement>('[data-testid="attack-action"]');
    const chiButton = root.querySelector<HTMLButtonElement>('[data-testid="chi-action"]');
    const resetButton = root.querySelector<HTMLButtonElement>('[data-testid="reset-battle"]');
    const victoryState = root.querySelector<HTMLElement>('[data-testid="victory-state"]');
    const darkener = root.querySelector<HTMLElement>('[data-testid="cinematic-darkener"]');
    const flash = root.querySelector<HTMLElement>('[data-testid="cinematic-flash"]');

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
      !attackButton ||
      !chiButton ||
      !resetButton ||
      !victoryState ||
      !darkener ||
      !flash
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
    this.attackButton = attackButton;
    this.chiButton = chiButton;
    this.resetButton = resetButton;
    this.victoryState = victoryState;
    this.darkener = darkener;
    this.flash = flash;
  }

  onAttack(handler: ActionHandler): void {
    this.attackButton.addEventListener('click', handler);
  }

  onChi(handler: ActionHandler): void {
    this.chiButton.addEventListener('click', handler);
  }

  onReset(handler: ActionHandler): void {
    this.resetButton.addEventListener('click', handler);
  }

  setBattleVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  setDarkened(darkened: boolean): void {
    this.darkener.classList.toggle('active', darkened);
  }

  pulseFlash(): void {
    this.flash.classList.remove('pulse');
    void this.flash.offsetWidth;
    this.flash.classList.add('pulse');
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

    const hasChi = snapshot.player.chi >= 30;
    this.attackButton.disabled = !snapshot.canAct;
    this.chiButton.disabled = !snapshot.canAct || !hasChi;
    this.victoryState.hidden = snapshot.phase !== 'victory';
  }
}
