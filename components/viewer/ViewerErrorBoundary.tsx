"use client";

import { TriangleAlert } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Catches render/runtime errors from the 3D viewer and offers recovery. */
export class ViewerErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("3D viewer error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ViewerMessage
        title="The 3D viewer ran into a problem"
        body="Something went wrong while rendering the model. Trying again usually fixes it; if not, reload the page."
        detail={this.state.error.message}
        actions={
          <>
            <button type="button" className={primary} onClick={() => this.setState({ error: null })}>
              Try again
            </button>
            <button type="button" className={secondary} onClick={() => window.location.reload()}>
              Reload page
            </button>
          </>
        }
      />
    );
  }
}

const primary =
  "rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const secondary =
  "rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function ViewerMessage({
  title,
  body,
  detail,
  actions,
  children,
}: {
  title: string;
  body: string;
  detail?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div role="alert" className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-stone-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <TriangleAlert className="size-6 text-[var(--accent)]" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-stone-900">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
        {detail && <p className="mt-3 rounded-md bg-stone-50 p-2 font-mono text-xs break-words text-stone-500">{detail}</p>}
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
        {children}
      </div>
    </div>
  );
}

export const buttonStyles = { primary, secondary };
