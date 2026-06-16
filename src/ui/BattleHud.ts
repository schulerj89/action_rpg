import type { BattleSnapshot, CharacterRewardSummary, LevelUpGain, MoveBannerTone } from '../core/types';

type MoveSlotHandler = (slotIndex: number) => void;
type ActionHandler = () => void;

interface SupportPartyMember {
  active: boolean;
  name: string;
  role: string;
}

export class BattleHud {
  private readonly root: HTMLElement;
  private readonly playerHp: HTMLElement;
  private readonly playerHpMax: HTMLElement;
  private readonly enemyHp: HTMLElement;
  private readonly enemyHpMax: HTMLElement;
  private readonly playerAtb: HTMLElement;
  private readonly playerAtbFill: HTMLElement;
  private readonly playerChi: HTMLElement;
  private readonly enemyAtb: HTMLElement;
  private readonly log: HTMLElement;
  private readonly moveButtons: HTMLButtonElement[];
  private readonly supportSlots: Array<{
    name: HTMLElement;
    root: HTMLElement;
    status: HTMLElement;
  }>;
  private readonly resetButton: HTMLButtonElement;
  private readonly victoryState: HTMLElement;
  private readonly victoryResults: HTMLElement;
  private readonly victoryLevelTitle: HTMLElement;
  private readonly victoryLevel: HTMLElement;
  private readonly victoryStatGains: HTMLElement;
  private readonly victoryXpFill: HTMLElement;
  private readonly victoryXp: HTMLElement;
  private readonly victoryTotalXp: HTMLElement;
  private readonly gameOverScreen: HTMLElement;
  private readonly gameOverReturnButton: HTMLButtonElement;
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
    const playerAtbFill = root.querySelector<HTMLElement>('[data-testid="player-atb-fill"]');
    const playerChi = root.querySelector<HTMLElement>('[data-testid="player-chi"]');
    const enemyAtb = root.querySelector<HTMLElement>('[data-testid="enemy-atb"]');
    const log = root.querySelector<HTMLElement>('[data-testid="battle-log"]');
    const supportSlots = [0, 1].map((index) => ({
      name: root.querySelector<HTMLElement>(`[data-testid="ally-slot-${index}-name"]`),
      root: root.querySelector<HTMLElement>(`[data-testid="ally-slot-${index}"]`),
      status: root.querySelector<HTMLElement>(`[data-testid="ally-slot-${index}-status"]`),
    }));
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
    const victoryStatGains = root.querySelector<HTMLElement>('[data-testid="victory-stat-gains"]');
    const victoryXpFill = root.querySelector<HTMLElement>('[data-testid="victory-xp-fill"]');
    const victoryXp = root.querySelector<HTMLElement>('[data-testid="victory-xp"]');
    const victoryTotalXp = root.querySelector<HTMLElement>('[data-testid="victory-total-xp"]');
    const gameOverScreen = root.querySelector<HTMLElement>('[data-testid="game-over-screen"]');
    const gameOverReturnButton = root.querySelector<HTMLButtonElement>('[data-testid="return-debug-room"]');
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
      !playerAtbFill ||
      !playerChi ||
      !enemyAtb ||
      !log ||
      supportSlots.some((slot) => !slot.name || !slot.root || !slot.status) ||
      moveButtons.some((button) => !button) ||
      !resetButton ||
      !victoryState ||
      !victoryResults ||
      !victoryLevelTitle ||
      !victoryLevel ||
      !victoryStatGains ||
      !victoryXpFill ||
      !victoryXp ||
      !victoryTotalXp ||
      !gameOverScreen ||
      !gameOverReturnButton ||
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
    this.playerAtbFill = playerAtbFill;
    this.playerChi = playerChi;
    this.enemyAtb = enemyAtb;
    this.log = log;
    this.supportSlots = supportSlots as Array<{
      name: HTMLElement;
      root: HTMLElement;
      status: HTMLElement;
    }>;
    this.moveButtons = moveButtons as HTMLButtonElement[];
    this.resetButton = resetButton;
    this.victoryState = victoryState;
    this.victoryResults = victoryResults;
    this.victoryLevelTitle = victoryLevelTitle;
    this.victoryLevel = victoryLevel;
    this.victoryStatGains = victoryStatGains;
    this.victoryXpFill = victoryXpFill;
    this.victoryXp = victoryXp;
    this.victoryTotalXp = victoryTotalXp;
    this.gameOverScreen = gameOverScreen;
    this.gameOverReturnButton = gameOverReturnButton;
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

  onGameOverReturn(handler: ActionHandler): void {
    this.gameOverReturnButton.addEventListener('click', handler);
  }

  setBattleVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  setSupportParty(members: SupportPartyMember[]): void {
    this.supportSlots.forEach((slot, index) => {
      const member = members[index];
      slot.name.textContent = member?.name ?? `Ally ${index + 2}`;
      slot.status.textContent = member ? (member.active ? `Standby ${member.role}` : 'Removed') : 'Empty';
      slot.root.classList.toggle('removed', Boolean(member && !member.active));
      slot.root.classList.toggle('empty', !member);
    });
  }

  showVictoryResults(rewards: CharacterRewardSummary[]): void {
    const leaderReward = rewards[0];
    this.victoryLevelTitle.textContent = 'Level Up';
    this.victoryLevel.textContent = leaderReward ? `Level ${leaderReward.level - 1} -> ${leaderReward.level}` : 'Level Up';
    this.victoryXp.textContent = rewards.map((reward) => `${reward.name} +${reward.xpGained} XP`).join(' | ');
    this.victoryTotalXp.textContent = rewards.map((reward) => `${reward.name} ${reward.totalXp} total`).join(' | ');
    this.victoryStatGains.innerHTML = '';
    rewards.forEach((reward) => {
      const row = document.createElement('div');
      row.className = 'victory-reward-card';

      const portrait = document.createElement('img');
      portrait.src = reward.portraitUrl;
      portrait.alt = `${reward.name} portrait`;
      portrait.className = 'victory-portrait';

      const body = document.createElement('div');
      body.className = 'victory-reward-body';

      const label = document.createElement('span');
      label.textContent = reward.name;

      const xp = document.createElement('b');
      xp.textContent = `Level ${reward.level - 1} -> ${reward.level} | +${reward.xpGained} XP | ${reward.totalXp} total`;

      const value = document.createElement('strong');
      value.textContent = reward.statGains
        .map((gain) => `${formatStatName(gain.stat)} +${gain.amount} -> ${gain.nextValue}`)
        .join(', ');

      body.append(label, xp, value);
      row.append(portrait, body);
      this.victoryStatGains.append(row);
    });
    this.victoryXpFill.classList.remove('fill', 'reset');
    this.victoryXpFill.style.setProperty('--xp-progress', '0%');
    this.victoryResults.hidden = false;
    void this.victoryXpFill.offsetWidth;
    this.victoryXpFill.classList.add('fill', 'reset');
    window.setTimeout(() => {
      this.victoryXpFill.classList.remove('fill', 'reset');
      this.victoryXpFill.style.setProperty('--xp-progress', '0%');
    }, 1500);
  }

  hideVictoryResults(): void {
    this.victoryResults.hidden = true;
    this.victoryXpFill.classList.remove('fill');
    this.victoryXpFill.style.setProperty('--xp-progress', '0%');
  }

  showGameOver(): void {
    this.gameOverScreen.hidden = false;
  }

  hideGameOver(): void {
    this.gameOverScreen.hidden = true;
  }

  setDarkened(darkened: boolean): void {
    this.darkener.classList.toggle('active', darkened);
    this.root.classList.toggle('cinematic', darkened);
  }

  pulseFlash(): void {
    this.flash.classList.remove('pulse');
    void this.flash.offsetWidth;
    this.flash.classList.add('pulse');
  }

  showMoveBanner(actorName: string, moveName: string, tone: MoveBannerTone = 'player'): void {
    window.clearTimeout(this.bannerTimer);
    this.moveBanner.textContent = `${actorName}: ${moveName}`;
    this.moveBanner.hidden = false;
    this.moveBanner.classList.remove('pop', 'player', 'enemy', 'chi', 'healing');
    this.moveBanner.classList.add(tone);
    void this.moveBanner.offsetWidth;
    this.moveBanner.classList.add('pop');
    this.bannerTimer = window.setTimeout(() => {
      this.moveBanner.hidden = true;
    }, 1450);
  }

  update(snapshot: BattleSnapshot): void {
    const activeMember = snapshot.party.find((member) => member.id === snapshot.activeActorId) ?? snapshot.party[0];
    this.playerHp.textContent = String(snapshot.player.hp);
    this.playerHpMax.textContent = String(snapshot.player.maxHp);
    this.enemyHp.textContent = String(snapshot.enemy.hp);
    this.enemyHpMax.textContent = String(snapshot.enemy.maxHp);
    this.playerAtb.textContent = String(Math.round(snapshot.player.atb));
    this.playerChi.textContent = String(snapshot.player.chi);
    this.enemyAtb.textContent = String(Math.round(snapshot.enemy.atb));
    this.log.textContent = snapshot.logLine;

    this.supportSlots.forEach((slot, index) => {
      const member = snapshot.party[index + 1];
      slot.name.textContent = member?.name ?? `Ally ${index + 2}`;
      if (!member) {
        slot.status.textContent = 'Empty';
      } else if (!member.active) {
        slot.status.textContent = 'Removed';
      } else {
        const ready = member.canAct ? ' Ready' : '';
        slot.status.textContent = `${member.role} ${member.hp}/${member.maxHp} HP ${member.chi} Chi ${Math.round(
          member.atb,
        )} ATB${ready}`;
      }
      slot.root.classList.toggle('removed', Boolean(member && !member.active));
      slot.root.classList.toggle('empty', !member);
      slot.root.classList.toggle('active-turn', Boolean(member?.canAct));
    });

    this.moveButtons.forEach((button, index) => {
      const move = snapshot.equippedMoves[index];
      button.textContent = move?.name ?? 'Empty';
      button.disabled = !snapshot.canAct || !move || (activeMember?.chi ?? 0) < move.chiCost;
      button.dataset.moveId = move?.id ?? '';
    });
    this.victoryState.hidden = snapshot.phase !== 'victory';
    this.playerAtbFill.style.setProperty('--atb-progress', `${Math.min(snapshot.player.atb, 100)}%`);
  }
}

function formatStatName(stat: LevelUpGain['stat']): string {
  switch (stat) {
    case 'strength':
      return 'Strength';
    case 'dexterity':
      return 'Dexterity';
    case 'vitality':
      return 'Vitality';
    case 'focus':
      return 'Focus';
    case 'defense':
      return 'Defense';
  }
}
