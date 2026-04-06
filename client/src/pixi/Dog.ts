import { AnimatedSprite, Container, Graphics, SCALE_MODES, Text, Texture } from "pixi.js";
import { collidesWithObject } from "./WorldObjects";

const WALK_SPEED = 0.4;
const FOLLOW_SPEED = 0.7;
const SCALE = 1.2;
const FW = 32;
const FH = 32;
const GROUND_Y = 12;
const DOG_RADIUS = 12;
const WALK_COLS = 3;
const DOG_ROWS = 4;

// Convert sheet row order -> game direction order [UP, LEFT, DOWN, RIGHT]
// Sheet rows (dog block): 0=front, 1=left, 2=right, 3=back
const DOG_DIR_ROW_MAP = [3, 1, 0, 2] as const;

type DogVariantDef = {
  id: string;
};

// Use one known-good 4-direction LPC sheet and create additional coat variants via palette transforms.
const DOG_SHEET_SRC = "/sprites/dog_lpc/lpccatratdog_0.png";
const DOG_START_COL = 0;
const DOG_START_ROW = 4;
const DOG_VARIANTS: DogVariantDef[] = [
  { id: "brown" },
  { id: "golden" },
  { id: "charcoal" },
  { id: "black" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function recolorFrame(ctx: CanvasRenderingContext2D, variantId: string) {
  if (variantId === "brown") return;

  const img = ctx.getImageData(0, 0, FW, FH);
  const d = img.data;

  let rr = 1;
  let rg = 1;
  let rb = 1;
  if (variantId === "golden") {
    rr = 1.16; rg = 1.09; rb = 0.8;
  } else if (variantId === "charcoal") {
    rr = 0.82; rg = 0.76; rb = 0.72;
  } else if (variantId === "black") {
    rr = 0.58; rg = 0.58; rb = 0.6;
  }

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;

    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const l = (r + g + b) / 3;

    // Preserve outline and highlights/white fur.
    if (l < 40) continue;
    if (r > 185 && g > 170 && b > 145) continue;

    d[i] = clampByte(r * rr);
    d[i + 1] = clampByte(g * rg);
    d[i + 2] = clampByte(b * rb);
  }

  ctx.putImageData(img, 0, 0);
}

function extractDogFrames(img: HTMLImageElement, def: DogVariantDef): Texture[][] {
  const directions: Texture[][] = [];
  for (let dir = 0; dir < DOG_ROWS; dir++) {
    const sheetRow = DOG_DIR_ROW_MAP[dir];
    const frames: Texture[] = [];
    for (let col = 0; col < WALK_COLS; col++) {
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = FW;
      frameCanvas.height = FH;
      const ctx = frameCanvas.getContext("2d");
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        (DOG_START_COL + col) * FW,
        (DOG_START_ROW + sheetRow) * FH,
        FW,
        FH,
        0,
        0,
        FW,
        FH,
      );
      recolorFrame(ctx, def.id);
      const texture = Texture.from(frameCanvas);
      texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      frames.push(texture);
    }
    directions.push(frames);
  }
  return directions;
}

export class Dog {
  x: number;
  y: number;
  private mapX: number;
  private mapY: number;
  private container: Container;
  private sprite: AnimatedSprite | null = null;
  private walkFrames: Texture[][] = [];
  private currentDir = 2; // 0=up,1=left,2=down,3=right
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
  private variantIdx: number;

  constructor(mapX: number, mapY: number, areaW: number, areaH: number, variantIdx?: number) {
    this.mapX = mapX;
    this.mapY = mapY;
    this.areaW = areaW;
    this.areaH = areaH;
    this.x = 300 + Math.random() * 300;
    this.y = 200 + Math.random() * 200;
    this.targetX = this.x;
    this.targetY = this.y;
    this.variantIdx = variantIdx ?? Math.floor(Math.random() * DOG_VARIANTS.length);

    this.container = new Container();

    // Shadow
    this.shadow = new Graphics();
    this.shadow.ellipse(0, GROUND_Y + 2, 12, 4.5);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.container.addChild(this.shadow);

    // Heart reaction container (hidden by default)
    this.heartContainer = new Container();
    this.heartContainer.visible = false;
    this.heartContainer.y = GROUND_Y - 38;

    const heart = new Text({
      text: "\u2764",
      style: { fontSize: 16, fill: 0xff4466 },
    });
    heart.anchor.set(0.5, 0.5);
    this.heartContainer.addChild(heart);
    this.container.addChild(this.heartContainer);

    this.initSprite();
    this.setPosition(this.x, this.y);
  }

  private async initSprite() {
    try {
      const def = DOG_VARIANTS[Math.abs(this.variantIdx) % DOG_VARIANTS.length];
      const img = await loadImage(DOG_SHEET_SRC);
      const walk = extractDogFrames(img, def);
      this.walkFrames = walk;
      const downFrames = walk[2];
      if (!downFrames || downFrames.length === 0) return;

      this.sprite = new AnimatedSprite(downFrames);
      this.sprite.anchor.set(0.5, 1);
      this.sprite.y = GROUND_Y;
      this.sprite.scale.set(SCALE);
      this.sprite.animationSpeed = 0.08;
      this.sprite.play();
      this.container.addChildAt(this.sprite, 1);
    } catch {
      // Keep gameplay functional even if asset loading fails.
    }
  }

  private updateDirection(nx: number, ny: number) {
    if (!this.sprite || this.walkFrames.length < 4) return;

    let nextDir = this.currentDir;
    if (Math.abs(nx) > Math.abs(ny)) {
      nextDir = nx < 0 ? 1 : 3; // left/right
    } else if (Math.abs(ny) > 0.001) {
      nextDir = ny < 0 ? 0 : 2; // up/down
    }

    if (nextDir !== this.currentDir) {
      this.currentDir = nextDir;
      const nextFrames = this.walkFrames[nextDir];
      if (nextFrames && nextFrames.length > 0) {
        this.sprite.textures = nextFrames;
        this.sprite.currentFrame = 0;
      }
    }
  }

  private pickNewTarget() {
    for (let i = 0; i < 20; i++) {
      const tx = 80 + Math.random() * (this.areaW - 160);
      const ty = 80 + Math.random() * (this.areaH - 160);
      if (!collidesWithObject(tx, ty, DOG_RADIUS)) {
        this.targetX = tx;
        this.targetY = ty;
        this.pauseTimer = 0;
        return;
      }
    }
    this.targetX = this.x;
    this.targetY = this.y;
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
      this.heartContainer.y = GROUND_Y - 38 - (90 - this.heartTimer) * 0.15;
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
    const oldX = this.x;
    const oldY = this.y;
    let px = oldX + nx * this.speed;
    let py = oldY + ny * this.speed;

    px = Math.max(DOG_RADIUS, Math.min(px, this.areaW - DOG_RADIUS));
    py = Math.max(DOG_RADIUS, Math.min(py, this.areaH - DOG_RADIUS));

    const alreadyInside = collidesWithObject(this.x, this.y, DOG_RADIUS);
    if (!alreadyInside) {
      if (collidesWithObject(px, this.y, DOG_RADIUS)) px = this.x;
      if (collidesWithObject(this.x, py, DOG_RADIUS)) py = this.y;
      if (collidesWithObject(px, py, DOG_RADIUS)) {
        px = this.x;
        py = this.y;
      }
    }

    this.x = px;
    this.y = py;
    const movedX = this.x - oldX;
    const movedY = this.y - oldY;
    const movedDist = Math.hypot(movedX, movedY);

    if (movedDist < 0.01) {
      if (this.sprite) {
        this.sprite.stop();
        this.sprite.currentFrame = 0;
      }
      this.pickNewTarget();
      return;
    }

    this.updateDirection(movedX, movedY);
    if (this.sprite && !this.sprite.playing) this.sprite.play();

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
