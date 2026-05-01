"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellDot,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/intelligence", label: "Intelligence", icon: BellDot },
  { href: "/stakeholders", label: "Stakeholders", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-[17rem] lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
      <div className="flex items-center gap-3 px-1">
        <div className="h-9 w-9 rounded-md bg-slate-950 text-center text-sm leading-9 font-semibold text-white shadow-sm">
          GR
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">MVP</p>
          <p className="truncate text-sm font-semibold text-slate-950">{APP_NAME}</p>
        </div>
      </div>

      <nav className="mt-5 flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:w-full lg:gap-3",
                isActive &&
                  "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-emerald-300" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 lg:block">
        <p className="font-semibold text-slate-900">Operational focus</p>
        <p className="mt-1 leading-5">Monitor intelligence, relationships, and follow-up work from one private workspace.</p>
      </div>
    </aside>
  );
}
