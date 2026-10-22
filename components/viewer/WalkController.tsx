"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { planToWorld } from "@/lib/architecture/geometry";
import { findRoomAt } from "@/lib/architecture/room-info";
import { useViewerStore } from "@/lib/store/viewer-store";
import { collisionFloor, EYE_HEIGHT, step, WALK_START } from "@/lib/viewer/walk";
import { walkInput } from "@/lib/viewer/walk-input";

const WALK_SPEED = 1.4;
const RUN_SPEED = 2.8;
const LOOK_SPEED = 0.0045;
const MAX_PITCH = 1.3;
const WALK_FOV = 70;
/** Feet ease toward the surface height so stairs feel continuous. */
const STEP_SMOOTHING = 14;

const KEYS = {
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  run: ["ShiftLeft", "ShiftRight"],
};

/**
 * First-person walkthrough: drag (mouse or touch) to look, WASD / arrows or
 * the on-screen pad to move. Collision and stair heights come from
 * `lib/viewer/walk`. All state lives in refs; React never re-renders per frame.
 */
export function WalkController() {
  // Read three objects through `get` inside effects: they are mutated, not React state.
  const get = useThree((s) => s.get);
  const pos = useRef({ x: WALK_START.x, z: WALK_START.z, feet: WALK_START.feet });
  const eyeFeet = useRef(WALK_START.feet);
  const look = useRef({ yaw: WALK_START.yaw, pitch: 0 });
  const keys = useRef(new Set<string>());
  /** Seconds since the room readout was last refreshed; starts due so the first frame reports. */
  const roomCheck = useRef(Infinity);

  // Camera setup and restore.
  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const prevFov = camera.fov;
    camera.fov = WALK_FOV;
    camera.updateProjectionMatrix();
    camera.rotation.order = "YXZ";
    return () => {
      camera.fov = prevFov;
      camera.rotation.order = "XYZ";
      camera.updateProjectionMatrix();
      walkInput.forward = 0;
      walkInput.strafe = 0;
    };
  }, [get]);

  // Drag to look.
  useEffect(() => {
    const dom = get().gl.domElement;
    let last: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (!last || e.pointerId !== last.id) return;
      look.current.yaw -= (e.clientX - last.x) * LOOK_SPEED;
      look.current.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, look.current.pitch - (e.clientY - last.y) * LOOK_SPEED));
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const up = (e: PointerEvent) => {
      if (last && e.pointerId === last.id) last = null;
    };
    const prevTouch = dom.style.touchAction;
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      dom.style.touchAction = prevTouch;
      dom.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [get]);

  // Keyboard movement (ignored while typing in form fields).
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const down = (e: KeyboardEvent) => {
      if (isField(e.target)) return;
      if (Object.values(KEYS).flat().includes(e.code)) {
        keys.current.add(e.code);
        if (e.code.startsWith("Arrow")) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const k = keys.current;
    const has = (codes: string[]) => codes.some((c) => k.has(c));
    const forward = (has(KEYS.forward) ? 1 : 0) - (has(KEYS.back) ? 1 : 0) + walkInput.forward;
    const strafe = (has(KEYS.right) ? 1 : 0) - (has(KEYS.left) ? 1 : 0) + walkInput.strafe;

    const { yaw, pitch } = look.current;
    if (forward !== 0 || strafe !== 0) {
      const len = Math.hypot(forward, strafe);
      const dist = (has(KEYS.run) ? RUN_SPEED : WALK_SPEED) * delta;
      const f = forward / len;
      const s = strafe / len;
      // World forward for yaw is (−sin, −cos) in (X, Z); plan Z is −world Z.
      const wx = (-Math.sin(yaw) * f + Math.cos(yaw) * s) * dist;
      const wz = (-Math.cos(yaw) * f - Math.sin(yaw) * s) * dist;
      // Sub-step so fast moves can't tunnel through thin walls.
      const steps = Math.ceil(Math.hypot(wx, wz) / 0.05);
      for (let i = 0; i < steps; i++) pos.current = step(pos.current, wx / steps, -wz / steps);
    }

    eyeFeet.current += (pos.current.feet - eyeFeet.current) * Math.min(1, delta * STEP_SMOOTHING);
    const [cx, cz] = planToWorld(pos.current.x, pos.current.z);
    camera.position.set(cx, eyeFeet.current + EYE_HEIGHT, cz);
    camera.rotation.set(pitch, yaw, 0, "YXZ");

    // Report the current room a few times a second (real time), only when it changes.
    roomCheck.current += rawDelta;
    if (roomCheck.current > 0.25) {
      roomCheck.current = 0;
      const room = findRoomAt(collisionFloor(pos.current.feet), pos.current.x, pos.current.z);
      const { walkRoomId, setWalkRoom } = useViewerStore.getState();
      if ((room?.id ?? null) !== walkRoomId) setWalkRoom(room?.id ?? null);
    }
  });

  return null;
}
