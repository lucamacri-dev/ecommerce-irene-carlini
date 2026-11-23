import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ShopLayout } from "@/components/shop/Layout";

export const Route = createFileRoute("/grazie")({
  head: () => ({
    meta: [{ title: "Grazie · Irene Carlini" }, { name: "robots", content: "noindex" }],
  }),
  component: ThankYou,
});

function ThankYou() {
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      setName(window.sessionStorage.getItem("echos_lead_name") ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ShopLayout>
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-green" />
        <h1 className="mt-6 text-3xl font-light">Grazie{name ? `, ${name}` : ""}!</h1>
        <p className="mt-5 text-muted-foreground">
          Il prodotto che hai scelto{" "}
          <strong className="font-medium text-foreground">
            al momento non è ancora disponibile
          </strong>
          . Non è stato addebitato nessun pagamento.
        </p>
        <p className="mt-3 text-muted-foreground">
          Abbiamo salvato la tua richiesta e{" "}
          <strong className="font-medium text-foreground">ti ricontatteremo a breve</strong> con
          tutte le informazioni.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-terracotta-dark"
        >
          Torna alla home
        </Link>
      </div>
    </ShopLayout>
  );
}
