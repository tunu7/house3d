import { furnitureFootprint } from "@/lib/architecture/furniture";
import { roomArea } from "@/lib/architecture/geometry";
import { GRID } from "@/lib/architecture/dimensions";
import { HOUSE } from "@/lib/architecture/house";
import { ROOM_FLOOR_FINISH } from "@/lib/style/theme";
import type { PlanRect } from "@/types/architecture";

/**
 * Compact text dump of the house model, so a change can be planned without
 * reading the source files.
 *
 *   npm run model                     everything
 *   npm run model -- rooms            one section: grid | rooms | walls | furniture
 *   npm run model -- furniture gf-living
 *   npm run model -- walls first      filter by floor or by id substring
 */

const SECTIONS = ["grid", "rooms", "walls", "furniture"] as const;
type Section = (typeof SECTIONS)[number];

const args = process.argv.slice(2);
const picked = args.filter((a): a is Section => (SECTIONS as readonly string[]).includes(a));
const filters = args.filter((a) => !(SECTIONS as readonly string[]).includes(a));
const show = (s: Section) => picked.length === 0 || picked.includes(s);
const match = (...fields: string[]) => filters.every((f) => fields.some((v) => v.includes(f)));

const n = (v: number) => +v.toFixed(3);
const rect = (r: PlanRect) => `x${n(r.x0)}–${n(r.x1)} z${n(r.z0)}–${n(r.z1)}`;

if (show("grid")) {
  console.log("## DIMENSIONS", JSON.stringify(HOUSE.dimensions));
  console.log("## GRID", JSON.stringify(GRID));
}

if (show("rooms")) {
  console.log("## ROOMS  id | kind | floor finish | m² | rects");
  for (const r of HOUSE.rooms) {
    if (!match(r.id, r.floor, r.kind)) continue;
    const finish = r.floorFinish ?? ROOM_FLOOR_FINISH[r.kind] ?? "-";
    console.log(`${r.id} | ${r.kind} | ${finish} | ${roomArea(r).toFixed(2)} | ${r.rects.map(rect).join(" + ")}`);
  }
}

if (show("walls")) {
  console.log("## WALLS  id | kind | axis@at | from–to | t | openings (id kind from–to sill/head)");
  for (const w of HOUSE.walls) {
    if (!match(w.id, w.floor, ...w.openings.map((o) => o.id))) continue;
    const ops = w.openings.map((o) => `${o.id} ${o.operation === "sliding" ? `sliding-${o.panel}` : o.kind} ${n(o.from)}–${n(o.to)} ${n(o.sill)}/${n(o.head)}`);
    console.log(`${w.id} | ${w.kind} | ${w.axis}@${n(w.at)} | ${n(w.from)}–${n(w.to)} | ${w.thickness} | ${ops.join("; ") || "-"}`);
  }
}

if (show("furniture")) {
  console.log("## FURNITURE  id | type | centre x,z | w×d | facing | footprint | extra");
  for (const f of HOUSE.furniture) {
    if (!match(f.id, f.floor, f.roomId, f.type)) continue;
    const { id, floor, roomId, type, x, z, w, d, facing, ...extra } = f;
    void floor;
    void roomId;
    const more = Object.keys(extra).length ? JSON.stringify(extra) : "";
    console.log(`${id} | ${type} | ${n(x)},${n(z)} | ${w}×${d} | ${facing} | ${rect(furnitureFootprint(f))} | ${more}`);
  }
}
