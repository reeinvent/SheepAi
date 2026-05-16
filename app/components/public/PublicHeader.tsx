import Link from "next/link";
import { Icon } from "../ui/Icon";
import { Logo } from "./Logo";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/community"
          aria-current="page"
          className="flex items-center gap-2.5 group"
        >
          <Logo
            size={36}
            className="shadow-md shadow-cyan-700/30 rounded-[7px] group-hover:shadow-lg group-hover:shadow-cyan-700/40 transition-shadow"
          />
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-800 to-teal-700 bg-clip-text text-transparent">
            Peristil
          </span>
        </Link>
        <button
          type="button"
          aria-label="Sign in"
          className="p-2 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <Icon name="user" size={20} />
        </button>
      </div>
    </header>
  );
}
