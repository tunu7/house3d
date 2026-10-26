"use client";

import { useMemo } from "react";
import { FIXTURES } from "@/lib/architecture/details";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import { CANOPY, PORCH } from "@/lib/architecture/site";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES } from "@/lib/viewer/atmosphere";
import type { FloorId } from "@/types/architecture";

const WARM = "#ffc98a";
/** Fittings lit on every device; the rest only at high quality. */
const KEY_FIXTURES = new Set(["dining-pendant", "living-globe-0", "living-globe-1", "ff-sitting-light", "ff-bedroom-2-light"]);

/**
 * Warm interior light at dusk, emitted from the visible fittings (see
 * lib/architecture/details FIXTURES), without shadows. Mounted only when
 * lamps are on, inside each floor's group so they follow visibility and
 * exploded view.
 */
export function InteriorLamps({ floor, all }: { floor: FloorId; all: boolean }) {
  const on = useViewerStore((s) => ATMOSPHERES[s.timeOfDay].lampsOn);
  const lamps = useMemo(() => {
    const ffl = HOUSE.levels[floor].ffl;
    return FIXTURES.filter((f) => f.floor === floor && (all || KEY_FIXTURES.has(f.id))).map((f) => {
      const [x, z] = planToWorld(f.x, f.z);
      return { key: f.id, position: [x, ffl + f.y - 0.15, z] as [number, number, number], intensity: f.intensity, distance: f.kind === "pendant" ? 9 : 6 };
    });
  }, [floor, all]);

  if (!on) return null;
  return (
    <>
      {lamps.map((l) => (
        <pointLight key={l.key} position={l.position} color={WARM} intensity={l.intensity} distance={l.distance} decay={2} />
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
  const [fx, fz] = planToWorld(0.8, -0.6);
  return (
    <>
      <spotLight position={[px, CANOPY.bottom - 0.05, pz]} target-position={[px, 0, pz]} angle={0.9} penumbra={0.8} intensity={14} distance={6} color={WARM} />
      <pointLight position={[lx, 2.0, lz]} intensity={2.5} distance={2.6} color={WARM} />
      <pointLight position={[rx, 2.0, rz]} intensity={2.5} distance={2.6} color={WARM} />
      <pointLight position={[fx, HOUSE.levels.first.ffl + 1.6, fz]} intensity={3} distance={3} color={WARM} />
    </>
  );
}
