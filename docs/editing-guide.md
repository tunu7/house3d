# Editing guide — layout, rooms, furniture and style

How to change the house quickly. Everything you see in 3D, on the floor plans and on the
property page is generated from the typed model in `lib/architecture/` and the style tokens in
`lib/style/theme.ts`. Edit data, run the checks, look at the result.

```
types/architecture.ts         shapes of everything (Room, Wall, Opening, FurnitureItem, …)
lib/architecture/
  dimensions.ts   DIMENSIONS (construction values) + GRID (planning lines) + footprint, void, balcony, stair well
  rooms.ts        ROOMS — rectangles per floor, built from GRID
  walls.ts        WALLS — centrelines + openings, built from GRID
  house.ts        slabs (first-floor outline), roof; assembles HOUSE
  railings.ts     glass guard rails on the first floor
  stair.ts        half-turn stair generator
  furniture.ts    FURNITURE — items per room
  site.ts         porch, steps, planters, path, rear patio
  landscape.ts    plot, hedge, trees, street
  details.ts      derived trim: skirting, tiling, sills, curtains, light fittings
  validation.ts   the rules `npm run validate` checks
lib/style/theme.ts            all colours, tile finishes, room-kind → floor finish
lib/viewer/atmosphere.ts      day / dusk sky, sun, exposure
lib/property.ts               property page copy, contact, per-room blurbs, gallery list
```

## The loop

1. **See the current state** — `npm run -s model` (or a section/filter, below).
2. **Edit** the one data file for the change.
3. **Check** — `npm run -s check` (typecheck → validate → unit tests). Fix any `✗` lines.
4. **Look** — `npm run dev`, open `/explore`. Useful URLs:
   `?room=<room id>`, `?hide=roof,first,walls,furniture`, `?cutaway=1`, `?exploded=1`,
   `?time=dusk`, `?walk=1`, `?cam=x,y,z&target=x,y,z`.
5. **Gallery** (optional, when the look changed) — `npm start -- -p 3123` then
   `npm run render:gallery`.

### `npm run model`

| Command | Shows |
|---|---|
| `npm run -s model` | everything (~3k tokens) |
| `npm run -s model -- grid` | `DIMENSIONS` and `GRID` |
| `npm run -s model -- rooms first` | first-floor rooms: id, kind, floor finish, m², rects |
| `npm run -s model -- walls gf-ext` | ground-floor exterior walls and their openings |
| `npm run -s model -- furniture ff-bedroom-2` | one room's furniture with plan footprints |
| `npm run -s model -- furniture sofa` | every sofa |

Several filters are AND-ed; each matches floor, ids or type by substring.

## Coordinates

- Plan metres. `x` 0 → 9 left → right seen from the street; `z` 0 → 10 front → back.
  Negative `z` is in front of the house (porch, balcony, garden).
- Room rects sit on **partition centrelines** and **exterior outer faces**, so rooms on a floor
  tile the footprint exactly (validation enforces this). Clear sizes are computed.
- Walls are centrelines: `axis: "x"` runs along x at fixed `z = at`; `axis: "z"` runs along z at
  fixed `x = at`. Exterior walls are inset by half their thickness.
- Opening `from`/`to` are absolute plan coordinates along the wall's run axis.
- World space (three.js) is `X = x − 4.5`, `Z = 5 − z`, `Y` up — only renderers care.

## Recipes

### Move a partition or resize a band

Change the line in `GRID` (`dimensions.ts`). Rooms, walls, void, slab and railings are built from
it. Then:

- Openings in walls you moved may now fall outside them → validation names them; adjust
  `from/to` in `walls.ts`.
- Furniture may now poke through a wall → validation names it; nudge `x/z` in `furniture.ts`.
- If the void or walkway changed, update `FIRST_SLAB_OUTLINE` in `house.ts` (hand-written polygon).

### Add or split a room

1. Add a line to `GRID` if the room needs a new planning line.
2. Add the `Room` to `ROOMS` (`rooms.ts`); shrink the neighbour(s) so the floor still tiles exactly
   (L-shapes are two non-overlapping rects).
3. Add its walls with `interior(floor, id, axis, at, from, to, [openings])` in `walls.ts`, and a
   door with `door(id, from, to, hinge, swing)`.
4. Optional: `floorFinish` on the room, a blurb in `ROOM_COPY` (`lib/property.ts`), furniture.
5. `npm run -s check`.

Room `kind` drives defaults: floor finish (`ROOM_FLOOR_FINISH`), wall tiling (`toilet`),
backsplash (`kitchen`), light fitting intensity, and the property-page counts (bedrooms, baths).
`void` and `stair` get no floor.

### Remove a wall / open two rooms up

Delete the `interior(...)` entry in `walls.ts`; optionally merge the two rooms in `rooms.ts`.
Detail trim follows automatically.

### Doors and windows

In the wall's `openings` (`walls.ts`):

```ts
win("gf-w-bed2-front", 0.6, 2.9)                    // standard sill/head from DIMENSIONS
win("gf-w-bed1-rear", 0.8, 2.6, CLERESTORY_SILL)    // custom sill
opening("gf-v-common-toilet", "vent", 4.0, 4.6)     // high vent
door("gf-d-bed2", 1.9, 2.8, "end", -1)              // hinge at span end, swings toward −axis
sliding("gf-d-dining-back", 4.1, 5.9, "grille", "Back door")  // or "glass"
```

Rules (validated): opening inside the wall's span, doors start at floor level, openings on a wall
don't overlap and leave a pier between them, doors have hinge and swing. Curtains, sills and sun
hoods on exterior windows are added automatically.

### Furniture

```ts
// item(type, x, z, w, d, facing, extra?)
item("sofa", 6.5, 4.4, 2.6, 0.9, "-z")                      // front faces −z (toward the street)
item("art", 3.575, 1.0, 1.0, 0.03, "+x", { elevation: 1.25, height: 0.8 })
item("counter", 7.665, 7.97, 2.21, 0.6, "-z", { sinkAt: 0.135 })
item("shower", 0.615, 5.95, 0.77, 0.77, "+x", { screens: ["front", "right"] })
```

- `x,z` is the plan **centre**; `w` runs across the item's front, `d` front-to-back. When facing
  `±x`, the plan footprint swaps (`d` along x, `w` along z) — `npm run model -- furniture` prints
  the resulting footprint.
- To put something against a wall: footprint edge = wall centre ± half thickness
  (exterior 0.115, interior 0.0575 from the grid line).
- Validation: item inside its room, clear of walls, and no overlap with other floor-standing items
  (rugs and items with `elevation` are exempt).
- Types available: see `FurnitureType` in `types/architecture.ts`.

**New furniture type**: add it to `FurnitureType`, write a component in the matching
`components/furniture/*.tsx` (build it from `B`, `RB`, `Soft`, `Cyl`, `Lathe`, `Arch`, `Legs`,
`Books` in `parts.tsx` with `FURN` materials, local front = +Z, origin at floor centre), and
register it in `RENDER` in `Furniture.tsx`. Furniture textures (oak, walnut, fabric, rug, stone,
steel, painting) are drawn in `components/furniture/finishes.ts`; plant shapes in `plants.ts`.

### Style

All colours are in `lib/style/theme.ts`:

| Block | Controls |
|---|---|
| `ARCH_COLORS` | render, interior paint, ceilings, floorboards, plinth, roof, frames, doors, glass, lamps, planting |
| `FURNITURE_COLORS` | timbers, fabrics, accents, metals, ceramics, worktop, plants, books, towels |
| `TILE_FINISHES` | marble / kitchen / bath / backsplash tiles: base, grout, grid, variation, veining |
| `ROOM_FLOOR_FINISH` | which finish each room kind gets (`wood`, `marble`, `kitchenTile`, `bathTile`) |

One-off floor change: set `floorFinish: "wood"` on a room in `rooms.ts`.
Textured surfaces (render, lawn, path, asphalt, foliage) multiply the material colour with a
procedural texture, so the colour acts as a tint. Physical properties (roughness, metalness,
opacity) are in `components/architecture/materials.ts` and `components/furniture/parts.tsx`.
Stone and timber facade cladding are drawn in `textures.ts` (`stone`, `cladding`, `wood`).

Lighting mood (sun position, sky, exposure, lamp warmth) lives in `lib/viewer/atmosphere.ts`.

### Site and garden

`site.ts`: porch size, number of entrance steps (must add up to the plinth height — validated),
planters, path, bollards, rear patio. `landscape.ts`: plot margin, hedge, trees (`GARDEN`),
street.

### Owner revisions

Changes requested by the owner get the next `R#`: tag the code comment `(R10)` and add a row to
§8 of `docs/architecture-spec.md`; update the room/opening tables in §3–§6 if they changed.

## Gotchas

- **Ids are referenced elsewhere.** Before renaming a room, wall or opening id, grep for it:
  `lib/property.ts` (`ROOM_COPY`), `lib/architecture/details.ts` (`SHELTERED` openings, living
  pendants), `railings.ts`, `components/architecture/Facade.tsx` (front-wall features),
  `components/viewer/Lamps.tsx` (key fixtures), `components/property/FloorPlan.tsx` (default
  selection) and `tests/unit/*.test.ts`.
- **Unit tests pin some facts** (room counts, specific ids, stair walk path). If a deliberate
  layout change breaks one, update the test's expectation — don't loosen the check.
- **Known warnings.** `validate` always reports three `[drawing]` warnings (Bedroom 1 ×2, dining):
  documented conflicts C3/C5 in the spec. Anything else is new.
- **Gallery images are static.** `public/gallery/*.jpg` don't update until you re-render them.
