"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useViewerStore } from "@/lib/store/viewer-store";

const DURATION = 0.9;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Flight {
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPos: THREE.Vector3;
  toTarget: THREE.Vector3;
  t: number;
}

/**
 * Animates the camera and orbit target toward store camera requests.
 * Subscribes outside React render, so camera motion causes no re-renders.
 * Any user drag/zoom cancels a flight in progress.
 */
export function CameraController() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const flight = useRef<Flight | null>(null);
  /** Last request started; lets a request made while controls were unmounted (walk mode) run on remount. */
  const lastSeq = useRef(0);

  useEffect(() => {
    if (!controls) return;
    const start = (req: ReturnType<typeof useViewerStore.getState>["cameraRequest"]) => {
      if (!req || req.seq === lastSeq.current) return;
      lastSeq.current = req.seq;
      flight.current = {
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPos: new THREE.Vector3(...req.position),
        toTarget: new THREE.Vector3(...req.target),
        t: 0,
      };
      // On-demand rendering: kick the loop; useFrame keeps it going until the flight lands.
      invalidate();
    };
    start(useViewerStore.getState().cameraRequest);
    const unsubscribe = useViewerStore.subscribe((s, prev) => {
      if (s.cameraRequest !== prev.cameraRequest) start(s.cameraRequest);
    });
    const cancel = () => {
      flight.current = null;
    };
    controls.addEventListener("start", cancel);
    return () => {
      unsubscribe();
      controls.removeEventListener("start", cancel);
    };
  }, [camera, controls, invalidate]);

  useFrame((_, delta) => {
    const f = flight.current;
    if (!f || !controls) return;
    f.t = Math.min(1, f.t + delta / DURATION);
    const k = ease(f.t);
    camera.position.lerpVectors(f.fromPos, f.toPos, k);
    controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
    controls.update();
    if (f.t >= 1) flight.current = null;
    else invalidate();
  });

  return null;
}
