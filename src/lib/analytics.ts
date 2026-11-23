import { getSupabase } from "./supabase";

export type EventType =
  | "landing"
  | "view_product"
  | "select_option"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase_intent";

export interface TrackProps {
  product_slug?: string;
  color?: string;
  size?: number;
  quantity?: number;
  meta?: Record<string, unknown>;
}

const SID_KEY = "echos_sid";

function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Anonymous per-browser id: lets us count unique visitors without any personal data. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const store = safeStorage("local");
  let id = store?.getItem(SID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    store?.setItem(SID_KEY, id);
  }
  return id;
}

function utm() {
  const q = new URLSearchParams(window.location.search);
  const pick = (k: string) => q.get(k) ?? undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
  };
}

export async function track(type: EventType, props: TrackProps = {}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("events").insert({
      session_id: getSessionId(),
      event_type: type,
      product_slug: props.product_slug ?? null,
      color: props.color ?? null,
      size: props.size ?? null,
      quantity: props.quantity ?? null,
      path: window.location.pathname,
      referrer: document.referrer || null,
      ...utm(),
      meta: props.meta ?? {},
    });
  } catch {
    // Tracking must never break the shop.
  }
}

/** Fire the `landing` event once per browser session (tab). */
export function trackLandingOnce(): void {
  const store = safeStorage("session");
  if (store?.getItem("echos_landed")) return;
  store?.setItem("echos_landed", "1");
  void track("landing");
}
