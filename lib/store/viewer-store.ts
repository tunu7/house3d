import { create } from "zustand";
import { HOUSE } from "@/lib/architecture/house";
import {
  EXPLODED_POSE,
  focusForRoom,
  PRESETS,
  type CameraPose,
  type PresetName,
  VIEW_MODE_POSES,
} from "@/lib/viewer/camera";
import type { FloorId } from "@/types/architecture";

export type LayerKey = "roof" | "walls" | "furniture";
export type ViewMode = "full" | "exterior" | "ground" | "first" | "cutaway";

/** A camera move for CameraController to animate; `seq` makes repeat requests distinct. */
export interface CameraRequest extends CameraPose {
  seq: number;
}

interface ViewerState {
  viewMode: ViewMode;
  floors: Record<FloorId, boolean>;
  layers: Record<LayerKey, boolean>;
  exploded: boolean;
  /** Dollhouse cutaway: exterior walls facing the camera are hidden. */
  cutaway: boolean;
  selectedRoomId: string | null;
  cameraRequest: CameraRequest | null;
  /** First-person walkthrough active (orbit controls are replaced). */
  walkMode: boolean;
  /** Room the walker is standing in, updated only when it changes. */
  walkRoomId: string | null;
  /** First frame rendered — hides the loading screen. */
  ready: boolean;
  /** The WebGL context was lost (GPU reset, too many contexts, etc.). */
  contextLost: boolean;

  setViewMode: (mode: ViewMode) => void;
  toggleFloor: (floor: FloorId) => void;
  toggleLayer: (layer: LayerKey) => void;
  setExploded: (exploded: boolean) => void;
  setCutaway: (cutaway: boolean) => void;
  selectRoom: (roomId: string | null, options?: { focus?: boolean }) => void;
  goToPreset: (preset: PresetName) => void;
  resetCamera: () => void;
  /** Quick floor focus for the touch floor switcher. */
  showFloors: (which: "all" | FloorId) => void;
  setWalkMode: (walk: boolean) => void;
  setWalkRoom: (roomId: string | null) => void;
  setReady: () => void;
  setContextLost: (lost: boolean) => void;
}

type ModeState = Pick<ViewerState, "floors" | "layers" | "cutaway">;

/** Visibility implied by each view mode. Furniture follows the user's choice. */
function modeState(mode: ViewMode, furniture: boolean): ModeState {
  const all = { ground: true, first: true };
  switch (mode) {
    case "full":
    case "exterior":
      return { floors: all, layers: { roof: true, walls: true, furniture }, cutaway: false };
    case "ground":
      return { floors: { ground: true, first: false }, layers: { roof: false, walls: true, furniture }, cutaway: false };
    case "first":
      return { floors: all, layers: { roof: false, walls: true, furniture }, cutaway: false };
    case "cutaway":
      return { floors: all, layers: { roof: false, walls: true, furniture }, cutaway: true };
  }
}

let seq = 0;
const request = (pose: CameraPose): CameraRequest => ({ ...pose, seq: ++seq });

export const useViewerStore = create<ViewerState>()((set, get) => ({
  viewMode: "full",
  ...modeState("full", true),
  exploded: false,
  selectedRoomId: null,
  cameraRequest: null,
  walkMode: false,
  walkRoomId: null,
  ready: false,
  contextLost: false,

  setViewMode: (mode) =>
    set((s) => ({
      viewMode: mode,
      walkMode: false,
      ...modeState(mode, s.layers.furniture),
      cameraRequest: request(VIEW_MODE_POSES[mode]),
    })),
  toggleFloor: (floor) => set((s) => ({ floors: { ...s.floors, [floor]: !s.floors[floor] } })),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setExploded: (exploded) =>
    set((s) => ({ exploded, cameraRequest: request(exploded ? EXPLODED_POSE : VIEW_MODE_POSES[s.viewMode]) })),
  setCutaway: (cutaway) => set((s) => ({ cutaway, layers: cutaway ? { ...s.layers, roof: false } : s.layers })),

  selectRoom: (roomId, options = {}) => {
    const room = roomId ? HOUSE.rooms.find((r) => r.id === roomId) : undefined;
    if (!room) {
      set({ selectedRoomId: null });
      return;
    }
    const { exploded, cutaway, walkMode } = get();
    // In the walkthrough the camera belongs to the walker: select without moving it.
    const focus = (options.focus ?? true) && !walkMode;
    // Reveal the room: lift the roof off, and for ground-floor rooms (other
    // than the double-height living area) hide the floor above unless exploded.
    const revealFloors =
      room.floor === "ground" && room.kind !== "living" && !exploded && !cutaway
        ? { ground: true, first: false }
        : { ground: true, first: true };
    set((s) => ({
      selectedRoomId: room.id,
      floors: focus ? revealFloors : s.floors,
      layers: focus ? { ...s.layers, roof: false } : s.layers,
      cameraRequest: focus ? request(focusForRoom(room, exploded)) : s.cameraRequest,
    }));
  },

  goToPreset: (preset) => set({ cameraRequest: request(PRESETS[preset]) }),
  resetCamera: () =>
    set((s) => ({
      viewMode: "full",
      walkMode: false,
      ...modeState("full", s.layers.furniture),
      exploded: false,
      selectedRoomId: null,
      cameraRequest: request(VIEW_MODE_POSES.full),
    })),

  showFloors: (which) =>
    set((s) => ({
      floors: which === "all" ? { ground: true, first: true } : { ground: which === "ground", first: which === "first" },
      // A single floor is only readable from above.
      layers: which === "all" ? s.layers : { ...s.layers, roof: false },
    })),

  setWalkMode: (walk) =>
    set((s) =>
      walk
        ? {
            walkMode: true,
            exploded: false,
            cutaway: false,
            floors: { ground: true, first: true },
            layers: { ...s.layers, walls: true, roof: true },
          }
        : { walkMode: false, walkRoomId: null, cameraRequest: request(VIEW_MODE_POSES[s.viewMode]) },
    ),
  setWalkRoom: (walkRoomId) => set({ walkRoomId }),
  setReady: () => set({ ready: true }),
  setContextLost: (contextLost) => set({ contextLost }),
}));
