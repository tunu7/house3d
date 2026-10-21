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

  it("climbs the stair to the first-floor landing", () => {
    let p = start();
    for (const [x, z] of [[4.2, 3.5], [2.6, 3.45], [0.62, 3.45], [0.62, 5.05], [2.6, 5.05]]) p = walkTo(p, x, z);
    expect(p.feet).toBeCloseTo(HOUSE.levels.first.ffl);
    expect(findRoomAt(floorOf(p), p.x, p.z)?.id).toBe("ff-landing");
  });

  it("is stopped by the void railing", () => {
    let p = start();
    for (const [x, z] of [[4.2, 3.5], [2.6, 3.45], [0.62, 3.45], [0.62, 5.05], [2.6, 5.05], [3.0, 3.4], [5.5, 3.4]]) p = walkTo(p, x, z);
    expect(p.x).toBeLessThan(3.6);
    expect(p.feet).toBeCloseTo(HOUSE.levels.first.ffl);
  });

  it("cannot pass through a solid wall", () => {
    // Living room → kitchen through the partition at plan z 5.5 (no door there).
    const p = walkTo({ x: 7.5, z: 4.5, feet: 0 }, 7.5, 7.0);
    expect(p.z).toBeLessThan(5.5);
  });

  it("follows tread heights on the stair", () => {
    const tread = HOUSE.stair.treads[0];
    const cx = tread.outline.reduce((s, q) => s + q.x, 0) / tread.outline.length;
    const cz = tread.outline.reduce((s, q) => s + q.z, 0) / tread.outline.length;
    expect(surfaceAt(cx, cz, 0)).toBeCloseTo(tread.top);
  });
});
