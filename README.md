# G+1 Residence — Interactive 3D Model

An explorable 3D model of a two-storey (G+1) house with a double-height living
room, built from a supplied ground- and first-floor reference plan.

> **Not a verified CAD or structural drawing.** Sizes come from the labels on the
> reference image, which is not drawn to scale and contains conflicts. Wall
> thicknesses, levels, roof form and opening positions are provisional
> assumptions. See [`docs/architecture-spec.md`](docs/architecture-spec.md).

## Pages

| Route | What it is |
|---|---|
| `/` | Property showcase: live 3D hero (day / dusk), key figures, highlights, rendered gallery, interactive floor plans, room schedule, specification |
| `/explore` | The full 3D viewer. Deep links: `?room=<room id>`, `?walk=1`, `?time=dusk`, `?cutaway=1` |

Property name, tagline, location, price and contact details live in
`lib/property.ts`. Anything left `null` is hidden (price shows "On request";
the enquiry section appears only once an email or phone is set). Every figure on
the page — bedrooms, areas, heights — is computed from the architectural model.

## Features

- Orbit, zoom and pan; camera presets (front, rear, left, right, top) with smooth transitions
- View modes: full 3D, exterior, ground floor, first floor, cutaway (dollhouse)
- Floor visibility, roof / walls / furniture layers, exploded floors
- Click a room (or choose it from the list) to highlight it and see its size, area, clear area, height and drawing notes
- First-person walkthrough: drag to look, WASD / arrows / on-screen pad to move, real stair climbing
- Day / Dusk lighting: physical sky, sky reflections on glass and metal, warm interior and facade lamps at dusk
- Desktop post-processing: ambient occlusion, bloom on light sources, filmic tone mapping (dropped automatically if the frame rate falls)
- Procedural textures with surface relief (render, stone, timber, concrete, tiles, lawn) mapped at true scale
- Responsive layout with touch controls on phones; loading screen, error recovery and a text fallback when WebGL is unavailable

## Stack

Next.js (App Router) · TypeScript · React Three Fiber · three.js · drei · Zustand · Tailwind CSS · Lucide

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run validate` | Geometry checks on the house model (exits non-zero on errors) |
| `npm run model -- [section] [filter]` | Compact text dump of rooms, walls, openings and furniture |
| `npm run check` | typecheck + validate + unit tests |
| `npm test` | Unit tests (model, geometry, furniture, walkthrough physics) |
| `npm run test:e2e` | Browser tests on desktop, tablet and mobile viewports (builds and starts the app) |
| `npm run render:gallery` | Re-renders `public/gallery/*.jpg` from the 3D model (needs `npm start -- -p 3123` running) |

Run `npx playwright install chromium` once before the first `test:e2e`.

## Editing the house

All dimensions live in one typed model under `lib/architecture/`:

| File | Contents |
|---|---|
| `dimensions.ts` | Overall size, wall thicknesses, levels, planning grid, footprint, void and stair well |
| `rooms.ts` | Room rectangles per floor (L-shapes are two rects) |
| `walls.ts` | Wall centrelines with door / window / vent openings |
| `stair.ts` | Stair generator (risers, winders, handrails) |
| `railings.ts` | First-floor guard rails |
| `furniture.ts` | Furniture and fixtures by room |
| `validation.ts` | Consistency checks — run `npm run validate` after any change |
| `../style/theme.ts` | Every colour, tile finish and room-kind → floor finish |

Step-by-step recipes (move a wall, add a room, place furniture, restyle) are in
[`docs/editing-guide.md`](docs/editing-guide.md).

Coordinates are metres in plan space: `x` 0 → 9 left to right seen from the
front, `z` 0 → 10 front to back. The 3D scene maps them to world space with the
house centred on the origin (`lib/architecture/geometry.ts`).

Useful URL parameters for checking views: `?hide=roof,first,walls,furniture`,
`?exploded=1`, `?time=dusk`, `?fx=0` (no post-processing),
`?cam=x,y,z&target=x,y,z`, `?stats=1` (renderer counters on
`window.__houseStats`).

## Performance notes

- Static content (walls, furniture, floors, stair) is baked into one mesh per material — about 170 draw calls for the full house, including the shadow pass.
- Rendering is on demand: frames are drawn only while the camera moves or the scene changes (continuous only in the walkthrough).
- Shadow maps are re-rendered only when the scene changes (continuously in cutaway, where walls hide as you orbit).
- Phones and tablets start with a lower pixel-ratio cap and smaller shadow maps; the pixel ratio drops further if the frame rate falls.
- three.js is loaded only on the client, in a separate chunk (~240 KB gzipped); post-processing is a further ~100 KB chunk fetched only on devices that use it.
- The environment map is rendered once per time of day from the procedural sky; no HDR files are downloaded.
- Phones skip post-processing and light only the main rooms at dusk.

## Deploying to Vercel

The app is a static Next.js page with no server code, environment variables or
external services, so it deploys with defaults:

```bash
npm i -g vercel
vercel        # preview deployment
vercel --prod # production
```

Or import the Git repository in the Vercel dashboard.
