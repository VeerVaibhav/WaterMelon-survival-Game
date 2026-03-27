import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { StatsSystem } from '../systems/StatsSystem';
import { EventSystem } from '../systems/EventSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import { NPC_DATA } from '../data/npcData';

const WORLD_W = 4800;
const WORLD_H = 720;
const GROUND_Y = 570;
const TILE_SIZE = 32;

export class GameScene extends Phaser.Scene {
  public stats!: StatsSystem;
  public events2!: EventSystem;   // renamed to avoid Phaser 'events' conflict
  public dialogue!: DialogueSystem;

  public player!: Player;
  public npcs: NPC[] = [];
  public nickname = 'Survivor';
  public profileLink = '';
  public survivalStart = 0;

  private ground!: Phaser.GameObjects.TileSprite;
  private platforms: Phaser.GameObjects.TileSprite[] = [];
  private staticGroup!: Phaser.Physics.Arcade.StaticGroup;
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];

  // Building labels
  private buildingLabels = [
    { key: 'home',          x: 150,  label: '🏠 Home',           w: 120 },
    { key: 'water_station', x: 950,  label: '💧 Water Station',  w: 120 },
    { key: 'shop',          x: 1750, label: '🏪 Shop',           w: 120 },
    { key: 'work',          x: 2550, label: '⚙️ Work Area',      w: 120 },
    { key: 'park',          x: 3250, label: '🌳 Park',           w: 120 },
    { key: 'town_hall',     x: 3950, label: '🏛 Town Hall',      w: 120 },
  ];

  constructor() { super({ key: 'GameScene' }); }

  init(data: { nickname?: string; profileLink?: string }): void {
    this.nickname = data.nickname ?? 'Survivor';
    this.profileLink = data.profileLink ?? '';
  }

  create(): void {
    this.survivalStart = Date.now();

    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Systems
    this.stats = new StatsSystem();
    this.events2 = new EventSystem(this.stats);
    this.dialogue = new DialogueSystem(this.stats);

    // World
    this.buildBackground();
    this.buildWorld();
    this.buildBuildings();
    this.buildTrees();

    // Player Animations
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('char_sheet', { start: 0, end: 0 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('char_sheet', { start: 0, end: 13 }),
      frameRate: 15,
      repeat: -1
    });

    // Player
    // With setOrigin(0.5, 1), Y parameter matches the bottom of the player's feet
    this.player = new Player(this, 200, GROUND_Y);
    this.physics.add.collider(this.player.sprite, this.staticGroup);

    // NPCs
    this.buildNPCs();

    // Camera follow
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // Player interact callback
    this.player.onInteract((npcId) => {
      if (!this.dialogue.isActive()) {
        this.getNPC(npcId)?.bounce();
        this.dialogue.startDialogue(npcId);
      }
    });

    // Dialogue events
    this.dialogue.onStart((node, npcId) => {
      this.events.emit('dialogue-open', node, npcId);
    });
    this.dialogue.onChange((node, npcId) => {
      this.events.emit('dialogue-update', node, npcId);
    });
    this.dialogue.onEnd((npcId) => {
      this.events.emit('dialogue-close', npcId);
    });

    // Stat events → show feedback on player
    this.stats.onStatChange((key, value, delta) => {
      if (key === 'time' || Math.abs(delta) < 1) return;
      const sign = delta > 0 ? '+' : '';
      const colors: Record<string, string> = {
        health: delta > 0 ? '#ff8888' : '#ff2222',
        water:  delta > 0 ? '#44aaff' : '#ff6600',
        food:   delta > 0 ? '#44ee88' : '#ff6600',
        energy: delta > 0 ? '#ffdd44' : '#ff8800',
        money:  delta > 0 ? '#ffd700' : '#ff4444',
      };
      const labels: Record<string, string> = {
        health: '❤️', water: '💧', food: '🍞', energy: '⚡', money: '₹',
      };
      const col = colors[key as string] ?? '#ffffff';
      const lbl = labels[key as string] ?? '';
      this.player.showFeedback(`${sign}${Math.round(Math.abs(delta))} ${lbl}`, col);
    });

    // Critical stat → screen shake
    this.stats.onCritical((key) => {
      this.cameras.main.shake(200, 0.006);
      this.events.emit('stat-critical', key);
    });

    // Game over
    this.stats.onDepleted((key) => {
      if (key === 'health' || !this.stats.isAlive) {
        this.triggerGameOver();
      }
    });

    // Event system
    this.events2.onEventStart((evt) => {
      this.events.emit('game-event-start', evt);
      this.cameras.main.shake(300, 0.007);
    });
    this.events2.onEventEnd((evt) => {
      this.events.emit('game-event-end', evt);
    });

    // Launch UI scene in parallel
    this.scene.launch('UIScene', { gameScene: this });

    // Day/night tint
    this.time.addEvent({
      delay: 500, loop: true,
      callback: this.updateDayNight, callbackScope: this,
    });
  }

  update(_time: number, delta: number): void {
    if (!this.stats.isAlive) return;

    this.stats.tick(delta);
    this.events2.tick(delta);
    this.player.update(this.dialogue.isActive());

    // Parallax scrolling
    const cx = this.cameras.main.scrollX;
    if (this.bgLayers[0]) this.bgLayers[0].setTilePosition(cx * 0.05, 0);
    if (this.bgLayers[1]) this.bgLayers[1].setTilePosition(cx * 0.15, 0);
    if (this.bgLayers[2]) this.bgLayers[2].setTilePosition(cx * 0.3, 0);

    // NPC proximity
    let nearestId: string | null = null;
    let nearestDist = Infinity;
    this.npcs.forEach(npc => {
      const dist = Math.abs(npc.getX() - this.player.sprite.x);
      if (dist < npc.interactRadius && dist < nearestDist) {
        nearestDist = dist;
        nearestId = npc.data.id;
      }
      npc.setHighlight(npc.data.id === nearestId);
    });
    this.player.setNearbyNPC(nearestId);

    // Check game over each frame
    if (!this.stats.isAlive) {
      this.triggerGameOver();
    }
  }

  private buildBackground(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Top layer sky image fixed stretching and slightly scaled up to handle shake overlap
    const sky = this.add.image(W / 2, H / 2, 'sky');
    sky.setScrollFactor(0).setDepth(0).setDisplaySize(W * 1.05, H * 1.05);

    // Mountains (horizon layer)
    const mtn = this.add.tileSprite(WORLD_W / 2, WORLD_H - 120, WORLD_W, 240, 'bg_mountains');
    mtn.setScrollFactor(0.15).setDepth(1).setTint(0x556688);
    mtn.tileScaleX = 2.5; mtn.tileScaleY = 2.5;

    this.bgLayers = [mtn];
  }

  private buildWorld(): void {
    this.staticGroup = this.physics.add.staticGroup();

    // Ground tiles
    this.ground = this.add.tileSprite(WORLD_W / 2, GROUND_Y + TILE_SIZE / 2, WORLD_W, TILE_SIZE, 'tile_grass');
    this.ground.setDepth(5);
    this.ground.tileScaleX = 2; this.ground.tileScaleY = 2;

    // Dirt layer below ground
    const dirt = this.add.tileSprite(WORLD_W / 2, GROUND_Y + TILE_SIZE + 60, WORLD_W, TILE_SIZE * 4, 'tile_dirt').setDepth(4);
    dirt.tileScaleX = 2; dirt.tileScaleY = 2;

    // Solid collision geometry for the ground (fixing the falling through issue)
    const groundCollider = this.add.rectangle(WORLD_W / 2, GROUND_Y + TILE_SIZE / 2, WORLD_W, TILE_SIZE);
    this.physics.add.existing(groundCollider, true);
    this.staticGroup.add(groundCollider as any);
  }

  private buildBuildings(): void {
    this.buildingLabels.forEach(b => {
      // Building sprite
      const bldg = this.add.image(b.x + b.w / 2, GROUND_Y - 50, `building_${b.key}`).setDepth(6);
      bldg.setDisplaySize(b.w, 100);

      // Sign label
      const sign = this.add.text(b.x + b.w / 2, GROUND_Y - 108, b.label, {
        fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#00000099',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(7);

      // Animated flag/light on each building
      this.add.text(b.x + b.w - 6, GROUND_Y - 100, '🚩', { fontSize: '12px' })
        .setDepth(8);
      this.tweens.add({
        targets: sign, alpha: 0.7, duration: 800 + Math.random() * 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  private buildTrees(): void {
    for(let i = 0; i < 35; i++) {
        const x = Phaser.Math.Between(100, WORLD_W - 100);
        // Avoid buildings
        if (this.buildingLabels.some(b => Math.abs(b.x - x) < 150)) continue;

        const trunk = this.add.tileSprite(x, GROUND_Y - 20, 16, 40, 'tile_wood').setDepth(3); 
        const top = this.add.image(x, GROUND_Y - 40, 'tree_top').setDepth(4).setOrigin(0.5, 1);
        top.setScale(2.5 + Math.random() * 0.5); // extracted crop scales well
        
        // Sway animation based on tree
        this.tweens.add({
            targets: top,
            rotation: 0.06,
            duration: 1800 + Math.random() * 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
  }

  private buildNPCs(): void {
    NPC_DATA.forEach(npcData => {
      const npc = new NPC(this, npcData, GROUND_Y);
      npc.onDialogue((id) => {
        if (!this.dialogue.isActive()) {
          npc.bounce();
          this.dialogue.startDialogue(id);
        }
      });
      this.npcs.push(npc);
    });
  }

  private updateDayNight(): void {
    const time = this.stats.getAllStats().time; // 0-1440
    let skyColor: string;
    let tint: number;
    if (time < 300 || time > 1200) {
      skyColor = '#0a0a1a'; // night
      tint = 0x111133;
    } else if (time < 400) {
      skyColor = '#223355'; // pre-dawn
      tint = 0x334466;
    } else if (time < 500) {
      skyColor = '#ffaa55'; // dawn
      tint = 0x887755;
    } else if (time < 1080) {
      skyColor = '#44aaff'; // bright blue string sky for daytime
      tint = 0xffffff;
    } else if (time < 1150) {
      skyColor = '#ff6622'; // dusk
      tint = 0xffaa55;
    } else {
      skyColor = '#1a2a4a'; // early night
      tint = 0x334455;
    }
    this.cameras.main.setBackgroundColor(skyColor);
    this.bgLayers.forEach(l => l.setTint(tint));
  }

  triggerGameOver(): void {
    if (!this.scene.isActive('GameScene')) return;
    const elapsed = (Date.now() - this.survivalStart) / 1000;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        nickname: this.nickname,
        profileLink: this.profileLink,
        survivalSeconds: elapsed,
        health: this.stats.getStat('health'),
        money: this.stats.getStat('money'),
      });
    });
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs.find(n => n.data.id === id);
  }
}
