import { ViewerClient } from "@/components/viewer/ViewerClient";

export default function Home() {
  return (
    <main className="flex h-dvh flex-col bg-stone-100 text-stone-900">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-stone-200 bg-white/80 px-4">
        <h1 className="text-sm font-semibold tracking-tight">G+1 Residence — 3D Model</h1>
        <p className="hidden text-xs text-stone-500 sm:block">
          Visualisation from a reference plan · not a verified CAD or structural drawing
        </p>
      </header>
      <section className="relative min-h-0 flex-1">
        <ViewerClient />
      </section>
    </main>
  );
}
