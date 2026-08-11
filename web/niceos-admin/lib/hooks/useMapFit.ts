"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";
import type maplibregl from "maplibre-gl";

export function useMapFit(
  mapRef: MutableRefObject<maplibregl.Map | null>,
  containerRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => mapRef.current?.resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    const timers = [
      window.setTimeout(resize, 60),
      window.setTimeout(resize, 250),
      window.setTimeout(resize, 700),
    ];

    window.addEventListener("resize", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
