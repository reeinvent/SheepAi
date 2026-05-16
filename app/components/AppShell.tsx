import type { ReactNode } from "react";
import {
  Sidebar,
  SidebarProvider,
  type SidebarNavItem,
} from "./ui/Sidebar";
import { ToastProvider } from "./ui/Toast";

const DEFAULT_NAV: SidebarNavItem[] = [
  { label: "Dashboard", icon: "home", href: "/", active: true },
  { label: "Community board", icon: "user", href: "/community" },
  { label: "Map", icon: "map", disabled: true },
  { label: "Analytics", icon: "bar-chart", disabled: true },
  { label: "Settings", icon: "settings", disabled: true },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
        S
      </div>
      <div className="min-w-0">
        <p className="font-bold text-slate-800 truncate">SheepAi</p>
        <p className="text-xs text-slate-500 truncate">City Issue Tracker</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ToastProvider>
        <div className="flex min-h-dvh bg-slate-50">
          <Sidebar brand={<Brand />} items={DEFAULT_NAV} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </ToastProvider>
    </SidebarProvider>
  );
}
