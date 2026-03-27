import { DIALOGUE_DATA, DialogueNode, NPCDialogue, DialogueChoice } from '../data/dialogueData';
import { StatsSystem } from './StatsSystem';

type NodeListener = (node: DialogueNode, npcId: string) => void;
type EndListener = (npcId: string) => void;

export class DialogueSystem {
  private dialogueMap = new Map<string, NPCDialogue>();
  private currentNPC: string | null = null;
  private currentNode: DialogueNode | null = null;

  private startListeners: NodeListener[] = [];
  private changeListeners: NodeListener[] = [];
  private endListeners: EndListener[] = [];

  constructor(private stats: StatsSystem) {
    for (const d of DIALOGUE_DATA) {
      this.dialogueMap.set(d.npcId, d);
    }
  }

  isActive(): boolean { return this.currentNPC !== null; }
  getCurrentNode(): DialogueNode | null { return this.currentNode; }
  getCurrentNPC(): string | null { return this.currentNPC; }

  onStart(l: NodeListener): void { this.startListeners.push(l); }
  onChange(l: NodeListener): void { this.changeListeners.push(l); }
  onEnd(l: EndListener): void { this.endListeners.push(l); }

  startDialogue(npcId: string): void {
    const dialogue = this.dialogueMap.get(npcId);
    if (!dialogue) return;
    this.currentNPC = npcId;
    this.currentNode = dialogue.nodes['start'];
    this.startListeners.forEach(l => l(this.currentNode!, npcId));
  }

  /** Returns { success, cannotAfford } */
  selectChoice(index: number): { success: boolean; cannotAfford: boolean } {
    if (!this.currentNode || !this.currentNPC) return { success: false, cannotAfford: false };
    const choice: DialogueChoice = this.currentNode.choices[index];
    if (!choice) return { success: false, cannotAfford: false };

    // Check money cost
    if (choice.costEffect && choice.costEffect.stat === 'money') {
      if (!this.stats.canAfford(choice.costEffect.amount)) {
        return { success: false, cannotAfford: true };
      }
      this.stats.addStat('money', -choice.costEffect.amount);
    }

    // Energy cost (from work)
    if (choice.costEffect && choice.costEffect.stat === 'energy') {
      this.stats.addStat('energy', -choice.costEffect.amount);
    }

    // Stat gain
    if (choice.statEffect) {
      const stat = choice.statEffect.stat as Parameters<StatsSystem['addStat']>[0];
      this.stats.addStat(stat, choice.statEffect.amount);
    }

    // Navigate
    if (choice.next === null) {
      this.endDialogue();
      return { success: true, cannotAfford: false };
    }

    const dialogue = this.dialogueMap.get(this.currentNPC!);
    const next = dialogue?.nodes[choice.next];
    if (!next) {
      this.endDialogue();
      return { success: true, cannotAfford: false };
    }

    this.currentNode = next;
    this.changeListeners.forEach(l => l(this.currentNode!, this.currentNPC!));
    return { success: true, cannotAfford: false };
  }

  endDialogue(): void {
    const id = this.currentNPC;
    this.currentNPC = null;
    this.currentNode = null;
    if (id) this.endListeners.forEach(l => l(id));
  }
}
