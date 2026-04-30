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
    <aside className="w-full border-b bg-white/80 px-4 py-4 backdrop-blur lg:h-screen lg:w-64 lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
      <div className="flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-md bg-slate-900 text-center text-sm leading-8 font-semibold text-white">
          GR
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">MVP</p>
          <p className="text-sm font-semibold text-slate-900">{APP_NAME}</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                isActive && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
