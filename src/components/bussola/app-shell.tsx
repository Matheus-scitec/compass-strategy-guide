import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApresentacaoGuiada } from "@/components/bussola/apresentacao";
import type { TelaGuia } from "@/lib/apresentacao";

export function AppShell({
  children,
  cicloId,
  titulo,
  subtitulo,
  acoes,
  tela,
}: {
  children: React.ReactNode;
  cicloId?: string;
  titulo?: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
  tela?: TelaGuia;
}) {
  const navigate = useNavigate();

  const abas = cicloId
    ? [
        { to: "/ciclo/$cicloId", label: "Etapas" },
        { to: "/ciclo/$cicloId/diagnostico", label: "Diagnóstico" },
        { to: "/ciclo/$cicloId/escolhas", label: "Escolhas" },
        { to: "/ciclo/$cicloId/mapa", label: "Mapa estratégico" },
        { to: "/ciclo/$cicloId/pessoas", label: "Por pessoa" },
        { to: "/ciclo/$cicloId/painel", label: "Painel de execução" },
        { to: "/ciclo/$cicloId/revisao", label: "Revisão" },
        { to: "/ciclo/$cicloId/conselho", label: "Conselho" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link to="/ciclos" className="flex items-center gap-2 font-display text-sm font-bold">
            <Compass className="h-4 w-4 text-primary" />
            Bússola
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto" data-guia="abas">
            {abas.map((aba) => (
              <Link
                key={aba.to}
                to={aba.to}
                params={{ cicloId: cicloId! }}
                activeOptions={{ exact: aba.to === "/ciclo/$cicloId" }}
                className="rounded-sm px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-superficie-forte hover:text-foreground data-[status=active]:bg-superficie-forte data-[status=active]:font-medium data-[status=active]:text-foreground"
              >
                {aba.label}
              </Link>
            ))}
          </nav>
          {tela ? <ApresentacaoGuiada tela={tela} /> : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/auth" });
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        {titulo ? (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{titulo}</h1>
              {subtitulo ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
              ) : null}
            </div>
            {acoes ? <div className="flex flex-wrap gap-2">{acoes}</div> : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function Painel({
  titulo,
  descricao,
  acoes,
  children,
  className,
  guia,
}: {
  titulo?: string;
  descricao?: string;
  acoes?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  guia?: string;
}) {
  return (
    <section
      className={cn("rounded-md border border-border bg-card", className)}
      {...(guia ? { "data-guia": guia } : {})}
    >
      {titulo ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">{titulo}</h2>
            {descricao ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
            ) : null}
          </div>
          {acoes}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
