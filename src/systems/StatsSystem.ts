import { clamp } from '../utils/helpers';

export type StatKey = 'health' | 'water' | 'food' | 'energy' | 'money';

export interface Stats {
  health: number;
  water: number;
  food: number;
  energy: number;
  money: number;
  time: number; // game minutes 0-1440
}

type StatListener = (key: StatKey | 'time', value: number, delta: number) => void;
type KeyListener = (key: StatKey) => void;

export class StatsSystem {
  private stats: Stats = {
    health: 100,
    water: 100,
    food: 100,
    energy: 100,
    money: 50,
    time: 360, // 6:00 AM
  };

  // Base drain per second
  private baseRates: Record<string, number> = {
    water: 1.2,
    food: 0.7,
    energy: 0.9,
  };

  private drainModifiers: Record<string, number> = {
    water: 1.0,
    food: 1.0,
    energy: 1.0,
  };

  private changeListeners: StatListener[] = [];
  private criticalListeners: KeyListener[] = [];
  private depletedListeners: KeyListener[] = [];

  public isAlive = true;
  private survivalSeconds = 0;

  onStatChange(listener: StatListener): void {
    this.changeListeners.push(listener);
  }
  onCritical(listener: KeyListener): void {
    this.criticalListeners.push(listener);
  }
  onDepleted(listener: KeyListener): void {
    this.depletedListeners.push(listener);
  }

  private emit(key: StatKey | 'time', value: number, delta: number): void {
    this.changeListeners.forEach(l => l(key, value, delta));
  }

  getStat(key: StatKey): number {
    return this.stats[key];
  }

  getAllStats(): Stats {
    return { ...this.stats };
  }

  getSurvivalSeconds(): number {
    return this.survivalSeconds;
  }

  addStat(key: StatKey, amount: number): number {
    if (key === 'money') {
      const newVal = clamp(this.stats.money + amount, 0, 9999);
      const delta = newVal - this.stats.money;
      this.stats.money = newVal;
      if (Math.abs(delta) > 0.001) this.emit('money', newVal, delta);
      return delta;
    }
    const prev = this.stats[key];
    const newVal = clamp(prev + amount, 0, 100);
    const delta = newVal - prev;
    (this.stats as Record<string, number>)[key] = newVal;
    if (Math.abs(delta) > 0.001) {
      this.emit(key, newVal, delta);
      if (newVal <= 0) {
        this.depletedListeners.forEach(l => l(key));
      } else if (newVal <= 20) {
        this.criticalListeners.forEach(l => l(key));
      }
    }
    return delta;
  }

  canAfford(amount: number): boolean {
    return this.stats.money >= amount;
  }

  setDrainModifier(key: string, mod: number): void {
    this.drainModifiers[key] = mod;
  }

  resetDrainModifier(key: string): void {
    this.drainModifiers[key] = 1.0;
  }

  tick(deltaMs: number): void {
    if (!this.isAlive) return;
    const ds = deltaMs / 1000;
    this.survivalSeconds += ds;

    // Drain water, food, energy
    for (const key of ['water', 'food', 'energy'] as const) {
      const rate = this.baseRates[key] * (this.drainModifiers[key] ?? 1.0);
      this.addStat(key, -rate * ds);
    }

    // Health depends on critical stats
    const critCount = (['water', 'food', 'energy'] as const).filter(k => this.stats[k] <= 10).length;
    if (critCount > 0) {
      this.addStat('health', -0.6 * critCount * ds);
    } else if (this.stats.water > 50 && this.stats.food > 50 && this.stats.energy > 50) {
      this.addStat('health', 0.08 * ds);
    }

    // Advance game time: 0.25 game-minutes per real second
    const prev = this.stats.time;
    this.stats.time = (prev + 0.25 * ds) % 1440;
    this.emit('time', this.stats.time, this.stats.time - prev);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.isAlive = false;
    }
  }
}
