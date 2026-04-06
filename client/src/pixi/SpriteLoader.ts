import { Texture } from "pixi.js";

const WALK_COLS = 9;
const SIT_COLS = 3;
const ROWS = 4;
const FW = 64;
const FH = 64;

/** Row indices in LPC spritesheets */
export const DIR = { UP: 0, LEFT: 1, DOWN: 2, RIGHT: 3 } as const;
export type Direction = (typeof DIR)[keyof typeof DIR];

export type CharacterFrames = {
  walk: Texture[][]; // [direction][frame]
  sit: Texture[][]; // [direction][frame]
};

type Variant = {
  gender: "male" | "female";
  walkLayers: string[];
  sitLayers: string[];
};

const VARIANTS: Variant[] = [
  {
    gender: "male",
    walkLayers: ["body", "head", "legs", "shoes", "torso1", "hair1"],
    sitLayers: ["body_sit", "head_sit", "legs_sit", "shoes_sit", "torso1_sit", "hair1_sit"],
  },
  {
    gender: "male",
    walkLayers: ["body", "head", "legs", "shoes", "torso1", "hair2"],
    sitLayers: ["body_sit", "head_sit", "legs_sit", "shoes_sit", "torso1_sit", "hair2_sit"],
  },
  {
    gender: "female",
    walkLayers: ["body", "head", "legs", "shoes", "torso1", "hair1"],
    sitLayers: ["body_sit", "head_sit", "legs_sit", "shoes_sit", "torso1_sit", "hair1_sit"],
  },
  {
    gender: "female",
    walkLayers: ["body", "head", "legs", "shoes", "torso1", "hair2"],
    sitLayers: ["body_sit", "head_sit", "legs_sit", "shoes_sit", "torso1_sit", "hair2_sit"],
  },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed: ${src}`));
    img.src = src;
  });
}

function extractFrames(canvas: HTMLCanvasElement, cols: number): Texture[][] {
  const directions: Texture[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const frames: Texture[] = [];
    for (let col = 0; col < cols; col++) {
      const fc = document.createElement("canvas");
      fc.width = FW;
      fc.height = FH;
      fc.getContext("2d")!.drawImage(canvas, col * FW, row * FH, FW, FH, 0, 0, FW, FH);
      frames.push(Texture.from(fc));
    }
    directions.push(frames);
  }
  return directions;
}

async function compositeLayers(gender: string, layers: string[]): Promise<HTMLCanvasElement> {
  const images: HTMLImageElement[] = [];
  for (const layer of layers) {
    try {
      const img = await loadImage(`/sprites/${gender}/${layer}.png`);
      if (img.width > 0 && img.height > 0) images.push(img);
    } catch {
      // Skip missing
    }
  }

  const w = images.length > 0 ? images[0].width : FW;
  const h = images.length > 0 ? images[0].height : FH;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  for (const img of images) ctx.drawImage(img, 0, 0);
  return canvas;
}

async function buildVariant(v: Variant): Promise<CharacterFrames> {
  const [walkCanvas, sitCanvas] = await Promise.all([
    compositeLayers(v.gender, v.walkLayers),
    compositeLayers(v.gender, v.sitLayers),
  ]);

  return {
    walk: extractFrames(walkCanvas, WALK_COLS),
    sit: extractFrames(sitCanvas, SIT_COLS),
  };
}

let cache: CharacterFrames[] | null = null;

export async function loadAllVariants(): Promise<CharacterFrames[]> {
  if (cache) return cache;
  cache = await Promise.all(VARIANTS.map(buildVariant));
  return cache;
}

export function pickVariant(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % VARIANTS.length;
}
