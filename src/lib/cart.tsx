import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getProduct } from "@/data/products";
import { track } from "./analytics";

export interface CartItem {
  slug: string;
  color: string;
  size: number;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  setQuantity: (item: CartItem, quantity: number) => void;
  remove: (item: CartItem) => void;
  clear: () => void;
}

const KEY = "echos_cart";
const Ctx = createContext<CartCtx | null>(null);

const same = (a: CartItem, b: CartItem) =>
  a.slug === b.slug && a.color === b.color && a.size === b.size;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems((JSON.parse(raw) as CartItem[]).filter((i) => getProduct(i.slug)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => same(i, item));
      if (found) {
        return prev.map((i) =>
          same(i, item) ? { ...i, quantity: Math.min(10, i.quantity + item.quantity) } : i,
        );
      }
      return [...prev, item];
    });
    void track("add_to_cart", {
      product_slug: item.slug,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    });
  }, []);

  const setQuantity = useCallback((item: CartItem, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        same(i, item) ? { ...i, quantity: Math.max(1, Math.min(10, quantity)) } : i,
      ),
    );
  }, []);

  const remove = useCallback((item: CartItem) => {
    setItems((prev) => prev.filter((i) => !same(i, item)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const total = items.reduce((n, i) => n + (getProduct(i.slug)?.salePrice ?? 0) * i.quantity, 0);
    return { items, count, total, add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
