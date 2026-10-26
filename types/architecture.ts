/**
 * Architectural data model types.
 *
 * Plan coordinates: `x` runs 0 → 9.0 left → right (viewed from the front),
 * `z` runs 0 → 10.0 front → back. All values are metres.
 * World mapping lives in `lib/architecture/geometry.ts`.
 */

export type FloorId = "ground" | "first";

export interface PlanPoint {
  x: number;
  z: number;
}

/** Axis-aligned plan rectangle. Invariant: x0 < x1, z0 < z1. */
export interface PlanRect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export type RoomKind =
  | "bedroom"
  | "toilet"
  | "kitchen"
  | "dining"
  | "living"
  | "sitting"
  | "circulation"
  | "stair"
  | "void"
  | "balcony";

/** Floor surface finishes (see TILE_FINISHES / ROOM_FLOOR_FINISH in lib/style/theme.ts). */
export type FloorFinish = "wood" | "marble" | "kitchenTile" | "bathTile" | "splashTile";

export interface Room {
  id: string;
  floor: FloorId;
  name: string;
  kind: RoomKind;
  /** Non-overlapping rectangles whose union is the room (L-shapes use two). */
  rects: PlanRect[];
  /** Size as written on the reference drawing, verbatim. */
  drawingLabel?: string;
  /** Reconciliation notes shown alongside the room. */
  notes?: string[];
  /**
   * Owner's revised size, which supersedes the drawing label. `includes`
   * lists rooms carved out of this one that count toward that size.
   */
  brief?: { label: string; includes?: string[] };
  /** Overrides the room kind's default floor finish (`ROOM_FLOOR_FINISH`). */
  floorFinish?: FloorFinish;
}

export type OpeningKind = "door" | "window" | "vent";

export interface Opening {
  id: string;
  kind: OpeningKind;
  /** Span along the wall's run axis, in plan coordinates. */
  from: number;
  to: number;
  /** Heights relative to the wall's floor level (FFL). */
  sill: number;
  head: number;
  /** Optional label, e.g. "Main entrance". */
  label?: string;
  /** Doors: which end of the span carries the hinge (default "start"). */
  hinge?: "start" | "end";
  /** Doors: side the leaf swings to, along the wall's fixed axis (+1 = increasing plan coordinate). */
  swing?: 1 | -1;
  /** Doors: hinged leaf (default) or a two-panel sliding door. */
  operation?: "swing" | "sliding";
  /** Sliding doors: metal grille (default) or framed glass panels. */
  panel?: "grille" | "glass";
  /** Sliding doors: which end of the span the panels park over (default "start"); the other half is open. */
  parked?: "start" | "end";
}

export type WallKind = "exterior" | "interior";

/**
 * A straight wall defined by its centreline.
 * `axis: "x"` runs along x at a fixed z; `axis: "z"` runs along z at a fixed x.
 */
export interface Wall {
  id: string;
  floor: FloorId;
  kind: WallKind;
  axis: "x" | "z";
  /** Centreline coordinate on the fixed axis. */
  at: number;
  /** Extent along the run axis (outer ends, including any corner overlap). */
  from: number;
  to: number;
  thickness: number;
  /** Height above the floor's FFL. */
  height: number;
  openings: Opening[];
}

export interface Slab {
  id: string;
  /** Top-of-slab elevation (world Y). */
  top: number;
  thickness: number;
  /** Simple polygon, counter-clockwise or clockwise, no self-intersection. */
  outline: PlanPoint[];
  /** Rectangular holes fully inside the outline (e.g. stair opening). */
  holes: PlanRect[];
}

/** Straight guard rail along an axis-aligned edge (e.g. the void edge). */
export interface Railing {
  id: string;
  floor: FloorId;
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
  height: number;
}

export interface StairTread {
  index: number;
  /** Plan outline of the tread (rectangle or winder wedge). */
  outline: PlanPoint[];
  /** Top-of-tread elevation above ground FFL. */
  top: number;
  kind: "straight" | "winder";
}

/** A point in plan with a height: [x, y, z] in plan coordinates (y = elevation). */
export type PlanPoint3 = [number, number, number];

export interface Stair {
  /** Clear well the stair occupies. */
  bounds: PlanRect;
  risers: number;
  riser: number;
  flightWidth: number;
  treads: StairTread[];
  /** Handrail runs along the inner (well) edge. */
  handrails: { from: PlanPoint3; to: PlanPoint3 }[];
  /** Vertical posts: base and top. */
  posts: { from: PlanPoint3; to: PlanPoint3 }[];
}

export type FurnitureType =
  | "bed"
  | "nightstand"
  | "wardrobe"
  | "sofa"
  | "armchair"
  | "coffeeTable"
  | "roundTable"
  | "rug"
  | "plant"
  | "diningTable"
  | "chair"
  | "console"
  | "counter"
  | "barTable"
  | "stool"
  | "floorLamp"
  | "sideTable"
  | "art"
  | "upperCabinet"
  | "hood"
  | "fridge"
  | "wc"
  | "basin"
  | "shower";

/** Plan direction an item's front faces (the side you use it from). */
export type Facing = "+x" | "-x" | "+z" | "-z";

/**
 * A furniture item or fixture. Modelled in local space with width `w` along
 * local X, depth `d` along local Z and the front toward local +Z, then placed
 * at its plan centre and rotated to `facing`.
 */
export interface FurnitureItem {
  id: string;
  floor: FloorId;
  roomId: string;
  type: FurnitureType;
  x: number;
  z: number;
  w: number;
  d: number;
  facing: Facing;
  /** Height of the item's base above FFL (wall cabinets, hoods). */
  elevation?: number;
  /** Overall height where the type allows it to vary. */
  height?: number;
  /** Counters: local-X offsets of a sink and a hob cut into the worktop. */
  sinkAt?: number;
  hobAt?: number;
  /** Showers: which local sides get a glass screen. */
  screens?: ("front" | "left" | "right")[];
}

export interface FloorLevel {
  id: FloorId;
  name: string;
  /** Finished floor level, world Y. */
  ffl: number;
  ceilingHeight: number;
}

export interface Dimensions {
  overallWidth: number;
  overallDepth: number;
  exteriorWall: number;
  interiorWall: number;
  slabThickness: number;
  floorToFloor: number;
  ceilingHeight: number;
  doorHeight: number;
  windowSill: number;
  windowHead: number;
  plinthHeight: number;
  parapetHeight: number;
}

export interface HouseModel {
  dimensions: Dimensions;
  levels: Record<FloorId, FloorLevel>;
  footprint: PlanPoint[];
  rooms: Room[];
  walls: Wall[];
  slabs: Slab[];
  roof: Slab;
  stair: Stair;
  railings: Railing[];
  furniture: FurnitureItem[];
}
