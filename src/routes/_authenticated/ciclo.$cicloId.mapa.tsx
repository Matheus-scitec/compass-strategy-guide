import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { SeloProcedencia } from "@/components/bussola/selos";
import { DialogIniciativa, DialogObjetivo } from "@/components/bussola/formularios";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERSPECTIVAS, STATUS_INICIATIVA_LABEL, type Perspectiva } from "@/lib/bussola";
import { useCiclo, useIniciativas, useMembros, useObjetivos } from "@/lib/queries";
import { fmtData } from "@/lib/format";
import { faltasDaIniciativa, faltasDoIndicador } from "@/lib/bloqueios";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa estratégico — Bússola" },
      {
        name: "description",
        content:
          "Quatro perspectivas encadeadas mais a faixa de sustentação, com objetivos, indicadores e iniciativas do ciclo.",
      },
      { property: "og:title", content: "Mapa estratégico — Bússola" },
      {
        property: "og:description",
        content:
          "Aprendizado sustenta processos, que entregam cliente, que geram financeiro. A faixa de sustentação é pré-requisito.",
      },
    ],
  }),
  component: MapaPage,
});

function MapaPage() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const objetivos = useObjetivos(cicloId);
  const iniciativas = useIniciativas(cicloId);
  const orgId = (ciclo.data as { org_id?: string } | undefined)?.org_id;
  const membros = useMembros(orgId);
  const qc = useQueryClient();

  const [objetivoAberto, setObjetivoAberto] = useState(false);
  const [iniciativaAberta, setIniciativaAberta] = useState(false);

  const lista = (objetivos.data ?? []) as unknown as {
    id: string;
    codigo: string;
    perspectiva: Perspectiva;
    frase: string;
    dono_id: string | null;
    forum_acompanhamento: string | null;
    procedencia: "decidido_pelo_time";
    perfil: { nome: string } | null;
    indicador: Parameters<typeof faltasDoIndicador>[0][];
  }[];

  const listaIniciativas = (iniciativas.data ?? []) as unknown as {
    id: string;
    codigo: string;
    titulo: string;
    objetivo_id: string | null;
    status: "N" | "A" | "C" | "T";
    fim: string | null;
    lider_id: string | null;
    entregavel_verificavel: string | null;
    publicado: boolean;
    perfil: { id: string; nome: string } | null;
    objetivo: { codigo: string } | null;
  }[];

  const membrosLista = (membros.data ?? []) as unknown as {
    user_id: string;
    perfil: { id: string; nome: string } | null;
  }[];

  async function moverPerspectiva(objetivoId: string, perspectiva: Perspectiva) {
    const { error } = await supabase
      .from("objetivo")
      .update({ perspectiva })
      .eq("id", objetivoId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries();
  }

  return (
    <AppShell
      cicloId={cicloId}
      titulo="Mapa estratégico"
      subtitulo="Aprendizado & Crescimento sustenta Processos, que entregam Cliente & Mercado, que geram Financeiro."
      acoes={
        <>
          <Button variant="outline" onClick={() => setIniciativaAberta(true)}>
            <Plus className="h-4 w-4" /> Iniciativa
          </Button>
          <Button onClick={() => setObjetivoAberto(true)}>
            <Plus className="h-4 w-4" /> Objetivo
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {PERSPECTIVAS.map((p, indice) => {
          const doGrupo = lista.filter((o) => o.perspectiva === p.valor);
          return (
            <section
              key={p.valor}
              className={
                p.sustentacao
                  ? "rounded-md border border-dashed border-primary/50 bg-superficie p-4"
                  : "rounded-md border border-border bg-card p-4"
              }
            >
              <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    {p.nome}
                    {!p.sustentacao && indice < 3 ? (
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : null}
                  </h2>
                  <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">{p.explicacao}</p>
                </div>
                <span className="num text-xs text-muted-foreground">
                  {doGrupo.length} objetivo(s)
                </span>
              </header>

              {doGrupo.length ? (
                <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {doGrupo.map((o) => {
                    const rascunhos = (o.indicador ?? []).filter((i) => !i.publicado).length;
                    return (
                      <li
                        key={o.id}
                        className="rounded-md border border-border bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to="/ciclo/$cicloId/objetivo/$objetivoId"
                            params={{ cicloId, objetivoId: o.id }}
                            className="text-sm font-medium underline-offset-4 hover:underline"
                          >
                            <span className="num mr-1 text-xs text-muted-foreground">
                              {o.codigo}
                            </span>
                            {o.frase}
                          </Link>
                          <SeloProcedencia valor={o.procedencia} />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Dono:{" "}
                          {o.perfil?.nome ?? (
                            <span className="text-farol-vermelho">sem dono</span>
                          )}{" "}
                          · Fórum: {o.forum_acompanhamento || "—"}
                        </p>
                        <p className="num mt-1 text-xs text-muted-foreground">
                          {(o.indicador ?? []).length} indicador(es)
                          {rascunhos ? ` · ${rascunhos} em rascunho` : ""}
                        </p>
                        <div className="mt-2">
                          <Select
                            value={o.perspectiva}
                            onValueChange={(v) => moverPerspectiva(o.id, v as Perspectiva)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERSPECTIVAS.map((op) => (
                                <SelectItem key={op.valor} value={op.valor}>
                                  Mover para {op.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum objetivo nesta perspectiva.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-4">
        <Painel
          titulo="Iniciativas do ciclo"
          descricao="Iniciativa sem objetivo é órfã e bloqueia o fechamento do desdobramento."
        >
          {listaIniciativas.length ? (
            <ul className="divide-y divide-border text-sm">
              {listaIniciativas.map((i) => {
                const faltas = faltasDaIniciativa(i);
                return (
                  <li key={i.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="num text-xs text-muted-foreground">{i.codigo}</span>
                    <span className="flex-1 min-w-[180px]">{i.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {i.perfil?.nome ?? "sem líder"} · prazo {fmtData(i.fim)}
                    </span>
                    <span className="rounded-sm border border-border px-1.5 py-px text-xs text-muted-foreground">
                      {STATUS_INICIATIVA_LABEL[i.status]}
                    </span>
                    {!i.objetivo_id ? (
                      <span className="rounded-sm border border-farol-vermelho/40 px-1.5 py-px text-xs text-farol-vermelho">
                        órfã
                      </span>
                    ) : (
                      <span className="num text-xs text-muted-foreground">
                        {i.objetivo?.codigo}
                      </span>
                    )}
                    {faltas.length ? (
                      <span className="text-xs text-farol-ambar">falta {faltas.join(", ")}</span>
                    ) : (
                      <span className="text-xs text-farol-verde">publicável</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma iniciativa. Cada objetivo precisa de iniciativas que expliquem como ele
              acontece.
            </p>
          )}
        </Painel>
      </div>

      {objetivoAberto ? (
        <DialogObjetivo
          aberto={objetivoAberto}
          onOpenChange={setObjetivoAberto}
          cicloId={cicloId}
          membros={membrosLista}
          codigosExistentes={lista.map((o) => o.codigo)}
        />
      ) : null}

      {iniciativaAberta ? (
        <DialogIniciativa
          aberto={iniciativaAberta}
          onOpenChange={setIniciativaAberta}
          cicloId={cicloId}
          membros={membrosLista}
          objetivos={lista.map((o) => ({ id: o.id, codigo: o.codigo, frase: o.frase }))}
          codigosExistentes={listaIniciativas.map((i) => i.codigo)}
        />
      ) : null}
    </AppShell>
  );
}
