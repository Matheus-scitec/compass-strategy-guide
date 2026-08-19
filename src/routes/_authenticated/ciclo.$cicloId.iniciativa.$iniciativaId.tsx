import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, Coach, Rotulo, SeloProcedencia } from "@/components/bussola/selos";
import { Comentarios } from "@/components/bussola/comentarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_ACAO_LABEL, STATUS_INICIATIVA_LABEL } from "@/lib/bussola";
import { acaoAtrasada, faltasDaIniciativa, type AcaoItem } from "@/lib/bloqueios";
import { fmtData, fmtNumero } from "@/lib/format";
import { useAcoesDaIniciativa, useCiclo, useIniciativa, useMembros } from "@/lib/queries";

export const Route = createFileRoute(
  "/_authenticated/ciclo/$cicloId/iniciativa/$iniciativaId",
)({
  head: () => ({
    meta: [
      { title: "Iniciativa e plano operacional — Bússola" },
      {
        name: "description",
        content:
          "Ações da iniciativa com responsável pessoa, prazo e entregável verificável, mais os pontos abertos do time.",
      },
      { property: "og:title", content: "Iniciativa e plano operacional — Bússola" },
      {
        property: "og:description",
        content: "Iniciativa sem ação com dono e prazo não fecha a etapa do plano operacional.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IniciativaDetalhe,
});

type Membro = { user_id: string; perfil: { id: string; nome: string } | null };

function IniciativaDetalhe() {
  const { cicloId, iniciativaId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const iniciativa = useIniciativa(iniciativaId);
  const acoes = useAcoesDaIniciativa(iniciativaId);
  const c = ciclo.data as { org_id: string } | undefined;
  const membros = useMembros(c?.org_id);
  const qc = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [responsavel, setResponsavel] = useState<string>("__vazio");
  const [prazo, setPrazo] = useState("");

  const i = iniciativa.data as
    | {
        id: string;
        codigo: string;
        titulo: string;
        status: "N" | "A" | "C" | "T";
        fim: string | null;
        inicio: string | null;
        investimento: number | null;
        entregavel_verificavel: string | null;
        reversibilidade: string | null;
        publicado: boolean;
        lider_id: string | null;
        objetivo_id: string | null;
        procedencia: "decidido_pelo_time" | "importado_de_documento" | "sugerido_pelo_sistema" | "inferido";
        perfil: { id: string; nome: string } | null;
        objetivo: { id: string; codigo: string; frase: string } | null;
      }
    | undefined;

  const listaAcoes = (acoes.data ?? []) as unknown as AcaoItem[];
  const listaMembros = (membros.data ?? []) as unknown as Membro[];
  const faltas = i
    ? faltasDaIniciativa({
        id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
        objetivo_id: i.objetivo_id,
        lider_id: i.lider_id,
        fim: i.fim,
        entregavel_verificavel: i.entregavel_verificavel,
        publicado: i.publicado,
        status: i.status,
      })
    : [];

  async function criarAcao() {
    if (!titulo.trim()) return;
    const { error } = await supabase.from("acao").insert({
      iniciativa_id: iniciativaId,
      titulo: titulo.trim(),
      responsavel_id: responsavel === "__vazio" ? null : responsavel,
      prazo: prazo || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitulo("");
    setPrazo("");
    setResponsavel("__vazio");
    await qc.invalidateQueries({ queryKey: ["acoes", iniciativaId] });
  }

  async function atualizarAcao(
    id: string,
    dados: { titulo?: string; responsavel_id?: string | null; prazo?: string | null; status?: string },
  ) {
    const { error } = await supabase.from("acao").update(dados).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["acoes", iniciativaId] });
  }

  async function removerAcao(id: string) {
    const { error } = await supabase.from("acao").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["acoes", iniciativaId] });
  }

  const semDono = listaAcoes.filter((a) => !a.responsavel_id || !a.prazo);
  const atrasadas = listaAcoes.filter(acaoAtrasada);

  return (
    <AppShell
      cicloId={cicloId}
      tela="iniciativa"
      titulo={i ? `${i.codigo} · ${i.titulo}` : "Iniciativa"}
      subtitulo={
        i
          ? `${STATUS_INICIATIVA_LABEL[i.status]} · líder ${i.perfil?.nome ?? "não nomeado"} · prazo ${fmtData(i.fim)}`
          : ""
      }
      acoes={
        <Button asChild variant="outline">
          <Link to="/ciclo/$cicloId/mapa" params={{ cicloId }}>
            Voltar ao mapa
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Painel
            guia="acoes"
            titulo="Ações (nível operacional)"
            descricao="Cada ação tem responsável pessoa, prazo e entregável que alguém confere."
          >
            <div className="space-y-2">
              {listaAcoes.length ? (
                listaAcoes.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-superficie p-3"
                  >
                    <Input
                      key={`t-${a.id}`}
                      defaultValue={a.titulo}
                      className="h-8 min-w-[200px] flex-1"
                      onBlur={(e) =>
                        e.target.value.trim() !== a.titulo &&
                        atualizarAcao(a.id, { titulo: e.target.value.trim() })
                      }
                    />
                    <Select
                      value={a.responsavel_id ?? "__vazio"}
                      onValueChange={(v) =>
                        atualizarAcao(a.id, { responsavel_id: v === "__vazio" ? null : v })
                      }
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="Responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__vazio">Sem responsável</SelectItem>
                        {listaMembros.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.perfil?.nome ?? "Sem nome"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      key={`p-${a.id}`}
                      type="date"
                      defaultValue={a.prazo ?? ""}
                      className="h-8 w-36"
                      onBlur={(e) =>
                        e.target.value !== (a.prazo ?? "") &&
                        atualizarAcao(a.id, { prazo: e.target.value || null })
                      }
                    />
                    <Select
                      value={a.status}
                      onValueChange={(v) => atualizarAcao(a.id, { status: v })}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_ACAO_LABEL).map(([valor, label]) => (
                          <SelectItem key={valor} value={valor}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {acaoAtrasada(a) ? (
                      <span className="rounded-sm border border-farol-vermelho/40 px-1.5 py-px text-xs text-farol-vermelho">
                        atrasada
                      </span>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Remover ação"
                      onClick={() => removerAcao(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ação. Iniciativa publicada sem ação bloqueia o fechamento da etapa 4.
                </p>
              )}
            </div>

            <div className="mt-3 rounded-md border border-border p-3">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nova ação
                <Coach chave="acao_entregavel" />
              </span>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Publicar o procedimento revisado no portal"
                  className="h-9 min-w-[220px] flex-1"
                />
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio">Sem responsável</SelectItem>
                    {listaMembros.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.perfil?.nome ?? "Sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="h-9 w-40"
                />
                <Button size="sm" onClick={criarAcao} disabled={!titulo.trim()}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            </div>
          </Painel>

          <Painel titulo="Pontos abertos" descricao="Comentário com @menção e marcação de resolvido.">
            <Comentarios
              orgId={c?.org_id}
              entidadeTipo="iniciativa"
              entidadeId={iniciativaId}
              membros={listaMembros}
            />
          </Painel>
        </div>

        <div className="space-y-4">
          <Painel titulo="Ficha da iniciativa">
            {i ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <Rotulo>Objetivo que sustenta</Rotulo>
                  {i.objetivo ? (
                    <Link
                      to="/ciclo/$cicloId/objetivo/$objetivoId"
                      params={{ cicloId, objetivoId: i.objetivo.id }}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {i.objetivo.codigo} · {i.objetivo.frase}
                    </Link>
                  ) : (
                    <p className="text-farol-vermelho">órfã — não sustenta objetivo nenhum</p>
                  )}
                </div>
                <div>
                  <Rotulo>Entregável verificável</Rotulo>
                  <p>{i.entregavel_verificavel || "—"}</p>
                </div>
                <div>
                  <Rotulo>Janela</Rotulo>
                  <p className="num">
                    {fmtData(i.inicio)} → {fmtData(i.fim)}
                  </p>
                </div>
                <div>
                  <Rotulo>Investimento</Rotulo>
                  <p className="num">
                    {i.investimento === null ? "—" : `R$ ${fmtNumero(i.investimento)}`}
                  </p>
                </div>
                <div>
                  <Rotulo>Reversibilidade</Rotulo>
                  <p>{i.reversibilidade || "—"}</p>
                </div>
                <SeloProcedencia valor={i.procedencia} />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            )}
          </Painel>

          <Painel titulo="Pendências">
            <div className="space-y-2">
              {faltas.length ? (
                <Aviso
                  titulo={`Falta ${faltas.join(", ")}`}
                  porque="Sem líder pessoa, prazo e entregável verificável a iniciativa não é publicável — e ninguém consegue cobrar a entrega na data."
                />
              ) : null}
              {semDono.length ? (
                <Aviso
                  titulo={`${semDono.length} ação(ões) sem responsável ou prazo`}
                  porque="Ação sem dono e data não entra em pauta de reunião e reaparece como surpresa no fim do trimestre."
                />
              ) : null}
              {atrasadas.length ? (
                <Aviso
                  titulo={`${atrasadas.length} ação(ões) com prazo vencido`}
                  porque="Prazo vencido sem replanejamento é o começo do plano de gaveta. Reprograme ou registre a decisão na revisão."
                />
              ) : null}
              {!faltas.length && !semDono.length && !atrasadas.length ? (
                <p className="text-sm text-muted-foreground">Nada pendente nesta iniciativa.</p>
              ) : null}
            </div>
          </Painel>
        </div>
      </div>
    </AppShell>
  );
}