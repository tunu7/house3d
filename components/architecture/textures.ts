import * as THREE from "three";

/**
 * Procedural floor textures drawn to canvases — no image downloads.
 * Each texture covers `metres` × `metres` of floor; meshes use world-scaled
 * UVs (1 UV unit = 1 m), so `repeat = 1 / metres`.
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

function canvasTexture(metres: number, draw: (ctx: CanvasRenderingContext2D, rand: () => number) => void, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  draw(ctx, rng(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / metres, 1 / metres);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const shade = (hex: string, amount: number) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
};

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
      ctx.strokeStyle = "rgba(60,35,15,0.10)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const gx = i * bw + 4 + rand() * (bw - 8);
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.bezierCurveTo(gx + 3, y + len / 3, gx - 3, y + (2 * len) / 3, gx, y + len);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(50,30,15,0.35)";
      ctx.fillRect(i * bw, y, bw, 2);
      y += len;
    }
    ctx.fillStyle = "rgba(50,30,15,0.35)";
    ctx.fillRect(i * bw, 0, 2, SIZE);
  }
}

/** Square tiles with grout; `n` tiles per side, slight per-tile variation. */
function tiles(base: string, n: number, grout: string, variation: number, veins = false) {
  return (ctx: CanvasRenderingContext2D, rand: () => number) => {
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, SIZE, SIZE);
    const t = SIZE / n;
    const g = Math.max(1, Math.round(SIZE / 256));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * variation);
        ctx.fillRect(i * t + g, j * t + g, t - 2 * g, t - 2 * g);
        if (veins) {
          ctx.strokeStyle = "rgba(120,110,100,0.12)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(i * t + rand() * t, j * t);
          ctx.quadraticCurveTo(i * t + rand() * t, j * t + t / 2, i * t + rand() * t, j * t + t);
          ctx.stroke();
        }
      }
    }
  };
}

export type FloorFinish = "wood" | "marble" | "kitchenTile" | "bathTile";

let cache: Record<FloorFinish, THREE.MeshStandardMaterial> | null = null;

/** Floor materials, created on first use (requires a DOM). */
export function floorMaterials(): Record<FloorFinish, THREE.MeshStandardMaterial> {
  cache ??= {
    wood: new THREE.MeshStandardMaterial({ map: canvasTexture(1.6, wood, 11), roughness: 0.6 }),
    marble: new THREE.MeshStandardMaterial({
      map: canvasTexture(1.6, tiles("#ece6dc", 2, "#cfc8bc", 0.03, true), 23),
      roughness: 0.3,
    }),
    kitchenTile: new THREE.MeshStandardMaterial({
      map: canvasTexture(1.2, tiles("#d8d0c4", 2, "#a9a196", 0.05), 37),
      roughness: 0.5,
    }),
    bathTile: new THREE.MeshStandardMaterial({
      map: canvasTexture(0.9, tiles("#c9ced1", 3, "#9ea4a8", 0.05), 41),
      roughness: 0.4,
    }),
  };
  return cache;
}

/** Honed dark stone: mottled charcoal with fine speckle and faint coursing joints. */
function stone(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#4b4a48";
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 2600; i++) {
    const r = 1 + rand() * 3;
    ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + rand() * 0.08})`;
    ctx.fillRect(rand() * SIZE, rand() * SIZE, r, r);
  }
  ctx.strokeStyle = "rgba(20,20,20,0.35)";
  ctx.lineWidth = 2;
  for (let y = SIZE / 4; y < SIZE; y += SIZE / 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }
}

/** Vertical teak cladding boards with fine grain. */
function cladding(ctx: CanvasRenderingContext2D, rand: () => number) {
  const boards = 6;
  const bw = SIZE / boards;
  for (let i = 0; i < boards; i++) {
    ctx.fillStyle = shade("#a8693a", (rand() - 0.5) * 0.06);
    ctx.fillRect(i * bw, 0, bw, SIZE);
    ctx.strokeStyle = "rgba(60,30,10,0.12)";
    for (let g = 0; g < 8; g++) {
      const gx = i * bw + 3 + rand() * (bw - 6);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 2, SIZE / 3, gx - 2, (2 * SIZE) / 3, gx, SIZE);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(40,20,5,0.4)";
    ctx.fillRect(i * bw, 0, 2, SIZE);
  }
}

export type FacadeFinish = "stone" | "cladding";

let facadeCache: Record<FacadeFinish, THREE.MeshStandardMaterial> | null = null;

/** Facade materials from the owner's reference photo (R9), created on first use. */
export function facadeMaterials(): Record<FacadeFinish, THREE.MeshStandardMaterial> {
  if (!facadeCache) {
    const stoneMap = canvasTexture(1, stone, 53);
    stoneMap.repeat.set(1, 1);
    const cladMap = canvasTexture(1, cladding, 61);
    cladMap.repeat.set(1, 1);
    facadeCache = {
      stone: new THREE.MeshStandardMaterial({ map: stoneMap, roughness: 0.75 }),
      cladding: new THREE.MeshStandardMaterial({ map: cladMap, roughness: 0.55 }),
    };
  }
  return facadeCache;
}
