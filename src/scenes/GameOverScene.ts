import Phaser from 'phaser';
import { ScoreSystem } from '../systems/ScoreSystem';
import { GameButton } from '../ui/Buttons';
import { formatNumber } from '../utils/helpers';

interface GameOverData {
  nickname: string;
  profileLink?: string;
  survivalSeconds: number;
  health: number;
  money: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data: GameOverData): void {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#080810');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const scoreSystem = new ScoreSystem();
    const score = scoreSystem.calculateScore(data.survivalSeconds, data.health, data.money);
    const entries = scoreSystem.saveScore(data.nickname, score, data.profileLink);
    const rank = scoreSystem.getRank(score);

    const minutes = Math.floor(data.survivalSeconds / 60);
    const seconds = Math.floor(data.survivalSeconds % 60);

    // Title
    this.add.text(W / 2, 60, data.health <= 0 ? '💀 You Didn\'t Survive' : '✅ Run Complete', {
      fontSize: '36px', color: data.health <= 0 ? '#ff4444' : '#4ade80',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 105, `Survivor: ${data.nickname}`, {
      fontSize: '18px', color: '#aabbcc',
    }).setOrigin(0.5);

    // Stats panel
    const panelY = 140;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0d1a2e, 0.9);
    panelBg.fillRoundedRect(W / 2 - 220, panelY, 440, 200, 10);
    panelBg.lineStyle(1, 0x334477, 0.7);
    panelBg.strokeRoundedRect(W / 2 - 220, panelY, 440, 200, 10);

    const statLines = [
      { label: '⏱ Survival Time', value: `${minutes}m ${seconds}s` },
      { label: '❤️ Final Health',  value: `${Math.floor(data.health)}%` },
      { label: '💰 Final Money',   value: `₹${formatNumber(data.money)}` },
      { label: '🏆 Score',         value: formatNumber(score), highlight: true },
      { label: '📊 Rank',          value: `#${rank} of ${entries.length}` },
    ];

    statLines.forEach((line, i) => {
      this.add.text(W / 2 - 190, panelY + 20 + i * 34, line.label, {
        fontSize: '14px', color: '#8899aa',
      });
      const val = this.add.text(W / 2 + 190, panelY + 20 + i * 34, line.value, {
        fontSize: line.highlight ? '22px' : '14px',
        color: line.highlight ? '#ffd700' : '#ffffff',
        fontStyle: line.highlight ? 'bold' : 'normal',
        stroke: line.highlight ? '#000000' : undefined,
        strokeThickness: line.highlight ? 2 : 0,
      }).setOrigin(1, 0);

      // Animate score reveal
      if (line.highlight) {
        val.setAlpha(0);
        this.tweens.add({ targets: val, alpha: 1, delay: 400, duration: 600 });
        this.tweens.add({
          targets: val, scaleX: 1.2, scaleY: 1.2, duration: 300,
          delay: 400, yoyo: true, ease: 'Power2',
        });
      }
    });

    // Buttons
    new GameButton(this, {
      x: W / 2 - 210, y: 380, width: 200, height: 46,
      text: '🏆 Leaderboard',
      fillColor: 0x4a3010,
    }, () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LeaderboardScene', { nickname: data.nickname, currentScore: score });
      });
    });

    new GameButton(this, {
      x: W / 2 + 10, y: 380, width: 200, height: 46,
      text: '🔄 Play Again',
      fillColor: 0x1b6b2a,
    }, () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // Profile link if provided
    if (data.profileLink) {
      this.add.text(W / 2, 445, `🔗 ${data.profileLink}`, {
        fontSize: '12px', color: '#4477aa',
      }).setOrigin(0.5);
    }

    // Quirky message
    const msgs = [
      'The city moves on.', 'Water waits for no one.', 'Try again?',
      'The NPCs miss you.', 'Even tiny Tiny is sad.', 'Grit is NOT surprised.',
    ];
    this.add.text(W / 2, H - 40, msgs[Math.floor(Math.random() * msgs.length)], {
      fontSize: '14px', color: '#445566', fontStyle: 'italic',
    }).setOrigin(0.5);
  }
}
