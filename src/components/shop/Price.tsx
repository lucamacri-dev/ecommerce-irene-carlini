import { formatEur, type Product } from "@/data/products";

export function Price({ product, large = false }: { product: Product; large?: boolean }) {
  const off = Math.round((1 - product.salePrice / product.listPrice) * 100);
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className={`${large ? "text-3xl" : "text-xl"} font-semibold text-brand-terracotta`}>
        {formatEur(product.salePrice)}
      </span>
      <span className="text-sm text-muted-foreground line-through">
        {formatEur(product.listPrice)}
      </span>
      <span className="rounded bg-brand-green px-2 py-0.5 text-xs font-medium text-white">
        Black Friday −{off}%
      </span>
    </div>
  );
}
