import { polygonArea, roomArea } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { Room } from "@/types/architecture";

/**
 * Marketing details for the property page. Everything here is editable;
 * anything left `null` is simply not shown. Nothing is invented: figures on
 * the page come from the architectural model (see `propertyStats`).
 */
export const PROPERTY = {
  name: "The G+1 Residence",
  tagline: "A light-filled family home around a double-height living room.",
  /** e.g. "Whitefield, Bengaluru". Hidden when null. */
  location: null as string | null,
  /** e.g. "₹ 1.85 Cr". Shown as "Price on request" when null. */
  price: null as string | null,
  /** Enquiry contact. The enquiry section is hidden until at least one is set. */
  contact: {
    name: null as string | null,
    email: null as string | null,
    phone: null as string | null,
  },
} as const;

const sum = (rooms: Room[]) => rooms.reduce((s, r) => s + roomArea(r), 0);
const ofKind = (...kinds: Room["kind"][]) => HOUSE.rooms.filter((r) => kinds.includes(r.kind));

/** Headline figures derived from the model, so the page can never disagree with it. */
export function propertyStats() {
  const footprint = polygonArea(HOUSE.footprint);
  const firstFloorUsable = sum(HOUSE.rooms.filter((r) => r.floor === "first" && !["void", "stair", "balcony"].includes(r.kind)));
  const groundUsable = sum(HOUSE.rooms.filter((r) => r.floor === "ground" && r.kind !== "stair"));
  const living = HOUSE.rooms.find((r) => r.id === "gf-living");
  return {
    bedrooms: ofKind("bedroom").length,
    bathrooms: ofKind("toilet").length,
    floors: 2,
    footprint,
    /** Floor area excluding the void and stair wells (grid dimensions). */
    floorArea: groundUsable + firstFloorUsable,
    balcony: sum(ofKind("balcony")),
    doubleHeight: HOUSE.levels.first.ffl + HOUSE.levels.first.ceilingHeight,
    livingArea: living ? roomArea(living) : 0,
    plot: { width: HOUSE.dimensions.overallWidth, depth: HOUSE.dimensions.overallDepth },
  };
}

export const fmtArea = (m2: number) => `${m2.toFixed(m2 >= 100 ? 0 : 1)} m²`;
export const toSqft = (m2: number) => Math.round(m2 * 10.7639).toLocaleString("en-IN");

/** One-line descriptions for the floor-plan card, keyed by room id. Factual: features present in the model. */
export const ROOM_COPY: Record<string, string> = {
  "gf-living": "The heart of the home: 6.2 m high over most of the room, with tall glazing to the front and side and the stair rising from one corner.",
  "gf-dining": "Opens onto the living room and, across a breakfast table, the kitchen. A sliding grille door leads out to the rear open area.",
  "gf-kitchen": "L-shaped counter with the sink under the window, hob with chimney hood, tall fridge and a breakfast table facing the dining area.",
  "gf-bedroom-1": "Ground-floor bedroom with its own toilet, windows on two sides and a full-height wardrobe.",
  "gf-attached-toilet": "En-suite with shower, WC and wall-hung basin.",
  "gf-bedroom-2": "Front bedroom with a wide window to the garden and direct access to the common toilet.",
  "gf-common-toilet": "Shower, WC and basin, with a window to the side.",
  "ff-bedroom-1": "Upstairs bedroom with an en-suite, windows on two sides and a wardrobe wall.",
  "ff-attached-toilet": "En-suite with shower, WC and basin.",
  "ff-bedroom-2": "The largest bedroom: 5.5 × 4.0 m including its own bathroom, with windows on two sides and a reading corner.",
  "ff-bathroom": "Private bathroom for Bedroom 2 with shower, WC and basin.",
  "ff-sitting": "An open lounge overlooking the double-height living room, with sliding glass doors to the balcony.",
  "ff-landing": "Light-filled passage to Bedroom 1, with a window to the side.",
  "ff-walkway": "A glass-railed walkway along the edge of the double-height space, leading to Bedroom 2.",
  "ff-void": "The upper half of the double-height living room, framed by full-height glazing at the front.",
  "ff-balcony": "Cantilevered balcony with a glass railing, timber screen and a covered soffit with downlights.",
};

/**
 * Gallery renders, captured from the 3D model itself by `npm run render:gallery`
 * (camera and lighting for each are defined in scripts/render-gallery.mjs).
 */
export const GALLERY = [
  { src: "/gallery/exterior-dusk.jpg", alt: "Front of the house at dusk with the porch, planters and balcony lit", caption: "Front elevation at dusk" },
  { src: "/gallery/exterior-day.jpg", alt: "Three-quarter view of the house by day", caption: "By day" },
  { src: "/gallery/living.jpg", alt: "Living room looking towards the dining area", caption: "Living room" },
  { src: "/gallery/double-height.jpg", alt: "Double-height living room looking up to the first-floor walkway", caption: "Double-height space" },
  { src: "/gallery/kitchen.jpg", alt: "Open kitchen with breakfast table and dining area", caption: "Kitchen and dining" },
  { src: "/gallery/lounge.jpg", alt: "First-floor lounge opening onto the balcony", caption: "First-floor lounge" },
  { src: "/gallery/bedroom.jpg", alt: "First-floor Bedroom 2", caption: "Bedroom 2" },
  { src: "/gallery/cutaway.jpg", alt: "Cutaway view showing both floors at dusk", caption: "Both floors, cut away" },
] as const;
