import Phaser from 'phaser';

export class Player {
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyE: Phaser.Input.Keyboard.Key;
  private interactLabel: Phaser.GameObjects.Text;
  private nearbyNPCId: string | null = null;
  private interactCb?: (id: string) => void;
  private ePressedLastFrame = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'char_sheet');
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setCollideWorldBounds(true);
    // Align the 32x48 physics box inside the 40x56 visual frame
    this.sprite.body.setSize(24, 48);
    this.sprite.body.setOffset(8, 8);
    this.sprite.body.setGravityY(800);
    this.sprite.setDepth(20);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey('A');
    this.keyD = kb.addKey('D');
    this.keyW = kb.addKey('W');
    this.keyE = kb.addKey('E');

    this.interactLabel = scene.add.text(x, y - 56, '[E] Talk', {
      fontSize: '12px', color: '#ffff00', backgroundColor: '#000000aa',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(100).setVisible(false);
  }

  onInteract(cb: (id: string) => void): void {
    this.interactCb = cb;
  }

  setNearbyNPC(id: string | null): void {
    this.nearbyNPCId = id;
    this.interactLabel.setVisible(id !== null);
  }

  showFeedback(text: string, color = '#ffffff'): void {
    const fx = this.sprite.x;
    const fy = this.sprite.y - 50;
    const t = this.scene.add.text(fx, fy, text, {
      fontSize: '15px', color,
      stroke: '#000000', strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(300);

    this.scene.tweens.add({
      targets: t,
      y: fy - 55,
      alpha: 0,
      scaleX: 1.4, scaleY: 1.4,
      duration: 1300,
      ease: 'Power2Out',
      onComplete: () => t.destroy(),
    });
  }

  update(dialogueActive: boolean): void {
    const body = this.sprite.body;
    const onGround = body.blocked.down;

    if (!dialogueActive) {
      const left = this.keyA.isDown || this.cursors.left.isDown;
      const right = this.keyD.isDown || this.cursors.right.isDown;
      const jump = this.keyW.isDown || this.cursors.up.isDown || this.cursors.space.isDown;

      body.setVelocityX(left ? -200 : right ? 200 : 0);
      // Terraria-style sprites usually face left initially, so left=false, right=true
      if (left) this.sprite.setFlipX(false);
      else if (right) this.sprite.setFlipX(true);

      if (jump && onGround) body.setVelocityY(-420);

      if (!onGround) {
         this.sprite.anims.play('player_idle', true); // Jumping/falling poses
      } else if (left || right) {
         this.sprite.anims.play('player_walk', true);
      } else {
         this.sprite.anims.play('player_idle', true);
      }

      const eNow = this.keyE.isDown;
      if (eNow && !this.ePressedLastFrame && this.nearbyNPCId) {
        this.interactCb?.(this.nearbyNPCId);
      }
      this.ePressedLastFrame = eNow;
    } else {
      body.setVelocityX(0);
      this.ePressedLastFrame = false;
    }

    this.interactLabel.setPosition(this.sprite.x, this.sprite.y - 56);
  }
}
