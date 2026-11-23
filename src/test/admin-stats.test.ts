import { describe, expect, it } from "vitest";
import { computeStats, leadsToCsv, type EventRow } from "@/lib/admin-stats";

const ev = (
  session_id: string,
  event_type: string,
  product_slug: string | null = null,
  extra: Partial<EventRow> = {},
): EventRow => ({
  created_at: "2026-11-24T10:00:00Z",
  session_id,
  event_type,
  product_slug,
  color: null,
  size: null,
  quantity: null,
  ...extra,
});

describe("computeStats", () => {
  const events = [
    ev("a", "landing"),
    ev("b", "landing"),
    ev("c", "landing"),
    ev("a", "add_to_cart", "aurora-slingback", { color: "Black", size: 38, quantity: 2 }),
    ev("b", "add_to_cart", "marta-decollete", { color: "Nude", size: 37, quantity: 1 }),
    ev("a", "begin_checkout"),
    ev("a", "purchase_intent", "aurora-slingback", { quantity: 2 }),
  ];
  const stats = computeStats(events, []);

  it("counts unique visitors and funnel steps by session", () => {
    expect(stats.visitors).toBe(3);
    expect(stats.cartSessions).toBe(2);
    expect(stats.checkoutSessions).toBe(1);
    expect(stats.intentSessions).toBe(1);
  });

  it("ranks the most requested product by units", () => {
    expect(stats.topProduct?.key).toBe("aurora-slingback");
    expect(stats.topProduct?.units).toBe(2);
  });

  it("computes the conversion rates", () => {
    expect(stats.conversion.cartRate).toBeCloseTo(66.67, 1);
    expect(stats.conversion.overall).toBeCloseTo(33.33, 1);
  });

  it("breaks cart adds down by variant", () => {
    expect(stats.addToCartByVariant.map((b) => b.key)).toContain("aurora-slingback · Black · 38");
  });

  it("handles no data without dividing by zero", () => {
    const empty = computeStats([], []);
    expect(empty.visitors).toBe(0);
    expect(empty.conversion.overall).toBe(0);
    expect(empty.topProduct).toBeNull();
  });
});

describe("leadsToCsv", () => {
  it("escapes quotes", () => {
    const csv = leadsToCsv([
      {
        id: "1",
        created_at: "2026-11-24",
        session_id: null,
        first_name: 'Ma"ria',
        last_name: "Rossi",
        email: "m@x.it",
        phone: null,
        city: null,
        items: [{ slug: "aurora-slingback", color: "Black", size: 38, quantity: 1 }],
        total_eur: 279,
      },
    ]);
    expect(csv).toContain('"Ma""ria"');
  });
});
