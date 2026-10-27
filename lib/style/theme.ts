import type { FloorFinish, RoomKind } from "@/types/architecture";

/**
 * The house's look in one place: every surface colour and which floor finish
 * each room gets. Pure data (no three.js), so restyling is a one-file edit.
 *
 * Keys match `MATERIALS` (components/architecture/materials.ts) and `FURN`
 * (components/furniture/parts.tsx); those files keep the physical properties
 * (roughness, metalness, transparency) that rarely change.
 */

/** Building and site surfaces. */
export const ARCH_COLORS = {
  // Warm cream render, as in the owner's reference photo (R9).
  exteriorWall: "#e8dcc8",
  interiorWall: "#e6e1d8",
  /** Slabs read as white ceilings from inside. */
  slab: "#e8e4dc",
  plinth: "#5d5b57",
  roof: "#d4d0c8",
  ground: "#7d9c5b",
  path: "#d9d4ca",
  asphalt: "#ffffff",
  marking: "#e9e6df",
  pebbles: "#c9c3b8",
  /** Charcoal fascias, frames and parapet coping. */
  fascia: "#3f3f3d",
  /** White eaves and slab edges. */
  eave: "#f6f3ee",
  handle: "#c8c9c7",
  skirting: "#f1ede6",
  pipe: "#4a4a48",
  bulb: "#fffaf0",
  bulbGlow: "#ffd8a0",
  sheer: "#f6f1e8",
  /** Facade planting before textures load; `leafTextured` once they do. */
  leaf: "#4f7a3a",
  leafTextured: "#6f9a48",
  glow: "#fff1d6",
  glowEmissive: "#ffc56b",
  /** Window frames, railings and handrails. */
  frame: "#2f2f2e",
  /** Interior door frames and leaves. */
  doorWood: "#b8956a",
  entranceDoor: "#5b3d27",
  stairTread: "#d6d1c7",
  /** Oak floorboards (bedrooms, lounge, balcony). */
  floorWood: "#a88b68",
  glass: "#c6d8e0",
  // Grounds (R11): driveway pavers, gym floor, pool, garden beds.
  /** Grey concrete pavers (tints the concrete texture). */
  paving: "#a7a39b",
  /** Gym floor: charcoal rubber tiles. */
  rubber: "#34373a",
  /** Pool basin: pale aqua mosaic. */
  poolTile: "#8ccbd6",
  /** Pool water: tint of the real-time surface, and the photoreal water's absorption colour. */
  water: "#2f8fa6",
  /** Gazebo and bed timber, gazebo roof shingles. */
  timber: "#7a5a3c",
  roofShingle: "#4a3b32",
  soil: "#4a3626",
} as const;

/** Furniture palette: neutral, warm, with sage accents from the reference drawing. */
export const FURNITURE_COLORS = {
  oak: "#a47a4f",
  walnut: "#5e4130",
  lacquer: "#f1ede6",
  fabric: "#d6cdbd",
  fabricDark: "#a89e8e",
  /** Accent cushions and throws. */
  terracotta: "#b8673a",
  ochre: "#c79a4a",
  brass: "#b8955a",
  sage: "#7c8a63",
  linen: "#f4f1ea",
  rug: "#b8a68a",
  ceramic: "#fbfbf9",
  steel: "#d4d7d8",
  dark: "#2b2b2a",
  /** Kitchen worktop. */
  stone: "#4a4744",
  hobGlass: "#111111",
  mirror: "#e4ecef",
  /** House plants: two leaf tones (young and mature leaves) and potting soil. */
  leaf: "#4f7537",
  leafDark: "#2f5226",
  soil: "#3b2d22",
  pot: "#8a8178",
  /** Glazed ceramic vases and bowls. */
  glaze: "#cfc6b6",
  lampShade: "#f3e9d6",
  lampShadeGlow: "#f3d9a4",
  /** Book spines and covers on shelves and tables. */
  books: ["#8c3b2e", "#2f4a5c", "#d8cdb5", "#56664a", "#b58a43", "#3a3533"],
  /** Bath towels. */
  towel: "#e9e3d7",
  /** Fruit in the kitchen bowl. */
  fruit: "#d9832b",
} as const;

/**
 * Procedural tile finishes: base colour, tiles across one texture repeat,
 * grout colour, per-tile colour variation (0–1) and optional marble veining.
 */
export const TILE_FINISHES: Record<Exclude<FloorFinish, "wood">, { base: string; grid: number; grout: string; variation: number; veined?: boolean }> = {
  marble: { base: "#ece6dc", grid: 2, grout: "#cfc8bc", variation: 0.03, veined: true },
  kitchenTile: { base: "#d8d0c4", grid: 2, grout: "#a9a196", variation: 0.05 },
  bathTile: { base: "#c9ced1", grid: 3, grout: "#9ea4a8", variation: 0.05 },
  /** Small glazed wall tiles (10 cm) for the kitchen backsplash. */
  splashTile: { base: "#efe8dc", grid: 6, grout: "#cfc6b8", variation: 0.06 },
};

/** Default floor finish per room kind. A room's own `floorFinish` overrides it. */
export const ROOM_FLOOR_FINISH: Partial<Record<RoomKind, FloorFinish>> = {
  bedroom: "wood",
  sitting: "wood",
  toilet: "bathTile",
  kitchen: "kitchenTile",
  living: "marble",
  dining: "marble",
  circulation: "marble",
  balcony: "wood",
};
