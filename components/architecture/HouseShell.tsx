"use client";

import { Furniture } from "@/components/furniture/Furniture";
import { InteriorLamps } from "@/components/viewer/Lamps";
import { RoomHighlight } from "@/components/viewer/RoomHighlight";
import { useViewerStore } from "@/lib/store/viewer-store";
import { EXPLODE_OFFSET } from "@/lib/viewer/constants";
import type { FloorId } from "@/types/architecture";
import { InteriorFinishes } from "./Details";
import { ExteriorWalls } from "./ExteriorWalls";
import { FloorSlab } from "./FloorSlabs";
import { InteriorWalls } from "./InteriorWalls";
import { Railings } from "./Railings";
import { Roof } from "./Roof";
import { RoomFloors } from "./RoomFloors";
import { Staircase } from "./Staircase";

function Floor({ floor, lampsAll }: { floor: FloorId; lampsAll: boolean }) {
  const visible = useViewerStore((s) => s.floors[floor]);
  const showWalls = useViewerStore((s) => s.layers.walls);
  const showFurniture = useViewerStore((s) => s.layers.furniture);
  return (
    // `userData.floor` lets room picking resolve which floor a hit belongs to.
    <group visible={visible} userData={{ floor }}>
      <FloorSlab floor={floor} />
      <RoomFloors floor={floor} />
      {showWalls && (
        <>
          <ExteriorWalls floor={floor} />
          <InteriorWalls floor={floor} />
          <InteriorFinishes floor={floor} />
        </>
      )}
      {showFurniture && <Furniture floor={floor} />}
      {/* The stair rises from the ground floor; first-floor guards edge the void and stair well. */}
      {floor === "ground" ? <Staircase /> : <Railings floor={floor} />}
      <RoomHighlight floor={floor} />
      <InteriorLamps floor={floor} all={lampsAll} />
    </group>
  );
}

export function HouseShell({ lampsAll }: { lampsAll: boolean }) {
  const exploded = useViewerStore((s) => s.exploded);
  const showRoof = useViewerStore((s) => s.layers.roof);
  const firstVisible = useViewerStore((s) => s.floors.first);
  const lift = exploded ? EXPLODE_OFFSET : 0;

  return (
    <group>
      <Floor floor="ground" lampsAll={lampsAll} />
      <group position-y={lift}>
        <Floor floor="first" lampsAll={lampsAll} />
        {showRoof && firstVisible && (
          <group position-y={lift} userData={{ floor: "first" }}>
            <Roof />
          </group>
        )}
      </group>
    </group>
  );
}
