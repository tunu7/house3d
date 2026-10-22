"use client";

import { useMemo } from "react";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import { CANOPY, PORCH } from "@/lib/architecture/site";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES } from "@/lib/viewer/atmosphere";
import type { FloorId } from "@/types/architecture";

const WARM = "#ffc98a";
/** Rooms lit on every device; the rest only at high quality. */
const KEY_ROOMS = new Set(["gf-living", "gf-dining", "ff-sitting", "ff-bedroom-2"]);
const LIT_KINDS = new Set(["bedroom", "living", "dining", "kitchen", "sitting", "circulation"]);

/**
 * Warm interior lamps for dusk: one ceiling light per habitable room (two in
 * the double-height living room), no shadows. Mounted only when lamps are on,
 * inside each floor's group so they follow visibility and exploded view.
 */
export function InteriorLamps({ floor, all }: { floor: FloorId; all: boolean }) {
  const on = useViewerStore((s) => ATMOSPHERES[s.timeOfDay].lampsOn);
  const lamps = useMemo(() => {
    const ffl = HOUSE.levels[floor].ffl;
    return HOUSE.rooms
      .filter((r) => r.floor === floor && LIT_KINDS.has(r.kind) && (all || KEY_ROOMS.has(r.id)))
      .flatMap((room) => {
        const r = room.rects.reduce((a, b) => ((a.x1 - a.x0) * (a.z1 - a.z0) >= (b.x1 - b.x0) * (b.z1 - b.z0) ? a : b));
        const cx = (r.x0 + r.x1) / 2;
        const cz = (r.z0 + r.z1) / 2;
        const points = room.kind === "living" ? [[cx, cz - 1.2], [cx, cz + 1.2]] : [[cx, cz]];
        return points.map(([x, z], i) => {
          const [wx, wz] = planToWorld(x, z);
          return { key: `${room.id}-${i}`, position: [wx, ffl + 2.55, wz] as [number, number, number], intensity: room.kind === "living" ? 9 : 5 };
        });
      });
  }, [floor, all]);

  if (!on) return null;
  return (
    <>
      {lamps.map((l) => (
        <pointLight key={l.key} position={l.position} color={WARM} intensity={l.intensity} distance={7} decay={2} />
      ))}
    </>
  );
}

/** Facade lighting for dusk: porch downlight wash and the glow of the wall sconces. */
export function FacadeLamps() {
  const on = useViewerStore((s) => ATMOSPHERES[s.timeOfDay].lampsOn);
  if (!on) return null;
  const [px, pz] = planToWorld((PORCH.x0 + PORCH.x1) / 2, (PORCH.z0 + PORCH.z1) / 2);
  const [lx, lz] = planToWorld(PORCH.x0 + 0.6, PORCH.z0 + 0.2);
  const [rx, rz] = planToWorld(PORCH.x1 - 0.6, PORCH.z0 + 0.2);
  const [fx, fz] = planToWorld(8.2, -0.6);
  return (
    <>
      <spotLight position={[px, CANOPY.bottom - 0.05, pz]} target-position={[px, 0, pz]} angle={0.9} penumbra={0.8} intensity={14} distance={6} color={WARM} />
      <pointLight position={[lx, 2.0, lz]} intensity={2.5} distance={2.6} color={WARM} />
      <pointLight position={[rx, 2.0, rz]} intensity={2.5} distance={2.6} color={WARM} />
      <pointLight position={[fx, HOUSE.levels.first.ffl + 1.6, fz]} intensity={3} distance={3} color={WARM} />
    </>
  );
}
