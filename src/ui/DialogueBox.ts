import Phaser from 'phaser';
import { DialogueNode } from '../data/dialogueData';
import { NPC_DATA } from '../data/npcData';

type ChoiceCb = (index: number) => void;
type CloseCb = () => void;

export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private portraitImg: Phaser.GameObjects.Image; // Added Image for Portrait
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private onChoice?: ChoiceCb;
  private onClose?: CloseCb;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private fullText = '';
  private isVisible = false;

  private readonly BOX_W: number;
  private readonly BOX_H = 180;
  private readonly PAD = 16;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;
    this.BOX_W = W - 40;

    const bg = scene.add.graphics();
    bg.fillStyle(0x1a2a4a, 0.95);
    bg.fillRoundedRect(0, 0, this.BOX_W, this.BOX_H, 8);
    bg.lineStyle(2, 0x336699, 1);
    bg.strokeRoundedRect(0, 0, this.BOX_W, this.BOX_H, 8);

    // Portrait box (background)
    this.portrait = scene.add.graphics();
    this.portrait.setPosition(this.PAD, this.PAD);
    this.portrait.fillStyle(0x000000, 0.4);
    this.portrait.fillRoundedRect(0, 0, 60, 60, 8);

    // Actual Portrait Sprite
    this.portraitImg = scene.add.image(this.PAD + 30, this.PAD + 30, 'char_sheet');
    this.portraitImg.setDisplaySize(40, 56);

    this.nameText = scene.add.text(this.PAD + 72, this.PAD + 2, '', {
      fontSize: '14px', color: '#aaddff', fontStyle: 'bold',
    });

    this.bodyText = scene.add.text(this.PAD + 72, this.PAD + 22, '', {
      fontSize: '13px', color: '#e8e8e8',
      wordWrap: { width: this.BOX_W - this.PAD * 2 - 80 },
    });

    this.container = scene.add.container(20, H, [bg, this.portrait, this.portraitImg, this.nameText, this.bodyText]);
    this.container.setScrollFactor(0).setDepth(150).setVisible(false);
  }

  show(node: DialogueNode, npcId: string, onChoice: ChoiceCb, onClose: CloseCb): void {
    this.onChoice = onChoice;
    this.onClose = onClose;
    this.isVisible = true;

    const npc = NPC_DATA.find(n => n.id === npcId);
    this.nameText.setText(npc?.name ?? npcId);

    // Set actual NPC sprite as portrait
    const pTex = (npc as any)?.texture ?? 'char_sheet';
    this.portraitImg.setTexture(pTex);
    this.portraitImg.setFrame(0);
    this.portraitImg.setTint(0xffffff);
    
    // Add simple breathing animation to portrait
    this.scene.tweens.add({
      targets: [this.portrait, this.portraitImg], // Animate both background and sprite
      y: '+=3',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.clearChoices();
    this.fullText = node.text;
    this.bodyText.setText('');

    // Slide up
    this.container.setVisible(true).setAlpha(0);
    const H = this.scene.scale.height;
    this.container.setY(H);
    this.scene.tweens.add({
      targets: this.container,
      y: H - this.BOX_H - 20,
      alpha: 1,
      duration: 280,
      ease: 'Power2Out',
      onComplete: () => this.typewrite(node),
    });
  }

  private typewrite(node: DialogueNode): void {
    this.typewriterTimer?.remove();
    let i = 0;
    const chars = this.fullText.split('');
    this.typewriterTimer = this.scene.time.addEvent({
      delay: 28,
      repeat: chars.length - 1,
      callback: () => {
        this.bodyText.setText(this.bodyText.text + chars[i]);
        i++;
        if (i >= chars.length) this.showChoices(node);
      },
    });
  }

  private showChoices(node: DialogueNode): void {
    this.clearChoices();
    const startX = this.PAD + 70;
    const startY = this.BOX_H - 20 - node.choices.length * 30;

    node.choices.forEach((choice, idx) => {
      const btn = this.makeChoiceButton(choice.text, startX, startY + idx * 30, idx);
      btn.setAlpha(0);
      this.scene.tweens.add({
        targets: btn,
        alpha: 1,
        delay: idx * 80,
        duration: 200,
      });
      this.choiceButtons.push(btn);
    });
  }

  private makeChoiceButton(text: string, x: number, y: number, idx: number): Phaser.GameObjects.Container {
    const w = Math.min(250, this.BOX_W - x - this.PAD);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x112244, 0.9);
    bg.fillRoundedRect(0, 0, w, 28, 4);
    bg.lineStyle(1, 0x4477aa, 1);
    bg.strokeRoundedRect(0, 0, w, 28, 4);

    const label = this.scene.add.text(10, 6, `▸ ${text}`, {
      fontSize: '13px', color: '#ccddff', fontStyle: 'bold'
    });

    const zone = this.scene.add.zone(0, 0, w, 28).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear(); bg.fillStyle(0x3366cc, 1); bg.fillRoundedRect(0, 0, w, 28, 4);
      this.scene.tweens.add({ targets: btn, scaleX: 1.04, scaleY: 1.04, duration: 100, ease: 'Sine.easeOut' });
    });
    zone.on('pointerout', () => {
      bg.clear(); bg.fillStyle(0x112244, 0.9); bg.fillRoundedRect(0, 0, w, 28, 4); bg.lineStyle(1, 0x4477aa, 1); bg.strokeRoundedRect(0, 0, w, 28, 4);
      this.scene.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100, ease: 'Sine.easeIn' });
    });
    zone.on('pointerdown', () => {
      this.scene.tweens.add({ targets: btn, scaleX: 0.94, scaleY: 0.94, duration: 80, yoyo: true });
      this.onChoice?.(idx);
    });

    const btn = this.scene.add.container(x, y, [bg, label, zone]);
    this.container.add(btn);
    return btn;
  }

  updateNode(node: DialogueNode, npcId: string): void {
    const npc = NPC_DATA.find(n => n.id === npcId);
    this.nameText.setText(npc?.name ?? npcId);
    this.clearChoices();
    this.fullText = node.text;
    this.bodyText.setText('');
    this.typewrite(node);
  }

  hide(): void {
    if (!this.isVisible) return;
    this.typewriterTimer?.remove();
    this.isVisible = false;
    this.scene.tweens.add({
      targets: this.container,
      y: this.scene.scale.height + 20,
      alpha: 0,
      duration: 220,
      ease: 'Power2In',
      onComplete: () => {
        this.container.setVisible(false);
        this.clearChoices();
        this.onClose?.();
      },
    });
  }

  private clearChoices(): void {
    this.choiceButtons.forEach(b => {
      this.container.remove(b, true);
    });
    this.choiceButtons = [];
  }

  isShowing(): boolean { return this.isVisible; }
}
