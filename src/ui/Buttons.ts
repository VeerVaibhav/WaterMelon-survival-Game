import Phaser from 'phaser';

export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height?: number;
  text: string;
  fontSize?: string;
  fillColor?: number;
  textColor?: string;
  depth?: number;
  scrollFactor?: number;
}

export class GameButton {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private config: Required<ButtonConfig>;

  constructor(scene: Phaser.Scene, config: ButtonConfig, onClick: () => void) {
    this.scene = scene;
    this.config = {
      height: 44,
      fontSize: '16px',
      fillColor: 0x2244aa,
      textColor: '#ffffff',
      depth: 10,
      scrollFactor: 0,
      ...config,
    };

    const { x, y, width, height, text, fontSize, fillColor, textColor, depth, scrollFactor } = this.config;

    this.bg = scene.add.graphics();
    this.label = scene.add.text(width / 2, height / 2, text, {
      fontSize, color: textColor, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    const zone = scene.add.zone(0, 0, width, height).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });

    this.container = scene.add.container(x, y, [this.bg, this.label, zone]);
    this.container.setDepth(depth).setScrollFactor(scrollFactor);

    this.drawDefault();

    zone.on('pointerover', () => {
      this.drawHover();
      scene.tweens.add({ targets: this.container, scaleX: 1.06, scaleY: 1.06, duration: 100, ease: 'Power1' });
    });
    zone.on('pointerout', () => {
      this.drawDefault();
      scene.tweens.add({ targets: this.container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    zone.on('pointerdown', () => {
      this.drawPressed();
      scene.tweens.add({ targets: this.container, scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true,
        onComplete: onClick });
    });
  }

  private draw(fillColor: number, strokeColor: number, alpha = 1): void {
    const { width, height } = this.config;
    this.bg.clear();
    this.bg.fillStyle(fillColor, alpha);
    this.bg.fillRoundedRect(0, 0, width, height, 8);
    this.bg.lineStyle(2, strokeColor, 0.9);
    this.bg.strokeRoundedRect(0, 0, width, height, 8);
  }

  private drawDefault(): void { this.draw(this.config.fillColor, 0x5577cc); }
  private drawHover(): void { this.draw(this.config.fillColor + 0x223344, 0xaabbff); }
  private drawPressed(): void { this.draw(this.config.fillColor - 0x112233, 0x334477); }

  setText(text: string): void { this.label.setText(text); }
  setVisible(v: boolean): void { this.container.setVisible(v); }
  destroy(): void { this.container.destroy(); }
}
