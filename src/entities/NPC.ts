import Phaser from 'phaser';
import { NPCData } from '../data/npcData';

export class NPC {
  public data: NPCData;
  public sprite: Phaser.GameObjects.Sprite;
  private nameLabel: Phaser.GameObjects.Text;
  private highlightCircle: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private dialogueCb?: (id: string) => void;
  public readonly interactRadius = 130;

  constructor(scene: Phaser.Scene, data: NPCData, groundY: number) {
    this.scene = scene;
    this.data = data;

    // Use proper TownNPC sprite sheet and display frame 0 since we use procedural breathing animations
    this.sprite = scene.add.sprite(data.x, groundY, data.texture);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(15);
    this.sprite.setFrame(0);

    // Idle bob animation (NPCs breathe slightly)
    scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.05,
      duration: 1100 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Name label
    this.nameLabel = scene.add.text(data.x, groundY - 65, data.name, {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(16);

    // Highlight ring
    this.highlightCircle = scene.add.graphics().setDepth(14);

    // Hover & click
    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on('pointerover', () => {
      scene.tweens.add({ targets: this.sprite, scaleX: 1.15, scaleY: 1.15, duration: 100 });
    });
    this.sprite.on('pointerout', () => {
      scene.tweens.add({ targets: this.sprite, scaleX: 1, scaleY: 1, duration: 100 });
    });
    this.sprite.on('pointerdown', () => {
      this.bounce();
      this.dialogueCb?.(data.id);
    });
  }

  onDialogue(cb: (id: string) => void): void {
    this.dialogueCb = cb;
  }

  bounce(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.65, scaleX: 1.35,
      duration: 70, yoyo: true, ease: 'Power2'
    });
  }

  setHighlight(on: boolean): void {
    this.highlightCircle.clear();
    if (on) {
      this.highlightCircle.lineStyle(2, 0xffffff, 0.5);
      this.highlightCircle.strokeCircle(this.data.x, this.sprite.y, 45);
    }
  }

  getX(): number { return this.data.x; }
  getY(): number { return this.sprite.y; }
}
