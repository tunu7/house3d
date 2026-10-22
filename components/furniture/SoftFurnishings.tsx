"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "@/components/architecture/materials";
import { curtains, FIXTURES } from "@/lib/architecture/details";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { FloorId, PlanPoint } from "@/types/architecture";
import { FURN } from "./parts";

/** Gathered fabric: a plane rippled into vertical folds (about five per metre). */
function foldedPanel(width: number, height: number, depth = 0.035): THREE.BufferGeometry {
  const segs = Math.max(8, Math.round(width * 24));
  const g = new THREE.PlaneGeometry(width, height, segs, 1);
  const pos = g.getAttribute("position");
  const folds = Math.max(2, Math.round(width * 5));
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + width / 2) / width;
    pos.setZ(i, Math.sin(u * folds * Math.PI * 2) * depth);
  }
  g.computeVertexNormals();
  return g;
}

const worldAt = (p: PlanPoint) => planToWorld(p.x, p.z);

/** Sheer curtains, drawn open either side of each living-space window, with a slim rod. */
export function Curtains({ floor }: { floor: FloorId }) {
  const items = useMemo(() => {
    const ffl = HOUSE.levels[floor].ffl;
    return curtains(floor).flatMap((c) => {
      const off = c.wall.at + c.side * (c.wall.thickness / 2 + 0.1);
      const at = (a: number): PlanPoint => (c.wall.axis === "x" ? { x: a, z: off } : { x: off, z: a });
      const rotationY = c.wall.axis === "x" ? 0 : Math.PI / 2;
      const panels = c.panels.map((p, i) => {
        const [x, z] = worldAt(at((p.from + p.to) / 2));
        return {
          key: `${c.id}-${i}`,
          geometry: foldedPanel(p.to - p.from, c.top - c.bottom),
          position: [x, ffl + (c.bottom + c.top) / 2, z] as [number, number, number],
          rotationY,
        };
      });
      const [rx, rz] = worldAt(at((c.rod.from + c.rod.to) / 2));
      return [{ panels, rod: { key: `${c.id}-rod`, position: [rx, ffl + c.top + 0.03, rz] as [number, number, number], length: c.rod.to - c.rod.from, rotationY } }];
    });
  }, [floor]);

  useEffect(() => () => items.forEach((i) => i.panels.forEach((p) => p.geometry.dispose())), [items]);

  return (
    <group>
      {items.map((c) => (
        <group key={c.rod.key}>
          {c.panels.map((p) => (
            <mesh key={p.key} geometry={p.geometry} position={p.position} rotation-y={p.rotationY} material={MATERIALS.sheer} receiveShadow />
          ))}
          {/* Rod runs along the wall: a cylinder turned onto the run axis. */}
          <mesh position={c.rod.position} rotation={[0, c.rod.rotationY, Math.PI / 2]} material={FURN.dark}>
            <cylinderGeometry args={[0.012, 0.012, c.rod.length, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Visible light fittings: flush ceiling lights, a linear dining pendant and globe pendants in the double-height living room. */
export function LightFittings({ floor }: { floor: FloorId }) {
  const ffl = HOUSE.levels[floor].ffl;
  return (
    <group>
      {FIXTURES.filter((f) => f.floor === floor).map((f) => {
        const [x, z] = planToWorld(f.x, f.z);
        const top = ffl + f.ceiling;
        if (f.kind === "flush") {
          return (
            <group key={f.id} position={[x, top, z]}>
              <mesh position-y={-0.025} material={FURN.ceramic}>
                <cylinderGeometry args={[0.2, 0.2, 0.05, 28]} />
              </mesh>
              <mesh position-y={-0.052} material={MATERIALS.bulb}>
                <cylinderGeometry args={[0.17, 0.17, 0.006, 28]} />
              </mesh>
            </group>
          );
        }
        const lampY = ffl + f.y;
        const cordLength = top - lampY;
        if (f.kind === "linear") {
          return (
            <group key={f.id} position={[x, lampY, z]}>
              <mesh material={FURN.dark}>
                <boxGeometry args={[1.2, 0.05, 0.08]} />
              </mesh>
              <mesh position-y={-0.027} material={MATERIALS.bulb}>
                <boxGeometry args={[1.14, 0.004, 0.05]} />
              </mesh>
              {[-0.5, 0.5].map((dx) => (
                <mesh key={dx} position={[dx, cordLength / 2, 0]} material={FURN.dark}>
                  <cylinderGeometry args={[0.003, 0.003, cordLength, 4]} />
                </mesh>
              ))}
            </group>
          );
        }
        return (
          <group key={f.id} position={[x, lampY, z]}>
            <mesh material={MATERIALS.bulb}>
              <sphereGeometry args={[0.16, 24, 16]} />
            </mesh>
            <mesh position-y={cordLength / 2 + 0.16} material={FURN.dark}>
              <cylinderGeometry args={[0.004, 0.004, cordLength - 0.16, 4]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
