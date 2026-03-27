import Phaser from 'phaser';
import { NPC_DATA } from '../data/npcData';

/**
 * BootScene: generates all programmatic textures, then proceeds to MenuScene.
 * No external image files required.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    // Load UI Assets
    this.load.image('panel_left', 'assets/ui/Panel_Left.png');
    this.load.image('hp_panel_middle', 'assets/ui/HP_Panel_Middle.png');
    this.load.image('hp_panel_right', 'assets/ui/HP_Panel_Right.png');
    this.load.image('hp_fill', 'assets/ui/HP_Fill.png');
    this.load.image('panel_bg', 'assets/ui/PanelBackground.png');
    this.load.image('inner_panel_bg', 'assets/ui/InnerPanelBackground.png');

    // Load World Assets
    this.load.image('bg_stars', 'assets/world/Background_0.png');
    this.load.image('bg_mountains', 'assets/world/Background_7.png');
    this.load.image('bg_city', 'assets/world/Background_77.png');
    
    // We will procedurally generate grass and dirt for flawless ground looping
    this.load.image('platform', 'assets/world/wood_tile.png'); 
    
    // We still extract tree crop dynamically since it's an image, not a tileSprite
    this.load.image('raw_tree_top', 'assets/world/Tree_Tops_0.png');

    // Add sky background
    this.load.image('sky', 'assets/world/sky.jpg');

    // Load full character spritesheet (Guide NPC_22)
    this.load.spritesheet('char_sheet', 'assets/chars/NPC_22.png', {
      frameWidth: 40, frameHeight: 56
    });

    // Town NPCs
    this.load.spritesheet('npc_merchant', 'referal_Asset/TownNPCs/Merchant_Default.png', { frameWidth: 40, frameHeight: 56 });
    this.load.spritesheet('npc_nurse', 'referal_Asset/TownNPCs/Nurse_Default.png', { frameWidth: 40, frameHeight: 56 });
    this.load.spritesheet('npc_demo', 'referal_Asset/TownNPCs/Demolitionist_Default.png', { frameWidth: 40, frameHeight: 56 });
    this.load.spritesheet('npc_wizard', 'referal_Asset/TownNPCs/Wizard_Default.png', { frameWidth: 40, frameHeight: 56 });
    this.load.spritesheet('npc_mechanic', 'referal_Asset/TownNPCs/Mechanic_Default.png', { frameWidth: 40, frameHeight: 56 });
    this.load.spritesheet('npc_angler', 'referal_Asset/TownNPCs/Angler_Default.png', { frameWidth: 40, frameHeight: 56 });
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    // Loading background
    this.cameras.main.setBackgroundColor('#0a0a1a');
    const title = this.add.text(W / 2, H / 2 - 40, '🍉 WaterMelon Survival', {
      fontSize: '28px', color: '#4ade80', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const loadingText = this.add.text(W / 2, H / 2 + 20, 'Loading...', {
      fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title], scaleX: 1.05, scaleY: 1.05,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.generateProceduralTiles();
    this.generateBuildingTextures();

    loadingText.setText('Ready!');

    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  private generateProceduralTiles(): void {
    // 1. Grass Block (Perfect 32x32 seamless)
    const g = this.make.graphics({ x:0, y:0 } as any);
    g.fillStyle(0x3a7a3a, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x2d5c2d, 1);
    g.fillRect(0, 0, 32, 4); // Dark top edge
    g.fillStyle(0x428c42, 1);
    g.fillRect(2, 6, 4, 2); g.fillRect(16, 14, 6, 2); g.fillRect(8, 26, 4, 2); // Detail specks
    g.generateTexture('tile_grass', 32, 32);
    g.destroy();

    // 2. Dirt Block
    const d = this.make.graphics({ x:0, y:0 } as any);
    d.fillStyle(0x523621, 1);
    d.fillRect(0, 0, 32, 32);
    d.fillStyle(0x402919, 1);
    d.fillRect(4, 4, 6, 4); d.fillRect(20, 12, 6, 4); d.fillRect(8, 24, 6, 4); d.fillRect(24, 26, 4, 4);
    d.generateTexture('tile_dirt', 32, 32);
    d.destroy();

    // 3. Tree Top
    const treeCrop = this.textures.createCanvas('tree_top', 80, 80);
    treeCrop?.context.drawImage(this.textures.get('raw_tree_top').getSourceImage() as HTMLImageElement, 0, 0, 80, 80, 0, 0, 80, 80);
    treeCrop?.refresh();

    // 4. Wood Trunk (Perfect 16x16 seamless log)
    const w = this.make.graphics({ x:0, y:0 } as any);
    w.fillStyle(0x5c3a21, 1);
    w.fillRect(0, 0, 16, 16);
    w.fillStyle(0x3e2310, 1); // vertical bark lines
    w.fillRect(2, 0, 2, 16); w.fillRect(8, 0, 2, 16); w.fillRect(12, 0, 2, 16);
    w.generateTexture('tile_wood', 16, 16);
    w.destroy();
  }

  private generateBuildingTextures(): void {
    // We retain programmatic generation for buildings until they are completely drawn.

    // Building textures
    const buildingColors: Record<string, number> = {
      home: 0xd4a27a, water_station: 0x1e90ff, shop: 0xffd700,
      work: 0x708090, park: 0x2ed573, town_hall: 0x9400d3,
    };
    for (const [name, color] of Object.entries(buildingColors)) {
      const b = this.make.graphics({ add: false } as any);
      b.fillStyle(color, 1);
      b.fillRect(0, 0, 120, 100);
      b.fillStyle(0x000000, 0.15);
      b.fillRect(0, 0, 120, 16); // darker roof band
      b.lineStyle(2, 0x000000, 0.3);
      b.strokeRect(0, 0, 120, 100);
      // Windows
      b.fillStyle(0xaaccff, 0.6);
      b.fillRect(15, 30, 20, 20);
      b.fillRect(55, 30, 20, 20);
      b.fillRect(85, 30, 20, 20);
      // Door
      b.fillStyle(0x5c3d1a, 1);
      b.fillRect(45, 65, 30, 35);
      b.generateTexture(`building_${name}`, 120, 100);
      b.destroy();
    }
  }
}
