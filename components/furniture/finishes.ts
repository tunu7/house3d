import * as THREE from "three";
import { grain, mottle, SIZE, surface, type Draw } from "@/components/architecture/textures";

/**
 * Procedural finishes for furniture: wood grain, woven fabric, rug pile,
 * engineered stone and brushed metal. Drawn in neutral greys so the material
 * colour (from `FURNITURE_COLORS` in lib/style/theme.ts) supplies the hue.
 * Furniture is baked with box-projected UVs in metres (see MergeStatic), so
 * `metres` is the real-world size of one texture repeat.
 */

/** Draws a vertical stroke and its wrapped copies so the texture tiles across the seam. */
function wrappedStroke(ctx: CanvasRenderingContext2D, x0: number, path: (x: number) => void) {
  for (const ox of [-SIZE, 0, SIZE]) {
    if (x0 + ox < -40 || x0 + ox > SIZE + 40) continue;
    ctx.beginPath();
    path(x0 + ox);
    ctx.stroke();
  }
}

/**
 * Plain-sawn timber: long wavy fibres running vertically, broad latewood
 * bands, and fine pores. Wave frequencies are whole numbers so it tiles.
 */
function woodGrain(contrast: number): Draw {
  return (ctx, rand) => {
    ctx.fillStyle = "#e6e6e6";
    ctx.fillRect(0, 0, SIZE, SIZE);
    mottle(ctx, rand, 30, 0.05, "255,255,255", "90,90,90");
    const fibre = (count: number, width: [number, number], alpha: [number, number]) => {
      for (let i = 0; i < count; i++) {
        const x0 = rand() * SIZE;
        const amp = 2 + rand() * 10;
        const freq = 1 + Math.floor(rand() * 3);
        const phase = rand() * Math.PI * 2;
        ctx.strokeStyle = `rgba(40,40,40,${(alpha[0] + rand() * (alpha[1] - alpha[0])) * contrast})`;
        ctx.lineWidth = width[0] + rand() * (width[1] - width[0]);
        wrappedStroke(ctx, x0, (x) => {
          for (let y = 0; y <= SIZE; y += 8) {
            const px = x + Math.sin((y / SIZE) * Math.PI * 2 * freq + phase) * amp;
            if (y === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
        });
      }
    };
    fibre(24, [6, 18], [0.03, 0.08]); // latewood bands
    fibre(320, [0.5, 1.6], [0.05, 0.18]); // fibres
    // Pores: short dark dashes along the grain.
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(30,30,30,${0.1 * contrast + rand() * 0.15 * contrast})`;
      ctx.fillRect(rand() * SIZE, rand() * SIZE, 1, 2 + rand() * 5);
    }
  };
}

/** Plain-woven upholstery: warp and weft threads with slubs (thicker, irregular threads). */
function weave(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#dedede";
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let y = 0; y < SIZE; y += 2) {
    ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "60,60,60"},${0.05 + rand() * 0.12})`;
    ctx.fillRect(0, y, SIZE, 1);
  }
  for (let x = 0; x < SIZE; x += 2) {
    ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "60,60,60"},${0.05 + rand() * 0.12})`;
    ctx.fillRect(x, 0, 1, SIZE);
  }
  // Slubs.
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "70,70,70"},${0.12 + rand() * 0.15})`;
    const horizontal = rand() > 0.5;
    const len = 6 + rand() * 30;
    ctx.fillRect(rand() * SIZE, rand() * SIZE, horizontal ? len : 1.5, horizontal ? 1.5 : len);
  }
  mottle(ctx, rand, 40, 0.05, "255,255,255", "80,80,80");
}

/** Cut-pile rug: dense random tufts with soft mottling. */
function pile(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#d4d4d4";
  ctx.fillRect(0, 0, SIZE, SIZE);
  mottle(ctx, rand, 60, 0.04, "255,255,255", "110,110,110");
  for (let i = 0; i < 30000; i++) {
    const v = rand() > 0.5 ? 255 : 90;
    ctx.fillStyle = `rgba(${v},${v},${v},${rand() * 0.16})`;
    ctx.beginPath();
    ctx.arc(rand() * SIZE, rand() * SIZE, 0.8 + rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Engineered stone (quartz): fine light and dark aggregate with faint cloudy veins. */
function quartz(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#cfcfcf";
  ctx.fillRect(0, 0, SIZE, SIZE);
  mottle(ctx, rand, 70, 0.08, "255,255,255", "60,60,60");
  grain(ctx, rand, 22000, 0.35);
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + rand() * 0.08})`;
    ctx.lineWidth = 2 + rand() * 6;
    ctx.beginPath();
    const y = rand() * SIZE;
    ctx.moveTo(-20, y);
    ctx.bezierCurveTo(SIZE / 3, y + (rand() - 0.5) * 200, (2 * SIZE) / 3, y + (rand() - 0.5) * 200, SIZE + 20, y + (rand() - 0.5) * 80);
    ctx.stroke();
  }
}

/** Brushed metal: fine horizontal streaks. */
function brushed(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 1400; i++) {
    const v = rand() > 0.5 ? 255 : 120;
    ctx.fillStyle = `rgba(${v},${v},${v},${rand() * 0.18})`;
    ctx.fillRect(rand() * SIZE - 100, rand() * SIZE, 60 + rand() * 300, 1);
  }
}

/** Abstract painting: soft layered brush fields for the framed artworks. */
function painting(ctx: CanvasRenderingContext2D, rand: () => number) {
  const palette = ["#d9cbb3", "#b46a45", "#7d8a64", "#c9a259", "#3e4a52", "#efe7da"];
  ctx.fillStyle = palette[5];
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.45;
    ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    ctx.beginPath();
    ctx.ellipse(x, y, 20 + rand() * 110, 8 + rand() * 50, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  grain(ctx, rand, 12000, 0.12);
}

export type FurnitureFinish = "oak" | "walnut" | "fabric" | "rug" | "stone" | "steel" | "painting";

let cache: Record<FurnitureFinish, ReturnType<typeof surface>> | null = null;

/** Texture sets for the furniture materials, created on first use (requires a DOM). */
export function furnitureTextures(): Record<FurnitureFinish, ReturnType<typeof surface>> {
  cache ??= {
    oak: surface(woodGrain(1), 211, 0.8, 1.5),
    walnut: surface(woodGrain(1.4), 223, 0.8, 1.5),
    fabric: surface(weave, 227, 0.12, 2.5),
    rug: surface(pile, 229, 0.6, 3),
    stone: surface(quartz, 233, 0.8, 0.6),
    steel: surface(brushed, 239, 0.4, 0.4),
    painting: surface(painting, 241, 1.0, 1.2),
  };
  return cache;
}

/** Gives a material a texture set (once). */
export function applyFinish(m: THREE.MeshStandardMaterial, set: { map: THREE.Texture; normalMap: THREE.Texture }, normalScale = 1) {
  m.map = set.map;
  m.normalMap = set.normalMap;
  m.normalScale.set(normalScale, normalScale);
  m.needsUpdate = true;
}
