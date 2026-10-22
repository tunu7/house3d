import * as THREE from "three";

/**
 * Procedural textures drawn to canvases — no image downloads. Each texture
 * covers `metres` × `metres` of surface; meshes use world-scaled UVs
 * (1 UV unit = 1 m), so `repeat = 1 / metres`. Each colour map gets a
 * matching normal map derived from the same drawing, so grout, joints, grain
 * and render texture catch the light.
 */

const SIZE = 512;

/** Deterministic PRNG so textures look the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Draw = (ctx: CanvasRenderingContext2D, rand: () => number) => void;

function drawCanvas(draw: Draw, seed: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  draw(ctx, rng(seed));
  return canvas;
}

function toTexture(source: HTMLCanvasElement, metres: number, srgb: boolean): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(source);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / metres, 1 / metres);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Tangent-space normal map from a canvas's luminance (bright = raised),
 * using wrapped central differences so it tiles seamlessly.
 */
function normalFromHeight(source: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const src = source.getContext("2d")!.getImageData(0, 0, SIZE, SIZE).data;
  const h = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < h.length; i++) h[i] = (0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2]) / 255;
  const out = document.createElement("canvas");
  out.width = out.height = SIZE;
  const ctx = out.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);
  const at = (x: number, y: number) => h[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * SIZE + x) * 4;
      img.data[o] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[o + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[o + 2] = (1 / len) * 255;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** Colour map plus derived normal map for one surface. */
function surface(draw: Draw, seed: number, metres: number, bump: number) {
  const canvas = drawCanvas(draw, seed);
  return { map: toTexture(canvas, metres, true), normalMap: toTexture(normalFromHeight(canvas, bump), metres, false) };
}

const shade = (hex: string, amount: number) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
};

/** Soft, low-frequency mottling: many faint overlapping blotches. */
function mottle(ctx: CanvasRenderingContext2D, rand: () => number, count: number, alpha: number, light: string, dark: string) {
  for (let i = 0; i < count; i++) {
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    const r = 20 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = rand() > 0.5 ? light : dark;
    g.addColorStop(0, `rgba(${c},${alpha})`);
    g.addColorStop(1, `rgba(${c},0)`);
    // Draw wrapped copies so the texture tiles.
    for (const ox of [-SIZE, 0, SIZE]) {
      for (const oy of [-SIZE, 0, SIZE]) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
        ctx.restore();
      }
    }
  }
}

/** Fine speckle grain. */
function grain(ctx: CanvasRenderingContext2D, rand: () => number, count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const s = 1 + rand() * 1.5;
    ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "0,0,0"},${rand() * alpha})`;
    ctx.fillRect(rand() * SIZE, rand() * SIZE, s, s);
  }
}

/** Near-white render with gentle trowel mottling (tinted by the material colour). */
function plaster(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#f4f2ee";
  ctx.fillRect(0, 0, SIZE, SIZE);
  mottle(ctx, rand, 140, 0.06, "255,255,255", "150,145,135");
  grain(ctx, rand, 9000, 0.07);
}

/** Pale broom-finished concrete with saw-cut joints. */
function concrete(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#d6d1c7";
  ctx.fillRect(0, 0, SIZE, SIZE);
  mottle(ctx, rand, 90, 0.08, "255,255,255", "120,112,100");
  grain(ctx, rand, 14000, 0.12);
  ctx.fillStyle = "rgba(70,65,58,0.55)";
  ctx.fillRect(0, 0, SIZE, 2);
  ctx.fillRect(0, 0, 2, SIZE);
}

/** Lawn: layered greens with short blade strokes. */
function grass(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#6f9450";
  ctx.fillRect(0, 0, SIZE, SIZE);
  mottle(ctx, rand, 120, 0.12, "150,190,100", "40,70,30");
  for (let i = 0; i < 16000; i++) {
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    ctx.strokeStyle = `rgba(${rand() > 0.5 ? "170,205,120" : "45,80,35"},${0.25 + rand() * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 3, y - 3 - rand() * 5);
    ctx.stroke();
  }
}

/** Oak planks, 8 boards across 1.6 m, staggered joints and faint grain. */
function wood(ctx: CanvasRenderingContext2D, rand: () => number) {
  const boards = 8;
  const bw = SIZE / boards;
  for (let i = 0; i < boards; i++) {
    let y = -rand() * SIZE;
    while (y < SIZE) {
      const len = SIZE * (0.45 + rand() * 0.5);
      ctx.fillStyle = shade("#b48a5f", (rand() - 0.5) * 0.08);
      ctx.fillRect(i * bw, y, bw, len);
      ctx.strokeStyle = "rgba(60,35,15,0.12)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 7; g++) {
        const gx = i * bw + 4 + rand() * (bw - 8);
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.bezierCurveTo(gx + 3, y + len / 3, gx - 3, y + (2 * len) / 3, gx, y + len);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(40,22,10,0.55)";
      ctx.fillRect(i * bw, y, bw, 2);
      y += len;
    }
    ctx.fillStyle = "rgba(40,22,10,0.55)";
    ctx.fillRect(i * bw, 0, 2, SIZE);
  }
}

/** Square tiles with recessed grout; `n` tiles per side, slight per-tile variation. */
function tiles(base: string, n: number, grout: string, variation: number, veins = false): Draw {
  return (ctx, rand) => {
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, SIZE, SIZE);
    const t = SIZE / n;
    const g = Math.max(1.5, SIZE / 220);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * variation);
        ctx.fillRect(i * t + g, j * t + g, t - 2 * g, t - 2 * g);
        if (veins) {
          for (let v = 0; v < 2; v++) {
            ctx.strokeStyle = `rgba(120,110,100,${0.08 + rand() * 0.08})`;
            ctx.lineWidth = 1 + rand();
            ctx.beginPath();
            ctx.moveTo(i * t + rand() * t, j * t);
            ctx.bezierCurveTo(i * t + rand() * t, j * t + t / 3, i * t + rand() * t, j * t + (2 * t) / 3, i * t + rand() * t, j * t + t);
            ctx.stroke();
          }
        }
      }
    }
  };
}

/** Honed dark stone: mottled charcoal with fine speckle and coursing joints. */
function stone(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#4b4a48";
  ctx.fillRect(0, 0, SIZE, SIZE);
  mottle(ctx, rand, 80, 0.1, "120,118,112", "20,20,20");
  grain(ctx, rand, 8000, 0.12);
  ctx.fillStyle = "rgba(18,18,18,0.7)";
  for (let y = 0; y < SIZE; y += SIZE / 4) ctx.fillRect(0, y, SIZE, 2);
  for (let r = 0; r < 4; r++) {
    const off = (r % 2) * (SIZE / 4);
    for (let x = off; x < SIZE + off; x += SIZE / 2) ctx.fillRect(x % SIZE, (r * SIZE) / 4, 2, SIZE / 4);
  }
}

/** Vertical teak cladding boards with fine grain and shadow gaps. */
function cladding(ctx: CanvasRenderingContext2D, rand: () => number) {
  const boards = 6;
  const bw = SIZE / boards;
  for (let i = 0; i < boards; i++) {
    ctx.fillStyle = shade("#a8693a", (rand() - 0.5) * 0.06);
    ctx.fillRect(i * bw, 0, bw, SIZE);
    for (let g = 0; g < 9; g++) {
      ctx.strokeStyle = `rgba(60,30,10,${0.08 + rand() * 0.1})`;
      const gx = i * bw + 3 + rand() * (bw - 6);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 2, SIZE / 3, gx - 2, (2 * SIZE) / 3, gx, SIZE);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(30,15,5,0.7)";
    ctx.fillRect(i * bw, 0, 3, SIZE);
  }
}

export type FloorFinish = "wood" | "marble" | "kitchenTile" | "bathTile" | "splashTile";
export type FacadeFinish = "stone" | "cladding";
export type SurfaceFinish = "exteriorPlaster" | "interiorPlaster" | "concrete" | "grass";

let floorCache: Record<FloorFinish, THREE.MeshStandardMaterial> | null = null;
let facadeCache: Record<FacadeFinish, THREE.MeshStandardMaterial> | null = null;
let surfaceCache: Record<SurfaceFinish, ReturnType<typeof surface>> | null = null;

/** Floor materials, created on first use (requires a DOM). */
export function floorMaterials(): Record<FloorFinish, THREE.MeshStandardMaterial> {
  floorCache ??= {
    wood: new THREE.MeshStandardMaterial({ ...surface(wood, 11, 1.6, 2.5), roughness: 0.55 }),
    marble: new THREE.MeshStandardMaterial({ ...surface(tiles("#ece6dc", 2, "#cfc8bc", 0.03, true), 23, 1.6, 4), roughness: 0.22 }),
    kitchenTile: new THREE.MeshStandardMaterial({ ...surface(tiles("#d8d0c4", 2, "#a9a196", 0.05), 37, 1.2, 4), roughness: 0.45 }),
    bathTile: new THREE.MeshStandardMaterial({ ...surface(tiles("#c9ced1", 3, "#9ea4a8", 0.05), 41, 0.9, 4), roughness: 0.35 }),
    // Small glazed wall tiles (10 cm) for the kitchen backsplash.
    splashTile: new THREE.MeshStandardMaterial({ ...surface(tiles("#efe8dc", 6, "#cfc6b8", 0.06), 43, 0.6, 4), roughness: 0.15 }),
  };
  return floorCache;
}

/** Facade materials from the owner's reference photo (R9), created on first use. */
export function facadeMaterials(): Record<FacadeFinish, THREE.MeshStandardMaterial> {
  facadeCache ??= {
    stone: new THREE.MeshStandardMaterial({ ...surface(stone, 53, 1, 3), roughness: 0.7 }),
    cladding: new THREE.MeshStandardMaterial({ ...surface(cladding, 61, 1, 2.5), roughness: 0.5 }),
  };
  return facadeCache;
}

/** Texture sets for render, concrete and lawn, applied to shared materials at runtime. */
export function surfaceTextures(): Record<SurfaceFinish, ReturnType<typeof surface>> {
  surfaceCache ??= {
    exteriorPlaster: surface(plaster, 71, 2, 1.2),
    interiorPlaster: surface(plaster, 73, 1.5, 0.6),
    concrete: surface(concrete, 79, 1, 1.5),
    grass: surface(grass, 83, 2, 2),
  };
  return surfaceCache;
}
