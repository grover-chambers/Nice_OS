import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getRetailers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nairobi Map — NiceOS",
};

const TerritoryMap = dynamic(() => import("@/components/TerritoryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  const retailers = getRetailers();

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <TerritoryMap retailers={retailers} standalone className="h-screen min-h-0 w-screen rounded-none border-0" />
    </div>
  );
}
