import { describe, it, expect, beforeEach } from 'vitest';
import { StatsSystem } from '../systems/StatsSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { EventSystem } from '../systems/EventSystem';

// ─── StatsSystem ──────────────────────────────────────────────────────────────

describe('StatsSystem', () => {
  let stats: StatsSystem;

  beforeEach(() => {
    stats = new StatsSystem();
  });

  it('initializes health at 100', () => {
    expect(stats.getStat('health')).toBe(100);
  });

  it('initializes money at 50', () => {
    expect(stats.getStat('money')).toBe(50);
  });

  it('addStat increases a value correctly', () => {
    stats.addStat('water', -30);
    expect(stats.getStat('water')).toBe(70);
  });

  it('addStat clamps at 0', () => {
    stats.addStat('food', -200);
    expect(stats.getStat('food')).toBe(0);
  });

  it('addStat clamps at 100', () => {
    stats.addStat('health', 50);
    expect(stats.getStat('health')).toBe(100);
  });

  it('canAfford returns true when money is sufficient', () => {
    expect(stats.canAfford(50)).toBe(true);
  });

  it('canAfford returns false when money is insufficient', () => {
    expect(stats.canAfford(100)).toBe(false);
  });

  it('emits stat-changed event on change', () => {
    const changes: string[] = [];
    stats.onStatChange((key) => changes.push(key as string));
    stats.addStat('water', -10);
    expect(changes).toContain('water');
  });

  it('tick drains water over time', () => {
    const before = stats.getStat('water');
    stats.tick(1000); // 1 second
    expect(stats.getStat('water')).toBeLessThan(before);
  });

  it('tick drains food over time', () => {
    const before = stats.getStat('food');
    stats.tick(1000);
    expect(stats.getStat('food')).toBeLessThan(before);
  });

  it('tick drains energy over time', () => {
    const before = stats.getStat('energy');
    stats.tick(1000);
    expect(stats.getStat('energy')).toBeLessThan(before);
  });

  it('tick does not drain when isAlive is false', () => {
    stats.isAlive = false;
    const before = stats.getStat('water');
    stats.tick(1000);
    expect(stats.getStat('water')).toBe(before);
  });

  it('health decreases when water is critically low', () => {
    stats.addStat('water', -95); // water at 5
    const healthBefore = stats.getStat('health');
    stats.tick(1000);
    expect(stats.getStat('health')).toBeLessThan(healthBefore);
  });

  it('isAlive becomes false when health depletes', () => {
    stats.addStat('water', -100); // prevent regen
    stats.addStat('health', -100);
    stats.tick(1000);
    expect(stats.isAlive).toBe(false);
  });

  it('setDrainModifier increases drain rate', () => {
    stats.setDrainModifier('water', 2.0);
    const water1 = stats.getStat('water');
    stats.tick(1000);
    const water2 = stats.getStat('water');
    // Drain should be doubled
    stats.resetDrainModifier('water');
    const statsB = new StatsSystem();
    statsB.tick(1000);
    const normalDrain = 100 - statsB.getStat('water');
    const doubleDrain = water1 - water2;
    expect(doubleDrain).toBeGreaterThan(normalDrain * 1.8);
  });

  it('getSurvivalSeconds starts at 0', () => {
    expect(stats.getSurvivalSeconds()).toBe(0);
  });

  it('getSurvivalSeconds increases with ticks', () => {
    stats.tick(5000);
    expect(stats.getSurvivalSeconds()).toBeCloseTo(5, 0);
  });
});

// ─── ScoreSystem ──────────────────────────────────────────────────────────────

describe('ScoreSystem', () => {
  let scoreSystem: ScoreSystem;

  beforeEach(() => {
    scoreSystem = new ScoreSystem();
    localStorage.clear();
  });

  it('calculates score correctly', () => {
    // 60 seconds = 1 minute * 100 + 80 health * 10 + 50 money = 100 + 800 + 50 = 950
    const score = scoreSystem.calculateScore(60, 80, 50);
    expect(score).toBe(950);
  });

  it('score is 0 for zero inputs', () => {
    expect(scoreSystem.calculateScore(0, 0, 0)).toBe(0);
  });

  it('longer survival yields higher score', () => {
    const short = scoreSystem.calculateScore(60, 50, 0);
    const long = scoreSystem.calculateScore(300, 50, 0);
    expect(long).toBeGreaterThan(short);
  });

  it('higher health yields higher score', () => {
    const low = scoreSystem.calculateScore(60, 10, 0);
    const high = scoreSystem.calculateScore(60, 100, 0);
    expect(high).toBeGreaterThan(low);
  });

  it('saveScore persists entry', () => {
    scoreSystem.saveScore('TestPlayer', 1000);
    const lb = scoreSystem.getLeaderboard();
    expect(lb.some(e => e.nickname === 'TestPlayer')).toBe(true);
  });

  it('getLeaderboard returns sorted entries', () => {
    scoreSystem.saveScore('A', 500);
    scoreSystem.saveScore('B', 1000);
    scoreSystem.saveScore('C', 750);
    const lb = scoreSystem.getLeaderboard();
    expect(lb[0].score).toBe(1000);
    expect(lb[1].score).toBe(750);
    expect(lb[2].score).toBe(500);
  });

  it('getLeaderboard caps at 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      scoreSystem.saveScore(`Player${i}`, i * 100);
    }
    const lb = scoreSystem.getLeaderboard();
    expect(lb.length).toBeLessThanOrEqual(10);
  });

  it('getRank returns 1 for top score', () => {
    scoreSystem.saveScore('A', 500);
    scoreSystem.saveScore('B', 200);
    // New score of 600 should be rank 1
    const rank = scoreSystem.getRank(600);
    expect(rank).toBe(1);
  });

  it('getRank reflects correct position', () => {
    scoreSystem.saveScore('A', 1000);
    scoreSystem.saveScore('B', 500);
    // Score of 600 should be rank 2 (ahead of 500, behind 1000)
    const rank = scoreSystem.getRank(600);
    expect(rank).toBe(2);
  });
});

// ─── EventSystem ──────────────────────────────────────────────────────────────

describe('EventSystem', () => {
  let stats: StatsSystem;
  let eventSystem: EventSystem;

  beforeEach(() => {
    stats = new StatsSystem();
    eventSystem = new EventSystem(stats);
  });

  it('starts with no active event', () => {
    expect(eventSystem.getActiveEvent()).toBeNull();
  });

  it('forceEvent activates an event', () => {
    eventSystem.forceEvent('heatwave');
    expect(eventSystem.getActiveEvent()).not.toBeNull();
    expect(eventSystem.getActiveEvent()?.id).toBe('heatwave');
  });

  it('active event modifies drain modifiers on stats', () => {
    eventSystem.forceEvent('heatwave');
    // Heatwave doubles water drain — we test it by draining
    const waterBefore = stats.getStat('water');
    stats.tick(1000);
    const normalStats = new StatsSystem(); // without event
    normalStats.tick(1000);
    const drainWithEvent = waterBefore - stats.getStat('water');
    const drainNormal = 100 - normalStats.getStat('water');
    expect(drainWithEvent).toBeGreaterThan(drainNormal * 1.5);
  });

  it('event emits start callback', () => {
    let called = false;
    eventSystem.onEventStart(() => { called = true; });
    eventSystem.forceEvent('heatwave');
    expect(called).toBe(true);
  });

  it('event data is accessible during event', () => {
    eventSystem.forceEvent('water_shortage');
    const evt = eventSystem.getActiveEvent();
    expect(evt?.id).toBe('water_shortage');
    expect(evt?.name).toContain('Water');
  });

  it('event ends after its duration elapses', () => {
    let ended = false;
    eventSystem.onEventEnd(() => { ended = true; });
    eventSystem.forceEvent('heatwave'); // duration = 45 seconds
    // Tick 46 seconds
    eventSystem.tick(46000);
    expect(ended).toBe(true);
    expect(eventSystem.getActiveEvent()).toBeNull();
  });

  it('drain modifiers reset after event ends', () => {
    eventSystem.forceEvent('heatwave');
    // Let it end
    eventSystem.tick(50000);
    // Now drain should be back to normal
    const waterBefore = stats.getStat('water');
    stats.tick(1000);
    const drain = waterBefore - stats.getStat('water');
    expect(drain).toBeLessThan(2.5); // normal drain ~1.2/s
  });
});
