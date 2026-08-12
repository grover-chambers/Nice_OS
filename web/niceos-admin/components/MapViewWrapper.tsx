// MapViewWrapper is now a thin dynamic wrapper around the unified MapView.
// Use this on pages that want a filter-less embedded map (dashboard, client,
// retailers, routes, analytics). Pass only the props the page cares about.
"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function MapViewWrapper(props: MapViewProps) {
  // Inherits the default `showControls: false`, so embedded maps render clean.
  return <MapView {...props} />;
}
