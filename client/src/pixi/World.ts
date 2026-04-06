import { Container, Graphics } from "pixi.js";
import { renderObjects } from "./WorldObjects";

const FLOOR_COLOR = 0x0c1018;
const GRID_COLOR = 0x1a2233;
const BORDER_COLOR = 0x00d992;
const GRID_SPACING = 40;

export class World {
  constructor(
    private mapX: number,
    private mapY: number,
    private width: number,
    private height: number,
  ) {}

  addToStage(stage: Container) {
    // Floor
    const floor = new Graphics();
    floor.rect(this.mapX, this.mapY, this.width, this.height);
    floor.fill(FLOOR_COLOR);
    stage.addChild(floor);

    // Grid lines
    const grid = new Graphics();
    for (let x = 0; x <= this.width; x += GRID_SPACING) {
      grid.moveTo(this.mapX + x, this.mapY);
      grid.lineTo(this.mapX + x, this.mapY + this.height);
      grid.stroke({ width: 1, color: GRID_COLOR, alpha: 0.3 });
    }
    for (let y = 0; y <= this.height; y += GRID_SPACING) {
      grid.moveTo(this.mapX, this.mapY + y);
      grid.lineTo(this.mapX + this.width, this.mapY + y);
      grid.stroke({ width: 1, color: GRID_COLOR, alpha: 0.3 });
    }
    stage.addChild(grid);

    // Environment objects (tables, chairs, walls, plants, etc.)
    renderObjects(stage, this.mapX, this.mapY);

    // Outer border
    const border = new Graphics();
    border.rect(this.mapX, this.mapY, this.width, this.height);
    border.stroke({ width: 1.5, color: BORDER_COLOR, alpha: 0.25 });
    stage.addChild(border);
  }
}
