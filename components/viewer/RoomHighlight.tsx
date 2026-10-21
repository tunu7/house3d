"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import { roomOutline, summarizeRoom } from "@/lib/architecture/room-info";
import { useViewerStore } from "@/lib/store/viewer-store";
import type { FloorId } from "@/types/architecture";

const ACCENT = "#c2703d";
const LIFT = 0.03;

const fillMaterial = new THREE.MeshBasicMaterial({
  color: ACCENT,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  side: THREE.DoubleSide,
});

/**
 * Selected-room highlight: a tinted floor and a wireframe prism tracing the
 * room boundary from floor to ceiling. Rendered inside the floor's group so it
 * follows exploded-view offsets.
 */
export function RoomHighlight({ floor }: { floor: FloorId }) {
  const selectedId = useViewerStore((s) => s.selectedRoomId);
  const room = HOUSE.rooms.find((r) => r.id === selectedId && r.floor === floor);

  const geometry = useMemo(() => {
    if (!room) return null;
    const y0 = HOUSE.levels[floor].ffl + LIFT;
    const y1 = HOUSE.levels[floor].ffl + summarizeRoom(room).height - 0.05;
    const toV = (p: { x: number; z: number }, y: number) => {
      const [x, z] = planToWorld(p.x, p.z);
      return new THREE.Vector3(x, y, z);
    };
    const segments = roomOutline(room);
    const lines = segments.flatMap(([a, b]) => [
      [toV(a, y0), toV(b, y0)],
      [toV(a, y1), toV(b, y1)],
    ]);
    const corners = new Map(segments.flatMap(([a, b]) => [a, b]).map((p) => [`${p.x},${p.z}`, p]));
    const posts = [...corners.values()].map((p) => [toV(p, y0), toV(p, y1)]);
    const fills = room.rects.map((r) => {
      const [cx, cz] = planToWorld((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
      return { key: `${r.x0},${r.z0}`, position: [cx, y0, cz] as [number, number, number], size: [r.x1 - r.x0, r.z1 - r.z0] as [number, number] };
    });
    return { lines: [...lines, ...posts], fills };
  }, [room, floor]);

  if (!geometry) return null;
  return (
    <group renderOrder={10}>
      {geometry.lines.map((pts, i) => (
        <Line key={i} points={pts} color={ACCENT} lineWidth={2.5} depthTest={false} transparent opacity={0.95} />
      ))}
      {geometry.fills.map((f) => (
        <mesh key={f.key} position={f.position} rotation-x={-Math.PI / 2} material={fillMaterial} raycast={() => null}>
          <planeGeometry args={f.size} />
        </mesh>
      ))}
    </group>
  );
}
