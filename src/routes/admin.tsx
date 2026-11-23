import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  computeStats,
  leadsToCsv,
  type Breakdown,
  type EventRow,
  type LeadRow,
} from "@/lib/admin-stats";
import { getProduct } from "@/data/products";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · ECHOS" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

const inputCls =
  "w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20";

function AdminPage() {
  const sb = getSupabase();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sb) {
      setAuthed(false);
      return;
    }
    void sb.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  if (!sb) {
    return (
      <Shell>
        <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Il database non è ancora collegato (mancano le variabili <code>VITE_SUPABASE_URL</code> e{" "}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>). Abilita Lovable Cloud e crea le tabelle con
          <code> docs/schema.sql</code>.
        </p>
      </Shell>
    );
  }
  if (authed === null) return <Shell>Caricamento…</Shell>;
  return <Shell>{authed ? <Dashboard /> : <Login />}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-brand-green px-5 py-4 text-white">
        <div className="mx-auto max-w-[1200px] text-sm font-medium tracking-[0.2em]">
          ADMIN · FAKE DOOR TEST
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-10">{children}</main>
    </div>
  );
}

function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const { error } = await getSupabase()!.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (error) setError("Credenziali non valide.");
    setBusy(false);
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-light">Accesso riservato</h1>
      <input
        className={inputCls}
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
      />
      <input
        className={inputCls}
        name="password"
        type="password"
        placeholder="Password"
        required
        autoComplete="current-password"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        Accedi
      </button>
    </form>
  );
}

function Dashboard() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async () => {
    const sb = getSupabase()!;
    setState("loading");
    const [e, l] = await Promise.all([
      sb
        .from("events")
        .select("created_at,session_id,event_type,product_slug,color,size,quantity")
        .order("created_at", { ascending: false })
        .limit(50000),
      sb
        .from("leads")
        .select("id,created_at,session_id,first_name,last_name,email,phone,city,items,total_eur")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);
    if (e.error || l.error) {
      setState("error");
      return;
    }
    setEvents(e.data as EventRow[]);
    setLeads(l.data as LeadRow[]);
    setState("ok");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => computeStats(events, leads), [events, leads]);

  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([leadsToCsv(leads)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (state === "loading") return <p>Caricamento dati…</p>;
  if (state === "error") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-destructive/40 bg-card p-6 text-sm">
          Impossibile leggere i dati. Se hai effettuato l'accesso, questo account non è nella lista
          admin (tabella <code>admin_emails</code>).
        </p>
        <button onClick={() => getSupabase()!.auth.signOut()} className="text-sm underline">
          Esci
        </button>
      </div>
    );
  }

  const name = (k: string) => {
    const [slug = "", ...rest] = k.split(" · ");
    const p = getProduct(slug);
    return [p ? `${p.name} ${p.type}` : slug, ...rest].join(" · ");
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-light">Risultati del test</h1>
        <div className="flex gap-3 text-sm">
          <button onClick={load} className="rounded-lg border border-border bg-card px-4 py-2">
            Aggiorna
          </button>
          <button
            onClick={() => getSupabase()!.auth.signOut()}
            className="rounded-lg border border-border bg-card px-4 py-2"
          >
            Esci
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi label="Visitatori unici" value={stats.visitors} />
        <Kpi
          label="Hanno aggiunto al carrello"
          value={stats.cartSessions}
          sub={`${stats.conversion.cartRate.toFixed(1)}% dei visitatori`}
        />
        <Kpi
          label="Sono arrivati al checkout"
          value={stats.checkoutSessions}
          sub={`${stats.conversion.checkoutRate.toFixed(1)}% dei carrelli`}
        />
        <Kpi
          label="Hanno cliccato «Acquista adesso»"
          value={stats.intentSessions}
          sub={`${stats.conversion.intentRate.toFixed(1)}% dal checkout`}
          highlight
        />
        <Kpi
          label="Lead raccolti"
          value={stats.leads}
          sub={`${stats.conversion.overall.toFixed(1)}% dei visitatori`}
        />
      </section>

      <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Lettura indiretta:</strong> {stats.intentSessions}{" "}
        visitatori su {stats.visitors} ({stats.conversion.overall.toFixed(1)}%) avrebbero comprato.
        {stats.topProduct && (
          <>
            {" "}
            Prodotto più richiesto nel carrello:{" "}
            <strong className="text-foreground">{name(stats.topProduct.key)}</strong> (
            {stats.topProduct.units} paia).
          </>
        )}
      </p>

      <section className="grid gap-8 md:grid-cols-2">
        <Table title="Carrello per modello" rows={stats.addToCartByProduct} name={name} />
        <Table title="Intenzione d'acquisto per modello" rows={stats.intentByProduct} name={name} />
        <Table
          title="Carrello per modello · colore · taglia"
          rows={stats.addToCartByVariant}
          name={name}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Andamento giornaliero</h2>
        <div className="h-72 rounded-lg border border-border bg-card p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitors" name="Visitatori" fill="var(--chart-2)" />
              <Bar dataKey="carts" name="Carrello" fill="var(--chart-3)" />
              <Bar dataKey="intents" name="Acquista adesso" fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Lead ({leads.length})</h2>
          <button
            onClick={exportCsv}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm"
          >
            Esporta CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Data", "Nome", "Email", "Telefono", "Città", "Prodotti", "Totale"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(l.created_at).toLocaleString("it-IT")}
                  </td>
                  <td className="px-4 py-3">
                    {l.first_name} {l.last_name}
                  </td>
                  <td className="px-4 py-3">{l.email}</td>
                  <td className="px-4 py-3">{l.phone}</td>
                  <td className="px-4 py-3">{l.city}</td>
                  <td className="px-4 py-3">
                    {l.items
                      .map(
                        (i) =>
                          `${i.quantity}× ${getProduct(i.slug)?.name ?? i.slug} ${i.color} ${i.size}`,
                      )
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3">{l.total_eur != null ? `${l.total_eur} €` : ""}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nessun lead ancora.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Table({
  title,
  rows,
  name,
}: {
  title: string;
  rows: Breakdown[];
  name: (k: string) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <h3 className="border-b border-border px-4 py-3 text-sm font-medium">{title}</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left font-normal">Voce</th>
            <th className="px-4 py-2 text-right font-normal">Utenti</th>
            <th className="px-4 py-2 text-right font-normal">Paia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="px-4 py-2">{name(r.key)}</td>
              <td className="px-4 py-2 text-right">{r.sessions}</td>
              <td className="px-4 py-2 text-right">{r.units}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                Nessun dato.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
