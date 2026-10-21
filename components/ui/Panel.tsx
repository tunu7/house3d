import type { ReactNode } from "react";

/**
 * Frosted overlay panel. Re-enables pointer events inside the click-through
 * overlay layer. `solid` is for panels that stack over other panels.
 */
export function Panel({ children, className = "", solid = false }: { children: ReactNode; className?: string; solid?: boolean }) {
  return (
    <div
      className={`pointer-events-auto rounded-xl border border-stone-200/80 ${solid ? "bg-white/97" : "bg-white/85"} shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelHeading({ children }: { children: ReactNode }) {
  return <h2 className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">{children}</h2>;
}
