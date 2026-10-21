"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { type ReactNode, useCallback } from "react";
import type * as THREE from "three";
import { worldToPlan } from "@/lib/architecture/geometry";
import { findRoomAt } from "@/lib/architecture/room-info";
import { useViewerStore } from "@/lib/store/viewer-store";
import type { FloorId, Room } from "@/types/architecture";

/** Pointer travel (px) above which a click is treated as an orbit drag. */
const DRAG_THRESHOLD = 5;

function isShown(object: THREE.Object3D | null): boolean {
  for (let o = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function floorOf(object: THREE.Object3D | null): FloorId | undefined {
  for (let o = object; o; o = o.parent) {
    const floor = o.userData.floor as FloorId | undefined;
    if (floor) return floor;
  }
  return undefined;
}

/** Room under the nearest visible hit, using the hit object's floor group and the hit point in plan. */
function roomFromEvent(e: ThreeEvent<PointerEvent | MouseEvent>): Room | undefined {
  const hit = e.intersections.find((i) => isShown(i.object));
  if (!hit) return undefined;
  const floor = floorOf(hit.object);
  if (!floor) return undefined;
  // Nudge the hit point along the ray so clicks on a wall face resolve to the room behind it.
  const p = hit.point.clone().addScaledVector(e.ray.direction, 0.02);
  const { x, z } = worldToPlan(p.x, p.z);
  return findRoomAt(floor, x, z);
}

/**
 * Click-to-select for everything inside it. Only canvas pointer events reach
 * here, so the DOM controls layered over the viewer never select rooms.
 */
export function RoomSelector({ children }: { children: ReactNode }) {
  const selectRoom = useViewerStore((s) => s.selectRoom);

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      const room = roomFromEvent(e);
      if (room) selectRoom(room.id);
    },
    [selectRoom],
  );

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = roomFromEvent(e) ? "pointer" : "auto";
  }, []);

  const onPointerOut = useCallback(() => {
    document.body.style.cursor = "auto";
  }, []);

  return (
    <group onClick={onClick} onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
      {children}
    </group>
  );
}
