"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TERRITORY_WARDS } from "@/lib/geo/satellite-wards";
import type { WardProperties } from "@/lib/geo/nairobi-wards";
import type { Retailer } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const ZONE_COLORS: Record<string, string> = {
  Kiambu: "#4C8C40",
  Central: "#D98A2B",
  Northern: "#2E6E9E",
  Eastern: "#D4B32A",
  "South-Eastern": "#8B4C9E",
  Kajiado: "#C1447A",
};

const DENSITY_STOPS: [number, string][] = [
  [0, "#FCF3D9"],
  [1000, "#FCF3D9"],
  [5000, "#F2C572"],
  [15000, "#E08B3E"],
  [40000, "#C0522D"],
  [200000, "#7A1F1F"],
];

const COVERAGE_STOPS: [number, string][] = [
  [0, "#EEF4EC"],
  [1, "#DCEEDC"],
  [3, "#C3E3C3"],
  [6, "#8FCF8F"],
  [10, "#4FAF4F"],
  [15, "#1F7A2E"],
];

export type RouteOverlay = {
  id: string;
  line: [number, number][];
  stops?: { lat: number; lng: number; label?: string }[];
};

export type MapViewProps = {
  wardMode?: "zone" | "density" | "coverage";
  wardCounts?: Map<string, number>;
  retailers?: Retailer[];
  retailerColor?: (r: Retailer) => string;
  onRetailerClick?: (r: Retailer) => void;
  selectedRetailerId?: string | null;
  route?: RouteOverlay;
  center?: [number, number];
  zoom?: number;
  className?: string;
  overlay?: React.ReactNode;
  onWardClick?: (ward: WardProperties) => void;
  onReady?: (map: maplibregl.Map) => void;
};

function buildWardGeo(counts?: Map<string, number>) {
  return {
    ...TERRITORY_WARDS,
    features: TERRITORY_WARDS.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        active: counts?.get(f.properties.ward) ?? 0,
      },
    })),
  } as any;
}

export default function MapView({
  wardMode = "zone",
  wardCounts,
  retailers,
  retailerColor,
  onRetailerClick,
  selectedRetailerId,
  route,
  center = [-1.35, 36.87],
  zoom = 10.5,
  className,
  overlay,
  onWardClick,
  onReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [basemap, setBasemap] = useState<"minimal" | "streets">("minimal");
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  const retailerFeatures = useCallback(() => {
    if (!retailers) return null;
    return {
      type: "FeatureCollection" as const,
      features: retailers.map((r) => ({
        type: "Feature" as const,
        properties: {
          id: r.id,
          name: r.name,
          status: r.status,
          zone: r.zone,
          color: retailerColor ? retailerColor(r) : "#64748b",
          selected: r.id === selectedRetailerId ? 1 : 0,
        },
        geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] },
      })),
    };
  }, [retailers, retailerColor, selectedRetailerId]);

  const routeFeatures = useCallback(() => {
    if (!route) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: { id: route.id },
          geometry: { type: "LineString" as const, coordinates: route.line },
        },
      ],
    };
  }, [route]);

  const stopFeatures = useCallback(() => {
    if (!route?.stops) return null;
    return {
      type: "FeatureCollection" as const,
      features: route.stops.map((s, i) => ({
        type: "Feature" as const,
        properties: { label: s.label ?? String(i + 1), idx: i + 1 },
        geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
      })),
    };
  }, [route]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "basemap-minimal": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap &copy; CARTO",
            maxzoom: 19,
          },
          "basemap-streets": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
            maxzoom: 19,
          },
          wards: { type: "geojson", data: buildWardGeo(wardCounts) },
        },
        layers: [
          {
            id: "basemap-minimal-layer",
            type: "raster",
            source: "basemap-minimal",
            layout: { visibility: "visible" },
          },
          {
            id: "basemap-streets-layer",
            type: "raster",
            source: "basemap-streets",
            layout: { visibility: "none" },
          },
          {
            id: "wards-fill",
            type: "fill",
            source: "wards",
            paint: {
              "fill-color": "#CCCCCC",
              "fill-opacity": 0.7,
            },
          },
          {
            id: "wards-outline",
            type: "line",
            source: "wards",
            paint: { "line-color": "#FBFAF6", "line-width": 1.1 },
          },
        ],
      },
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
    });

    map.on("mouseenter", "wards-fill", (e) => {
      map.getCanvas().style.cursor = "pointer";
      if (e.features?.[0] && popupRef.current) {
        const p = e.features[0].properties as WardProperties;
        const active = e.features[0].properties?.active ?? 0;
        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${p.ward}</strong><br/>${p.constituency} · ${p.zone} Zone` +
              (wardMode === "coverage" ? `<br/>${active} active retailers` : "")
          )
          .addTo(map);
      }
    });
    map.on("mouseleave", "wards-fill", () => {
      map.getCanvas().style.cursor = "";
      popupRef.current?.remove();
    });

    map.on("click", "wards-fill", (e) => {
      if (e.features?.[0] && onWardClick) {
        onWardClick(e.features[0].properties as WardProperties);
      }
    });

    map.on("load", () => {
      readyRef.current = true;
      setReady(true);
      mapRef.current = map;
      onReady?.(map);
      applyWardPaint(map);
      if (!route) {
        const b = new maplibregl.LngLatBounds();
        TERRITORY_WARDS.features.forEach((f) => {
          const coords =
            f.geometry.type === "MultiPolygon"
              ? (f.geometry.coordinates as number[][][][]).flat(2)
              : (f.geometry.coordinates as number[][][]).flat(1);
          coords.forEach((c) => b.extend(c as [number, number]));
        });
        map.fitBounds(b, { padding: 30, maxZoom: 12, duration: 0 });
      }
    });

    mapRef.current = map;

    const containerEl = containerRef.current;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    if (containerEl) ro.observe(containerEl);
    requestAnimationFrame(() => map.resize());

    return () => {
      ro.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyWardPaint = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded() || !map.getLayer("wards-fill")) return;
      const fillColor =
        wardMode === "zone"
          ? (["match", ["get", "zone"], ...Object.entries(ZONE_COLORS).flatMap(([z, c]) => [z, c]), "#CCCCCC"] as any)
          : wardMode === "density"
            ? (["interpolate", ["linear"], ["get", "density"], ...DENSITY_STOPS.flat()] as any)
            : (["interpolate", ["linear"], ["get", "active"], ...COVERAGE_STOPS.flat()] as any);
      map.setPaintProperty("wards-fill", "fill-color", fillColor);
      map.setPaintProperty(
        "wards-fill",
        "fill-opacity",
        wardMode === "coverage" ? 0.78 : 0.68
      );
    },
    [wardMode]
  );

  useEffect(() => {
    if (mapRef.current && readyRef.current) applyWardPaint(mapRef.current);
  }, [applyWardPaint]);

  // Retailer markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    if (!retailers || retailers.length === 0) {
      if (map.getSource("retailers")) {
        map.removeLayer("retailers-circle");
        map.removeLayer("retailers-selected");
        map.removeSource("retailers");
      }
      return;
    }

    const features = retailerFeatures();
    if (!map.getSource("retailers")) {
      map.addSource("retailers", { type: "geojson", data: features as any });
      map.addLayer({
        id: "retailers-selected",
        type: "circle",
        source: "retailers",
        filter: ["==", ["get", "selected"], 1],
        paint: {
          "circle-radius": 11,
          "circle-color": "#0f172a",
          "circle-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "retailers-circle",
        type: "circle",
        source: "retailers",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "status"], "churned"],
            5,
            ["==", ["get", "status"], "prospect"],
            4,
            6,
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.2,
        },
      });
      map.on("click", "retailers-circle", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id && onRetailerClick) {
          const r = retailers.find((x) => x.id === id);
          if (r) onRetailerClick(r);
        }
      });
      map.on("mouseenter", "retailers-circle", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f && popupRef.current) {
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              `<strong>${f.properties.name}</strong><br/><span style="color:#64748b;text-transform:capitalize">${f.properties.status}</span>`
            )
            .addTo(map);
        }
      });
      map.on("mouseleave", "retailers-circle", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
    } else {
      (map.getSource("retailers") as maplibregl.GeoJSONSource).setData(features as any);
    }
  }, [retailerFeatures, retailers, onRetailerClick]);

  // Route overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const clean = () => {
      for (const id of ["route-line", "route-stops", "route-stop-labels"]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      for (const src of ["route-line", "route-stops"]) {
        if (map.getSource(src)) map.removeSource(src);
      }
    };

    if (!route) {
      clean();
      return;
    }

    const line = routeFeatures();
    const stops = stopFeatures();
    if (map.getSource("route-line")) {
      (map.getSource("route-line") as maplibregl.GeoJSONSource).setData(line as any);
    } else {
      map.addSource("route-line", { type: "geojson", data: line as any });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route-line",
        paint: {
          "line-color": "#2563eb",
          "line-width": 3.5,
          "line-opacity": 0.9,
          "line-dasharray": [0.5, 0.25],
        },
      });
    }

    if (stops && map.getSource("route-stops")) {
      (map.getSource("route-stops") as maplibregl.GeoJSONSource).setData(stops as any);
    } else if (stops) {
      map.addSource("route-stops", { type: "geojson", data: stops as any });
      map.addLayer({
        id: "route-stops",
        type: "circle",
        source: "route-stops",
        paint: {
          "circle-radius": 8,
          "circle-color": "#1d4ed8",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.6,
        },
      });
      map.addLayer({
        id: "route-stop-labels",
        type: "symbol",
        source: "route-stops",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 10,
          "text-font": ["Noto Sans Bold"],
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });
    }

    if (route.line.length && route.stops) {
      const bounds = new maplibregl.LngLatBounds();
      route.stops.forEach((s) => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [routeFeatures, stopFeatures, route]);

  const toggleBasemap = (b: "minimal" | "streets") => {
    const map = mapRef.current;
    if (!map) return;
    map.setLayoutProperty("basemap-minimal-layer", "visibility", b === "minimal" ? "visible" : "none");
    map.setLayoutProperty("basemap-streets-layer", "visibility", b === "streets" ? "visible" : "none");
    setBasemap(b);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
      <div ref={containerRef} className="h-full w-full" aria-label="Nairobi map" />
      <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-md border border-slate-200 bg-white/95 text-xs font-semibold shadow-sm">
        <button
          onClick={() => toggleBasemap("minimal")}
          className={cn("px-2.5 py-1.5", basemap === "minimal" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50")}
        >
          Minimal
        </button>
        <button
          onClick={() => toggleBasemap("streets")}
          className={cn("px-2.5 py-1.5", basemap === "streets" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50")}
        >
          Streets
        </button>
      </div>
      {overlay}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
          Loading map…
        </div>
      )}
    </div>
  );
}
