import { describe, expect, it } from "vitest";
import { HOUSE } from "@/lib/architecture/house";
import { findRoomAt } from "@/lib/architecture/room-info";
import { step, surfaceAt, WALK_START } from "@/lib/viewer/walk";

type Pos = { x: number; z: number; feet: number };

function walkTo(p: Pos, tx: number, tz: number): Pos {
  for (let i = 0; i < 500; i++) {
    const dx = tx - p.x;
    const dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.02) break;
    const s = Math.min(0.03, d);
    p = step(p, (dx / d) * s, (dz / d) * s);
  }
  return p;
}

const start = (): Pos => ({ x: WALK_START.x, z: WALK_START.z, feet: WALK_START.feet });
const floorOf = (p: Pos) => (p.feet > 1.6 ? "first" : "ground");

describe("walkthrough physics", () => {
  it("starts inside the living room", () => {
    expect(findRoomAt("ground", WALK_START.x, WALK_START.z)?.id).toBe("gf-living");
  });

  // Living room → stair entry (south-west) → up the west half → half turn → up the east half → sitting area.
  const UP_THE_STAIR: [number, number][] = [[5.0, 3.5], [6.0, 3.5], [6.0, 4.3], [6.0, 4.95], [7.0, 4.95], [7.0, 4.3], [7.0, 2.5]];
  const climb = () => UP_THE_STAIR.reduce((p, [x, z]) => walkTo(p, x, z), start());

  it("climbs the stair into the first-floor sitting area", () => {
    const p = climb();
    expect(p.feet).toBeCloseTo(HOUSE.levels.first.ffl);
    expect(findRoomAt(floorOf(p), p.x, p.z)?.id).toBe("ff-sitting");
  });

  it("is stopped by the void railing beside the sitting area", () => {
    const p = walkTo(climb(), 3.5, 1.0);
    expect(p.x).toBeGreaterThan(5.5);
    expect(p.feet).toBeCloseTo(HOUSE.levels.first.ffl);
  });

  it("reaches Bedroom 1 along the landing over the common toilet", () => {
    let p = climb();
    for (const [x, z] of [[8.25, 2.5], [8.25, 6.5]]) p = walkTo(p, x, z);
    expect(findRoomAt("first", p.x, p.z)?.id).toBe("ff-bedroom-1");
  });

  it("walks out onto the balcony through the open half of the sliding doors", () => {
    let p = climb();
    for (const [x, z] of [[6.4, 1.0], [6.4, -0.6]]) p = walkTo(p, x, z);
    expect(findRoomAt("first", p.x, p.z)?.id).toBe("ff-balcony");
    expect(walkTo(p, 6.4, -2.0).z).toBeGreaterThan(-1.2);
  });

  it("cannot pass through a solid wall", () => {
    // Living room → kitchen through the partition at plan z 5.5 (no door there).
    const p = walkTo({ x: 1.5, z: 4.5, feet: 0 }, 1.5, 7.0);
    expect(p.z).toBeLessThan(5.5);
  });

  it("walks out of the front door, across the porch and down the entrance steps", () => {
    let p = start();
    p = walkTo(p, 4.7, -2.5);
    expect(p.z).toBeLessThan(-2);
    expect(p.feet).toBeCloseTo(-HOUSE.dimensions.plinthHeight);
  });

  it("goes through the dining room's sliding back door onto the rear patio", () => {
    let p = start();
    for (const [x, z] of [[4.0, 5.0], [4.0, 7.0], [3.5, 7.9], [3.5, 9.2]]) p = walkTo(p, x, z);
    expect(p.z).toBeGreaterThan(9);
    expect(p.feet).toBeLessThan(0);
  });

  it("enters first-floor Bedroom 2 along the walkway by the void", () => {
    let p = climb();
    for (const [x, z] of [[6.0, 2.5], [5.0, 2.5], [5.0, 4.2], [5.0, 6.0]]) p = walkTo(p, x, z);
    expect(findRoomAt("first", p.x, p.z)?.id).toBe("ff-bedroom-2");
  });

  it("enters the common toilet from Bedroom 2's back-right corner", () => {
    let p = start();
    for (const [x, z] of [[5.0, 2.4], [6.1, 2.4], [8.3, 2.6], [8.3, 4.0]]) p = walkTo(p, x, z);
    expect(findRoomAt("ground", p.x, p.z)?.id).toBe("gf-common-toilet");
  });

  it("follows tread heights on the stair", () => {
    const tread = HOUSE.stair.treads[0];
    const cx = tread.outline.reduce((s, q) => s + q.x, 0) / tread.outline.length;
    const cz = tread.outline.reduce((s, q) => s + q.z, 0) / tread.outline.length;
    expect(surfaceAt(cx, cz, 0)).toBeCloseTo(tread.top);
  });
});
