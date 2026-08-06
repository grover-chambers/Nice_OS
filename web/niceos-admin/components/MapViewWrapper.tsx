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
  return <MapView {...props} />;
}
