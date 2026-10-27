"use client";

import { SlidersHorizontal, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FloorSwitcher } from "@/components/ui/FloorSwitcher";
import { MobileRoomSheet } from "@/components/ui/MobileRoomSheet";
import { Panel, PanelHeading } from "@/components/ui/Panel";
import { RenderStatus } from "@/components/ui/RenderStatus";
import { RoomInfoPanel } from "@/components/ui/RoomInfoPanel";
import { CameraPresets, ResetButton, ViewerToolbar } from "@/components/ui/ViewerToolbar";
import { WalkHud } from "@/components/ui/WalkHud";
import { useViewerStore } from "@/lib/store/viewer-store";
import { hasWebGL } from "@/lib/viewer/webgl";
import { FloorControls } from "./FloorControls";
import { LoadingScreen, ViewerLoadingOverlay } from "./LoadingScreen";
import { buttonStyles, ViewerErrorBoundary, ViewerMessage } from "./ViewerErrorBoundary";
import { ViewModeControls } from "./ViewModeControls";
import { WebGLFallback } from "./WebGLFallback";

/** WebGL can't render on the server, so the viewer is a client-only chunk. */
const HouseViewer = dynamic(() => import("./HouseViewer"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

/** `?ui=0` hides every control (clean renders for the gallery). */
function useControlsVisible(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("ui") !== "0",
    () => true,
  );
}

let webglSupport: boolean | undefined;
/** WebGL support, probed once on the client; `null` during SSR/hydration. */
function useWebGLSupport(): boolean | null {
  return useSyncExternalStore(
    () => () => {},
    () => (webglSupport ??= hasWebGL()),
    () => null,
  );
}

/** Escape leaves the walkthrough, or else clears the room selection. */
function useEscapeKey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useViewerStore.getState();
      if (s.walkMode) s.setWalkMode(false);
      else s.selectRoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Small-screen menu: floor/layer toggles and camera presets in a dropdown. */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative md:hidden">
      <Panel>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-viewer-menu"
          aria-label={open ? "Close view options" : "View options"}
          onClick={() => setOpen((o) => !o)}
          className="flex size-11 items-center justify-center text-stone-700"
        >
          {open ? <X className="size-5" aria-hidden /> : <SlidersHorizontal className="size-5" aria-hidden />}
        </button>
      </Panel>
      {open && (
        <div id="mobile-viewer-menu" className="absolute top-13 left-0 z-10 flex max-h-[70dvh] flex-col gap-2 overflow-y-auto">
          <FloorControls solid />
          <Panel className="w-56 pb-2" solid>
            <PanelHeading>Camera</PanelHeading>
            <div className="px-2">
              <CameraPresets />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function ContextLostMessage() {
  return (
    <ViewerMessage
      title="The graphics context was lost"
      body="The browser reset the 3D graphics (this can happen when the GPU is busy or the device sleeps). It may recover on its own; otherwise reload the page."
      actions={
        <button type="button" className={buttonStyles.primary} onClick={() => window.location.reload()}>
          Reload page
        </button>
      }
    />
  );
}

/**
 * Canvas plus DOM controls layered above it. The overlay layer is
 * click-through (`pointer-events-none`); only the panels take input, so UI
 * clicks never reach the canvas and never select rooms.
 *
 * ≥ md: left toggles, right room panel, bottom camera bar.
 * < md: menu button, floor switcher, collapsible room sheet.
 */
export function ViewerClient() {
  useEscapeKey();
  const webgl = useWebGLSupport();
  const walkMode = useViewerStore((s) => s.walkMode);
  const contextLost = useViewerStore((s) => s.contextLost);
  const controls = useControlsVisible();

  if (webgl === null) return <LoadingScreen />;
  if (!webgl) return <WebGLFallback />;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ViewerErrorBoundary>
        <div className="absolute inset-0">
          <HouseViewer />
        </div>
        <ViewerLoadingOverlay />
      </ViewerErrorBoundary>
      {contextLost && <ContextLostMessage />}

      <div className={`pointer-events-none absolute inset-0 flex-col gap-3 p-3 ${controls ? "flex" : "hidden"}`}>
        {walkMode ? (
          <WalkHud />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 md:justify-center">
              <MobileMenu />
              <ViewModeControls />
              <span className="w-11 md:hidden" aria-hidden />
            </div>
            <div className="hidden min-h-0 flex-1 items-start justify-between gap-3 md:flex">
              <FloorControls />
              <div className="flex max-h-full">
                <RoomInfoPanel />
              </div>
            </div>
            <div className="mt-auto hidden flex-col items-center gap-2 md:flex">
              <RenderStatus />
              <ViewerToolbar />
            </div>
            <div className="mt-auto flex flex-col items-center gap-2 md:hidden">
              <MobileRoomSheet />
              <div className="flex items-center gap-2">
                <FloorSwitcher />
                <Panel className="p-1">
                  <ResetButton compact />
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
