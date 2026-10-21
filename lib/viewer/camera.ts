import { EXPLODE_OFFSET } from "@/lib/viewer/constants";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { Room } from "@/types/architecture";

export type Vec3 = [number, number, number];

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export type PresetName = "front" | "rear" | "left" | "right" | "top";

const CENTRE_Y = 3;
const ORBIT = 22;

/** Elevation presets around the house centre. Front faces +Z. */
export const PRESETS: Record<PresetName, CameraPose> = {
  front: { position: [0, 4, ORBIT], target: [0, CENTRE_Y, 0] },
  rear: { position: [0, 4, -ORBIT], target: [0, CENTRE_Y, 0] },
  left: { position: [-ORBIT, 4, 0], target: [0, CENTRE_Y, 0] },
  right: { position: [ORBIT, 4, 0], target: [0, CENTRE_Y, 0] },
  // Tiny Z offset avoids a degenerate look-at straight down the up axis.
  top: { position: [0, 26, 0.01], target: [0, 0, 0] },
};

export const DEFAULT_POSE: CameraPose = { position: [14, 11, 17], target: [0, 2.5, 0] };

export const VIEW_MODE_POSES = {
  full: DEFAULT_POSE,
  exterior: { position: [9, 4.5, 19], target: [0, 3, 0] },
  ground: { position: [7, 14, 11], target: [0, 0, 0] },
  first: { position: [7, 17, 11], target: [0, HOUSE.levels.first.ffl, 0] },
  cutaway: { position: [13, 10, 14], target: [0, 2.5, 0] },
} satisfies Record<string, CameraPose>;

/** Pulled back and raised so both separated floors fit in view. */
export const EXPLODED_POSE: CameraPose = { position: [16, 15, 20], target: [0, 4.5, 0] };

/** Plan bounding box of a room (all rects). */
export function roomBounds(room: Room) {
  return {
    x0: Math.min(...room.rects.map((r) => r.x0)),
    x1: Math.max(...room.rects.map((r) => r.x1)),
    z0: Math.min(...room.rects.map((r) => r.z0)),
    z1: Math.max(...room.rects.map((r) => r.z1)),
  };
}

/**
 * Camera pose that frames a room from above at a 3/4 angle, looking from the
 * front-right so the house's open sides face the viewer.
 */
export function focusForRoom(room: Room, exploded: boolean): CameraPose {
  const b = roomBounds(room);
  const [cx, cz] = planToWorld((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
  const floorY = HOUSE.levels[room.floor].ffl + (exploded && room.floor === "first" ? EXPLODE_OFFSET : 0);
  const span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
  const dist = 3 + span * 1.3;
  return {
    position: [cx + dist * 0.55, floorY + 3 + dist * 0.9, cz + dist * 0.75],
    target: [cx, floorY + 0.6, cz],
  };
}
