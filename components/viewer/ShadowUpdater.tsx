"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useViewerStore } from "@/lib/store/viewer-store";

/** Frames to keep refreshing shadows after a change (covers deferred mesh baking). */
const SETTLE_FRAMES = 12;

/**
 * The house is static, so shadow maps are rendered only when the scene
 * changes (any viewer-state change, or startup) instead of every frame —
 * roughly halving per-frame GPU work while orbiting. Cutaway hides walls as
 * the camera moves, so shadows update continuously there.
 */
export function ShadowUpdater() {
  const get = useThree((s) => s.get);
  const pending = useRef(SETTLE_FRAMES * 3);

  useEffect(() => {
    const { gl, invalidate } = get();
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const unsubscribe = useViewerStore.subscribe(() => {
      pending.current = SETTLE_FRAMES;
      invalidate();
    });
    return () => {
      unsubscribe();
      gl.shadowMap.autoUpdate = true;
    };
  }, [get]);

  useFrame(({ gl, invalidate }) => {
    if (useViewerStore.getState().cutaway) {
      gl.shadowMap.needsUpdate = true;
      return;
    }
    if (pending.current > 0) {
      pending.current -= 1;
      gl.shadowMap.needsUpdate = true;
      invalidate();
    }
  });
  return null;
}
