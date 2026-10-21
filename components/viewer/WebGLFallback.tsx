"use client";

import { HOUSE } from "@/lib/architecture/house";
import { summarizeRoom } from "@/lib/architecture/room-info";
import { ViewerMessage } from "./ViewerErrorBoundary";

/** Shown when WebGL is unavailable: explains why, and gives the room schedule as text. */
export function WebGLFallback() {
  return (
    <ViewerMessage
      title="3D view isn't available in this browser"
      body="This model needs WebGL, which is turned off or unsupported here. Try a current version of Chrome, Edge, Firefox or Safari, and check that hardware acceleration is enabled. The room schedule is below."
    >
      {(["ground", "first"] as const).map((floor) => (
        <section key={floor} className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">{HOUSE.levels[floor].name}</h3>
          <table className="mt-1 w-full text-sm">
            <tbody>
              {HOUSE.rooms
                .filter((r) => r.floor === floor)
                .map((r) => {
                  const s = summarizeRoom(r);
                  return (
                    <tr key={r.id} className="border-t border-stone-100">
                      <td className="py-1 text-stone-700">{r.name}</td>
                      <td className="py-1 text-right text-stone-500 tabular-nums">
                        {s.sizeLabel}
                        {s.shape === "L-shaped" && <span className="text-stone-400"> (L)</span>}
                      </td>
                      <td className="py-1 pl-3 text-right text-stone-500 tabular-nums">{s.nominalArea.toFixed(2)} m²</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ))}
    </ViewerMessage>
  );
}
