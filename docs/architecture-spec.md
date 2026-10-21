# Architectural Coordinate Specification — Stage 1

Source: `Two-Storey Double-Height House Plan.png` (ground + first floor plans).
Status: **reconciled reference model, not a verified CAD/structural drawing.**

The reference image is **not drawn to scale** (horizontal ≈ 60 px/m, vertical ≈ 78 px/m;
the 3.5 m / 5.5 m columns are drawn as ≈ 3.85 m / 5.15 m). Only the written dimensions
are used; pixel positions are used only for relative placement of openings.

---

## 1. Conventions

| Item | Value |
|---|---|
| Plan coords | `px` 0 → 9.0 left → right (viewed from the front), `pz` 0 → 10.0 front → back |
| Front | Main entrance facade (bottom of the drawing) at `pz = 0` |
| World mapping | `X = px − 4.5`, `Y = up`, `Z = 5.0 − pz` (front faces +Z, house centred on origin), 1 unit = 1 m |
| Overall dims | 9.0 × 10.0 measured to the **outer face** of exterior walls (as the drawing's dimension lines show) |
| Internal grid | Partition **centrelines**: X = 3.5, 6.5; Z = 3.0, 5.5, 8.0, 8.5 |
| Room labels | Nominal grid dimensions. Clear (internal) dims are smaller by wall thickness and are computed, not stored |
| Exterior wall | 0.23 m, inner face offset inward from outer grid line (centreline at 0.115 from the edge) |
| Interior wall | 0.115 m, centred on grid line |
| GF FFL | Y 0.00 |
| FF FFL | Y 3.20 (configurable) |
| Ceiling heights | 3.00 m both floors; slab 0.15 m + finishes |
| Roof | Flat slab, top ≈ Y 6.4; 0.9 m parapet (roof form not shown in drawing — assumption) |
| Plinth | 0.45 m above ground; three 150 mm entrance steps (owner revision R1) |
| Door | 2.10 m high; 0.9 m main/bedroom, 0.7 m toilet |
| Window | Sill 0.9, head 2.1; toilet vent sill 1.6, head 2.1 |

All construction values are provisional assumptions.

## 2. Footprint

Not a full rectangle. The right column is set back at the rear:

```
pz=10 ┌──────────┐
      │ left     │
 8.5  │ column   ├───────────────┐   ← right block rear wall (derived, not dimensioned)
      │ 3.5 wide │ right column  │
      │          │ 5.5 wide      │
  0   └──────────┴───────────────┘
     px=0       3.5            9.0
```

Footprint polygon (plan, outer face): (0,0) → (9,0) → (9,8.5) → (3.5,8.5) → (3.5,10) → (0,10).
Area = 90 − 5.5 × 1.5 = **81.75 m²**.

## 3. Ground floor (nominal grid rectangles)

The left column's 1.5 m **wet strip** (px 0–1.5) stacks the plumbing on the west wall.

| Room | px | pz | Size (W×D) | Nominal m² | Notes |
|---|---|---|---|---|---|
| Bedroom 1 | 1.5–3.5 / 0–3.5 | 5.5–7.5 / 7.5–10.0 | 3.5 × 4.5 (L-shaped) | 12.75 | Toilet in its front-left corner (R6) |
| Attached toilet | 0–1.5 | 5.5–7.5 | 1.5 × 2.0 | 3.00 | Back to back with the common toilet (R6) |
| Dining (open zone) | 3.5–6.5 | 5.5–8.5 | 3.0 × 3.0 | 9.00 | Open to living; breakfast table to kitchen (R5); sliding grille back door (R2) |
| Kitchen | 6.5–9.0 | 5.5–8.5 | 2.5 × 3.0 | 7.50 | No wall to dining (R5) |
| Common toilet | 0–1.5 | 3.0–5.5 | 1.5 × 2.5 | 3.75 | Door from Bedroom 2's back-left corner (R6) |
| Stair | 1.5–3.5 | 3.0–5.5 | 2.0 × 2.5 | 5.00 | Entered from the living room (R6) |
| Bedroom 2 | 0–3.5 | 0–3.0 | 3.5 × 3.0 | 10.50 | |
| Living | 3.5–9.0 | 0–5.5 | 5.5 × 5.5 | 30.25 | Double height except under the walkway and Bedroom 2's front 1 m |
| **Total** | | | | **81.75** | = footprint ✓ |

## 4. First floor

| Room | px | pz | Size (W×D) | Nominal m² | Notes |
|---|---|---|---|---|---|
| Bedroom 1 | 0–3.5 / 1.5–3.5 | 5.5–8.0 / 8.0–10.0 | 3.5 × 4.5 (L-shaped) | 12.75 | Door from the landing |
| Attached toilet | 0–1.5 | 8.0–10.0 | 1.5 × 2.0 | 3.00 | Back-left corner, on the west wet wall (R6) |
| Bedroom 2 | 3.5–9.0 | 4.5–8.5 minus bathroom | 5.5 × 4.0 incl. bathroom | 19.00 | R3; door off the walkway (R7) |
| Bedroom 2 bathroom | 7.5–9.0 | 6.5–8.5 | 1.5 × 2.0 | 3.00 | R4 — over the kitchen |
| Stair opening | 1.5–3.5 | 3.0–5.5 | 2.0 × 2.5 | 5.00 | No slab |
| Landing | 0–1.5 | 3.0–5.5 | 1.5 × 2.5 | 3.75 | Passage to Bedroom 1, over the common toilet |
| Mini sitting area | 0–3.5 | 0–3.0 | 3.5 × 3.0 | 10.50 | No walls on its right or back (R8) |
| Walkway | 3.5–4.5 | 2.0–4.5 | 1.0 × 2.5 | 2.50 | Glass railings (R7) |
| Open to below (void) | 3.5–4.5 / 4.5–9.0 | 0–2.0 / 0–4.5 | L-shaped | 22.25 | **No slab** |
| **Total** | | | | **81.75** | ✓ |
| Balcony | 0–3.5 | −1.2–0 | 3.5 × 1.2 | 4.20 | Cantilevered outside the footprint (R8) |

## 5. Staircase

- Half-turn (U) stair in the 2.0 × 2.5 m well beside the wet strip; flights 0.94 m wide, no central well.
- Clear box px 1.56–3.44 × pz 3.06–5.44.
- Rise 3.20 m → **18 risers × 0.178 m**, 17 treads: 3 entry winders, 2 straight (east half, northbound), 6 winders (half turn), 6 straight (west half, southbound, 0.24 m going).
- Enter from the living room at the south-east corner; arrive at first-floor level in the open sitting area at the south-west.
- Handrail on the central spine; newels at both spine ends and the turn.

## 6. Openings (approximate — positions scaled from the drawing, not dimensioned)

### Ground floor doors
| Door | Wall | Span |
|---|---|---|
| Main entrance | front, pz 0 | px 3.8–4.8, under the porch canopy |
| Bedroom 1 | px 3.5 (to dining) | pz 6.0–6.9 |
| Bedroom 1 toilet | px 1.5 (from Bedroom 1) | pz 6.6–7.3 |
| Common toilet | pz 3.0 (from Bedroom 2) | px 0.35–1.05 |
| Bedroom 2 | px 3.5 (from living) | pz 1.9–2.8 |
| Dining back door | pz 8.5 | px 4.1–5.9, two-panel sliding grille (R2) |

### Ground floor windows
Front: Bedroom 2 px 0.6–2.9, living px 5.6–8.4. West: Bedroom 2 pz 1.2–2.4, toilet vents pz 4.0–4.6 and 6.3–6.9, Bedroom 1 pz 7.9–9.1. Rear: Bedroom 1 px 0.8–2.6 (sill 1.2), kitchen px 7.4–8.2. East: living pz 0.8–2.0 and 3.6–4.8, kitchen pz 7.3–8.0.

### First floor doors
| Door | Wall | Span |
|---|---|---|
| Balcony | front, pz 0 | px 0.4–3.1, two-panel sliding glass, head 2.4 (R8) |
| Bedroom 1 | pz 5.5 (from landing) | px 0.3–1.2 |
| Bedroom 1 toilet | pz 8.0 (from Bedroom 1) | px 0.4–1.1 |
| Bedroom 2 | pz 4.5 (from walkway) | px 3.65–4.4 |
| Bedroom 2 bathroom | pz 6.5 (from Bedroom 2) | px 7.7–8.4 |

### First floor windows
Front: void glazing px 4.9–8.3, sill 0.3, head 2.7, in a charcoal portal frame (R9). West: sitting pz 1.0–2.2, landing pz 3.8–4.8, Bedroom 1 pz 6.0–7.4, toilet vent pz 8.6–9.2. Rear: Bedroom 1 px 1.9–3.1, Bedroom 2 px 4.4–5.4 and 6.2–7.2, bathroom vent px 8.1–8.6. East: void pz 0.8–2.0 and 2.8–4.0, Bedroom 2 pz 5.0–6.2.

## 7. Conflict log

| # | Conflict in reference | Resolution |
|---|---|---|
| C1 | Image not to scale; columns and bands drawn at wrong proportions | Use written labels only |
| C2 | Footprint is L-shaped (right block ends ≈ pz 8.5), not 9 × 10 | Rear of right block derived from kitchen depth 3.0 above pz 5.5 |
| C3 | Bedroom 1 "3.5 × 4.5" shares its band with the toilet | Model L-shape; display gross 15.75 and net 12.75 |
| C4 | Attached toilet labelled 2.0 × 1.5 but drawn 1.5 wide × 2.0 deep | Follow drawn shape |
| C5 | Dining labelled 3.5 wide; only 3.0 between Bedroom 1 and kitchen | 3.0 × 3.0 open zone *(user decision)* |
| C6 | Stair drawn at px 1.5–3.5 on GF but px 0–2.0 on FF — cannot stack | ~~Follow FF~~ — superseded by R6: stair at px 1.5–3.5 on both floors (the GF drawing's position), common toilet restored to 1.5 × 2.5 |
| C7 | FF Bedroom 2 door opens directly onto the void edge | ~~Landing nib into the void~~ — superseded by R3: Bedroom 2 now meets the landing, door moved to the shared wall |
| C8 | Stair box 2.0 × 2.5 is tight for 3.2 m floor-to-floor | 18 risers with winders; flights now 0.94 m (R6) |
| C9 | Room labels can't be clear dims (3.5 + 5.5 + walls > 9.0) | Labels = nominal grid dims; clear dims computed |

## 8. Owner revisions

Changes requested by the owner after Stage 7. These supersede the drawing.

| # | Revision | Model change |
|---|---|---|
| R1 | House is raised; small stair at the entrance with flowers on both sides | Plinth 0.45 m; three 150 mm risers (two 300 mm treads) in front of the main door; raised flower planters either side (`lib/architecture/site.ts`) |
| R2 | Dining room has a sliding grille back door; the area behind dining and kitchen is open | Dining rear window replaced by a 1.8 m two-panel sliding grille door; paved open area in the rear notch, one step (150 mm) below the floor |
| R3 | First-floor Bedroom 2 is 5.5 × 4.0 m, not 5.5 × 3.0 m | Extended 1 m forward over the living room (pz 4.5–8.5); void reduced to 5.5 × 4.5 m; landing nib removed |
| R4 | First-floor Bedroom 2 has its own bathroom | 1.5 × 2.0 m bathroom inside the 5.5 × 4.0 m, rear-east corner over the kitchen; shower, WC, basin, vent |
| R5 | Kitchen–dining should be open, with just a table between | Kitchen–dining wall removed; counter-height breakfast table with two stools on the line |
| R6 | Common toilet at the front-left of the stair area, entered from Bedroom 2; stair arranged properly; Bedroom 1 toilets in the optimised position | Wet strip px 0–1.5: common toilet (pz 3.0–5.5, door from Bedroom 2's back-left corner), GF Bedroom 1 toilet front-left (pz 5.5–7.5), FF Bedroom 1 toilet back-left (pz 8.0–10.0; front-left would block the only way in). Stair moved to px 1.5–3.5 as a half-turn stair from the living room up to the sitting area |
| R7 | (Consequence of R6) Bedroom 2 no longer touches the landing | 1.0 × 2.5 m walkway along the void's west edge from the sitting area to Bedroom 2's front door |
| R8 | Mini sitting area: small balcony as in the photo, no walls on its right or back | Walls removed (glass railings to the void and stair well); 3.5 × 1.2 m cantilevered balcony with glass railing, timber slat screen and eave; sliding glass doors |
| R9 | Exterior should look like the owner's reference photo | Cream render, charcoal parapet coping; covered porch on stone pillars with timber soffit, downlights and door surround; wide lit steps; long stone planters with flowers and a small tree; charcoal portal frame with stone pier, timber fins and trailing planter around the first-floor glazing; white eave with timber soffit over the balcony; pale path with pebble edges and bollards; lawn |
