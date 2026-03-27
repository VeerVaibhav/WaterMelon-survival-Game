import Phaser from 'phaser';
import { ScoreSystem } from '../systems/ScoreSystem';
import { GameButton } from '../ui/Buttons';
import { formatNumber } from '../utils/helpers';

interface LeaderboardData {
  nickname?: string;
  currentScore?: number;
}

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: 'LeaderboardScene' }); }

  create(data: LeaderboardData): void {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#070712');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Stars BG
    this.add.tileSprite(W / 2, H / 2, W, H, 'bg_stars').setAlpha(0.5);

    // Title
    this.add.text(W / 2, 35, '🏆 Leaderboard', {
      fontSize: '34px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 73, 'Top 10 Survivors', {
      fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    const scoreSystem = new ScoreSystem();
    const entries = scoreSystem.getLeaderboard();

    // Header row
    const headerY = 105;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0d1a2e, 0.85);
    panelBg.fillRoundedRect(W / 2 - 300, headerY - 5, 600, 390, 10);
    panelBg.lineStyle(1, 0x334477, 0.6);
    panelBg.strokeRoundedRect(W / 2 - 300, headerY - 5, 600, 390, 10);

    ['#', 'Name', 'Score', 'Date'].forEach((h, i) => {
      const xs = [W / 2 - 280, W / 2 - 230, W / 2 + 120, W / 2 + 230];
      this.add.text(xs[i], headerY + 5, h, {
        fontSize: '13px', color: '#5577aa', fontStyle: 'bold',
      });
    });

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x334477, 0.5);
    div.lineBetween(W / 2 - 290, headerY + 28, W / 2 + 290, headerY + 28);

    // Entries
    if (entries.length === 0) {
      this.add.text(W / 2, headerY + 160, 'No scores yet. Be the first!', {
        fontSize: '16px', color: '#555577',
      }).setOrigin(0.5);
    } else {
      entries.slice(0, 10).forEach((entry, i) => {
        const rowY = headerY + 38 + i * 34;
        const isPlayer = entry.nickname === data.nickname && entry.score === data.currentScore;
        const isCurrent = data.currentScore !== undefined && entry.score === data.currentScore;
        const rowColor = i === 0 ? '#ffd700' : i === 1 ? '#cccccc' : i === 2 ? '#cd7f32' : (isPlayer ? '#44ff88' : '#8899aa');

        // Highlight row
        if (isCurrent || isPlayer) {
          const rowBg = this.add.graphics();
          rowBg.fillStyle(0x1a3a1a, 0.6);
          rowBg.fillRoundedRect(W / 2 - 295, rowY - 4, 590, 26, 4);
          rowBg.setAlpha(0);
          this.tweens.add({ targets: rowBg, alpha: 1, delay: i * 80 + 200, duration: 300 });
        }

        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const cols = [
          { x: W / 2 - 280, text: medal },
          { x: W / 2 - 230, text: entry.nickname.slice(0, 18) },
          { x: W / 2 + 120, text: formatNumber(entry.score) },
          { x: W / 2 + 230, text: entry.date },
        ];

        cols.forEach(col => {
          const t = this.add.text(col.x, rowY, col.text, {
            fontSize: '14px', color: rowColor,
            fontStyle: i < 3 ? 'bold' : 'normal',
          }).setAlpha(0);
          this.tweens.add({ targets: t, alpha: 1, delay: i * 80, duration: 250 });
        });

        // Profile link small indicator
        if (entry.profileLink) {
          this.add.text(W / 2 + 275, rowY, '🔗', { fontSize: '11px' }).setAlpha(0.6);
        }
      });
    }

    // Buttons
    new GameButton(this, {
      x: W / 2 - 210, y: H - 75, width: 195, height: 44,
      text: '🔄 Play Again',
      fillColor: 0x1b6b2a,
    }, () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    new GameButton(this, {
      x: W / 2 + 15, y: H - 75, width: 195, height: 44,
      text: '🗑 Clear Scores',
      fillColor: 0x5a1010,
    }, () => {
      localStorage.removeItem('wms_leaderboard');
      this.cameras.main.fadeOut(200);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
    });
  }
}
