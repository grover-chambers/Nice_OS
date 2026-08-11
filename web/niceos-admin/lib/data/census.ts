// Nairobi Metropolitan Shops Census — boss's plan, hardcoded for the demo.
// 25 days · 8 officers · 4 groups × 2 officers · pace 20–40 shops/person/day.

import type { WardZone } from "./types";

export const CENSUS_DAYS = 25;
export const CENSUS_OFFICERS = 8;
export const CENSUS_PACE_MIN = 20;
export const CENSUS_PACE_MAX = 40;

export type CensusArea = {
  name: string;
  zone: WardZone;
  lat: number;
  lng: number;
  shops: number; // estimated target shops to visit
};

export type CensusRoute = {
  id: number;
  name: string;
  zone: WardZone;
  officers: number;
  areas: CensusArea[];
};

const AREA = (name: string, zone: WardZone, lat: number, lng: number, shops: number): CensusArea => ({
  name,
  zone,
  lat,
  lng,
  shops,
});

// Route 1 — Central (Kamukunji / Starehe / Mathare / Ruaraka / Embakasi North)
export const ROUTE1_AREAS: CensusArea[] = [
  AREA("Ngara", "Central", -1.2786, 36.8272, 40),
  AREA("Pangani", "Central", -1.2745, 36.84, 35),
  AREA("Ziwani / Kariokor", "Central", -1.285, 36.835, 30),
  AREA("Landimawe", "Central", -1.275, 36.82, 28),
  AREA("Pumwani", "Central", -1.2875, 36.8525, 38),
  AREA("Eastleigh", "Central", -1.268, 36.855, 45),
  AREA("California", "Central", -1.265, 36.855, 25),
  AREA("Lucky Summer", "Central", -1.235, 36.885, 22),
  AREA("Baba Ndogo", "Central", -1.24, 36.88, 26),
  AREA("Huruma", "Central", -1.255, 36.87, 32),
  AREA("Kariobangi", "Central", -1.25, 36.89, 36),
  AREA("Mathare", "Central", -1.26, 36.865, 40),
  AREA("Korogocho", "Central", -1.245, 36.895, 30),
  AREA("Dandora", "Central", -1.255, 36.905, 42),
];

// Route 2 — Northern (Roysambu / Kasarani / Ruiru / Juja / Eastern Bypass)
export const ROUTE2_AREAS: CensusArea[] = [
  AREA("Clay City", "Northern", -1.22, 36.89, 24),
  AREA("Kasarani", "Northern", -1.225, 36.9, 40),
  AREA("Githurai", "Northern", -1.195, 36.915, 44),
  AREA("Mwiki", "Northern", -1.19, 36.93, 30),
  AREA("Njiru", "Northern", -1.215, 36.93, 28),
  AREA("Chokaa", "Northern", -1.23, 36.94, 20),
  AREA("Ruai", "Northern", -1.2, 36.95, 26),
  AREA("Kamulu", "Northern", -1.22, 36.97, 18),
  AREA("Joska", "Northern", -1.24, 36.99, 15),
  AREA("Zimmerman", "Northern", -1.205, 36.87, 32),
  AREA("Roysambu", "Northern", -1.21, 36.87, 34),
  AREA("Kahawa West", "Northern", -1.195, 36.885, 36),
  AREA("Kahawa Sukari", "Northern", -1.175, 36.9, 22),
  AREA("Kahawa Wendani", "Northern", -1.165, 36.915, 20),
  AREA("Kiambu Road", "Northern", -1.19, 36.85, 28),
  AREA("Ruiru", "Northern", -1.145, 36.945, 38),
  AREA("Juja", "Northern", -1.1, 37.01, 24),
  AREA("Eastern Bypass", "Northern", -1.23, 36.955, 20),
];

// Route 3 — Eastern (Makadara / Embakasi / Jogoo Road corridor)
export const ROUTE3_AREAS: CensusArea[] = [
  AREA("Jogoo Road", "Eastern", -1.295, 36.855, 40),
  AREA("Buruburu", "Eastern", -1.292, 36.875, 46),
  AREA("Jericho", "Eastern", -1.29, 36.865, 30),
  AREA("Umoja", "Eastern", -1.28, 36.9, 38),
  AREA("Kariobangi South", "Eastern", -1.27, 36.895, 28),
  AREA("Maili Saba", "Eastern", -1.275, 36.915, 22),
  AREA("Komarock", "Eastern", -1.285, 36.925, 36),
  AREA("Kayole", "Eastern", -1.275, 36.915, 42),
  AREA("Donholm", "Eastern", -1.29, 36.915, 26),
  AREA("Pipeline", "Eastern", -1.3, 36.92, 34),
  AREA("Dandora Utawala", "Eastern", -1.265, 36.915, 24),
  AREA("Utawala", "Eastern", -1.27, 36.95, 30),
  AREA("Mihang'o", "Eastern", -1.28, 36.97, 22),
  AREA("Ruai Spillover", "Eastern", -1.255, 36.97, 18),
  AREA("Maringo", "Eastern", -1.29, 36.875, 22),
  AREA("Hamza", "Eastern", -1.29, 36.88, 20),
  AREA("Harambee", "Eastern", -1.295, 36.885, 20),
  AREA("Yandani", "Eastern", -1.3, 36.89, 16),
];

// Route 4 — South / Kajiado / Kiambu mix (Lang'ata / Karen / Kajiado North+East / Kiambu)
export const ROUTE4_AREAS: CensusArea[] = [
  AREA("Kitengela", "Kajiado", -1.456, 36.965, 34),
  AREA("Ongata Rongai", "Kajiado", -1.39, 36.755, 36),
  AREA("Ngong", "Kajiado", -1.362, 36.656, 30),
  AREA("Kiserian", "Kajiado", -1.422, 36.652, 22),
  AREA("Karen", "Kajiado", -1.319, 36.711, 28),
  AREA("Lang'ata", "Kajiado", -1.345, 36.74, 32),
  AREA("Kangemi", "Kiambu", -1.265, 36.762, 30),
  AREA("Ruaka", "Kiambu", -1.19, 36.78, 24),
];

export const CENSUS_ROUTES: CensusRoute[] = [
  { id: 1, name: "Route 1 — Central", zone: "Central", officers: 2, areas: ROUTE1_AREAS },
  { id: 2, name: "Route 2 — Northern", zone: "Northern", officers: 2, areas: ROUTE2_AREAS },
  { id: 3, name: "Route 3 — Eastern", zone: "Eastern", officers: 2, areas: ROUTE3_AREAS },
  { id: 4, name: "Route 4 — South / Kajiado / Kiambu", zone: "Kajiado", officers: 2, areas: ROUTE4_AREAS },
];

export const CENSUS_AREAS: CensusArea[] = [
  ...ROUTE1_AREAS,
  ...ROUTE2_AREAS,
  ...ROUTE3_AREAS,
  ...ROUTE4_AREAS,
];

export const CENSUS_TOTAL_SHOPS = CENSUS_AREAS.reduce((s, a) => s + a.shops, 0);
