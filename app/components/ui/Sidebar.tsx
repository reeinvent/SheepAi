"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./Icon";

export interface SidebarNavItem {
  label: string;
  icon: IconName;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

interface SidebarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

interface SidebarProps {
  brand: ReactNode;
  items: SidebarNavItem[];
  footer?: ReactNode;
}

export function Sidebar({ brand, items, footer }: SidebarProps) {
  const { isOpen, close } = useSidebar();

  const content = (
    <>
      <div className="px-5 py-5 border-b border-slate-200">{brand}</div>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-3">
          {items.map((item) => (
            <li key={item.label}>
              <SidebarItem item={item} onNavigate={close} />
            </li>
          ))}
        </ul>
      </nav>
      {footer && (
        <div className="border-t border-slate-200 px-3 py-3">{footer}</div>
      )}
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
        {content}
      </aside>

      <div
        className={`lg:hidden fixed inset-0 z-40 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          {content}
        </aside>
      </div>
    </>
  );
}

function SidebarItem({
  item,
  onNavigate,
}: {
  item: SidebarNavItem;
  onNavigate: () => void;
}) {
  const base =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  let stateClasses: string;
  if (item.disabled) {
    stateClasses = "text-slate-400 cursor-not-allowed";
  } else if (item.active) {
    stateClasses = "bg-slate-100 text-slate-900";
  } else {
    stateClasses = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  }

  const className = `${base} ${stateClasses}`;

  const inner = (
    <>
      <Icon name={item.icon} size={18} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && (
        <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">
          {item.badge}
        </span>
      )}
    </>
  );

  if (item.disabled) {
    return (
      <span className={className} aria-disabled="true">
        {inner}
      </span>
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} onClick={onNavigate} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        item.onClick?.();
        onNavigate();
      }}
      className={`${className} w-full text-left`}
    >
      {inner}
    </button>
  );
}
