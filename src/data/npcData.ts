export interface NPCData {
  id: string;
  name: string;
  color: number;
  accentColor: number;
  x: number;
  description: string;
  functionType: 'tutorial' | 'water' | 'shop' | 'worker' | 'child' | 'ai';
  hat: string;
  texture: string;
}

export const NPC_DATA: NPCData[] = [
  {
    id: 'tutorial',
    name: 'Elder Melon',
    color: 0x8B4513,
    accentColor: 0xD2691E,
    x: 350,
    description: 'A wise elder who guides newcomers.',
    functionType: 'tutorial',
    hat: 'wide',
    texture: 'npc_wizard',
  },
  {
    id: 'water',
    name: 'Aqua',
    color: 0x1E90FF,
    accentColor: 0x87CEEB,
    x: 1100,
    description: 'Runs the water station.',
    functionType: 'water',
    hat: 'cap',
    texture: 'npc_angler',
  },
  {
    id: 'shop',
    name: 'Penny',
    color: 0xFFD700,
    accentColor: 0xFF8C00,
    x: 1900,
    description: 'The city shopkeeper.',
    functionType: 'shop',
    hat: 'top',
    texture: 'npc_merchant',
  },
  {
    id: 'worker',
    name: 'Grit',
    color: 0x708090,
    accentColor: 0xA9A9A9,
    x: 2700,
    description: 'Offers work in exchange for money.',
    functionType: 'worker',
    hat: 'hard',
    texture: 'npc_demo',
  },
  {
    id: 'child',
    name: 'Tiny',
    color: 0xFF69B4,
    accentColor: 0xFFB6C1,
    x: 3400,
    description: 'A curious child who shares secrets.',
    functionType: 'child',
    hat: 'bow',
    texture: 'npc_nurse',
  },
  {
    id: 'ai',
    name: 'Sage',
    color: 0x9400D3,
    accentColor: 0xDA70D6,
    x: 4100,
    description: 'A mysterious AI entity.',
    functionType: 'ai',
    hat: 'antenna',
    texture: 'npc_mechanic',
  },
];
