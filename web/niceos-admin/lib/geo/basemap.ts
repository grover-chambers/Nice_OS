// OpenFreeMap basemap style URL — single, no API key, no rate limit, MIT-licensed.
// Positron: clean light backdrop (best for choropleths, matches the previous CARTO Positron look)
// Liberty:  full-color streets + POIs (use for route / retailer detail views where context matters)
// Bright:   vivid streets
// Dark:     dark mode
//
// Public instance has no limits, no registration. See https://openfreemap.org
// To self-host: download MBTiles/Btrfs from https://github.com/hyperknot/openfreemap

export type BasemapStyle = "positron" | "liberty" | "bright" | "dark";

const STYLE_URLS: Record<BasemapStyle, string> = {
  positron: "https://tiles.openfreemap.org/styles/positron",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  bright: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

// Default to Positron — matches the look the demo's "Minimal" toggle had previously
// (clean CARTO Positron raster), but now as crisp vector tiles. Pages that need
// street detail (routes/analytics) can opt in via `basemap="liberty"` on the MapView.
export const DEFAULT_BASEMAP: BasemapStyle = "positron";

export function basemapStyleUrl(style: BasemapStyle = DEFAULT_BASEMAP): string {
  return STYLE_URLS[style];
}
