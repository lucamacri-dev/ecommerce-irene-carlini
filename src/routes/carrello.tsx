import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { ShopLayout } from "@/components/shop/Layout";
import { COLOR_HEX, formatEur, getProduct, type ColorName } from "@/data/products";
import { trackLandingOnce } from "@/lib/analytics";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/carrello")({
  head: () => ({ meta: [{ title: "Carrello · Irene Carlini" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQuantity, remove } = useCart();

  useEffect(() => {
    trackLandingOnce();
  }, []);

  return (
    <ShopLayout>
      <div className="mx-auto max-w-[1000px] px-5 py-12">
        <h1 className="text-3xl font-light">Il tuo carrello</h1>

        {items.length === 0 ? (
          <div className="mt-10 rounded-lg border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Il carrello è vuoto.</p>
            <Link
              to="/"
              hash="collezione"
              className="mt-4 inline-block text-brand-terracotta underline"
            >
              Scopri la collezione
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {items.map((item) => {
                const p = getProduct(item.slug)!;
                return (
                  <li key={`${item.slug}-${item.color}-${item.size}`} className="flex gap-4 p-4">
                    <div
                      className="h-20 w-20 shrink-0 rounded-md"
                      style={{ background: COLOR_HEX[item.color as ColorName] }}
                      aria-hidden
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {p.name}{" "}
                        <span className="font-light text-muted-foreground">| {p.type}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.color} · Taglia {item.size}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            type="button"
                            className="h-8 w-8"
                            onClick={() => setQuantity(item, item.quantity - 1)}
                            aria-label="Meno"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            className="h-8 w-8"
                            onClick={() => setQuantity(item, item.quantity + 1)}
                            aria-label="Più"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Rimuovi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium">{formatEur(p.salePrice * item.quantity)}</p>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-medium uppercase tracking-[0.15em]">Riepilogo</h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotale</span>
                <span>{formatEur(total)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Spedizione</span>
                <span>Gratuita</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-medium">
                <span>Totale</span>
                <span>{formatEur(total)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-5 block rounded-lg bg-primary px-6 py-3.5 text-center text-sm font-medium text-primary-foreground transition hover:bg-brand-terracotta-dark"
              >
                Procedi al checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
