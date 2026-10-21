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
| Roof | Flat slab, top ≈ Y 6.35; optional 0.9 m parapet (roof form not shown in drawing — assumption) |
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

| Room | px | pz | Size (W×D) | Nominal m² | Notes |
|---|---|---|---|---|---|
| Bedroom 1 | 0–3.5 | 5.5–10.0 | 3.5 × 4.5 (L-shaped) | 12.75 | Gross 15.75 minus attached toilet |
| Attached toilet | 2.0–3.5 | 8.0–10.0 | 1.5 × 2.0 | 3.00 | Drawn 1.5 wide × 2.0 deep (label reads 2.0 × 1.5) |
| Dining (open zone) | 3.5–6.5 | 5.5–8.5 | 3.0 × 3.0 | 9.00 | Label says 3.5 × 3.0; only 3.0 available. No walls to living |
| Kitchen | 6.5–9.0 | 5.5–8.5 | 2.5 × 3.0 | 7.50 | Enclosed |
| Stair | 0–2.0 | 3.0–5.5 | 2.0 × 2.5 | 5.00 | **Revised** — stacked with first floor |
| Stair lobby | 2.0–3.5 | 3.0–4.0 | 1.5 × 1.0 | 1.50 | **Revised** — open to living at px 3.5 |
| Common toilet | 2.0–3.5 | 4.0–5.5 | 1.5 × 1.5 | 2.25 | **Revised** from 1.5 × 2.5 at px 0–1.5; no exterior wall → exhaust fan |
| Bedroom 2 | 0–3.5 | 0–3.0 | 3.5 × 3.0 | 10.50 | |
| Living (double height) | 3.5–9.0 | 0–5.5 | 5.5 × 5.5 | 30.25 | |
| **Total** | | | | **81.75** | = footprint ✓ |

## 4. First floor

| Room | px | pz | Size (W×D) | Nominal m² | Notes |
|---|---|---|---|---|---|
| Bedroom 1 | 0–3.5 | 5.5–10.0 | 3.5 × 4.5 (L-shaped) | 12.75 | Stacked on GF Bedroom 1 |
| Attached toilet | 2.0–3.5 | 8.0–10.0 | 1.5 × 2.0 | 3.00 | Stacked (plumbing) |
| Bedroom 2 | 3.5–9.0 | 5.5–8.5 | 5.5 × 3.0 | 16.50 | Over dining + kitchen |
| Stair opening | 0–2.0 | 3.0–5.5 | 2.0 × 2.5 | 5.00 | No slab |
| Landing | 2.0–3.5 | 3.0–5.5 | 1.5 × 2.5 | 3.75 | |
| Landing nib | 3.5–4.6 | 4.4–5.5 | 1.1 × 1.1 | (1.21) | **Added** — see conflict C7 |
| Mini sitting area | 0–3.5 | 0–3.0 | 3.5 × 3.0 | 10.50 | Over GF Bedroom 2 |
| Open to below (void) | 3.5–9.0 | 0–5.5 | 5.5 × 5.5 minus nib | 29.04 | **No slab mesh.** Guard rail 1.0 m on open edges |
| **Total** | | | | **81.75** | ✓ |

## 5. Staircase

- Three-flight U stair around a narrow well, open side facing east (px 2.0).
- Clear box ≈ px 0.23–2.0 × pz 3.06–5.44 (1.77 × 2.38).
- Rise 3.20 m → **18 risers × 0.178 m**; walking-line length ≈ 4.3 m → 17 goings × ≈ 0.25 m.
- Flight width 0.80 m with **winders at both turns** (needed to fit; narrower than typical comfort guidance — check local code).
- Foot: GF lobby at px 2.0, pz 3.0–3.8, climbing west. Head: FF landing at px 2.0, pz 4.7–5.5, arriving east.

## 6. Openings (approximate — positions scaled from the drawing, not dimensioned)

### Ground floor doors
| Door | Wall | Span |
|---|---|---|
| Main entrance | front, pz 0 | px 3.8–4.8 |
| Bedroom 1 | px 3.5 (to dining) | pz 6.0–6.9 |
| Attached toilet | pz 8.0 (from Bedroom 1) | px 2.6–3.3 |
| Kitchen | px 6.5 (to dining) | pz 5.8–6.7 |
| Common toilet | pz 4.0 (from lobby) | px 2.6–3.3 |
| Bedroom 2 | px 3.5 (from living) | pz 2.0–2.9 |

### Ground floor windows
| Window | Wall | Span |
|---|---|---|
| Bedroom 1 rear | pz 10 | px 0.6–1.8 |
| Bedroom 1 side | px 0 | pz 7.4–8.6 |
| Attached toilet vent | pz 10 | px 2.4–3.0 |
| Stair | px 0 | pz 3.8–4.6, sill 2.0 / head 2.8 to clear the west flight (former common-toilet window position) |
| Bedroom 2 side | px 0 | pz 1.4–2.4 |
| Bedroom 2 front | pz 0 | px 0.9–2.1 |
| Living front | pz 0 | px 5.6–7.6 |
| Living side ×2 | px 9 | pz 0.8–2.0, 4.2–5.2 |
| Dining rear | pz 8.5 | px 4.6–5.4 |
| Kitchen rear | pz 8.5 | px 7.4–8.2 |
| Kitchen side | px 9 | pz 7.3–8.0 |

### First floor doors
| Door | Wall | Span |
|---|---|---|
| Bedroom 1 | pz 5.5 (from landing) | px 2.5–3.4 |
| Attached toilet | pz 8.0 | px 2.6–3.3 |
| Bedroom 2 | pz 5.5 (from nib) | px 3.6–4.5 |
| Mini sitting | pz 3.0 (from landing) | px 2.5–3.4 |

### First floor windows
Bedroom 1 and toilet as GF. Bedroom 2 rear pz 8.5: px 4.6–5.6, 6.9–7.9; side px 9: pz 6.6–7.6.
Mini sitting: side px 0 pz 1.4–2.4, front pz 0 px 0.9–2.1. Stair side px 0 pz 3.8–4.6.
Void upper glazing (Y 3.2–6.2 zone): front px 5.6–7.6, side px 9 pz 0.8–2.0 and 4.2–5.2.

## 7. Conflict log

| # | Conflict in reference | Resolution |
|---|---|---|
| C1 | Image not to scale; columns and bands drawn at wrong proportions | Use written labels only |
| C2 | Footprint is L-shaped (right block ends ≈ pz 8.5), not 9 × 10 | Rear of right block derived from kitchen depth 3.0 above pz 5.5 |
| C3 | Bedroom 1 "3.5 × 4.5" shares its band with the toilet | Model L-shape; display gross 15.75 and net 12.75 |
| C4 | Attached toilet labelled 2.0 × 1.5 but drawn 1.5 wide × 2.0 deep | Follow drawn shape |
| C5 | Dining labelled 3.5 wide; only 3.0 between Bedroom 1 and kitchen | 3.0 × 3.0 open zone *(user decision)* |
| C6 | Stair drawn at px 1.5–3.5 on GF but px 0–2.0 on FF — cannot stack | Follow FF; GF common toilet becomes 1.5 × 1.5 at px 2.0–3.5 with a 1.5 × 1.0 lobby *(user decision)* |
| C7 | FF Bedroom 2 door opens directly onto the void edge | Add 1.1 × 1.1 landing nib projecting into the void corner (minimum addition needed for access) |
| C8 | Stair box 2.0 × 2.5 is tight for 3.2 m floor-to-floor | 18 risers with winders, 0.8 m flights; flagged |
| C9 | Room labels can't be clear dims (3.5 + 5.5 + walls > 9.0) | Labels = nominal grid dims; clear dims computed |
