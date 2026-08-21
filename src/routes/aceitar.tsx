import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aceitar")({
  head: () => ({
    meta: [
      { title: "Aceitar convite — Bússola" },
      {
        name: "description",
        content:
          "Entre na sua conta para aceitar o convite e participar do ciclo de planejamento estratégico no Bússola.",
      },
      { property: "og:title", content: "Aceitar convite — Bússola" },
      {
        property: "og:description",
        content: "Aceite o convite e participe do ciclo de planejamento estratégico da sua empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search['c'] === "string" ? (search['c'] as string) : "",
  }),
  component: AceitarConvite,
});

function AceitarConvite() {
  const { c } = Route.useSearch();
  const { user, carregando } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"pronto" | "processando" | "erro">("pronto");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (carregando || !user || !c || estado !== "pronto") return;
    setEstado("processando");
    void (async () => {
      const { error } = await supabase.rpc("aceitar_convite", { _codigo: c });
      if (error) {
        setErro(error.message);
        setEstado("erro");
        return;
      }
      toast.success("Convite aceito. Bem-vindo ao time!");
      void navigate({ to: "/ciclos" });
    })();
  }, [c, carregando, estado, navigate, user]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
        <Compass className="h-6 w-6 text-primary" />
        Convite para o Bússola
      </h1>

      {!c ? (
        <p className="text-sm text-muted-foreground">
          Este link de convite está incompleto. Peça um novo link ao facilitador do ciclo.
        </p>
      ) : carregando ? (
        <p className="text-sm text-muted-foreground">Verificando sua conta…</p>
      ) : !user ? (
        <>
          <p className="text-sm text-muted-foreground">
            Entre na sua conta para aceitar o convite. Depois de entrar, abra este link de convite
            novamente.
          </p>
          <Button asChild>
            <Link to="/auth">Entrar na conta</Link>
          </Button>
        </>
      ) : estado === "erro" ? (
        <>
          <p className="text-sm text-destructive">{erro}</p>
          <Button variant="outline" asChild>
            <Link to="/ciclos">Ir para meus ciclos</Link>
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Aceitando o convite…</p>
      )}
    </main>
  );
}
