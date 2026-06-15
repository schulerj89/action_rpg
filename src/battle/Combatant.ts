import type { CombatantSnapshot, HeroStats } from '../core/types';

export class Combatant {
  readonly name: string;
  stats: HeroStats;
  hp: number;
  chi: number;
  atb = 0;

  private readonly initialStats: HeroStats;

  constructor(name: string, stats: HeroStats) {
    this.name = name;
    this.initialStats = { ...stats };
    this.stats = { ...stats };
    this.hp = this.maxHp;
    this.chi = this.maxChi;
  }

  get maxHp(): number {
    return 70 + this.stats.vitality * 12;
  }

  get maxChi(): number {
    return 30 + this.stats.focus * 4;
  }

  applyDamage(amount: number): number {
    const damage = Math.max(Math.round(amount), 1);
    this.hp = Math.max(this.hp - damage, 0);
    return damage;
  }

  setHp(value: number): void {
    this.hp = Math.max(Math.min(Math.round(value), this.maxHp), 0);
  }

  spendChi(amount: number): boolean {
    if (this.chi < amount) {
      return false;
    }

    this.chi -= amount;
    return true;
  }

  gainChi(amount: number): void {
    this.chi = Math.min(this.chi + amount, this.maxChi);
  }

  setStats(stats: HeroStats): void {
    const hpRatio = this.hp / this.maxHp;
    const chiRatio = this.chi / this.maxChi;
    this.stats = { ...stats };
    this.hp = Math.max(1, Math.round(this.maxHp * hpRatio));
    this.chi = Math.round(this.maxChi * chiRatio);
  }

  reset(): void {
    this.stats = { ...this.initialStats };
    this.hp = this.maxHp;
    this.chi = this.maxChi;
    this.atb = 0;
  }

  snapshot(): CombatantSnapshot {
    return {
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      chi: this.chi,
      maxChi: this.maxChi,
      atb: this.atb,
      stats: { ...this.stats },
    };
  }
}
