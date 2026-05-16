import type { ReactNode } from "react";
import { PublicFooter } from "@/app/components/public/PublicFooter";
import { PublicHeader } from "@/app/components/public/PublicHeader";
import { ToastProvider } from "@/app/components/ui/Toast";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <PublicFooter />
      </div>
    </ToastProvider>
  );
}
