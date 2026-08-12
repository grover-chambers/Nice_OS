// TerritoryMap is now a thin wrapper around the unified MapView.
// Pages that used <TerritoryMap /> (the territories/census/standalone views)
// now delegate here — one renderer, one set of filters. Existing call-sites
// that pass `retailers`, `standalone`, `className`, `initialZone` keep working.
"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] min-h-[560px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

type TerritoryMapCompatProps = {
  retailers?: MapViewProps["retailers"];
  className?: string;
  standalone?: boolean;
  initialZone?: string | null;
};

// Renders the full-featured map with the controls sidebar (the old TerritoryMap UX).
// For embedded choropleth-only views (dashboard / client), use MapViewWrapper.
export default function TerritoryMap({
  retailers,
  className,
  standalone,
  initialZone,
}: TerritoryMapCompatProps) {
  return (
    <MapView
      retailers={retailers}
      className={className}
      standalone={standalone}
      initialZone={initialZone}
      showControls
    />
  );
}
