import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, Rotulo, SeloClassificacao, SeloProcedencia } from "@/components/bussola/selos";
import {
  DialogIndicador,
  DialogIniciativa,
  DialogObjetivo,
} from "@/components/bussola/formularios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PERSPECTIVAS, periodosMensais } from "@/lib/bussola";
import { faltasDoIndicador, type IndicadorBloq } from "@/lib/bloqueios";
import { fmtData, fmtNumero, fmtPeriodo } from "@/lib/format";
import { useCiclo, useIniciativas, useMembros, useObjetivo, useObjetivos } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/objetivo/$objetivoId")({
  head: () => ({
    meta: [
      { title: "Ficha do objetivo — Bússola" },
      {
        name: "description",
        content:
          "Por que importa, dono, indicadores com metas por período, iniciativas vinculadas, risco principal e fórum de acompanhamento.",
      },
      { property: "og:title", content: "Ficha do objetivo — Bússola" },
      {
        property: "og:description",
        content: "Tudo o que sustenta um objetivo do ciclo, num só lugar.",
      },
    ],
  }),
  component: FichaObjetivo,
});

function FichaObjetivo() {
  const { cicloId, objetivoId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const objetivo = useObjetivo(objetivoId);
  const objetivos = useObjetivos(cicloId);
  const iniciativas = useIniciativas(cicloId);
  const orgId = (ciclo.data as { org_id?: string } | undefined)?.org_id;
  const membros = useMembros(orgId);

  const [editando, setEditando] = useState(false);
  const [novoIndicador, setNovoIndicador] = useState(false);
  const [indicadorEditando, setIndicadorEditando] = useState<IndicadorBloq | null>(null);
  const [novaIniciativa, setNovaIniciativa] = useState(false);
  const [tituloIniciativa, setTituloIniciativa] = useState<string | null>(null);

  const o = objetivo.data as unknown as
    | {
        id: string;
        codigo: string;
        perspectiva: string;
        frase: string;
        por_que_importa: string | null;
        dono_id: string | null;
        forum_acompanhamento: string | null;
        risco_principal: string | null;
        procedencia: "decidido_pelo_time";
        perfil: { nome: string } | null;
        indicador: IndicadorBloq[];
      }
    | undefined;

  const membrosLista = (membros.data ?? []) as unknown as {
    user_id: string;
    perfil: { id: string; nome: string } | null;
  }[];
  const todosObjetivos = (objetivos.data ?? []) as unknown as {
    id: string;
    codigo: string;
    frase: string;
    indicador: IndicadorBloq[];
  }[];
  const listaIniciativas = (iniciativas.data ?? []) as unknown as {
    id: string;
    codigo: string;
    titulo: string;
    objetivo_id: string | null;
    fim: string | null;
    perfil: { nome: string } | null;
  }[];

  const c = ciclo.data as
    | { horizonte_inicio: string; horizonte_fim: string; nome: string }
    | undefined;

  if (!o) {
    return (
      <AppShell cicloId={cicloId} titulo="Objetivo">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  const indicadores = o.indicador ?? [];
  const vinculadas = listaIniciativas.filter((i) => i.objetivo_id === o.id);
  const codigosIndicadores = todosObjetivos.flatMap((obj) =>
    (obj.indicador ?? []).map((i) => i.codigo),
  );
  const nomesIndicadores = todosObjetivos.flatMap((obj) =>
    (obj.indicador ?? []).map((i) => ({ nome: i.nome, formula: i.formula })),
  );

  return (
    <AppShell
      cicloId={cicloId}
      tela="objetivo"
      titulo={o.frase}
      subtitulo={`${o.codigo} · ${PERSPECTIVAS.find((p) => p.valor === o.perspectiva)?.nome ?? ""} · ${c?.nome ?? ""}`}
      acoes={
        <>
          <Button variant="outline" onClick={() => setEditando(true)}>
            <Pencil className="h-4 w-4" /> Editar objetivo
          </Button>
          <Button onClick={() => setNovoIndicador(true)}>
            <Plus className="h-4 w-4" /> Indicador
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Painel guia="indicadores" titulo="Indicadores" descricao="Máximo de 3 por objetivo.">
            {indicadores.length > 3 ? (
              <div className="mb-3">
                <Aviso
                  titulo="Mais de 3 indicadores neste objetivo"
                  porque="Provavelmente são dois objetivos. Separe a frase de mudança em duas."
                />
              </div>
            ) : null}
            {indicadores.length ? (
              <ul className="space-y-3">
                {indicadores.map((i) => (
                  <li key={i.id} className="rounded-md border border-border bg-superficie p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          <span className="num mr-1 text-xs text-muted-foreground">{i.codigo}</span>
                          {i.nome}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {i.formula || "sem fórmula"} · fonte: {i.fonte || "—"} ·{" "}
                          {i.frequencia || "—"} ·{" "}
                          {i.polaridade === "menor" ? "menor é melhor" : "maior é melhor"}
                        </p>
                        <p className="num mt-1 text-xs text-muted-foreground">
                          Linha de base: {fmtNumero(i.linha_base)} {" "}
                          {fmtData(i.linha_base_data)} ·{" "}
                          {i.tipo_indicador === "direcao" ? "de direção" : "de resultado"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={
                            i.publicado
                              ? "rounded-sm border border-farol-verde/40 px-1.5 py-px text-xs text-farol-verde"
                              : "rounded-sm border border-farol-ambar/40 px-1.5 py-px text-xs text-farol-ambar"
                          }
                        >
                          {i.publicado ? "publicado" : "rascunho"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIndicadorEditando(i)}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                    {!i.publicado ? (
                      <p className="mt-2 text-xs text-farol-ambar">
                        Falta {faltasDoIndicador(i).join(", ")} — indicador em rascunho não aparece
                        no painel.
                      </p>
                    ) : null}
                    {c ? (
                      <MetasDoIndicador
                        indicadorId={i.id}
                        inicio={c.horizonte_inicio}
                        fim={c.horizonte_fim}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum indicador ainda. Sem indicador, ninguém sabe se o objetivo andou.
              </p>
            )}
          </Painel>

          <Painel
            guia="iniciativas"
            titulo="Iniciativas vinculadas"
            descricao="Como este objetivo vai acontecer."
            acoes={
              <Button size="sm" variant="outline" onClick={() => setNovaIniciativa(true)}>
                <Plus className="h-4 w-4" /> Iniciativa
              </Button>
            }
          >
            {vinculadas.length ? (
              <ul className="divide-y divide-border text-sm">
                {vinculadas.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="num text-xs text-muted-foreground">{i.codigo}</span>
                    <span className="flex-1 min-w-[160px]">{i.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {i.perfil?.nome ?? "sem líder"} · {fmtData(i.fim)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma iniciativa vinculada.</p>
            )}
          </Painel>
        </div>

        <div className="space-y-4">
          <Painel titulo="Ficha">
            <dl className="space-y-3 text-sm">
              <div>
                <Rotulo>Por que importa</Rotulo>
                <dd className="text-muted-foreground">{o.por_que_importa || "—"}</dd>
              </div>
              <div>
                <Rotulo>Dono</Rotulo>
                <dd>
                  {o.perfil?.nome ?? <span className="text-farol-vermelho">sem dono</span>}
                </dd>
              </div>
              <div>
                <Rotulo coach="objetivo_forum">Fórum de acompanhamento</Rotulo>
                <dd className={o.forum_acompanhamento ? "" : "text-farol-ambar"}>
                  {o.forum_acompanhamento || "não definido"}
                </dd>
              </div>
              <div>
                <Rotulo>Risco principal</Rotulo>
                <dd className="text-muted-foreground">{o.risco_principal || "—"}</dd>
              </div>
              <div className="flex items-center gap-2">
                <SeloProcedencia valor={o.procedencia} />
                <SeloClassificacao valor="dado_medido" />
              </div>
            </dl>
          </Painel>

          <Painel titulo="Voltar ao mapa">
            <Link
              to="/ciclo/$cicloId/mapa"
              params={{ cicloId }}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Ver o mapa estratégico completo
            </Link>
          </Painel>
        </div>
      </div>

      {editando ? (
        <DialogObjetivo
          aberto={editando}
          onOpenChange={setEditando}
          cicloId={cicloId}
          membros={membrosLista}
          codigosExistentes={todosObjetivos.map((x) => x.codigo)}
          inicial={{
            id: o.id,
            perspectiva: o.perspectiva as never,
            frase: o.frase,
            por_que_importa: o.por_que_importa,
            dono_id: o.dono_id,
            forum_acompanhamento: o.forum_acompanhamento,
            risco_principal: o.risco_principal,
            procedencia: o.procedencia,
          }}
        />
      ) : null}

      {novoIndicador ? (
        <DialogIndicador
          aberto={novoIndicador}
          onOpenChange={setNovoIndicador}
          objetivoId={o.id}
          cicloId={cicloId}
          membros={membrosLista}
          codigosExistentes={codigosIndicadores}
          nomesExistentes={nomesIndicadores}
          onPedirIniciativaLinhaBase={(nome) => {
            setTituloIniciativa(`Construir a linha de base de ${nome}`);
            setNovoIndicador(false);
            setNovaIniciativa(true);
          }}
        />
      ) : null}

      {indicadorEditando ? (
        <DialogIndicador
          aberto={!!indicadorEditando}
          onOpenChange={(v) => !v && setIndicadorEditando(null)}
          objetivoId={o.id}
          cicloId={cicloId}
          membros={membrosLista}
          codigosExistentes={codigosIndicadores}
          nomesExistentes={nomesIndicadores.filter((n) => n.nome !== indicadorEditando.nome)}
          inicial={{
            id: indicadorEditando.id,
            nome: indicadorEditando.nome,
            formula: indicadorEditando.formula,
            fonte: indicadorEditando.fonte,
            frequencia: indicadorEditando.frequencia,
            polaridade: indicadorEditando.polaridade,
            unidade: null,
            linha_base:
              indicadorEditando.linha_base === null ? "" : String(indicadorEditando.linha_base),
            linha_base_data: indicadorEditando.linha_base_data,
            responsavel_apuracao: null,
            tipo_indicador: indicadorEditando.tipo_indicador,
            publicado: indicadorEditando.publicado,
            procedencia: "decidido_pelo_time",
          }}
          onPedirIniciativaLinhaBase={(nome) => {
            setTituloIniciativa(`Construir a linha de base de ${nome}`);
            setIndicadorEditando(null);
            setNovaIniciativa(true);
          }}
        />
      ) : null}

      {novaIniciativa ? (
        <DialogIniciativa
          aberto={novaIniciativa}
          onOpenChange={(v) => {
            setNovaIniciativa(v);
            if (!v) setTituloIniciativa(null);
          }}
          cicloId={cicloId}
          membros={membrosLista}
          objetivos={todosObjetivos.map((x) => ({
            id: x.id,
            codigo: x.codigo,
            frase: x.frase,
          }))}
          codigosExistentes={listaIniciativas.map((i) => i.codigo)}
          inicial={{
            titulo: tituloIniciativa ?? "",
            objetivo_id: o.id,
            lider_id: null,
            entregavel_verificavel: tituloIniciativa
              ? "Linha de base medida, com fonte e data de extração registradas"
              : "",
            inicio: null,
            fim: null,
            investimento: "",
            status: "N",
            reversibilidade: null,
            publicado: false,
            procedencia: "decidido_pelo_time",
          }}
        />
      ) : null}
    </AppShell>
  );
}

function MetasDoIndicador({
  indicadorId,
  inicio,
  fim,
}: {
  indicadorId: string;
  inicio: string;
  fim: string;
}) {
  const qc = useQueryClient();
  const periodos = periodosMensais(inicio, fim);
  const metas = useQuery({
    queryKey: ["metas-indicador", indicadorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_indicador")
        .select("*")
        .eq("indicador_id", indicadorId);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const revisoes = useQuery({
    queryKey: ["revisoes", indicadorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revisao_meta")
        .select("*")
        .eq("indicador_id", indicadorId)
        .order("data", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const [revisando, setRevisando] = useState<{
    periodo: string;
    anterior: number;
    novo: string;
  } | null>(null);
  const [motivo, setMotivo] = useState("");

  const mapa = new Map(
    ((metas.data ?? []) as { periodo: string; valor: number }[]).map((m) => [m.periodo, m.valor]),
  );

  async function salvarMeta(periodo: string, texto: string) {
    if (texto.trim() === "") return;
    const valor = Number(texto.replace(",", "."));
    if (Number.isNaN(valor)) return;
    const anterior = mapa.get(periodo);
    if (anterior !== undefined && anterior !== valor) {
      setRevisando({ periodo, anterior, novo: String(valor) });
      return;
    }
    if (anterior === valor) return;
    const { error } = await supabase
      .from("meta_indicador")
      .upsert({ indicador_id: indicadorId, periodo, valor }, { onConflict: "indicador_id,periodo" });
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["metas-indicador", indicadorId] });
    await qc.invalidateQueries({ queryKey: ["metas"] });
  }

  async function confirmarRevisao() {
    if (!revisando || !motivo.trim()) return;
    const valor = Number(revisando.novo);
    const { data: user } = await supabase.auth.getUser();
    const { error: erroRev } = await supabase.from("revisao_meta").insert({
      indicador_id: indicadorId,
      periodo: revisando.periodo,
      valor_anterior: revisando.anterior,
      valor_novo: valor,
      motivo,
      autor: user.user!.id,
    });
    if (erroRev) {
      toast.error(erroRev.message);
      return;
    }
    const { error } = await supabase
      .from("meta_indicador")
      .upsert(
        { indicador_id: indicadorId, periodo: revisando.periodo, valor },
        { onConflict: "indicador_id,periodo" },
      );
    if (error) {
      toast.error(error.message);
      return;
    }
    setRevisando(null);
    setMotivo("");
    await qc.invalidateQueries();
    toast.success("Meta revisada com motivo registrado.");
  }

  const listaRevisoes = (revisoes.data ?? []) as {
    id: string;
    periodo: string;
    valor_anterior: number | null;
    valor_novo: number | null;
    motivo: string;
    data: string;
  }[];

  return (
    <div className="mt-3 border-t border-border pt-3">
      <Rotulo>Metas por período</Rotulo>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {periodos.map((p) => (
          <label key={p} className="text-xs">
            <span className="text-muted-foreground">{fmtPeriodo(p)}</span>
            <Input
              defaultValue={mapa.get(p) ?? ""}
              inputMode="decimal"
              onBlur={(e) => salvarMeta(p, e.target.value)}
              className="num mt-0.5 h-8"
            />
          </label>
        ))}
      </div>

      {listaRevisoes.length ? (
        <div className="mt-3">
          <Rotulo>Histórico de revisões de meta</Rotulo>
          <ul className="num space-y-1 text-xs text-muted-foreground">
            {listaRevisoes.map((r) => (
              <li key={r.id}>
                {fmtPeriodo(r.periodo)}: {fmtNumero(r.valor_anterior)} →{" "}
                {fmtNumero(r.valor_novo)} · {r.motivo} · {fmtData(r.data)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Dialog open={!!revisando} onOpenChange={(v) => !v && setRevisando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar meta exige motivo</DialogTitle>
            <DialogDescription>
              Meta silenciosamente reduzida transforma todo “verde” futuro em ruído. O histórico
              fica visível no card do indicador.
            </DialogDescription>
          </DialogHeader>
          <p className="num text-sm">
            {revisando ? fmtPeriodo(revisando.periodo) : ""}: {fmtNumero(revisando?.anterior)} →{" "}
            {fmtNumero(Number(revisando?.novo))}
          </p>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por que a meta muda?"
          />
          <DialogFooter>
            <Button onClick={confirmarRevisao} disabled={!motivo.trim()}>
              Registrar revisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
