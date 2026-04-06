import { Container, Graphics, Text } from "pixi.js";

const BODY_COLOR = 0xc4813d;
const EAR_COLOR = 0x8b5e2a;
const NOSE_COLOR = 0x2a1a0a;

export class Dog {
  x: number;
  y: number;
  private mapX: number;
  private mapY: number;
  private container: Container;
  private bodyGroup: Container;
  private bobPhase = 0;

  // AI movement
  private targetX: number;
  private targetY: number;
  private speed = 0.8;
  private pauseTimer = 0;
  private areaW: number;
  private areaH: number;

  constructor(mapX: number, mapY: number, areaW: number, areaH: number) {
    this.mapX = mapX;
    this.mapY = mapY;
    this.areaW = areaW;
    this.areaH = areaH;
    this.x = 200 + Math.random() * 400;
    this.y = 200 + Math.random() * 300;
    this.targetX = this.x;
    this.targetY = this.y;

    this.container = new Container();
    this.bodyGroup = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 8, 10, 4);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.bodyGroup.addChild(shadow);

    // Body (oval)
    const body = new Graphics();
    body.ellipse(0, 0, 10, 7);
    body.fill(BODY_COLOR);
    body.ellipse(0, 0, 10, 7);
    body.stroke({ width: 1, color: EAR_COLOR, alpha: 0.5 });
    this.bodyGroup.addChild(body);

    // Head
    const head = new Graphics();
    head.circle(8, -3, 6);
    head.fill(BODY_COLOR);
    head.circle(8, -3, 6);
    head.stroke({ width: 1, color: EAR_COLOR, alpha: 0.4 });
    this.bodyGroup.addChild(head);

    // Ears
    const earL = new Graphics();
    earL.ellipse(5, -9, 3, 4);
    earL.fill(EAR_COLOR);
    this.bodyGroup.addChild(earL);

    const earR = new Graphics();
    earR.ellipse(11, -9, 3, 4);
    earR.fill(EAR_COLOR);
    this.bodyGroup.addChild(earR);

    // Eyes
    const eyeL = new Graphics();
    eyeL.circle(6, -4, 1.5);
    eyeL.fill(0xffffff);
    eyeL.circle(6.5, -4, 0.8);
    eyeL.fill(0x101010);
    this.bodyGroup.addChild(eyeL);

    const eyeR = new Graphics();
    eyeR.circle(10, -4, 1.5);
    eyeR.fill(0xffffff);
    eyeR.circle(10.5, -4, 0.8);
    eyeR.fill(0x101010);
    this.bodyGroup.addChild(eyeR);

    // Nose
    const nose = new Graphics();
    nose.circle(13, -2, 1.5);
    nose.fill(NOSE_COLOR);
    this.bodyGroup.addChild(nose);

    // Tail
    const tail = new Graphics();
    tail.moveTo(-10, -2);
    tail.quadraticCurveTo(-16, -10, -12, -14);
    tail.stroke({ width: 2.5, color: BODY_COLOR });
    this.bodyGroup.addChild(tail);

    // Name
    const label = new Text({
      text: "Buddy",
      style: {
        fontSize: 9,
        fontFamily: "Rajdhani, system-ui, sans-serif",
        fill: 0xc4813d,
        fontWeight: "600",
      },
    });
    label.anchor.set(0.5, 0.5);
    label.y = -18;
    this.bodyGroup.addChild(label);

    this.container.addChild(this.bodyGroup);
    this.setPosition(this.x, this.y);
  }

  private pickNewTarget() {
    this.targetX = 80 + Math.random() * (this.areaW - 160);
    this.targetY = 80 + Math.random() * (this.areaH - 160);
    this.pauseTimer = 0;
  }

  update(playerX?: number, playerY?: number) {
    // If a player is nearby, follow them
    if (playerX !== undefined && playerY !== undefined) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 30) {
        this.targetX = playerX;
        this.targetY = playerY;
        this.speed = 1.2;
      } else {
        this.speed = 0.8;
      }
    }

    // Pause occasionally (dog sniffing around)
    if (this.pauseTimer > 0) {
      this.pauseTimer -= 1;
      // Gentle idle bob
      this.bobPhase += 0.02;
      this.bodyGroup.y = Math.sin(this.bobPhase) * 0.5;
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Reached target — pause then pick new one
      this.pauseTimer = 60 + Math.random() * 120; // 1-3 seconds at 60fps
      this.pickNewTarget();
      return;
    }

    // Move toward target
    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * this.speed;
    this.y += ny * this.speed;

    // Flip direction
    this.bodyGroup.scale.x = nx < 0 ? -1 : 1;

    // Walk bob
    this.bobPhase += 0.15;
    this.bodyGroup.y = Math.sin(this.bobPhase) * 2;

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
