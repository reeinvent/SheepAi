"use client";

import { Icon } from "./Icon";
import { useSidebar } from "./Sidebar";

export function MobileMenuButton() {
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Otvori navigacijski izbornik"
      className="lg:hidden -ml-1 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
    >
      <Icon name="menu" size={22} />
    </button>
  );
}
