import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bússola — copiloto de planejamento estratégico" },
      {
        name: "description",
        content:
          "Do diagnóstico ao acompanhamento da execução: o Bússola desdobra a estratégia em níveis estratégico, tático e operacional e impede que o plano fique frouxo.",
      },
      { property: "og:title", content: "Bússola — copiloto de planejamento estratégico" },
      {
        property: "og:description",
        content:
          "Indicador sem fórmula não publica, iniciativa sem líder não publica, número fechado não muda sem rastro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const REGRAS = [
  {
    titulo: "Indicador com fórmula, fonte e linha de base",
    texto:
      "Sem fórmula, fonte, frequência, polaridade e linha de base medida, o indicador fica em rascunho e não entra no painel.",
  },
  {
    titulo: "Iniciativa com líder pessoa e entregável",
    texto:
      "Líder é pessoa, não área. Sem prazo e sem entregável verificável, a iniciativa não é publicável.",
  },
  {
    titulo: "Ciclo só fecha sem órfãos",
    texto:
      "Objetivo sem dono e iniciativa sem objetivo aparecem como bloqueio explícito, com a lista clicável.",
  },
  {
    titulo: "Número fechado é imutável",
    texto:
      "Alterar um período apurado exige reapresentação com motivo e autor, e o painel passa a exibir o selo.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-display text-sm font-bold">
            <Compass className="h-4 w-4 text-primary" />
            Bússola
          </span>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Copiloto de planejamento estratégico
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Do diagnóstico à execução, sem plano frouxo
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          O Bússola conduz o time executivo pelas cinco etapas do ciclo e desdobra a estratégia
          em três níveis — estratégico, tático e operacional. Não é repositório de documentos:
          é um sistema que bloqueia, avisa e ensina no momento em que a decisão está sendo tomada.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar um ciclo
          </Link>
          <Link
            to="/ciclos"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-superficie-forte"
          >
            Já tenho ciclo em andamento
          </Link>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {REGRAS.map((regra) => (
            <article key={regra.titulo} className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">{regra.titulo}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{regra.texto}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
