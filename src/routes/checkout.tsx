import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ShopLayout } from "@/components/shop/Layout";
import { formatEur, getProduct } from "@/data/products";
import { getSessionId, track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · ECHOS" }] }),
  component: CheckoutPage,
});

const input =
  "w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20";

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (items.length > 0) void track("begin_checkout", { meta: { total } });
    // Only once per visit to the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending || items.length === 0) return;
    setSending(true);
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) ?? "").trim();

    // 1 event per cart line, so the admin can rank products by purchase intent.
    for (const i of items) {
      void track("purchase_intent", {
        product_slug: i.slug,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
      });
    }

    try {
      await getSupabase()
        ?.from("leads")
        .insert({
          session_id: getSessionId(),
          first_name: val("first_name"),
          last_name: val("last_name"),
          email: val("email"),
          phone: val("phone") || null,
          address: val("address") || null,
          city: val("city") || null,
          zip: val("zip") || null,
          province: val("province") || null,
          notes: val("notes") || null,
          marketing_consent: f.get("marketing") === "on",
          items,
          total_eur: total,
        });
    } catch {
      // The visitor always reaches the thank-you page.
    }

    try {
      window.sessionStorage.setItem("echos_lead_name", val("first_name"));
    } catch {
      /* ignore */
    }
    clear();
    void navigate({ to: "/grazie" });
  };

  if (items.length === 0) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="text-muted-foreground">Il carrello è vuoto.</p>
          <Link
            to="/"
            hash="collezione"
            className="mt-4 inline-block text-brand-terracotta underline"
          >
            Scopri la collezione
          </Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-12 md:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} className="space-y-6">
          <h1 className="text-3xl font-light">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Lasciaci i tuoi dati: non ti chiediamo nessun pagamento in questa fase.
          </p>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="eyebrow mb-3">Contatti</legend>
            <input
              className={input}
              name="first_name"
              placeholder="Nome"
              required
              autoComplete="given-name"
            />
            <input
              className={input}
              name="last_name"
              placeholder="Cognome"
              required
              autoComplete="family-name"
            />
            <input
              className={input}
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
            />
            <input
              className={input}
              name="phone"
              type="tel"
              placeholder="Telefono"
              required
              autoComplete="tel"
            />
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="eyebrow mb-3">Indirizzo di spedizione</legend>
            <input
              className={`${input} sm:col-span-2`}
              name="address"
              placeholder="Via e numero civico"
              required
              autoComplete="street-address"
            />
            <input
              className={input}
              name="city"
              placeholder="Città"
              required
              autoComplete="address-level2"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                className={input}
                name="zip"
                placeholder="CAP"
                required
                inputMode="numeric"
                autoComplete="postal-code"
              />
              <input
                className={input}
                name="province"
                placeholder="Prov."
                required
                maxLength={2}
                autoComplete="address-level1"
              />
            </div>
            <textarea
              className={`${input} sm:col-span-2`}
              name="notes"
              placeholder="Note per la consegna (opzionale)"
              rows={3}
            />
          </fieldset>

          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="privacy"
              required
              className="mt-1 h-4 w-4 accent-[var(--brand-green)]"
            />
            <span>
              Acconsento al trattamento dei miei dati personali per essere ricontattata/o riguardo a
              questo ordine (informativa privacy).
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="marketing"
              className="mt-1 h-4 w-4 accent-[var(--brand-green)]"
            />
            <span>Voglio ricevere novità e offerte via email (facoltativo).</span>
          </label>

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition hover:bg-brand-terracotta-dark disabled:opacity-60"
          >
            {sending ? "Invio in corso…" : "Acquista adesso"}
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.15em]">Il tuo ordine</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => {
              const p = getProduct(i.slug)!;
              return (
                <li key={`${i.slug}-${i.color}-${i.size}`} className="flex justify-between gap-3">
                  <span>
                    {i.quantity}× {p.name} {p.type}
                    <span className="block text-xs text-muted-foreground">
                      {i.color} · Taglia {i.size}
                    </span>
                  </span>
                  <span>{formatEur(p.salePrice * i.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-medium">
            <span>Totale</span>
            <span>{formatEur(total)}</span>
          </div>
        </aside>
      </div>
    </ShopLayout>
  );
}
