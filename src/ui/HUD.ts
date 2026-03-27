import Phaser from 'phaser';
import { Stats } from '../systems/StatsSystem';
import { GameEvent } from '../data/eventsData';
import { lerpColor, formatNumber, formatTime } from '../utils/helpers';

interface BarConfig {
  key: keyof Stats;
  icon: string;
  color: number;
  warnColor: number;
  critColor: number;
  y: number;
}

const BAR_CONFIGS: BarConfig[] = [
  { key: 'health',  icon: '❤️',  color: 0xE84393, warnColor: 0xFF8C00, critColor: 0xFF0000, y: 12 },
  { key: 'water',   icon: '💧',  color: 0x1E90FF, warnColor: 0xFFA500, critColor: 0xFF4500, y: 44 },
  { key: 'food',    icon: '🍞',  color: 0x2ED573, warnColor: 0xFFA502, critColor: 0xFF4500, y: 76 },
  { key: 'energy',  icon: '⚡',  color: 0xFFD700, warnColor: 0xFFA500, critColor: 0xFF4500, y: 108 },
];

const BAR_W = 140;
const BAR_H = 14;
const BAR_X = 44;

export class HUD {
  private scene: Phaser.Scene;
  private barGfx: Phaser.GameObjects.Graphics;
  private vignette: Phaser.GameObjects.Graphics;
  private moneyText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private eventBanner?: Phaser.GameObjects.Container;
  private eventBannerBg?: Phaser.GameObjects.Image;

  // Render objects for the bars
  private barFills: Phaser.GameObjects.Sprite[] = [];
  private barBgs: Phaser.GameObjects.Image[] = [];

  // Smooth bar values
  private barCurrent: Record<string, number> = {};
  private barTarget: Record<string, number> = {};

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const W = scene.scale.width;

    // Initialize bar values
    BAR_CONFIGS.forEach(c => {
      this.barCurrent[c.key as string] = 100;
      this.barTarget[c.key as string] = 100;
    });

    // HUD Background removed to make it completely transparent as requested.

    // Bar graphics for highlights
    this.barGfx = scene.add.graphics().setScrollFactor(0).setDepth(53);

    // Draw static bar backgrounds and store fill sprites
    BAR_CONFIGS.forEach((c, idx) => {
      scene.add.text(8, c.y + 1, c.icon, { fontSize: '14px' })
        .setScrollFactor(0).setDepth(52);

      // Procedural Dark Background
      this.barGfx.fillStyle(0x222222, 1);
      this.barGfx.fillRoundedRect(BAR_X, c.y, BAR_W, BAR_H, 4);

      // Bar Fill Layer
      const fill = scene.add.sprite(BAR_X, c.y, 'hp_fill').setOrigin(0).setScrollFactor(0).setDepth(52);
      fill.setDisplaySize(BAR_W, BAR_H); // stretch horizontally/vertically if needed
      fill.setTint(c.color);
      this.barFills.push(fill);
    });

    // Money
    this.moneyText = scene.add.text(8, 150, '💰 ₹50', {
      fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(52);

    // Time
    this.timeText = scene.add.text(W - 110, 10, '⏱ 06:00', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(52);

    // Vignette
    this.vignette = scene.add.graphics().setScrollFactor(0).setDepth(199);

    this.drawBars();
  }

  update(stats: Stats, _event: GameEvent | null): void {
    BAR_CONFIGS.forEach(c => {
      this.barTarget[c.key as string] = (stats[c.key] as number);
    });
    this.moneyText.setText(`💰 ₹${formatNumber(stats.money)}`);
    this.timeText.setText(`⏱ ${formatTime(stats.time)}`);

    // Vignette on low health
    const hp = stats.health / 100;
    this.drawVignette(hp < 0.3 ? 0.45 * (1 - hp / 0.3) : 0);
  }

  tick(deltaMs: number): void {
    // Smooth bars
    const speed = Math.min(1, 4 * deltaMs / 1000);
    let redraw = false;
    BAR_CONFIGS.forEach(c => {
      const k = c.key as string;
      const diff = this.barTarget[k] - this.barCurrent[k];
      if (Math.abs(diff) > 0.05) {
        this.barCurrent[k] += diff * speed;
        redraw = true;
      } else if (this.barCurrent[k] !== this.barTarget[k]) {
        this.barCurrent[k] = this.barTarget[k];
        redraw = true;
      }
    });
    if (redraw) this.drawBars();
  }

  private drawBars(): void {
    this.barGfx.clear();
    const now = Date.now();

    BAR_CONFIGS.forEach((c, i) => {
      const val = this.barCurrent[c.key as string];
      const pct = Math.max(0, val) / 100;
      const y = c.y;

      const fill = this.barFills[i];
      fill.setCrop(0, 0, fill.width * pct, fill.height);

      // Color based on value
      let color: number;
      if (pct > 0.5) color = c.color;
      else if (pct > 0.2) color = lerpColor(c.warnColor, c.color, (pct - 0.2) / 0.3);
      else color = lerpColor(c.critColor, c.warnColor, pct / 0.2);

      fill.setTint(color);

      // Pulse shimmer when critical
      if (val <= 20) {
        const pulse = (Math.sin(now / 180) * 0.5 + 0.5) * 0.25;
        this.barGfx.fillStyle(0xffffff, pulse);
        this.barGfx.fillRoundedRect(BAR_X, y, BAR_W * pct, BAR_H, 2);
      }
    });
  }

  private drawVignette(alpha: number): void {
    this.vignette.clear();
    if (alpha <= 0) return;
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const pulse = (Math.sin(Date.now() / 400) * 0.5 + 0.5) * 0.35 * alpha;
    const a = alpha + pulse;
    const bw = 30, bh = 30;
    this.vignette.fillStyle(0xff0000, a);
    this.vignette.fillRect(0, 0, W, bh);
    this.vignette.fillRect(0, H - bh, W, bh);
    this.vignette.fillRect(0, 0, bw, H);
    this.vignette.fillRect(W - bw, 0, bw, H);
  }

  showEventBanner(event: GameEvent | null): void {
    this.eventBanner?.destroy();
    if (!event) return;
    const W = this.scene.scale.width;
    
    // Create animated event banner
    const bg = this.scene.add.image(0, 0, 'inner_panel_bg').setOrigin(0);
    bg.setDisplaySize(380, 36);
    bg.setTint(event.bannerColor);
    
    // Add pulsing glow behind banner
    const glow = this.scene.add.image(0, 0, 'panel_bg').setOrigin(0);
    glow.setDisplaySize(380, 36);
    glow.setTint(0xffffff).setAlpha(0.3);
    
    this.scene.tweens.add({
      targets: glow, alpha: 0.1, scaleX: 1.02, scaleY: 1.05,
      duration: 500, yoyo: true, repeat: -1
    });

    const label = this.scene.add.text(190, 18, `${event.name}  ${event.description}`, {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.eventBanner = this.scene.add.container(W / 2 - 190, 5, [glow, bg, label])
      .setScrollFactor(0).setDepth(60);

    // Enter animation
    this.eventBanner.setY(-50);
    this.scene.tweens.add({
      targets: this.eventBanner, y: 5, duration: 400, ease: 'Back.out'
    });

    // Exit animation
    this.scene.tweens.add({
      targets: this.eventBanner, alpha: 0, delay: event.duration * 1000 - 1500, duration: 1500,
      onComplete: () => this.eventBanner?.destroy(),
    });
  }
}
