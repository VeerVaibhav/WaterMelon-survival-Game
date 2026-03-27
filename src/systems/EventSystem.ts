import { EVENTS_DATA, GameEvent } from '../data/eventsData';
import { StatsSystem } from './StatsSystem';

type EventListener = (event: GameEvent) => void;

export class EventSystem {
  private activeEvent: GameEvent | null = null;
  private activeElapsed = 0;
  private timeSinceLast = 0;
  private readonly minInterval = 60; // seconds between events

  private startListeners: EventListener[] = [];
  private endListeners: EventListener[] = [];

  constructor(private stats: StatsSystem) {}

  onEventStart(l: EventListener): void { this.startListeners.push(l); }
  onEventEnd(l: EventListener): void { this.endListeners.push(l); }

  getActiveEvent(): GameEvent | null { return this.activeEvent; }

  tick(deltaMs: number): void {
    const ds = deltaMs / 1000;

    if (this.activeEvent) {
      this.activeElapsed += ds;
      if (this.activeElapsed >= this.activeEvent.duration) {
        this.endEvent();
      }
      return;
    }

    this.timeSinceLast += ds;
    if (this.timeSinceLast < this.minInterval) return;

    // Roll for each event
    for (const evt of EVENTS_DATA) {
      if (Math.random() < evt.probability * deltaMs) {
        this.startEvent(evt);
        return;
      }
    }
  }

  private startEvent(evt: GameEvent): void {
    this.activeEvent = evt;
    this.activeElapsed = 0;
    this.timeSinceLast = 0;
    for (const [key, mod] of Object.entries(evt.drainModifiers)) {
      this.stats.setDrainModifier(key, mod);
    }
    this.startListeners.forEach(l => l(evt));
  }

  private endEvent(): void {
    if (!this.activeEvent) return;
    const ended = this.activeEvent;
    for (const key of Object.keys(ended.drainModifiers)) {
      this.stats.resetDrainModifier(key);
    }
    this.activeEvent = null;
    this.activeElapsed = 0;
    this.endListeners.forEach(l => l(ended));
  }

  forceEvent(id: string): void {
    const evt = EVENTS_DATA.find(e => e.id === id);
    if (evt) this.startEvent(evt);
  }
}
