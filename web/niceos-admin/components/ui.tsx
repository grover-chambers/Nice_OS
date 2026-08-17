"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  pad = true,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={pad ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export type Tone = "default" | "emerald" | "amber" | "rose" | "blue" | "violet" | "cyan" | "slate";

export const toneBg: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-700",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  cyan: "bg-cyan-50 text-cyan-700",
  slate: "bg-slate-100 text-slate-600",
};

export function Badge({
  children,
  tone = "slate",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        toneBg[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
  trend,
  href,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  trend?: { dir: "up" | "down"; text: string; good?: boolean };
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon && (
          <span className={cn("rounded-lg p-1.5", toneBg[tone])}>{icon}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-slate-900">
        {value}
        {href && <ArrowUpRight className="text-slate-300" size={16} />}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
      {trend && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            trend.good
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          )}
        >
          <span>{trend.dir === "up" ? "▲" : "▼"}</span>
          {trend.text}
        </div>
      )}
    </>
  );

  const cls = cn(
    "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition",
    href && "cursor-pointer hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
  );

  if (href) {
    return (
      <Link href={href} className={cn("block", cls)}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}

export function Progress({
  value,
  tone = "emerald",
  className,
}: {
  value: number;
  tone?: "emerald" | "amber" | "rose" | "blue" | "slate";
  className?: string;
}) {
  const color = {
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    blue: "bg-blue-600",
    slate: "bg-slate-400",
  }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex overflow-hidden rounded-md border border-slate-300 bg-white", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 whitespace-nowrap px-3 py-1.5 text-xs font-semibold transition-colors",
            value === opt.value
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-10 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 text-sm text-slate-700", className)}>{children}</td>;
}

export function tableWrap(children: ReactNode) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}
