import { ArrowRight, BedDouble, DoorOpen, Droplets, Flower2, Footprints, Sofa, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { FloorPlan } from "@/components/property/FloorPlan";
import { Gallery } from "@/components/property/Gallery";
import { Reveal } from "@/components/property/Reveal";
import { ShowcaseHero } from "@/components/property/ShowcaseHero";
import { SiteNav } from "@/components/property/SiteNav";
import { HOUSE } from "@/lib/architecture/house";
import { summarizeRoom } from "@/lib/architecture/room-info";
import { fmtArea, PROPERTY, propertyStats, toSqft } from "@/lib/property";
import type { FloorId } from "@/types/architecture";

const stats = propertyStats();

const HIGHLIGHTS: { icon: ComponentType<{ className?: string }>; title: string; body: string }[] = [
  {
    icon: Sofa,
    title: `A ${stats.doubleHeight.toFixed(1)} m living room`,
    body: "Double-height over most of its 5.5 × 5.5 m, glazed to the front and side, and overlooked by the upstairs lounge and walkway.",
  },
  {
    icon: UtensilsCrossed,
    title: "Open kitchen and dining",
    body: "No dividing wall — just a breakfast table between them — and a sliding grille door out to the rear open area.",
  },
  {
    icon: BedDouble,
    title: `${stats.bedrooms} bedrooms, ${stats.bathrooms} bathrooms`,
    body: "Every bedroom has its own bathroom or a door straight into one. The largest is 5.5 × 4.0 m with a private bath.",
  },
  {
    icon: DoorOpen,
    title: "Lounge and balcony",
    body: "An open first-floor lounge with sliding glass doors to a cantilevered balcony under a timber soffit.",
  },
  {
    icon: Flower2,
    title: "A considered arrival",
    body: "Covered porch on stone pillars, wide lit steps and long flower planters across the front.",
  },
  {
    icon: Droplets,
    title: "Services grouped",
    body: "Three toilets share one wet wall and the fourth bathroom sits over the kitchen, keeping plumbing runs short.",
  },
];

const SPECIFICATION: { heading: string; items: string[] }[] = [
  {
    heading: "Exterior",
    items: [
      "Warm cream render with charcoal parapet coping",
      "Dark stone cladding to porch pillars, planters and the first-floor frame",
      "Timber-look cladding, soffits and vertical fins",
      "Charcoal aluminium window frames; glass balustrades",
    ],
  },
  {
    heading: "Interior finishes",
    items: [
      "Oak-look planks to bedrooms and the upstairs lounge",
      "Large-format marble-look tiles to living, dining and circulation",
      "Tiled kitchen and bathrooms",
      "Stone worktop, lacquered cabinets and chimney hood in the kitchen",
    ],
  },
  {
    heading: "Dimensions",
    items: [
      `${stats.plot.width.toFixed(1)} × ${stats.plot.depth.toFixed(1)} m overall, ${fmtArea(stats.footprint)} footprint`,
      `${HOUSE.levels.first.ffl.toFixed(1)} m floor-to-floor, ${HOUSE.dimensions.ceilingHeight.toFixed(1)} m ceilings`,
      `Half-turn stair: ${HOUSE.stair.risers} risers of ${Math.round(HOUSE.stair.riser * 1000)} mm, ${HOUSE.stair.flightWidth.toFixed(2)} m flights`,
      `Raised ${HOUSE.dimensions.plinthHeight.toFixed(2)} m above ground; three entrance steps`,
    ],
  },
];

const FLOORS: FloorId[] = ["ground", "first"];
/** Named spaces on the plans (stair wells and the void excluded). */
const SPACE_COUNT = HOUSE.rooms.filter((r) => r.kind !== "stair" && r.kind !== "void").length;

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase ${light ? "text-white/70" : "text-[var(--accent)]"}`}>{children}</p>
  );
}

export default function PropertyPage() {
  const hasContact = Boolean(PROPERTY.contact.email || PROPERTY.contact.phone);
  return (
    <div id="top" className="bg-[#f7f4ef] text-stone-900">
      <SiteNav name={PROPERTY.name} />

      <main>
        {/* Hero: live 3D at dusk. */}
        <ShowcaseHero>
          <Eyebrow light>{PROPERTY.location ?? "Two-storey family residence"}</Eyebrow>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">{PROPERTY.name}</h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">{PROPERTY.tagline}</p>
        </ShowcaseHero>

        {/* Key figures. */}
        <section aria-label="Key figures" className="border-b border-stone-200 bg-white">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-stone-200 sm:grid-cols-5">
            {[
              ["Bedrooms", String(stats.bedrooms)],
              ["Bathrooms", String(stats.bathrooms)],
              ["Floor area", `${fmtArea(stats.floorArea)}`, `${toSqft(stats.floorArea)} sq ft`],
              ["Living room height", `${stats.doubleHeight.toFixed(1)} m`],
              ["Price", PROPERTY.price ?? "On request"],
            ].map(([label, value, sub], i) => (
              <div key={label} className={`bg-white px-5 py-6 sm:px-6 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-1 font-display text-2xl tracking-tight sm:text-3xl">{value}</dd>
                {sub && <dd className="text-xs text-stone-500">{sub}</dd>}
              </div>
            ))}
          </dl>
        </section>

        {/* Overview and highlights. */}
        <section id="overview" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Overview</Eyebrow>
            <h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Generous light, a sense of height, and every room in its place.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
              Arranged over two floors on a compact {stats.plot.width.toFixed(0)} × {stats.plot.depth.toFixed(0)} m footprint, the
              house opens around a double-height living room. Bedrooms sit on both floors, each with its own bathroom close by,
              and the first floor gathers around an open lounge with a balcony to the street.
            </p>
          </Reveal>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h, i) => (
              <li key={h.title} className="bg-[#f7f4ef]">
                <Reveal delay={(i % 3) * 80} className="h-full p-7">
                  <h.icon className="size-6 text-[var(--accent)]" aria-hidden />
                  <h3 className="mt-5 font-display text-xl tracking-tight">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{h.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* Gallery. */}
        <section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-20 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Gallery</Eyebrow>
                <h2 id="gallery-title" className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
                  Day into evening
                </h2>
              </div>
              <p className="max-w-sm text-sm text-stone-500">Every image is rendered from the same 3D model you can explore.</p>
            </Reveal>
            <Reveal>
              <Gallery />
            </Reveal>
          </div>
        </section>

        {/* Floor plans. */}
        <section id="plans" aria-labelledby="plans-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="mb-10">
            <Eyebrow>Floor plans</Eyebrow>
            <h2 id="plans-title" className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Two floors, {SPACE_COUNT} spaces
            </h2>
          </Reveal>
          <Reveal>
            <FloorPlan />
          </Reveal>
        </section>

        {/* Room schedule. */}
        <section aria-labelledby="schedule-title" className="border-y border-stone-200 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <Eyebrow>Room schedule</Eyebrow>
              <h2 id="schedule-title" className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                Every room, measured
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              {FLOORS.map((floor) => (
                <Reveal key={floor}>
                  <table className="w-full text-sm">
                    <caption className="pb-3 text-left font-display text-xl">{HOUSE.levels[floor].name}</caption>
                    <thead className="sr-only">
                      <tr>
                        <th>Room</th>
                        <th>Size</th>
                        <th>Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HOUSE.rooms
                        .filter((r) => r.floor === floor && r.kind !== "stair" && r.kind !== "void")
                        .map((r) => {
                          const s = summarizeRoom(r);
                          return (
                            <tr key={r.id} className="border-t border-stone-100">
                              <td className="py-2.5 pr-3">
                                <Link href={`/explore?room=${r.id}`} className="hover:text-[var(--accent)]">
                                  {r.name}
                                </Link>
                              </td>
                              <td className="py-2.5 pr-3 text-stone-500 tabular-nums">
                                {s.sizeLabel}
                                {s.shape === "L-shaped" && <span className="text-stone-400"> (L)</span>}
                              </td>
                              <td className="py-2.5 text-right tabular-nums">{s.nominalArea.toFixed(2)} m²</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Specification. */}
        <section id="specification" aria-labelledby="spec-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Specification</Eyebrow>
            <h2 id="spec-title" className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Materials and measures
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {SPECIFICATION.map((group, i) => (
              <Reveal key={group.heading} delay={i * 80}>
                <h3 className="border-b border-stone-300 pb-3 font-display text-xl">{group.heading}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-600">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Experience call to action. */}
        <section className="relative overflow-hidden bg-[#1b1d24] text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gallery/double-height.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
            <Reveal>
              <Eyebrow light>Virtual tour</Eyebrow>
              <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight tracking-tight sm:text-6xl">Step inside.</h2>
              <p className="mt-4 max-w-lg text-white/75">
                Walk up the stair, look down from the lounge, switch to dusk, or cut the house open to see both floors at once.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/explore?walk=1"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-stone-900 hover:bg-stone-100"
                >
                  <Footprints className="size-4" aria-hidden />
                  Start the walkthrough
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-sm font-medium hover:bg-white/10"
                >
                  Open the 3D model
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Enquiries: shown only once contact details are configured in lib/property.ts. */}
        {hasContact && (
          <section aria-labelledby="enquire-title" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow>Enquiries</Eyebrow>
                <h2 id="enquire-title" className="mt-3 font-display text-4xl tracking-tight">
                  Arrange a private viewing
                </h2>
                {PROPERTY.contact.name && <p className="mt-3 text-stone-600">{PROPERTY.contact.name}</p>}
              </div>
              <div className="flex flex-wrap gap-3">
                {PROPERTY.contact.email && (
                  <a href={`mailto:${PROPERTY.contact.email}`} className="inline-flex min-h-12 items-center rounded-full bg-stone-900 px-6 text-sm font-medium text-white hover:bg-stone-700">
                    {PROPERTY.contact.email}
                  </a>
                )}
                {PROPERTY.contact.phone && (
                  <a href={`tel:${PROPERTY.contact.phone.replace(/\s/g, "")}`} className="inline-flex min-h-12 items-center rounded-full border border-stone-300 px-6 text-sm font-medium hover:bg-white">
                    {PROPERTY.contact.phone}
                  </a>
                )}
              </div>
            </Reveal>
          </section>
        )}
      </main>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-display text-base text-stone-800">{PROPERTY.name}</p>
          <p className="max-w-xl">
            Images and plans are generated from a 3D visualisation of a reference plan. They are illustrative and are not a
            verified CAD, structural or survey drawing.
          </p>
        </div>
      </footer>
    </div>
  );
}
