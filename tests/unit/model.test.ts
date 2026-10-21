import { describe, expect, it } from "vitest";
import { furnitureFootprint } from "@/lib/architecture/furniture";
import { exteriorNormal, planToWorld, polygonArea, rectOverlapArea, roomArea, worldToPlan } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import { clearArea, findRoomAt, roomOutline, summarizeRoom } from "@/lib/architecture/room-info";
import { validateHouse } from "@/lib/architecture/validation";

const room = (id: string) => {
  const r = HOUSE.rooms.find((x) => x.id === id);
  if (!r) throw new Error(`missing room ${id}`);
  return r;
};

describe("house model validation", () => {
  const issues = validateHouse(HOUSE);

  it("has no errors", () => {
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("only warns about known, documented deviations", () => {
    const warnings = issues.filter((i) => i.level === "warning").map((i) => i.message);
    // Bedroom 1 is L-shaped on both floors (toilet inside its 3.5 × 4.5 m), and dining is 3.0 m wide.
    expect(warnings).toHaveLength(3);
    expect(warnings.every((w) => /bedroom-1|dining/.test(w))).toBe(true);
  });
});

describe("footprint and rooms", () => {
  it("footprint is the 9 × 10 L-shape minus the 5.5 × 1.5 rear notch", () => {
    expect(polygonArea(HOUSE.footprint)).toBeCloseTo(81.75, 6);
  });

  it.each(["ground", "first"] as const)("%s floor rooms tile the footprint exactly", (floor) => {
    const total = HOUSE.rooms.filter((r) => r.floor === floor && r.kind !== "balcony").reduce((s, r) => s + roomArea(r), 0);
    expect(total).toBeCloseTo(81.75, 6);
  });

  it("matches the drawing's written sizes where reconciled", () => {
    expect(roomArea(room("gf-living"))).toBeCloseTo(5.5 * 5.5);
    expect(roomArea(room("gf-kitchen"))).toBeCloseTo(2.5 * 3.0);
    expect(roomArea(room("ff-sitting"))).toBeCloseTo(3.5 * 3.0);
  });

  it("stacks the stair on both floors", () => {
    expect(room("gf-stair").rects).toEqual(room("ff-stair").rects);
  });

  it("keeps every toilet on the west wet strip or over the kitchen", () => {
    for (const id of ["gf-common-toilet", "gf-attached-toilet", "ff-attached-toilet"]) {
      expect(room(id).rects.every((r) => r.x0 === 0 && r.x1 === 1.5)).toBe(true);
    }
    const bath = room("ff-bathroom").rects[0];
    const kitchen = room("gf-kitchen").rects[0];
    expect(bath.x0 >= kitchen.x0 && bath.x1 <= kitchen.x1 && bath.z0 >= kitchen.z0 && bath.z1 <= kitchen.z1).toBe(true);
  });
});

describe("double-height void", () => {
  const slab = HOUSE.slabs.find((s) => s.id === "first-floor")!;

  it("has no first-floor slab over the void", () => {
    const voidRoom = room("ff-void");
    const slabOverVoid = voidRoom.rects.reduce((sum, r) => {
      // Sample a 10 cm grid inside the void and count slab coverage.
      let covered = 0;
      for (let x = r.x0 + 0.05; x < r.x1; x += 0.1) {
        for (let z = r.z0 + 0.05; z < r.z1; z += 0.1) {
          if (findRoomAt("first", x, z)?.id !== "ff-void") continue;
          const inside = slab.outline.length > 0 && pointInSlab(x, z);
          if (inside) covered++;
        }
      }
      return sum + covered;
    }, 0);
    expect(slabOverVoid).toBe(0);
  });

  function pointInSlab(x: number, z: number) {
    // Ray-cast against the slab outline.
    let inside = false;
    const poly = slab.outline;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
    }
    return inside;
  }

  it("first-floor Bedroom 2 is 5.5 × 4.0 m including its bathroom (owner revision)", () => {
    expect(roomArea(room("ff-bedroom-2")) + roomArea(room("ff-bathroom"))).toBeCloseTo(5.5 * 4.0);
    expect(roomArea(room("ff-void"))).toBeCloseTo(5.5 * 4.5 - 1.0 * 2.5);
  });

  it("living room reports double height", () => {
    expect(summarizeRoom(room("gf-living")).height).toBeCloseTo(6.2);
  });
});

describe("geometry helpers", () => {
  it("plan ↔ world round-trips and centres the house", () => {
    expect(planToWorld(4.5, 5)).toEqual([0, 0]);
    const p = worldToPlan(...planToWorld(1.23, 7.89));
    expect(p.x).toBeCloseTo(1.23);
    expect(p.z).toBeCloseTo(7.89);
  });

  it("front wall faces the street (plan −z)", () => {
    const front = HOUSE.walls.find((w) => w.id === "gf-ext-front")!;
    const n = exteriorNormal(front, HOUSE.footprint);
    expect([n.x + 0, n.z]).toEqual([0, -1]);
    const step = HOUSE.walls.find((w) => w.id === "gf-ext-step")!;
    const m = exteriorNormal(step, HOUSE.footprint);
    expect([m.x, m.z + 0]).toEqual([1, 0]);
  });

  it("outlines an L-shaped room without its internal seam", () => {
    const segments = roomOutline(room("gf-bedroom-1"));
    const length = segments.reduce((s, [a, b]) => s + Math.hypot(b.x - a.x, b.z - a.z), 0);
    // Perimeter of 3.5 × 4.5 (L-shape keeps the same perimeter as its bounding box).
    expect(length).toBeCloseTo(2 * (3.5 + 4.5));
  });

  it("clear area is smaller than grid area by a plausible wall allowance", () => {
    for (const r of HOUSE.rooms.filter((x) => x.kind !== "void" && x.kind !== "balcony")) {
      const ratio = clearArea(r) / roomArea(r);
      expect(ratio).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(1);
    }
  });
});

describe("furniture", () => {
  it("never overlaps another floor-standing item", () => {
    const items = HOUSE.furniture.filter((f) => f.type !== "rug" && !f.elevation);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].floor !== items[j].floor) continue;
        expect(rectOverlapArea(furnitureFootprint(items[i]), furnitureFootprint(items[j]))).toBeLessThan(1e-4);
      }
    }
  });
});
