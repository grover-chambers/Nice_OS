import { redirect } from "next/navigation";

export default function RouteApprovalsPage() {
  redirect("/routes?tab=approvals");
}
