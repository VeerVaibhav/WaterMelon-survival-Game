import Phaser from 'phaser';
import { ScoreSystem } from '../systems/ScoreSystem';
import { formatNumber } from '../utils/helpers';

interface LeaderboardData {
  nickname?: string;
  currentScore?: number;
}

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: 'LeaderboardScene' }); }

  create(data: LeaderboardData): void {
    const W = this.scale.width;   // 1280
    const H = this.scale.height;  // 720

    this.cameras.main.setBackgroundColor('#070712');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Stars BG
    this.add.tileSprite(W / 2, H / 2, W, H, 'bg_stars').setAlpha(0.5);

    // --- Remove white background from leaderboard image at runtime ---
    this.removeWhiteBackground('leaderboard_bg', 'leaderboard_clean');

    // --- Leaderboard background image (1024x1024 source) ---
    const displayH = H * 0.92;
    const scale = displayH / 1024;
    const displayW = 1024 * scale;

    const board = this.add.image(W / 2, H / 2, 'leaderboard_clean');
    board.setScale(scale);

    // Board bounds in screen coords
    const boardLeft = W / 2 - displayW / 2;
    const boardTop = H / 2 - displayH / 2;

    const toScreenX = (imgX: number) => boardLeft + imgX * scale;
    const toScreenY = (imgY: number) => boardTop + imgY * scale;

    // --- Row positions (measured from the 1024x1024 source image) ---
    // 7 yellow bars, centers estimated from image analysis
    const firstRowY = 310;
    const rowSpacing = 63;
    const barLeftX = 280;
    const barRightX = 760;

    const scoreSystem = new ScoreSystem();
    const entries = scoreSystem.getLeaderboard();

    // --- Render entries on the 7 bars ---
    if (entries.length === 0) {
      this.add.text(W / 2, H / 2 + 10, 'No scores yet.\nBe the first!', {
        fontSize: '16px', color: '#5c4a2a', fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
    } else {
      entries.slice(0, 7).forEach((entry, i) => {
        const rowCenterY = toScreenY(firstRowY + i * rowSpacing);
        const isPlayer = entry.nickname === data.nickname && entry.score === data.currentScore;

        const rowColor = i === 0 ? '#7a1a00' : i === 1 ? '#5c3a0a' : i === 2 ? '#5c3a0a' : '#4a3a1a';

        // Player name on the left side of bar
        const nameText = entry.nickname.slice(0, 14);
        const nameT = this.add.text(toScreenX(barLeftX + 8), rowCenterY, nameText, {
          fontSize: '12px', color: rowColor, fontStyle: i < 3 ? 'bold' : 'normal',
        }).setOrigin(0, 0.5).setAlpha(0);

        // Score on the right side of bar
        const scoreT = this.add.text(toScreenX(barRightX - 8), rowCenterY, formatNumber(entry.score), {
          fontSize: '12px', color: rowColor, fontStyle: i < 3 ? 'bold' : 'normal',
        }).setOrigin(1, 0.5).setAlpha(0);

        // Animate in
        this.tweens.add({ targets: [nameT, scoreT], alpha: 1, delay: i * 80, duration: 250 });

        // Highlight current player's row
        if (isPlayer) {
          const glowX = toScreenX((barLeftX + barRightX) / 2);
          const glowW = (barRightX - barLeftX) * scale;
          const highlight = this.add.graphics();
          highlight.fillStyle(0xffffff, 0.2);
          highlight.fillRoundedRect(glowX - glowW / 2, rowCenterY - 12, glowW, 24, 3);
          this.tweens.add({
            targets: highlight, alpha: 0.1,
            duration: 600, yoyo: true, repeat: -1,
          });
        }
      });
    }

    // --- Interactive buttons overlaying the image's BACK and NEXT button areas ---
    // The previous Y calculation (approx 66%) was too high, placing them over rows 6 and 7.
    // The buttons in the image are very close to the bottom. Based on visual inspection, 
    // they are roughly at ~84% to 85% of the total height.
    const backBtnX = toScreenX(395);
    const backBtnY = toScreenY(755);
    const startBtnX = toScreenX(630);
    const startBtnY = toScreenY(755);
    
    // Adjust button size to cover the red areas
    const btnW = 160 * scale; 
    const btnH = 45 * scale;

    // -- BACK BUTTON --
    const backCover = this.add.graphics();
    backCover.fillStyle(0xd52121, 1);
    backCover.fillRoundedRect(backBtnX - btnW / 2, backBtnY - btnH / 2, btnW, btnH, 4);
    backCover.setDepth(board.depth + 1);

    const backLabel = this.add.text(backBtnX, backBtnY, 'BACK', {
      fontSize: `${Math.round(20 * scale)}px`, color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(board.depth + 2);

    const backZone = this.add.zone(backBtnX, backBtnY, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(board.depth + 3);

    backZone.on('pointerover', () => {
      backCover.clear();
      backCover.fillStyle(0xff4444, 1);
      backCover.fillRoundedRect(backBtnX - btnW / 2, backBtnY - btnH / 2, btnW, btnH, 4);
      backLabel.setScale(1.1);
    });
    backZone.on('pointerout', () => {
      backCover.clear();
      backCover.fillStyle(0xd52121, 1);
      backCover.fillRoundedRect(backBtnX - btnW / 2, backBtnY - btnH / 2, btnW, btnH, 4);
      backLabel.setScale(1);
    });
    backZone.on('pointerdown', () => {
      backLabel.setScale(0.95);
      this.time.delayedCall(100, () => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene');
        });
      });
    });

    // -- START SURVIVING BUTTON --
    // We cover the 'NEXT' text entirely.
    const startCover = this.add.graphics();
    startCover.fillStyle(0xd52121, 1);
    startCover.fillRoundedRect(startBtnX - btnW / 2, startBtnY - btnH / 2, btnW, btnH, 4);
    startCover.setDepth(board.depth + 1);

    const startLabel = this.add.text(startBtnX, startBtnY, 'START SURVIVING', {
      fontSize: `${Math.round(12 * scale)}px`, color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(board.depth + 2);

    const startZone = this.add.zone(startBtnX, startBtnY, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(board.depth + 3);

    startZone.on('pointerover', () => {
      startCover.clear();
      startCover.fillStyle(0xff4444, 1);
      startCover.fillRoundedRect(startBtnX - btnW / 2, startBtnY - btnH / 2, btnW, btnH, 4);
      startLabel.setScale(1.1);
    });
    startZone.on('pointerout', () => {
      startCover.clear();
      startCover.fillStyle(0xd52121, 1);
      startCover.fillRoundedRect(startBtnX - btnW / 2, startBtnY - btnH / 2, btnW, btnH, 4);
      startLabel.setScale(1);
    });
    startZone.on('pointerdown', () => {
      startLabel.setScale(0.95);
      this.time.delayedCall(100, () => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene');
        });
      });
    });
  }

  /** Remove white/near-white pixels from a texture and create a new clean texture */
  private removeWhiteBackground(sourceKey: string, targetKey: string): void {
    const source = this.textures.get(sourceKey);
    const img = source.getSourceImage() as HTMLImageElement;
    
    const canvas = this.textures.createCanvas(targetKey, img.width, img.height);
    if (!canvas) return;
    
    const ctx = canvas.context;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    const threshold = 235;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > threshold && g > threshold && b > threshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    canvas.refresh();
  }
}
