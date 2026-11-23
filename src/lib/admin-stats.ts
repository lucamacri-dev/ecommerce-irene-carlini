export interface EventRow {
  created_at: string;
  session_id: string;
  event_type: string;
  product_slug: string | null;
  color: string | null;
  size: number | null;
  quantity: number | null;
}

export interface LeadRow {
  id: string;
  created_at: string;
  session_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  items: { slug: string; color: string; size: number; quantity: number }[];
  total_eur: number | null;
}

export interface Breakdown {
  key: string;
  sessions: number;
  units: number;
}

export interface Stats {
  visitors: number;
  productViewers: number;
  cartSessions: number;
  checkoutSessions: number;
  intentSessions: number;
  leads: number;
  addToCartByProduct: Breakdown[];
  addToCartByVariant: Breakdown[];
  intentByProduct: Breakdown[];
  topProduct: Breakdown | null;
  conversion: { cartRate: number; checkoutRate: number; intentRate: number; overall: number };
  perDay: { day: string; visitors: number; carts: number; intents: number }[];
}

const sessionsOf = (rows: EventRow[], type: string) =>
  new Set(rows.filter((r) => r.event_type === type).map((r) => r.session_id));

function breakdown(rows: EventRow[], keyOf: (r: EventRow) => string | null): Breakdown[] {
  const map = new Map<string, { s: Set<string>; units: number }>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!k) continue;
    const e = map.get(k) ?? { s: new Set<string>(), units: 0 };
    e.s.add(r.session_id);
    e.units += r.quantity ?? 1;
    map.set(k, e);
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, sessions: v.s.size, units: v.units }))
    .sort((a, b) => b.units - a.units || b.sessions - a.sessions);
}

const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);

export function computeStats(events: EventRow[], leads: LeadRow[]): Stats {
  const visitorSet = new Set(events.map((e) => e.session_id));
  const carts = events.filter((e) => e.event_type === "add_to_cart");
  const intents = events.filter((e) => e.event_type === "purchase_intent");

  const visitors = visitorSet.size;
  const cartSessions = sessionsOf(events, "add_to_cart").size;
  const checkoutSessions = sessionsOf(events, "begin_checkout").size;
  const intentSessions = sessionsOf(events, "purchase_intent").size;

  const addToCartByProduct = breakdown(carts, (r) => r.product_slug);
  const addToCartByVariant = breakdown(carts, (r) =>
    r.product_slug ? `${r.product_slug} · ${r.color ?? "?"} · ${r.size ?? "?"}` : null,
  );
  const intentByProduct = breakdown(intents, (r) => r.product_slug);

  const days = new Map<string, { v: Set<string>; c: Set<string>; i: Set<string> }>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const d = days.get(day) ?? { v: new Set(), c: new Set(), i: new Set() };
    d.v.add(e.session_id);
    if (e.event_type === "add_to_cart") d.c.add(e.session_id);
    if (e.event_type === "purchase_intent") d.i.add(e.session_id);
    days.set(day, d);
  }

  return {
    visitors,
    productViewers: sessionsOf(events, "view_product").size,
    cartSessions,
    checkoutSessions,
    intentSessions,
    leads: leads.length,
    addToCartByProduct,
    addToCartByVariant,
    intentByProduct,
    topProduct: addToCartByProduct[0] ?? null,
    conversion: {
      cartRate: pct(cartSessions, visitors),
      checkoutRate: pct(checkoutSessions, cartSessions),
      intentRate: pct(intentSessions, checkoutSessions),
      overall: pct(intentSessions, visitors),
    },
    perDay: [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, d]) => ({ day, visitors: d.v.size, carts: d.c.size, intents: d.i.size })),
  };
}

export function leadsToCsv(leads: LeadRow[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["data", "nome", "cognome", "email", "telefono", "citta", "totale_eur", "prodotti"];
  const rows = leads.map((l) =>
    [
      l.created_at,
      l.first_name,
      l.last_name,
      l.email,
      l.phone,
      l.city,
      l.total_eur,
      l.items.map((i) => `${i.quantity}x ${i.slug} ${i.color} ${i.size}`).join(" | "),
    ]
      .map(esc)
      .join(","),
  );
  return [head.join(","), ...rows].join("\n");
}
