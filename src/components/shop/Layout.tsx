import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "@/lib/cart";

export function ShopLayout({ children }: { children: ReactNode }) {
  const { count } = useCart();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-brand-green px-4 py-2 text-center text-xs font-medium tracking-wide text-white">
        BLACK FRIDAY · prezzi speciali su tutta la collezione
      </div>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
          <Link to="/" className="text-xl font-semibold tracking-[0.2em] text-brand-green">
            ECHOS
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              hash="collezione"
              className="hidden text-muted-foreground hover:text-foreground sm:block"
            >
              Collezione
            </Link>
            <Link
              to="/carrello"
              className="relative inline-flex items-center gap-2 text-foreground"
              aria-label="Carrello"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-brand-green-deep px-5 py-10 text-center text-xs text-white/70">
        © {new Date().getFullYear()} ECHOS · Tutti i diritti riservati
      </footer>
    </div>
  );
}
