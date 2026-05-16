import type { ReactNode } from "react";
import { Logo } from "./public/Logo";
import {
  Sidebar,
  SidebarProvider,
  type SidebarNavItem,
} from "./ui/Sidebar";
import { ToastProvider } from "./ui/Toast";

const DEFAULT_NAV: SidebarNavItem[] = [
  { label: "Nadzorna ploča", icon: "home", href: "/", active: true },
  { label: "Oglasna ploča zajednice", icon: "user", href: "/community" },
  { label: "Analitika", icon: "bar-chart", disabled: true },
  { label: "Postavke", icon: "settings", disabled: true },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={36} />
      <div className="min-w-0">
        <p className="font-bold text-slate-800 truncate">Peristil</p>
        <p className="text-xs text-slate-500 truncate">Pratilac gradskih problema</p>
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
