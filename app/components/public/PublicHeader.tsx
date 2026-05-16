import Link from "next/link";
import { Icon } from "../ui/Icon";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/community"
          aria-current="page"
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/40 transition-all">
            B
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Beeeeee
          </span>
        </Link>
        <button
          type="button"
          aria-label="Sign in"
          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          <Icon name="user" size={20} />
        </button>
      </div>
    </header>
  );
}
