import { create } from "zustand";

/**
 * Progress of the path-traced render mode, published by
 * components/viewer/PathTracer.tsx for the on-screen badge. Kept apart from
 * the tracer so the UI doesn't pull its (large) chunk into the main bundle.
 */
export const usePathTraceStatus = create<{ samples: number; preparing: boolean }>(() => ({ samples: 0, preparing: false }));
