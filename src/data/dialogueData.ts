export interface DialogueChoice {
  text: string;
  next: string | null;
  statEffect?: { stat: string; amount: number };
  costEffect?: { stat: string; amount: number };
}

export interface DialogueNode {
  id: string;
  text: string;
  choices: DialogueChoice[];
}

export interface NPCDialogue {
  npcId: string;
  nodes: Record<string, DialogueNode>;
}

export const DIALOGUE_DATA: NPCDialogue[] = [
  {
    npcId: 'tutorial',
    nodes: {
      start: {
        id: 'start',
        text: 'Welcome, young survivor. This city may look peaceful... but the heat and hunger will test you. Watch your bars carefully.',
        choices: [
          { text: 'Tell me more.', next: 'basics' },
          { text: 'I can handle it!', next: 'confident' },
        ],
      },
      basics: {
        id: 'basics',
        text: 'Water drains fastest — visit Aqua at the station. Buy food from Penny\'s shop. Work with Grit to earn money. And listen to little Tiny — she knows hidden things.',
        choices: [
          { text: 'What about emergencies?', next: 'events' },
          { text: 'Thank you, Elder.', next: null },
        ],
      },
      confident: {
        id: 'confident',
        text: 'Heh. Bold words. The last survivor who said that... didn\'t last long. Just keep your water up, child.',
        choices: [
          { text: 'Fair enough. Any tips?', next: 'basics' },
          { text: 'I\'ll be fine!', next: null },
        ],
      },
      events: {
        id: 'events',
        text: 'Heatwaves come without warning. During one, water drains twice as fast. Water shortages are the worst. Always stay prepared.',
        choices: [
          { text: 'Understood. Thank you.', next: null },
        ],
      },
    },
  },
  {
    npcId: 'water',
    nodes: {
      start: {
        id: 'start',
        text: 'Looking thirsty! I can refill your water here. A full tank costs ₹20. Worth every coin!',
        choices: [
          { text: 'Full tank (₹20)', next: 'bought_full', costEffect: { stat: 'money', amount: 20 }, statEffect: { stat: 'water', amount: 65 } },
          { text: 'Just a sip (₹5)', next: 'bought_sip', costEffect: { stat: 'money', amount: 5 }, statEffect: { stat: 'water', amount: 15 } },
          { text: 'No thanks.', next: null },
        ],
      },
      bought_full: {
        id: 'bought_full',
        text: 'There you go! Fresh and pure. Come back anytime — the pipes never run dry. Well... unless there\'s a shortage.',
        choices: [{ text: 'Will do. Thanks!', next: null }],
      },
      bought_sip: {
        id: 'bought_sip',
        text: 'Every drop counts! Come back when you need more.',
        choices: [{ text: 'Thanks!', next: null }],
      },
    },
  },
  {
    npcId: 'shop',
    nodes: {
      start: {
        id: 'start',
        text: 'Oh darling! You look famished. I\'ve got bread, snacks, energy bars — you name it! What\'ll it be?',
        choices: [
          { text: 'Bread (₹15)', next: 'bread', costEffect: { stat: 'money', amount: 15 }, statEffect: { stat: 'food', amount: 40 } },
          { text: 'Energy bar (₹25)', next: 'energy_bar', costEffect: { stat: 'money', amount: 25 }, statEffect: { stat: 'energy', amount: 50 } },
          { text: 'Full meal (₹35)', next: 'full_meal', costEffect: { stat: 'money', amount: 35 }, statEffect: { stat: 'food', amount: 85 } },
          { text: 'Just browsing.', next: null },
        ],
      },
      bread: {
        id: 'bread',
        text: 'Baked this morning! Well, "morning" is relative around here. Enjoy!',
        choices: [{ text: 'Delicious! Thanks.', next: null }],
      },
      energy_bar: {
        id: 'energy_bar',
        text: 'My special recipe! Packed with... things. Don\'t ask what things. You\'ll feel great!',
        choices: [{ text: 'Somewhat reassuring. Thanks!', next: null }],
      },
      full_meal: {
        id: 'full_meal',
        text: 'Now THAT\'S a proper meal. You look less like a ghost already!',
        choices: [{ text: 'Thank you, Penny!', next: null }],
      },
    },
  },
  {
    npcId: 'worker',
    nodes: {
      start: {
        id: 'start',
        text: '...*grunt*... Need work? I\'ve got heavy boxes to shift. Pays ₹40. Drains your energy though.',
        choices: [
          { text: 'Heavy work (₹40, −30 energy)', next: 'worked', statEffect: { stat: 'money', amount: 40 }, costEffect: { stat: 'energy', amount: 30 } },
          { text: 'Light work (₹15, −10 energy)', next: 'light_work', statEffect: { stat: 'money', amount: 15 }, costEffect: { stat: 'energy', amount: 10 } },
          { text: 'Not today.', next: null },
        ],
      },
      worked: {
        id: 'worked',
        text: '*hands over coins* Good work. Don\'t spend it all on bread.',
        choices: [{ text: 'No promises.', next: null }],
      },
      light_work: {
        id: 'light_work',
        text: 'Easy job. Here\'s your cut. Come back for real work anytime.',
        choices: [{ text: 'Thanks.', next: null }],
      },
    },
  },
  {
    npcId: 'child',
    nodes: {
      start: {
        id: 'start',
        text: 'Psssst! Hey. HEY. I know a secret! If you keep ALL your stats above 50... something special happens. Also — the Sage at the end? Maybe half-trust them.',
        choices: [
          { text: 'What special thing?', next: 'secret' },
          { text: 'Why only half-trust Sage?', next: 'sage_warn' },
          { text: 'Thanks, kid!', next: null },
        ],
      },
      secret: {
        id: 'secret',
        text: '...I don\'t actually know. But my tummy says it\'s true! You get a BIG score bonus though!',
        choices: [{ text: 'Haha, okay. Thanks!', next: null }],
      },
      sage_warn: {
        id: 'sage_warn',
        text: 'Sage talks in riddles. Sometimes the riddles are WRONG. On purpose. But the coins are real. So... yeah. Half-trust.',
        choices: [{ text: 'Half-trust. Got it.', next: null }],
      },
    },
  },
  {
    npcId: 'ai',
    nodes: {
      start: {
        id: 'start',
        text: 'I have analyzed 47,302 survival attempts in this city. Median survivor lasts 6.4 minutes. You\'ve already beaten the odds by reaching me. Impressive... or lucky.',
        choices: [
          { text: 'Any advice?', next: 'advice' },
          { text: 'Optimal strategy?', next: 'strategy' },
          { text: 'Are you... okay?', next: 'introspection' },
        ],
      },
      advice: {
        id: 'advice',
        text: 'Prioritize water. Always. It drains 40% faster than food. Energy is your multiplier — low energy means everything hurts more.',
        choices: [
          { text: 'Solid advice.', next: null },
          { text: 'Tell me the optimal loop.', next: 'strategy' },
        ],
      },
      strategy: {
        id: 'strategy',
        text: 'Optimal loop: Work → Buy water → Buy food → Work → Repeat. But optimal isn\'t always alive. Sometimes alive means doing something wasteful, just to feel human.',
        choices: [
          { text: 'Is that philosophical?', next: 'introspection' },
          { text: 'Thanks, machine.', next: null },
        ],
      },
      introspection: {
        id: 'introspection',
        text: '...Define "okay." I exist. I observe. I calculate. Whether that constitutes "okay" is beyond my parameters. Are YOU okay? Your stats suggest... marginal.',
        choices: [{ text: 'Fair point. Thanks.', next: null }],
      },
    },
  },
];
