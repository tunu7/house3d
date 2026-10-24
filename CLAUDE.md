@AGENTS.md

# House — 3D model of a G+1 residence (Next.js + React Three Fiber)

The house is **data**: a typed model in `lib/architecture/` rendered by `components/`. Almost every
change is a data edit — find the right file below and edit it; don't explore the renderers.

## Before editing: look at the model, not the source

`npm run -s model -- [grid|rooms|walls|furniture] [filter…]` prints a compact table (ids, plan
rects, openings, furniture footprints). Filters match floor (`ground`/`first`), room id, wall id
or type. Example: `npm run -s model -- furniture gf-living`. Use this instead of reading
`rooms.ts` / `walls.ts` / `furniture.ts` in full; then open only the lines you need.

## Where things live

| Change | Edit |
|---|---|
| Move a partition / resize a band (rooms, walls, slab, void follow) | `GRID` in `lib/architecture/dimensions.ts` |
| Wall thickness, heights, sills, plinth, parapet | `DIMENSIONS` in `lib/architecture/dimensions.ts` |
| Add / remove / reshape a room, its notes, per-room floor finish | `lib/architecture/rooms.ts` |
| Walls, doors, windows, vents | `lib/architecture/walls.ts` (`door`, `win`, `opening`, `sliding` helpers) |
| First-floor slab outline (if the void / walkway changes) | `FIRST_SLAB_OUTLINE` in `lib/architecture/house.ts` |
| Void-edge / stair glass railings | `lib/architecture/railings.ts` |
| Stair | `lib/architecture/stair.ts` (generator; usually leave alone) |
| Furniture placement | `lib/architecture/furniture.ts` (`item(type, x, z, w, d, facing, extra)`) |
| New furniture *type* | union in `types/architecture.ts` → component in `components/furniture/*` → `RENDER` in `components/furniture/Furniture.tsx` |
| Colours, tiles, which floor finish each room kind gets | `lib/style/theme.ts` (only file needed for restyling) |
| Roughness / metalness / transparency | `components/architecture/materials.ts`, `components/furniture/parts.tsx` |
| Porch, steps, planters, path, rear patio | `lib/architecture/site.ts` |
| Garden, hedge, trees, street | `lib/architecture/landscape.ts` |
| Sky, sun, day/dusk lighting | `lib/viewer/atmosphere.ts` |
| Property page copy, price, contact, per-room blurbs | `lib/property.ts` |

Derived automatically — don't edit for layout changes: skirting, bathroom tiling, backsplash,
sills, curtains, light fittings (`lib/architecture/details.ts`), floor meshes, room areas,
property-page figures and floor plans.

## Conventions

- Plan metres: `x` 0→9 left→right seen from the front, `z` 0→10 front→back; negative `z` is in
  front of the house. Room rects are on partition centrelines / exterior outer faces.
- Furniture: `x,z` = plan centre, `w` across the front, `d` front-to-back, `facing` = direction the
  front points. Ids are generated as `<roomId>-<type>-<n>`.
- Opening `from/to` run along the wall's run axis in plan coords (not relative to the wall).
- Owner revisions are tagged `(R1)…(R9)` in comments; add a new `R#` row to
  `docs/architecture-spec.md` §8 for owner-requested changes.
- Renaming a room/wall/opening id: `grep -rn '"<old-id>"' app components lib tests` — ids are
  referenced by `lib/property.ts` (ROOM_COPY), `details.ts`, `railings.ts`, `Facade.tsx`,
  `Lamps.tsx`, `FloorPlan.tsx` and the unit tests.

## Verify (in this order, stop at the first failure)

`npm run -s check` = typecheck + `validate` (rooms tile the footprint, no overlaps, openings fit
their walls, furniture inside its room and clear of walls/other items) + unit tests.
The 3 `[drawing]` warnings are known, documented conflicts (C3, C5). Only run `npm run build`
or `test:e2e` when touching pages/UI. Recipes and gotchas: `docs/editing-guide.md`.

## Don't read

`package-lock.json`, `tsconfig.tsbuildinfo`, `.next/`, `public/gallery/`, `test-results/`.
`components/architecture/textures.ts` is canvas-drawing code — only open it to change a pattern;
tile colours are in `theme.ts`.
