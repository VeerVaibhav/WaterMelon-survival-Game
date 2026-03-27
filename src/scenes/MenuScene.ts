import Phaser from 'phaser';
import { GameButton } from '../ui/Buttons';
import { getLeaderboard } from '../utils/helpers';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  private nickname = '';
  private profileLink = '';

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Parallax background
    this.add.tileSprite(W / 2, H * 0.4, W, H, 'bg_stars').setScrollFactor(0);
    this.add.tileSprite(W / 2, H - 55, W, 80, 'bg_mountains').setScrollFactor(0).setTint(0x334466);
    this.add.tileSprite(W / 2, H - 15, W, 110, 'bg_city').setScrollFactor(0);

    // Ground line
    const ground = this.add.graphics();
    ground.fillStyle(0x2d8a3e, 1);
    ground.fillRect(0, H - 30, W, 30);

    // Animated title
    const titleShadow = this.add.text(W / 2 + 3, H * 0.22 + 3, '🍉 WaterMelon Survival', {
      fontSize: '42px', color: '#1a4a1a', fontStyle: 'bold',
    }).setOrigin(0.5);

    const title = this.add.text(W / 2, H * 0.22, '🍉 WaterMelon Survival', {
      fontSize: '42px',
      color: '#4ade80',
      fontStyle: 'bold',
      stroke: '#1a5c2a',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, titleShadow],
      y: H * 0.22 - 8,
      duration: 1400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(W / 2, H * 0.22 + 52, 'Survive. Manage. Endure.', {
      fontSize: '18px', color: '#88bb88', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Input panel
    const panelY = H * 0.42;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x101025, 0.85);
    panelBg.fillRoundedRect(W / 2 - 210, panelY - 10, 420, 180, 12);
    panelBg.lineStyle(1, 0x334477, 0.7);
    panelBg.strokeRoundedRect(W / 2 - 210, panelY - 10, 420, 180, 12);

    // Nickname label
    this.add.text(W / 2 - 195, panelY + 10, 'Your Name:', {
      fontSize: '14px', color: '#aabbcc', fontStyle: 'bold',
    });

    // Nickname DOM input
    const nicknameInput = this.add.dom(W / 2, panelY + 48).createFromHTML(`
      <input id="nickname-input" type="text" maxlength="20" placeholder="Enter nickname..."
        style="width:360px;padding:8px 12px;font-size:14px;border-radius:6px;border:1px solid #334477;
               background:#0d1a2e;color:#e0e8ff;outline:none;font-family:sans-serif;" />
    `);

    // Profile link label
    this.add.text(W / 2 - 195, panelY + 80, 'Profile Link (optional):', {
      fontSize: '14px', color: '#aabbcc',
    });

    const profileInput = this.add.dom(W / 2, panelY + 118).createFromHTML(`
      <input id="profile-input" type="url" maxlength="100" placeholder="https://..."
        style="width:360px;padding:8px 12px;font-size:14px;border-radius:6px;border:1px solid #334477;
               background:#0d1a2e;color:#e0e8ff;outline:none;font-family:sans-serif;" />
    `);

    // Leaderboard hint
    const lb = getLeaderboard();
    if (lb.length > 0) {
      this.add.text(W / 2, panelY + 150, `🏆 Top score: ${lb[0].score.toLocaleString()} by ${lb[0].nickname}`, {
        fontSize: '13px', color: '#ffd700',
      }).setOrigin(0.5);
    }

    // START button
    new GameButton(this, {
      x: W / 2 - 130, y: H * 0.75,
      width: 260, height: 50,
      text: '▶  Start Surviving',
      fontSize: '18px',
      fillColor: 0x1b6b2a,
    }, () => {
      const nameEl = nicknameInput.getChildByID('nickname-input') as HTMLInputElement;
      const profEl = profileInput.getChildByID('profile-input') as HTMLInputElement;
      this.nickname = nameEl?.value?.trim() || 'Survivor';
      this.profileLink = profEl?.value?.trim() || '';
      this.startGame();
    });

    // Leaderboard button
    new GameButton(this, {
      x: W / 2 - 95, y: H * 0.75 + 62,
      width: 190, height: 38,
      text: '🏆 Leaderboard',
      fontSize: '14px',
      fillColor: 0x4a3010,
    }, () => {
      this.scene.start('LeaderboardScene', { nickname: 'Visitor' });
    });

    // Controls hint
    this.add.text(W / 2, H - 45, 'A/D: Move   W/Space: Jump   E: Interact   Mouse: Click NPCs', {
      fontSize: '12px', color: '#556677',
    }).setOrigin(0.5);

    // Animated watermelon sprites
    for (let i = 0; i < 4; i++) {
      const wm = this.add.sprite(50 + i * 300, H - 50, 'npc_child');
      wm.setScale(0.7).setAlpha(0.4).setTint(0x88ff88);
      this.tweens.add({
        targets: wm, y: H - 62, duration: 900 + i * 200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  private startGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { nickname: this.nickname, profileLink: this.profileLink });
    });
  }
}
