import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ShopLayout } from "@/components/shop/Layout";
import { ProductImage } from "@/components/shop/ProductImage";
import { Price } from "@/components/shop/Price";
import { COLOR_HEX, getProduct, type ColorName } from "@/data/products";
import { track, trackLandingOnce } from "@/lib/analytics";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/prodotto/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Prodotto"} · ECHOS` },
      { name: "description", content: loaderData?.product.tagline ?? "" },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <ShopLayout>
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-2xl font-light">Prodotto non trovato</h1>
        <Link to="/" className="mt-6 inline-block text-brand-terracotta underline">
          Torna alla collezione
        </Link>
      </div>
    </ShopLayout>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const navigate = useNavigate();
  const [color, setColor] = useState<ColorName>(product.colors[0] ?? "Black");
  const [size, setSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    trackLandingOnce();
    void track("view_product", { product_slug: product.slug });
  }, [product.slug]);

  const pickColor = (c: ColorName) => {
    setColor(c);
    void track("select_option", {
      product_slug: product.slug,
      color: c,
      meta: { option: "color" },
    });
  };

  const pickSize = (s: number) => {
    setSize(s);
    setSizeError(false);
    void track("select_option", { product_slug: product.slug, size: s, meta: { option: "size" } });
  };

  const addToCart = (goToCart: boolean) => {
    if (size === null) {
      setSizeError(true);
      toast.error("Seleziona una taglia");
      return;
    }
    add({ slug: product.slug, color, size, quantity });
    if (goToCart) {
      void navigate({ to: "/carrello" });
    } else {
      toast.success(`${product.name} ${color} · taglia ${size} aggiunta al carrello`);
    }
  };

  return (
    <ShopLayout>
      <Toaster position="top-center" />
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-10 md:grid-cols-2 md:py-16">
        <ProductImage name={product.name} type={product.type} color={color} />

        <div>
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Collezione
          </Link>
          <h1 className="mt-3 text-3xl font-light md:text-4xl">
            {product.name} <span className="text-muted-foreground">| {product.type}</span>
          </h1>
          <div className="mt-4">
            <Price product={product} large />
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium">
              Colore: <span className="font-normal text-muted-foreground">{color}</span>
            </p>
            <div className="mt-3 flex gap-3">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickColor(c)}
                  aria-label={c}
                  aria-pressed={color === c}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    color === c ? "border-brand-terracotta" : "border-border"
                  }`}
                >
                  <span className="h-7 w-7 rounded-full" style={{ background: COLOR_HEX[c] }}>
                    {color === c && (
                      <Check className="m-1.5 h-4 w-4 text-white mix-blend-difference" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium">
              Taglia {sizeError && <span className="ml-2 text-destructive">obbligatoria</span>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickSize(s)}
                  aria-pressed={size === s}
                  className={`h-11 w-14 rounded-lg border text-sm transition ${
                    size === s
                      ? "border-brand-green bg-brand-green text-white"
                      : sizeError
                        ? "border-destructive"
                        : "border-border bg-card hover:border-brand-green"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <p className="text-sm font-medium">Quantità</p>
            <div className="flex items-center rounded-lg border border-border bg-card">
              <button
                type="button"
                className="h-10 w-10"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Meno"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                type="button"
                className="h-10 w-10"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="Più"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => addToCart(false)}
              className="flex-1 rounded-lg border border-primary px-6 py-3.5 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              Aggiungi al carrello
            </button>
            <button
              type="button"
              onClick={() => addToCart(true)}
              className="flex-1 rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-terracotta-dark"
            >
              Acquista adesso
            </button>
          </div>

          <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
            {product.specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-4 py-3">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-right">{s.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 text-sm font-medium">Comfort</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {product.comfort.map((c) => (
              <li key={c} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ShopLayout>
  );
}
