import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/territories", label: "Territories" },
  { href: "/retailers", label: "Retailers" },
  { href: "/rep-management", label: "Rep Management" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="p-6">
        <h1 className="text-lg font-bold text-slate-900">NiceOS</h1>
        <p className="text-xs text-slate-400">Market Link / Nice Millers</p>
      </div>
      <nav className="px-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded px-3 py-2 text-sm ${
              pathname === item.href
                ? "bg-primary-50 text-primary-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}