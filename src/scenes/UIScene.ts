import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import { DialogueBox } from '../ui/DialogueBox';
import { GameScene } from './GameScene';
import { DialogueNode } from '../data/dialogueData';
import { GameEvent } from '../data/eventsData';

export class UIScene extends Phaser.Scene {
  private hud!: HUD;
  private dialogueBox!: DialogueBox;
  private gameScene!: GameScene;

  constructor() { super({ key: 'UIScene' }); }

  create(): void {
    // Get reference to the running GameScene
    this.gameScene = this.scene.get('GameScene') as GameScene;

    // Build HUD
    this.hud = new HUD(this);

    // Build dialogue box
    this.dialogueBox = new DialogueBox(this);

    // Listen to GameScene events
    const gs = this.gameScene;

    gs.events.on('dialogue-open', (node: DialogueNode, npcId: string) => {
      this.dialogueBox.show(
        node,
        npcId,
        (choiceIdx) => {
          const result = gs.dialogue.selectChoice(choiceIdx);
          if (result.cannotAfford) {
            // Flash a "Can't afford!" message
            this.showAffordError();
          }
        },
        () => {
          // onClose: dialogue already ended by system
        }
      );
    });

    gs.events.on('dialogue-update', (node: DialogueNode, npcId: string) => {
      this.dialogueBox.updateNode(node, npcId);
    });

    gs.events.on('dialogue-close', () => {
      this.dialogueBox.hide();
    });

    gs.events.on('game-event-start', (evt: GameEvent) => {
      this.hud.showEventBanner(evt);
    });

    // ESC to close dialogue
    this.input.keyboard?.addKey('ESC').on('down', () => {
      if (this.dialogueBox.isShowing()) {
        gs.dialogue.endDialogue();
      }
    });
  }

  update(_time: number, delta: number): void {
    if (!this.gameScene || !this.gameScene.stats) return;

    const stats = this.gameScene.stats.getAllStats();
    const event = this.gameScene.events2.getActiveEvent();

    this.hud.update(stats, event);
    this.hud.tick(delta);
  }

  private showAffordError(): void {
    const W = this.scale.width;
    const err = this.add.text(W / 2, this.scale.height - 230, "💸 Can't afford that!", {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: err,
      y: err.y - 30,
      alpha: 0,
      duration: 1200,
      ease: 'Power2Out',
      onComplete: () => err.destroy(),
    });
  }
}
