import { Container, Graphics, Text } from "pixi.js";

export type ObjectDef = {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  label?: string;
};

const C = {
  wall: 0x2a2a35,
  wallStroke: 0x3d3a39,
  tableTop: 0x5a4a38,
  tableLeg: 0x3d3228,
  chairSeat: 0x3a4a5a,
  sofa: 0x4a3050,
  sofaCushion: 0x5a3a60,
  desk: 0x4a4035,
  monitor: 0x1a2a3a,
  monitorScreen: 0x2563eb,
  plant: 0x1a6040,
  plantPot: 0x5a4a3a,
  plantLeaf: 0x2a8a50,
  bookshelf: 0x4a3a28,
  books: [0xfb565b, 0x818cf8, 0x00d992, 0xf59e0b, 0x38bdf8],
  rug: 0x2a2040,
  rugBorder: 0x3a3050,
  label: 0x8b949e,
};

/** All sittable object types */
const SITTABLE = new Set(["chair", "sofa"]);

export const OBJECTS: ObjectDef[] = [
  // ─── Outer walls ───
  { x: 0, y: 0, w: 1100, h: 8, type: "wall" },
  { x: 0, y: 612, w: 1100, h: 8, type: "wall" },
  { x: 0, y: 0, w: 8, h: 620, type: "wall" },
  { x: 1092, y: 0, w: 8, h: 620, type: "wall" },

  // ─── Room dividers ───
  { x: 380, y: 0, w: 6, h: 180, type: "wall" },
  { x: 380, y: 280, w: 6, h: 340, type: "wall" },
  { x: 700, y: 0, w: 6, h: 140, type: "wall" },
  { x: 700, y: 200, w: 6, h: 420, type: "wall" },

  // ─── Left - Lounge ───
  { x: 50, y: 50, w: 150, h: 130, type: "rug" },
  { x: 40, y: 40, w: 120, h: 36, type: "sofa" },
  { x: 40, y: 40, w: 36, h: 100, type: "sofa" },
  { x: 100, y: 100, w: 60, h: 35, type: "table" },
  { x: 300, y: 30, w: 22, h: 22, type: "plant" },

  { x: 50, y: 250, w: 32, h: 32, type: "chair" },
  { x: 100, y: 250, w: 32, h: 32, type: "chair" },
  { x: 60, y: 300, w: 80, h: 36, type: "table" },

  { x: 15, y: 400, w: 28, h: 180, type: "bookshelf" },
  { x: 15, y: 200, w: 22, h: 22, type: "plant" },

  // ─── Middle - Open workspace ───
  { x: 420, y: 50, w: 80, h: 36, type: "desk", label: "Desk" },
  { x: 520, y: 50, w: 80, h: 36, type: "desk" },
  { x: 620, y: 50, w: 50, h: 36, type: "desk" },
  { x: 440, y: 96, w: 24, h: 24, type: "chair" },
  { x: 545, y: 96, w: 24, h: 24, type: "chair" },
  { x: 630, y: 96, w: 24, h: 24, type: "chair" },

  { x: 420, y: 155, w: 80, h: 36, type: "desk" },
  { x: 520, y: 155, w: 80, h: 36, type: "desk" },
  { x: 440, y: 200, w: 24, h: 24, type: "chair" },
  { x: 545, y: 200, w: 24, h: 24, type: "chair" },

  { x: 440, y: 330, w: 180, h: 70, type: "table", label: "Shared Table" },
  { x: 460, y: 410, w: 24, h: 24, type: "chair" },
  { x: 530, y: 410, w: 24, h: 24, type: "chair" },
  { x: 590, y: 410, w: 24, h: 24, type: "chair" },
  { x: 460, y: 300, w: 24, h: 24, type: "chair" },
  { x: 530, y: 300, w: 24, h: 24, type: "chair" },
  { x: 590, y: 300, w: 24, h: 24, type: "chair" },

  { x: 660, y: 280, w: 22, h: 22, type: "plant" },
  { x: 400, y: 500, w: 22, h: 22, type: "plant" },

  // ─── Right - Conference ───
  { x: 780, y: 280, w: 200, h: 80, type: "table", label: "Conference" },
  { x: 800, y: 250, w: 24, h: 24, type: "chair" },
  { x: 870, y: 250, w: 24, h: 24, type: "chair" },
  { x: 940, y: 250, w: 24, h: 24, type: "chair" },
  { x: 800, y: 370, w: 24, h: 24, type: "chair" },
  { x: 870, y: 370, w: 24, h: 24, type: "chair" },
  { x: 940, y: 370, w: 24, h: 24, type: "chair" },
  { x: 1040, y: 260, w: 36, h: 100, type: "bookshelf" },

  { x: 760, y: 500, w: 100, h: 36, type: "sofa" },
  { x: 780, y: 460, w: 60, h: 30, type: "table" },
  { x: 730, y: 220, w: 22, h: 22, type: "plant" },
  { x: 1050, y: 440, w: 22, h: 22, type: "plant" },

  // ─── Bottom - Café ───
  { x: 200, y: 500, w: 45, h: 45, type: "table" },
  { x: 185, y: 555, w: 24, h: 24, type: "chair" },
  { x: 235, y: 555, w: 24, h: 24, type: "chair" },

  { x: 310, y: 520, w: 45, h: 45, type: "table" },
  { x: 295, y: 575, w: 24, h: 24, type: "chair" },
  { x: 345, y: 575, w: 24, h: 24, type: "chair" },

  { x: 130, y: 570, w: 22, h: 22, type: "plant" },
];

function drawObject(g: Graphics, o: ObjectDef) {
  switch (o.type) {
    case "wall":
      g.rect(o.x, o.y, o.w, o.h);
      g.fill(C.wall);
      g.rect(o.x, o.y, o.w, o.h);
      g.stroke({ width: 1, color: C.wallStroke, alpha: 0.6 });
      break;
    case "table":
      g.rect(o.x + 2, o.y + 2, o.w, o.h);
      g.fill({ color: 0x000000, alpha: 0.25 });
      g.roundRect(o.x, o.y, o.w, o.h, 4);
      g.fill(C.tableTop);
      g.roundRect(o.x, o.y, o.w, o.h, 4);
      g.stroke({ width: 1, color: C.tableLeg, alpha: 0.8 });
      break;
    case "chair":
      g.roundRect(o.x, o.y, o.w, o.h, 6);
      g.fill(C.chairSeat);
      g.roundRect(o.x, o.y, o.w, o.h, 6);
      g.stroke({ width: 1, color: 0x4a5a6a, alpha: 0.5 });
      break;
    case "sofa":
      g.rect(o.x + 2, o.y + 2, o.w, o.h);
      g.fill({ color: 0x000000, alpha: 0.2 });
      g.roundRect(o.x, o.y, o.w, o.h, 6);
      g.fill(C.sofa);
      g.roundRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8, 4);
      g.fill(C.sofaCushion);
      g.roundRect(o.x, o.y, o.w, o.h, 6);
      g.stroke({ width: 1, color: 0x5a4060, alpha: 0.6 });
      break;
    case "desk":
      g.rect(o.x + 2, o.y + 2, o.w, o.h);
      g.fill({ color: 0x000000, alpha: 0.2 });
      g.roundRect(o.x, o.y, o.w, o.h, 3);
      g.fill(C.desk);
      g.roundRect(o.x, o.y, o.w, o.h, 3);
      g.stroke({ width: 1, color: 0x5a5045, alpha: 0.5 });
      g.roundRect(o.x + o.w / 2 - 12, o.y + 6, 24, 16, 2);
      g.fill(C.monitor);
      g.roundRect(o.x + o.w / 2 - 10, o.y + 8, 20, 12, 1);
      g.fill({ color: C.monitorScreen, alpha: 0.3 });
      break;
    case "plant":
      g.roundRect(o.x + o.w / 4, o.y + o.h / 2, o.w / 2, o.h / 2, 2);
      g.fill(C.plantPot);
      g.circle(o.x + o.w / 2, o.y + o.h / 3, o.w / 3);
      g.fill(C.plantLeaf);
      g.circle(o.x + o.w / 3, o.y + o.h / 2.5, o.w / 4);
      g.fill(C.plant);
      g.circle(o.x + o.w * 0.65, o.y + o.h / 2.5, o.w / 4);
      g.fill({ color: C.plantLeaf, alpha: 0.8 });
      break;
    case "bookshelf":
      g.rect(o.x + 2, o.y + 2, o.w, o.h);
      g.fill({ color: 0x000000, alpha: 0.2 });
      g.rect(o.x, o.y, o.w, o.h);
      g.fill(C.bookshelf);
      g.rect(o.x, o.y, o.w, o.h);
      g.stroke({ width: 1, color: 0x5a4a38, alpha: 0.6 });
      for (let i = 0; i < Math.floor(o.h / 20); i++) {
        const bw = 6 + Math.random() * 4;
        const bx = o.x + 3 + ((i * 11) % (o.w - 10));
        const by = o.y + 3 + i * 20;
        if (by + 14 < o.y + o.h) {
          g.rect(bx, by, bw, 14);
          g.fill(C.books[i % C.books.length]);
        }
      }
      break;
    case "rug":
      g.roundRect(o.x, o.y, o.w, o.h, 8);
      g.fill({ color: C.rug, alpha: 0.4 });
      g.roundRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12, 6);
      g.stroke({ width: 1, color: C.rugBorder, alpha: 0.3 });
      break;
  }
}

export function renderObjects(stage: Container, mapX: number, mapY: number) {
  const rugs = new Graphics();
  rugs.x = mapX;
  rugs.y = mapY;
  for (const o of OBJECTS) if (o.type === "rug") drawObject(rugs, o);
  stage.addChild(rugs);

  const furniture = new Graphics();
  furniture.x = mapX;
  furniture.y = mapY;
  for (const o of OBJECTS) if (o.type !== "rug") drawObject(furniture, o);
  stage.addChild(furniture);

  for (const o of OBJECTS) {
    if (o.label) {
      const label = new Text({
        text: o.label,
        style: { fontSize: 9, fontFamily: "Inter, system-ui, sans-serif", fill: C.label, fontWeight: "500" },
      });
      label.anchor.set(0.5, 0.5);
      label.x = mapX + o.x + o.w / 2;
      label.y = mapY + o.y + o.h / 2;
      stage.addChild(label);
    }
  }
}

/** Circle vs AABB collision */
export function collidesWithObject(px: number, py: number, radius: number): boolean {
  for (const o of OBJECTS) {
    if (o.type === "rug") continue;
    const cx = Math.max(o.x, Math.min(px, o.x + o.w));
    const cy = Math.max(o.y, Math.min(py, o.y + o.h));
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

/** Find nearest sittable object within range */
export function findNearbySeat(px: number, py: number, range: number): ObjectDef | null {
  let best: ObjectDef | null = null;
  let bestDist = range;

  for (const o of OBJECTS) {
    if (!SITTABLE.has(o.type)) continue;
    const ocx = o.x + o.w / 2;
    const ocy = o.y + o.h / 2;
    const dx = px - ocx;
    const dy = py - ocy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = o;
    }
  }
  return best;
}
