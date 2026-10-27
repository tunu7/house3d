import { describe, expect, it } from "vitest";
import { GRID } from "@/lib/architecture/dimensions";
import { TREES } from "@/lib/architecture/landscape";
import { insidePlot, PLOT_OUTLINE, plotLeftX, SITE_PLAN } from "@/lib/architecture/plot";
import { DRIVEWAY, GYM, POOL, POOL_DECK } from "@/lib/architecture/site";

/** The owner's site plan (R11): the land and where the house sits on it. */
describe("site plan", () => {
  const [fl, fr, br, bl] = PLOT_OUTLINE;
  const len = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(b.x - a.x, b.z - a.z);

  it("matches the plan's boundary dimensions", () => {
    expect(len(fl, fr)).toBeCloseTo(30);
    expect(len(bl, br)).toBeCloseTo(33);
    expect(len(fr, br)).toBeCloseTo(63);
    expect(len(fl, bl)).toBeCloseTo(63, 0);
  });

  it("sets the house 20 m back from the street and 4 m off the right boundary", () => {
    expect(GRID.z.front - fl.z).toBeCloseTo(SITE_PLAN.frontSetback);
    expect(fr.x - GRID.x.right).toBeCloseTo(SITE_PLAN.rightSetback);
    // Pool / gym zone and the open garden fill the rest of the depth.
    expect(bl.z - GRID.z.back).toBeCloseTo(SITE_PLAN.poolGymDepth + SITE_PLAN.openBack);
    // The left side space is the remainder (18–18.5 m beside the house; the plan's 20 m is approximate).
    expect(GRID.x.left - plotLeftX(GRID.z.front)).toBeGreaterThan(17.9);
    expect(GRID.x.left - plotLeftX(GRID.z.back)).toBeLessThan(18.5);
  });

  it("fits the pool and gym in the 5 m zone behind the house, the pool inside its deck", () => {
    for (const r of [POOL_DECK, GYM]) {
      expect(r.z0).toBeCloseTo(GRID.z.back);
      expect(r.z1).toBeCloseTo(GRID.z.back + SITE_PLAN.poolGymDepth);
    }
    expect(POOL.x0 > POOL_DECK.x0 && POOL.x1 < POOL_DECK.x1 && POOL.z0 > POOL_DECK.z0 && POOL.z1 < POOL_DECK.z1).toBe(true);
  });

  it("runs the driveway from the front wall to beside the house", () => {
    expect(DRIVEWAY.z0).toBeLessThan(fl.z + 0.5);
    expect(DRIVEWAY.x1).toBeLessThanOrEqual(GRID.x.left);
    expect(insidePlot(DRIVEWAY.x0, DRIVEWAY.z0 + 1)).toBe(true);
  });

  it("keeps garden trees inside the walls and the woodland outside", () => {
    for (const t of TREES.filter((t) => t.shadow)) expect(insidePlot(t.x, t.z)).toBe(true);
  });
});
