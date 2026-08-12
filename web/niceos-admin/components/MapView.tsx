"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ExternalLink, Maximize2, Minimize2, Settings2 } from "lucide-react";
import { TERRITORY_WARDS } from "@/lib/geo/satellite-wards";
import { WARD_ZONES, type WardProperties } from "@/lib/geo/nairobi-wards";
import { NAIROBI_CORRIDORS } from "@/lib/geo/nairobi-corridors";
import { CENSUS_AREAS } from "@/lib/data/census";
import { retailerStatusMeta, zoneColor } from "@/lib/status";
import { useMapFit } from "@/lib/hooks/useMapFit";
import { basemapStyleUrl, type BasemapStyle, DEFAULT_BASEMAP } from "@/lib/geo/basemap";
import type { Retailer } from "@/lib/data/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants — ward colors, choropleth stops, corridor styling. Single source
// of truth (previously duplicated between TerritoryMap.tsx and MapView.tsx).
// ---------------------------------------------------------------------------

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

const ROAD_STYLE: Record<string, { color: string; weight: number; dash?: number[] }> = {
  highway: { color: "#C0392B", weight: 4 },
  arterial: { color: "#D9713C", weight: 3 },
  bypass: { color: "#8B4C9E", weight: 3, dash: [8, 5] },
};

const CORRIDOR_FEATURES = NAIROBI_CORRIDORS.map((c) => ({
  type: "Feature",
  properties: { name: c.name, type: c.type },
  geometry: { type: "LineString", coordinates: c.coords },
}));

const emptyFC = { type: "FeatureCollection" as const, features: [] as any[] };

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function buildWardGeo(counts?: Map<string, number>) {
  return {
    ...TERRITORY_WARDS,
    features: TERRITORY_WARDS.features.map((f) => ({
      ...f,
      properties: { ...f.properties, active: counts?.get(f.properties.ward) ?? 0 },
    })),
  } as any;
}

function zoneBounds(zone: string): [number, number][] {
  const coords: [number, number][] = [];
  for (const f of TERRITORY_WARDS.features) {
    if (f.properties.zone !== zone) continue;
    const c =
      f.geometry.type === "MultiPolygon"
        ? (f.geometry.coordinates as number[][][][]).flat(2)
        : (f.geometry.coordinates as number[][][]).flat(1);
    coords.push(...(c as [number, number][]));
  }
  return coords;
}

// ---------------------------------------------------------------------------
// Public types — what pages pass in. All optional except `className`.
// Each page passes only the props that matter for its view.
// ---------------------------------------------------------------------------

export type WardMode = "zone" | "density" | "coverage";

export type RouteOverlay = {
  id: string;
  line: [number, number][];
  stops?: { lat: number; lng: number; label?: string }[];
};

export type MapViewProps = {
  /**@c Ward choropleth mode. Defaults to "zone" when retailers are present, else "coverage". */
  wardMode?: WardMode;
  /** Pre-aggregated active retailer counts per ward — used for `wardMode="coverage"`. */
  wardCounts?: Map<string, number>;
  /** Retailer pins to render. Omit to render no retailer layer. */
  retailers?: Retailer[];
  /** Function returning a color per retailer. Default uses retailerStatusMeta. */
  retailerColor?: (r: Retailer) => string;
  /** Called when a retailer pin is clicked. */
  onRetailerClick?: (r: Retailer) => void;
  /** Highlight one retailer by id (drawn as a dark selected circle behind). */
  selectedRetailerId?: string | null;
  /** A polyline + ordered stops drawn on top of the map (route detail view). */
  route?: RouteOverlay;
  /** Called when a ward fill is clicked. */
  onWardClick?: (ward: WardProperties) => void;
  /** Fires once the MapLibre map has loaded. */
  onReady?: (map: maplibregl.Map) => void;
  /** Initial viewport. Defaults to metro Nairobi at z10.5. */
  center?: [number, number];
  zoom?: number;
  /** Inline React node pinned over the map (legends, badges). */
  overlay?: React.ReactNode;

  // ---- Filters panel control (the sidebar in the territories/standalone views)
  /** Show the controls sidebar. Default false (pages that already have their own sidebar pass false). */
  showControls?: boolean;
  /** Show census area pins (default true only when no retailers passed — census page convention). */
  showCensusAreas?: boolean;
  /** Show the corridors overlay toggle in the controls panel. Default true (only relevant when showControls=true). */
  allowCorridors?: boolean;
  /** Initial zone to zoom to on load (territories page with ?zone=Central). */
  initialZone?: string | null;

  // ---- Standalone chrome
  /** Full-screen variant: no controls sidebar, no expand button, no border radius. Used by /map. */
  standalone?: boolean;
  /** OpenFreeMap style. Positron (clean) by default; pass "liberty" for rich street context. */
  basemap?: BasemapStyle;

  className?: string;
};

export default function MapView({
  wardMode: wardModeProp,
  wardCounts: wardCountsProp,
  retailers,
  retailerColor,
  onRetailerClick,
  selectedRetailerId,
  route,
  onWardClick,
  onReady,
  center = [-1.35, 36.87],
  zoom = 10.5,
  overlay,
  showControls = false,
  showCensusAreas,
  allowCorridors = true,
  initialZone = null,
  standalone = false,
  basemap = DEFAULT_BASEMAP,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const applyPaintRef = useRef<() => void>(() => {});
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Default wardMode: "zone" if retailers supplied (territories/retailers), else "coverage" (dashboard/CEO overview).
  const defaultWardMode: WardMode = retailers ? "zone" : "coverage";
  const wardMode = wardModeProp ?? defaultWardMode;

  // Internal control state for the controls panel
  const [mode, setMode] = useState<WardMode>(wardMode);
  const [outlineOnly, setOutlineOnly] = useState(false);
  const [showCorridors, setShowCorridors] = useState(false);
  const [showRetailers, setShowRetailers] = useState(true);
  const [showCensus, setShowCensus] = useState(
    showCensusAreas ?? (!retailers && (showControls || standalone))
  );
  const [activeZone, setActiveZone] = useState<string | null>(
    initialZone && (WARD_ZONES as readonly string[]).includes(initialZone) ? initialZone : null
  );
  const [selectedWard, setSelectedWard] = useState<WardProperties | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  // Coalesce ward counts from explicit prop OR from retailers list (active ones only).
  const wardCounts = useMemo(() => {
    if (wardCountsProp) return wardCountsProp;
    const m = new Map<string, number>();
    retailers?.forEach((r) => {
      if (r.status === "active" || r.status === "at-risk") {
        m.set(r.ward, (m.get(r.ward) ?? 0) + 1);
      }
    });
    return m;
  }, [wardCountsProp, retailers]);

  const wardGeo = useMemo(() => buildWardGeo(wardCounts), [wardCounts]);

  const retailerFeatures = useMemo(() => {
    if (!retailers) return null;
    return {
      type: "FeatureCollection" as const,
      features: retailers.map((r) => ({
        type: "Feature" as const,
        properties: {
          id: r.id,
          name: r.name,
          status: r.status,
          ward: r.ward,
          color: retailerColor ? retailerColor(r) : retailerStatusMeta[r.status]?.dot ?? "#64748b",
          selected: r.id === selectedRetailerId ? 1 : 0,
        },
        geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] },
      })),
    };
  }, [retailers, retailerColor, selectedRetailerId]);

  const censusAreaFeatures = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: CENSUS_AREAS.map((a) => ({
        type: "Feature" as const,
        properties: {
          name: a.name,
          zone: a.zone,
          shops: a.shops,
          color: zoneColor(a.zone),
        },
        geometry: { type: "Point" as const, coordinates: [a.lng, a.lat] },
      })),
    }),
    []
  );

  const routeFeatures = useMemo(() => {
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

  const stopFeatures = useMemo(() => {
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

  // ---------- Paint (wards) ----------
  const applyPaint = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer("wards-fill")) return;

    const baseOpacity = 0.72;
    const dimOpacity = 0.08;
    const fillOpacity = outlineOnly
      ? 0.04
      : activeZone
        ? (["case", ["==", ["get", "zone"], activeZone], baseOpacity, dimOpacity] as any)
        : mode === "coverage"
          ? 0.78
          : baseOpacity;

    const fillColor =
      mode === "zone"
        ? (["match", ["get", "zone"], ...Object.entries(ZONE_COLORS).flatMap(([z, c]) => [z, c]), "#CCCCCC"] as any)
        : mode === "density"
          ? (["interpolate", ["linear"], ["get", "density"], ...DENSITY_STOPS.flat()] as any)
          : (["interpolate", ["linear"], ["get", "active"], ...COVERAGE_STOPS.flat()] as any);

    map.setPaintProperty("wards-fill", "fill-color", fillColor);
    map.setPaintProperty("wards-fill", "fill-opacity", fillOpacity as any);
  }, [mode, outlineOnly, activeZone]);

  useEffect(() => {
    applyPaintRef.current = applyPaint;
  }, [applyPaint]);

  useEffect(() => {
    applyPaint();
  }, [applyPaint]);

  // ---------- Map init ----------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyleUrl(basemap),
      center,
      zoom,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
    });

    map.on("load", () => {
      // ---- Add all data sources ----
      map.addSource("wards", { type: "geojson", data: wardGeo });
      map.addSource("corridors", {
        type: "geojson",
        data: { type: "FeatureCollection", features: CORRIDOR_FEATURES } as any,
      });
      map.addSource("retailers", {
        type: "geojson",
        data: (retailerFeatures ?? emptyFC) as any,
      });
      map.addSource("censusAreas", { type: "geojson", data: censusAreaFeatures as any });
      if (route) {
        map.addSource("route-line", { type: "geojson", data: routeFeatures as any });
        if (stopFeatures) {
          map.addSource("route-stops", { type: "geojson", data: stopFeatures as any });
        }
      }

      // ---- Layers — order matters; ward fill sits ON TOP of the basemap so the
      // choropleth is visible, but with the basemap's own roads showing through
      // where the ward fill is transparent / outline-mode.
      map.addLayer({
        id: "corridors-line",
        type: "line",
        source: "corridors",
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "none",
        },
        paint: {
          "line-color": ["match", ["get", "type"], "highway", "#C0392B", "arterial", "#D9713C", "bypass", "#8B4C9E", "#D9713C"],
          "line-width": ["match", ["get", "type"], "highway", 4, "arterial", 3, "bypass", 3, 3],
          "line-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "wards-fill",
        type: "fill",
        source: "wards",
        paint: { "fill-color": "#CCCCCC", "fill-opacity": 0.72 },
      });
      map.addLayer({
        id: "wards-outline",
        type: "line",
        source: "wards",
        paint: { "line-color": "#FBFAF6", "line-width": 1.1, "line-opacity": 1 },
      });
      map.addLayer({
        id: "census-areas-circle",
        type: "circle",
        source: "censusAreas",
        layout: { visibility: showCensus ? "visible" : "none" },
        paint: {
          "circle-radius": 6,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1.8,
        },
      });
      map.addLayer({
        id: "census-areas-symbol",
        type: "symbol",
        source: "censusAreas",
        layout: {
          visibility: showCensus ? "visible" : "none",
          "text-field": ["get", "name"],
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-size": 11,
          "text-font": ["Noto Sans Bold"],
        },
        paint: {
          "text-color": "#1F2937",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1.5,
        },
      });
      map.addLayer({
        id: "retailers-selected",
        type: "circle",
        source: "retailers",
        filter: ["==", ["get", "selected"], 1],
        layout: { visibility: showRetailers && retailerFeatures ? "visible" : "none" },
        paint: { "circle-radius": 11, "circle-color": "#0f172a", "circle-opacity": 0.9 },
      });
      map.addLayer({
        id: "retailers-circle",
        type: "circle",
        source: "retailers",
        layout: { visibility: showRetailers && retailerFeatures ? "visible" : "none" },
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "status"], "churned"], 5,
            ["==", ["get", "status"], "prospect"], 4,
            6,
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.2,
        },
      });
      if (route && routeFeatures) {
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
      if (route && stopFeatures) {
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

      // ---- Interactions ----
      map.on("mouseenter", "wards-fill", (e: any) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features?.[0] && popupRef.current) {
          const p = e.features[0].properties as WardProperties;
          const active = e.features[0].properties?.active ?? 0;
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              `<strong>${p.ward}</strong><br/>${p.constituency} · ${p.zone} Zone` +
                (mode === "coverage" ? `<br/>${active} active retailers` : "")
            )
            .addTo(map);
        }
      });
      map.on("mouseleave", "wards-fill", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
      map.on("click", "wards-fill", (e: any) => {
        if (e.features?.[0]) {
          const wp = e.features[0].properties as WardProperties;
          setSelectedWard(wp);
          onWardClick?.(wp);
        }
      });

      map.on("mouseenter", "retailers-circle", (e: any) => {
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
      map.on("click", "retailers-circle", (e: any) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) {
          const r = retailers?.find((x) => x.id === id);
          if (r && onRetailerClick) {
            onRetailerClick(r);
          } else {
            window.location.href = `/retailers/${id}`;
          }
        }
      });

      map.on("mouseenter", "census-areas-circle", (e: any) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f && popupRef.current) {
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              `<strong>${f.properties.name}</strong><br/><span style="color:#64748b">${f.properties.zone} zone · ~${f.properties.shops} shops target</span>`
            )
            .addTo(map);
        }
      });
      map.on("mouseleave", "census-areas-circle", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
      map.on("click", "census-areas-circle", (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const g = f.geometry as { type: string; coordinates: [number, number] };
        if (g.type !== "Point") return;
        map.easeTo({ center: g.coordinates, zoom: Math.max(map.getZoom(), 13.5), duration: 700 });
      });

      readyRef.current = true;
      setReady(true);
      mapRef.current = map;
      onReady?.(map);
      map.resize();
      applyPaintRef.current();

      // Fit to either the active zone or the full metro bounds (no route case)
      const zoomTo = () => {
        const b = new maplibregl.LngLatBounds();
        TERRITORY_WARDS.features.forEach((f) => {
          const coords =
            f.geometry.type === "MultiPolygon"
              ? (f.geometry.coordinates as number[][][][]).flat(2)
              : (f.geometry.coordinates as number[][][]).flat(1);
          coords.forEach((c) => b.extend(c as [number, number]));
        });
        map.fitBounds(b, { padding: 30, maxZoom: 12, duration: 0 });
      };

      if (route?.stops?.length) {
        const b = new maplibregl.LngLatBounds();
        route.stops.forEach((s) => b.extend([s.lng, s.lat]));
        map.fitBounds(b, { padding: 60, maxZoom: 14, duration: 0 });
      } else if (activeZone) {
        const pts = zoneBounds(activeZone);
        if (pts.length > 0) {
          const b = new maplibregl.LngLatBounds();
          pts.forEach((c) => b.extend(c));
          map.fitBounds(b, { padding: 60, maxZoom: 13, duration: 0 });
        } else {
          zoomTo();
        }
      } else {
        zoomTo();
      }
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapFit(mapRef, containerRef);

  // ---------- Sync data when props change ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getSource("wards")) return;
    (map.getSource("wards") as maplibregl.GeoJSONSource).setData(wardGeo as any);
  }, [wardGeo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getSource("retailers")) return;
    (map.getSource("retailers") as maplibregl.GeoJSONSource).setData(
      (retailerFeatures ?? emptyFC) as any
    );
    const vis = showRetailers && retailerFeatures ? "visible" : "none";
    map.setLayoutProperty("retailers-circle", "visibility", vis as any);
    if (map.getLayer("retailers-selected")) {
      map.setLayoutProperty("retailers-selected", "visibility", vis as any);
    }
  }, [retailerFeatures, showRetailers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getLayer("census-areas-circle")) return;
    const vis = showCensus ? "visible" : "none";
    map.setLayoutProperty("census-areas-circle", "visibility", vis as any);
    map.setLayoutProperty("census-areas-symbol", "visibility", vis as any);
  }, [showCensus]);

  // Auto-zoom on activeZone change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (!activeZone) {
      const b = new maplibregl.LngLatBounds();
      TERRITORY_WARDS.features.forEach((f) => {
        const coords =
          f.geometry.type === "MultiPolygon"
            ? (f.geometry.coordinates as number[][][][]).flat(2)
            : (f.geometry.coordinates as number[][][]).flat(1);
        coords.forEach((c) => b.extend(c as [number, number]));
      });
      map.fitBounds(b, { padding: 30, maxZoom: 12, duration: 900 });
      return;
    }
    const pts = zoneBounds(activeZone);
    if (pts.length === 0) return;
    const b = new maplibregl.LngLatBounds();
    pts.forEach((c) => b.extend(c));
    map.fitBounds(b, { padding: 60, maxZoom: 13, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeZone, ready]);

  useEffect(() => {
    if (!mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.resize(), 60);
    return () => clearTimeout(t);
  }, [expanded]);

  // ---------- Interaction handlers ----------
  const toggleZone = (zone: string) => {
    setActiveZone((prev) => (prev === zone ? null : zone));
  };
  const toggleCorridors = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !showCorridors;
    map.setLayoutProperty("corridors-line", "visibility", next ? "visible" : "none");
    setShowCorridors(next);
  };

  const wardOutlets = useMemo(
    () => (selectedWard ? (retailers ?? []).filter((r) => r.ward === selectedWard.ward) : []),
    [selectedWard, retailers]
  );

  const totalPopulation = TERRITORY_WARDS.features.reduce(
    (s, f) => s + f.properties.population, 0
  );
  const totalArea = TERRITORY_WARDS.features.reduce(
    (s, f) => s + f.properties.area_km2, 0
  );

  // ---------- Render ----------
  return (
    <div
      className={cn(
        "relative flex h-[75vh] min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white md:flex-row",
        expanded && "fixed inset-0 z-50 h-screen w-screen rounded-none",
        standalone && "h-screen min-h-0 w-screen rounded-none border-0",
        className
      )}
    >
      {showControls && (
        <aside
          className={cn(
            "z-30 flex flex-col gap-4 overflow-y-auto bg-slate-50 p-4",
            mobilePanel
              ? "absolute inset-x-0 bottom-0 max-h-[65%] rounded-t-2xl border-t border-slate-200 shadow-xl md:static md:max-h-none md:w-80 md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:shadow-none"
              : "hidden md:flex md:w-80 md:shrink-0 md:border-r md:border-b-0"
          )}
        >
          {mobilePanel && (
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 md:hidden">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Map controls
              </span>
              <button
                onClick={() => setMobilePanel(false)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Ward colouring
            </h3>
            <div className="flex overflow-hidden rounded-md border border-emerald-700">
              <button
                onClick={() => setMode("zone")}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold ${
                  mode === "zone" ? "bg-emerald-700 text-white" : "bg-white text-slate-800 hover:bg-emerald-50"
                }`}
              >
                Zones
              </button>
              <button
                onClick={() => setMode("density")}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold ${
                  mode === "density" ? "bg-emerald-700 text-white" : "bg-white text-slate-800 hover:bg-emerald-50"
                }`}
              >
                Density
              </button>
              {retailers && (
                <button
                  onClick={() => setMode("coverage")}
                  className={`flex-1 px-2 py-1.5 text-xs font-semibold ${
                    mode === "coverage" ? "bg-emerald-700 text-white" : "bg-white text-slate-800 hover:bg-emerald-50"
                  }`}
                >
                  Outlets
                </button>
              )}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={outlineOnly}
                onChange={(e) => setOutlineOnly(e.target.checked)}
                className="accent-emerald-700"
              />
              Outline only (hide ward fill)
            </label>
          </div>

          {mode === "zone" ? (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Zones (tap to isolate)
              </h3>
              <div className="space-y-1">
                {WARD_ZONES.map((z) => (
                  <button
                    key={z}
                    onClick={() => toggleZone(z)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-white"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm border border-black/15"
                      style={{ background: ZONE_COLORS[z] }}
                    />
                    <span>{z}</span>
                    {activeZone === z && <span className="ml-auto text-emerald-700">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : mode === "density" ? (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Estimated density (people / km²)
              </h3>
              <div
                className="h-2.5 rounded"
                style={{
                  background:
                    "linear-gradient(90deg,#FCF3D9,#F2C572,#E08B3E,#C0522D,#7A1F1F)",
                }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>{"<1,000"}</span>
                <span>5,000</span>
                <span>20,000</span>
                <span>50,000+</span>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Active outlets per ward
              </h3>
              <div
                className="h-2.5 rounded"
                style={{
                  background:
                    "linear-gradient(90deg,#EEF4EC,#C3E3C3,#8FCF8F,#4FAF4F,#1F7A2E)",
                }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>0</span>
                <span>3</span>
                <span>6</span>
                <span>10</span>
                <span>15+</span>
              </div>
            </div>
          )}

          {retailers && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Outlet markers
              </h3>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={showRetailers}
                  onChange={(e) => setShowRetailers(e.target.checked)}
                  className="accent-emerald-700"
                />
                Show outlets on map
              </label>
              {showRetailers && (
                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                  {(Object.keys(retailerStatusMeta) as (keyof typeof retailerStatusMeta)[]).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ background: retailerStatusMeta[s].dot }}
                      />
                      <span className="capitalize">{retailerStatusMeta[s].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {allowCorridors && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Corridor highlight
              </h3>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={showCorridors}
                  onChange={toggleCorridors}
                  className="accent-emerald-700"
                />
                <span className="inline-block h-0.5 w-4 bg-red-700" />
                Highlight named corridors
              </label>
              <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                {Object.entries(ROAD_STYLE).map(([type, s]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span
                      className="inline-block h-0.5 w-4"
                      style={{
                        background: s.dash ? "transparent" : s.color,
                        borderTop: s.dash ? `2px dashed ${s.color}` : "none",
                      }}
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Census areas
            </h3>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showCensus}
                onChange={(e) => setShowCensus(e.target.checked)}
                className="accent-emerald-700"
              />
              Show census area pins
            </label>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {CENSUS_AREAS.length} areas across 4 census routes.
            </p>
          </div>

          {showControls && selectedWard && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Selected ward
              </h3>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-sm font-bold text-slate-900">{selectedWard.ward}</div>
                <div className="mb-2 text-xs text-slate-500">
                  {selectedWard.constituency} · {selectedWard.zone} Zone
                </div>
                <div className="divide-y divide-dashed divide-slate-200 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Area</span>
                    <b className="text-slate-900">{selectedWard.area_km2} km²</b>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Est. population</span>
                    <b className="text-slate-900">{fmt(selectedWard.population)}</b>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Density</span>
                    <b className="text-slate-900">{fmt(selectedWard.density)} /km²</b>
                  </div>
                  {retailers && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Outlets</span>
                      <b className="text-slate-900">
                        {wardCounts.get(selectedWard.ward) ?? 0} active
                      </b>
                    </div>
                  )}
                </div>
                {retailers && wardOutlets.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Outlets in ward ({wardOutlets.length})
                    </p>
                    <div className="max-h-36 space-y-1 overflow-y-auto">
                      {wardOutlets.map((r) => (
                        <Link
                          key={r.id}
                          href={`/retailers/${r.id}`}
                          className="flex items-center gap-1.5 rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: retailerStatusMeta[r.status]?.dot }}
                          />
                          <span className="truncate">{r.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      )}

      <div className="relative min-w-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" aria-label="Nairobi map" />

        {showControls && (
          <button
            onClick={() => setMobilePanel(true)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-md border border-slate-200 bg-white/95 p-2 text-slate-600 shadow-sm hover:bg-white md:hidden"
            title="Map controls"
          >
            <Settings2 size={16} />
          </button>
        )}

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-4 rounded-md bg-white/90 px-3 py-2 text-xs shadow">
          <div>
            <div className="text-sm font-bold text-emerald-800">
              {TERRITORY_WARDS.features.length}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              Wards mapped
            </div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-sm font-bold text-emerald-800">
              {(totalPopulation / 1e6).toFixed(2)}M
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              Est. population
            </div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-sm font-bold text-emerald-800">
              {totalArea.toFixed(0)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">km² total</div>
          </div>
        </div>

        {!standalone && (
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
            <button
              title="Open map in a new tab"
              onClick={() => window.open("/map", "_blank", "noopener")}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <ExternalLink size={14} />
            </button>
            <button
              title={expanded ? "Collapse map" : "Expand map to full screen"}
              onClick={() => setExpanded((e) => !e)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-600 shadow-sm hover:bg-slate-50"
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        )}

        {overlay}

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
            Loading map…
          </div>
        )}
      </div>
    </div>
  );
}
