import { AnimatedSprite, Container, Graphics, Text } from "pixi.js";
import { type CharacterFrames, DIR, type Direction } from "./SpriteLoader";

type PlayerOptions = {
  id: string;
  name: string;
  mapX: number;
  mapY: number;
  x: number;
  y: number;
  isSelf: boolean;
  frames: CharacterFrames;
};

const SELF_COLOR = 0x00d992;
const OTHER_COLOR = 0xfb565b;

export class Player {
  static readonly RADIUS = 16;
  static readonly PROXIMITY_RADIUS = 100;

  id: string;
  name: string;
  x: number;
  y: number;
  readonly radius = Player.RADIUS;
  readonly proximityRadius = Player.PROXIMITY_RADIUS;
  readonly isSelf: boolean;
  sitting = false;

  private mapX: number;
  private mapY: number;
  private container: Container;
  private sprite: AnimatedSprite;
  private frames: CharacterFrames;
  private currentDir: Direction = DIR.DOWN;
  private prevX: number;
  private prevY: number;

  constructor({ id, name, mapX, mapY, x, y, isSelf, frames }: PlayerOptions) {
    this.id = id;
    this.name = name;
    this.mapX = mapX;
    this.mapY = mapY;
    this.x = x;
    this.y = y;
    this.isSelf = isSelf;
    this.prevX = x;
    this.prevY = y;
    this.frames = frames;

    const color = isSelf ? SELF_COLOR : OTHER_COLOR;
    this.container = new Container();

    if (isSelf) {
      const prox = new Graphics();
      prox.circle(0, 0, this.proximityRadius);
      prox.stroke({ width: 1, color, alpha: 0.12 });
      this.container.addChild(prox);
    }

    const shadow = new Graphics();
    shadow.ellipse(0, 10, 14, 5);
    shadow.fill({ color: 0x000000, alpha: 0.35 });
    this.container.addChild(shadow);

    this.sprite = new AnimatedSprite(frames.walk[DIR.DOWN]);
    this.sprite.anchor.set(0.5, 0.7);
    this.sprite.animationSpeed = 0.15;
    this.sprite.scale.set(0.9);
    this.sprite.currentFrame = 0;
    this.container.addChild(this.sprite);

    const label = new Text({
      text: name,
      style: {
        fontSize: 11,
        fontFamily: "Inter, system-ui, sans-serif",
        fill: 0xf2f2f2,
        fontWeight: "600",
        letterSpacing: 0.3,
      },
    });
    label.anchor.set(0.5, 0.5);
    const pw = label.width + 14;
    const ph = label.height + 6;
    const bg = new Graphics();
    bg.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
    bg.fill({ color: 0x101010, alpha: 0.85 });
    bg.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
    bg.stroke({ width: 1, color, alpha: 0.35 });
    const labelGroup = new Container();
    labelGroup.y = -38;
    labelGroup.addChild(bg);
    labelGroup.addChild(label);
    this.container.addChild(labelGroup);

    this.setPosition(x, y);
  }

  sit() {
    this.sitting = true;
    const sitFrames = this.frames.sit[this.currentDir];
    if (sitFrames.length > 0) {
      this.sprite.textures = sitFrames;
      this.sprite.animationSpeed = 0.08;
      this.sprite.loop = false;
      this.sprite.gotoAndPlay(0);
    }
  }

  stand() {
    this.sitting = false;
    this.sprite.textures = this.frames.walk[this.currentDir];
    this.sprite.loop = true;
    this.sprite.animationSpeed = 0.15;
    this.sprite.stop();
    this.sprite.currentFrame = 0;
  }

  update() {
    if (this.sitting) return;

    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    const isMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;

    if (isMoving) {
      let dir: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      } else {
        dir = dy > 0 ? DIR.DOWN : DIR.UP;
      }

      if (dir !== this.currentDir) {
        this.currentDir = dir;
        this.sprite.textures = this.frames.walk[dir];
        this.sprite.loop = true;
        this.sprite.play();
      }
      if (!this.sprite.playing) this.sprite.play();
    } else {
      if (this.sprite.playing) {
        this.sprite.stop();
        this.sprite.currentFrame = 0;
      }
    }

    this.prevX = this.x;
    this.prevY = this.y;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container.x = this.mapX + x;
    this.container.y = this.mapY + y;
  }

  addToStage(stage: Container) {
    stage.addChild(this.container);
  }

  removeFromStage(stage: Container) {
    stage.removeChild(this.container);
  }
}
