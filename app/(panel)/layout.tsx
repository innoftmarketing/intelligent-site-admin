import Link from "next/link";
import { ReactNode } from "react";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/clients" className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-sm bg-foreground" />
            <span className="text-sm font-semibold tracking-tight">
              Intelligent Website
            </span>
            <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/clients"
              className="text-foreground/80 hover:text-foreground"
            >
              Clients
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
