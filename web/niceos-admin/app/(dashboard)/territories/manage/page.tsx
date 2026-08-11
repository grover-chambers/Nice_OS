import { redirect } from "next/navigation";

export default function TerritoryManagePage() {
  redirect("/territories?tab=hierarchy");
}
