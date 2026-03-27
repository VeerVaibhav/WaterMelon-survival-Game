export interface GameEvent {
  id: string;
  name: string;
  description: string;
  duration: number;        // seconds
  probability: number;     // chance per second check
  drainModifiers: Partial<Record<string, number>>;
  priceModifiers: Partial<Record<string, number>>;
  npcOverride: string;
  bannerColor: number;
}

export const EVENTS_DATA: GameEvent[] = [
  {
    id: 'heatwave',
    name: '🔥 Heatwave',
    description: 'Temperatures soar! Water drains twice as fast.',
    duration: 45,
    probability: 0.0025,
    drainModifiers: { water: 2.0, energy: 1.3 },
    priceModifiers: { water: 1.5 },
    npcOverride: 'It\'s brutal out there! Stay hydrated!',
    bannerColor: 0xFF4500,
  },
  {
    id: 'water_shortage',
    name: '💧 Water Shortage',
    description: 'Supply is running low. Water prices spike!',
    duration: 60,
    probability: 0.0015,
    drainModifiers: { water: 1.5 },
    priceModifiers: { water: 2.5 },
    npcOverride: 'Water is scarce right now. Save every drop.',
    bannerColor: 0x4169E1,
  },
  {
    id: 'price_surge',
    name: '📈 Price Surge',
    description: 'Market prices have spiked across the board.',
    duration: 30,
    probability: 0.002,
    drainModifiers: {},
    priceModifiers: { water: 1.4, food: 1.4, energy: 1.4 },
    npcOverride: 'Business is rough. Prices are up everywhere.',
    bannerColor: 0xFFD700,
  },
  {
    id: 'blackout',
    name: '⚡ Energy Blackout',
    description: 'Power outage! Energy drains twice as fast.',
    duration: 40,
    probability: 0.002,
    drainModifiers: { energy: 2.0 },
    priceModifiers: {},
    npcOverride: 'The power\'s out! Moving in the dark is exhausting.',
    bannerColor: 0x2F4F4F,
  },
];
