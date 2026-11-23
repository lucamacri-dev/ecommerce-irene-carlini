import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/shop/Layout";
import { ProductImage } from "@/components/shop/ProductImage";
import { Price } from "@/components/shop/Price";
import { PRODUCTS } from "@/data/products";
import { trackLandingOnce } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Irene Carlini · Black Friday" },
      {
        name: "description",
        content:
          "Aurora e Marta: scarpe con memory foam, tessuto jeans e tacco comodo. Prezzi Black Friday.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    trackLandingOnce();
  }, []);

  return (
    <ShopLayout>
      <section className="bg-brand-green text-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <p className="eyebrow !text-white/80">Black Friday</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-light leading-tight md:text-6xl">
            Tacchi che <span className="font-semibold">non fanno male</span>.
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/80">
            Tessuto jeans, memory foam e sostegno dell'arco plantare. Due modelli, tre colori, sei
            taglie, a prezzo speciale.
          </p>
          <Link
            to="/"
            hash="collezione"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-terracotta-dark"
          >
            Scopri la collezione <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="collezione" className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <p className="eyebrow">La collezione</p>
        <h2 className="mt-3 text-3xl font-light md:text-4xl">Scegli il tuo modello</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              to="/prodotto/$slug"
              params={{ slug: p.slug }}
              className="group block"
            >
              <ProductImage
                name={p.name}
                type={p.type}
                color="Camel"
                className="transition group-hover:shadow-lg"
              />
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-medium">
                    {p.name} <span className="font-light text-muted-foreground">| {p.type}</span>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-brand-terracotta transition group-hover:translate-x-1" />
              </div>
              <div className="mt-3">
                <Price product={p} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ShopLayout>
  );
}
