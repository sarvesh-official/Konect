import { AnimatedSprite, Container, Graphics, Text, Texture } from "pixi.js";

const FRAME_COUNT = 19;
const WALK_SPEED = 0.4;
const FOLLOW_SPEED = 0.7;
const SCALE = 0.3;

export class Dog {
  x: number;
  y: number;
  private mapX: number;
  private mapY: number;
  private container: Container;
  private sprite: AnimatedSprite | null = null;
  private shadow: Graphics;
  private heartContainer: Container;
  private heartTimer = 0;

  // AI
  private targetX: number;
  private targetY: number;
  private speed = WALK_SPEED;
  private pauseTimer = 0;
  private areaW: number;
  private areaH: number;
  private isBeingPet = false;
  private petTimer = 0;

  constructor(mapX: number, mapY: number, areaW: number, areaH: number) {
    this.mapX = mapX;
    this.mapY = mapY;
    this.areaW = areaW;
    this.areaH = areaH;
    this.x = 300 + Math.random() * 300;
    this.y = 200 + Math.random() * 200;
    this.targetX = this.x;
    this.targetY = this.y;

    this.container = new Container();

    // Shadow
    this.shadow = new Graphics();
    this.shadow.ellipse(0, 12, 14, 5);
    this.shadow.fill({ color: 0x000000, alpha: 0.25 });
    this.container.addChild(this.shadow);

    // Heart reaction container (hidden by default)
    this.heartContainer = new Container();
    this.heartContainer.visible = false;
    this.heartContainer.y = -25;

    const heart = new Text({
      text: "\u2764",
      style: { fontSize: 16, fill: 0xff4466 },
    });
    heart.anchor.set(0.5, 0.5);
    this.heartContainer.addChild(heart);
    this.container.addChild(this.heartContainer);

    this.loadSprites();
    this.setPosition(this.x, this.y);
  }

  private async loadSprites() {
    const textures: Texture[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const idx = String(i).padStart(4, "0");
      textures.push(Texture.from(`/sprites/dog/doggo_${idx}.png`));
    }

    this.sprite = new AnimatedSprite(textures);
    this.sprite.anchor.set(0.5, 0.6);
    this.sprite.scale.set(SCALE);
    this.sprite.animationSpeed = 0.08;
    this.sprite.play();
    this.container.addChildAt(this.sprite, 1); // After shadow, before heart
  }

  private pickNewTarget() {
    this.targetX = 80 + Math.random() * (this.areaW - 160);
    this.targetY = 80 + Math.random() * (this.areaH - 160);
    this.pauseTimer = 0;
  }

  /** Call this when the player presses the pet key nearby */
  pet() {
    this.isBeingPet = true;
    this.petTimer = 120; // 2 seconds
    this.heartContainer.visible = true;
    this.heartTimer = 90; // 1.5 seconds
    if (this.sprite) {
      this.sprite.stop();
      this.sprite.currentFrame = 0;
    }
  }

  /** Is the player close enough to interact? */
  isNear(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) < 50;
  }

  update(playerX?: number, playerY?: number) {
    // Heart animation
    if (this.heartTimer > 0) {
      this.heartTimer--;
      this.heartContainer.visible = true;
      this.heartContainer.y = -25 - (90 - this.heartTimer) * 0.15;
      this.heartContainer.alpha = this.heartTimer / 90;
    } else {
      this.heartContainer.visible = false;
    }

    // Being pet - stay still
    if (this.isBeingPet) {
      this.petTimer--;
      if (this.petTimer <= 0) this.isBeingPet = false;
      return;
    }

    // Follow nearby player
    if (playerX !== undefined && playerY !== undefined) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 40) {
        this.targetX = playerX;
        this.targetY = playerY;
        this.speed = FOLLOW_SPEED;
      } else {
        this.speed = WALK_SPEED;
      }
    }

    // Pause (sniffing)
    if (this.pauseTimer > 0) {
      this.pauseTimer--;
      if (this.sprite && this.sprite.playing) {
        this.sprite.stop();
        this.sprite.currentFrame = 0;
      }
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.pauseTimer = 90 + Math.random() * 180;
      this.pickNewTarget();
      return;
    }

    // Move
    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * this.speed;
    this.y += ny * this.speed;

    // Flip sprite direction
    if (this.sprite) {
      this.sprite.scale.x = nx < 0 ? -SCALE : SCALE;
      if (!this.sprite.playing) this.sprite.play();
    }

    this.setPosition(this.x, this.y);
  }

  private setPosition(x: number, y: number) {
    this.container.x = this.mapX + x;
    this.container.y = this.mapY + y;
  }

  addToStage(stage: Container) {
    stage.addChild(this.container);
  }
}
