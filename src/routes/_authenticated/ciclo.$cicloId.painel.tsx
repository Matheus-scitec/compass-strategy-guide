import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Rotulo, SeloClassificacao } from "@/components/bussola/selos";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FAROL_CLASSE,
  FAROL_LABEL,
  PERSPECTIVAS,
  calculaAtingimento,
  farolDe,
  periodosMensais,
  type Farol,
  type Perspectiva,
} from "@/lib/bussola";
import { fmtNumero, fmtPercentual, fmtPeriodo } from "@/lib/format";
import { useApuracoes, useCiclo, useMetas, useObjetivos } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/painel")({
  head: () => ({
    meta: [
      { title: "Painel de execução — Bússola" },
      {
        name: "description",
        content:
          "Farol por objetivo e indicador, apuração mês a mês, fechamento de período e reapresentação auditada.",
      },
      { property: "og:title", content: "Painel de execução — Bússola" },
      {
        property: "og:description",
        content:
          "Período fechado é imutável: qualquer correção vira reapresentação com motivo e histórico.",
      },
    ],
  }),
  component: PainelExecucao,
});

type Indicador = {
  id: string;
  codigo: string;
  nome: string;
  publicado: boolean;
  polaridade: "maior" | "menor" | null;
  unidade: string | null;
  tipo_indicador: string;
  formula: string | null;
  limite_verde: number | null;
  limite_atencao: number | null;
};

type ObjetivoLinha = {
  id: string;
  codigo: string;
  frase: string;
  perspectiva: Perspectiva;
  perfil: { nome: string } | null;
  indicador: Indicador[];
};

type Classificacao = "dado_medido" | "estimativa" | "premissa_da_diretoria";

type Meta = { indicador_id: string; periodo: string; valor: number | null };
type Apuracao = {
  id: string;
  indicador_id: string;
  periodo: string;
  valor: number | null;
  fechado: boolean;
  observacao: string | null;
  reapresentado: boolean;
  classificacao_numero: Classificacao;
};

function PainelExecucao() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const objetivos = useObjetivos(cicloId);
  const metas = useMetas(cicloId);
  const apuracoes = useApuracoes(cicloId);
  const qc = useQueryClient();

  const c = ciclo.data as
    | { nome: string; horizonte_inicio: string; horizonte_fim: string }
    | undefined;
  const periodos = useMemo(
    () => (c ? periodosMensais(c.horizonte_inicio, c.horizonte_fim) : []),
    [c],
  );
  const hoje = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [periodo, setPeriodo] = useState<string>("");
  const periodoAtivo = periodo || (periodos.includes(hoje) ? hoje : (periodos[0] ?? ""));

  const lista = (objetivos.data ?? []) as unknown as ObjetivoLinha[];
  const listaMetas = (metas.data ?? []) as unknown as Meta[];
  const listaApuracoes = (apuracoes.data ?? []) as unknown as Apuracao[];

  const metaDe = (indicadorId: string) =>
    listaMetas.find((m) => m.indicador_id === indicadorId && m.periodo === periodoAtivo)?.valor ??
    null;
  const apuracaoDe = (indicadorId: string) =>
    listaApuracoes.find((a) => a.indicador_id === indicadorId && a.periodo === periodoAtivo);

  const [reapresentando, setReapresentando] = useState<{
    apuracao: Apuracao;
    nome: string;
    novo: string;
  } | null>(null);
  const [motivo, setMotivo] = useState("");

  async function salvarValor(indicador: Indicador, texto: string) {
    const existente = apuracaoDe(indicador.id);
    const valor = texto.trim() === "" ? null : Number(texto.replace(",", "."));
    if (valor !== null && Number.isNaN(valor)) return;
    if (existente && existente.valor === valor) return;

    if (existente?.fechado) {
      setReapresentando({
        apuracao: existente,
        nome: indicador.nome,
        novo: valor === null ? "" : String(valor),
      });
      return;
    }
    const { error } = await supabase
      .from("apuracao")
      .upsert(
        { indicador_id: indicador.id, periodo: periodoAtivo, valor },
        { onConflict: "indicador_id,periodo" },
      );
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["apuracoes", cicloId] });
  }

  async function salvarObservacao(indicadorId: string, observacao: string) {
    const { error } = await supabase
      .from("apuracao")
      .upsert(
        { indicador_id: indicadorId, periodo: periodoAtivo, observacao },
        { onConflict: "indicador_id,periodo" },
      );
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["apuracoes", cicloId] });
  }

  async function salvarClassificacao(indicadorId: string, classificacao: Classificacao) {
    const { error } = await supabase
      .from("apuracao")
      .upsert(
        {
          indicador_id: indicadorId,
          periodo: periodoAtivo,
          classificacao_numero: classificacao,
        },
        { onConflict: "indicador_id,periodo" },
      );
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["apuracoes", cicloId] });
  }

  async function alternarFechamento(ap: Apuracao) {
    const { error } = await supabase
      .from("apuracao")
      .update({ fechado: !ap.fechado })
      .eq("id", ap.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(ap.fechado ? "Período reaberto." : "Período fechado: valor imutável.");
    await qc.invalidateQueries({ queryKey: ["apuracoes", cicloId] });
  }

  async function confirmarReapresentacao() {
    if (!reapresentando || !motivo.trim()) return;
    const { error } = await supabase.rpc("reapresentar_apuracao", {
      _apuracao: reapresentando.apuracao.id,
      _valor_novo: reapresentando.novo === "" ? 0 : Number(reapresentando.novo),
      _motivo: motivo,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setReapresentando(null);
    setMotivo("");
    toast.success("Reapresentação registrada com motivo e histórico.");
    await qc.invalidateQueries();
  }

  function farolObjetivo(o: ObjetivoLinha): Farol {
    const publicados = (o.indicador ?? []).filter((i) => i.publicado);
    const faroisDe = publicados.map((i) =>
      farolDe(calculaAtingimento(apuracaoDe(i.id)?.valor, metaDe(i.id), i.polaridade)),
    );
    if (!faroisDe.length || faroisDe.every((f) => f === "sem_apuracao")) return "sem_apuracao";
    if (faroisDe.includes("critico")) return "critico";
    if (faroisDe.includes("atencao")) return "atencao";
    return "verde";
  }

  const totais = lista.reduce<Record<Farol, number>>(
    (acc, o) => {
      acc[farolObjetivo(o)] += 1;
      return acc;
    },
    { verde: 0, atencao: 0, critico: 0, sem_apuracao: 0 },
  );

  return (
    <AppShell
      cicloId={cicloId}
      tela="painel"
      titulo="Painel de execução"
      subtitulo="Farol é consequência de meta e apuração, nunca opinião. Sem apuração, cinza — não verde."
      acoes={
        <div className="w-48" data-guia="periodo">
          <Select value={periodoAtivo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p} value={p}>
                  {fmtPeriodo(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["verde", "atencao", "critico", "sem_apuracao"] as Farol[]).map((f) => (
          <div key={f} className={`rounded-md border p-3 ${FAROL_CLASSE[f]}`}>
            <p className="num text-2xl font-bold">{totais[f]}</p>
            <p className="text-xs">{FAROL_LABEL[f]}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3" data-guia="apuracao">
        {lista.length ? (
          lista.map((o) => {
            const farol = farolObjetivo(o);
            const publicados = (o.indicador ?? []).filter((i) => i.publicado);
            const rascunhos = (o.indicador ?? []).length - publicados.length;
            return (
              <Painel key={o.id}>
                <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      to="/ciclo/$cicloId/objetivo/$objetivoId"
                      params={{ cicloId, objetivoId: o.id }}
                      className="text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      <span className="num mr-1 text-xs text-muted-foreground">{o.codigo}</span>
                      {o.frase}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {PERSPECTIVAS.find((p) => p.valor === o.perspectiva)?.nome} ·{" "}
                      {o.perfil?.nome ?? "sem dono"}
                    </p>
                  </div>
                  <span
                    className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${FAROL_CLASSE[farol]}`}
                  >
                    {FAROL_LABEL[farol]}
                  </span>
                </header>

                {publicados.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="py-1.5 font-medium">Indicador</th>
                          <th className="py-1.5 font-medium">Meta</th>
                          <th className="py-1.5 font-medium">Apurado</th>
                          <th className="py-1.5 font-medium">Atingimento</th>
                          <th className="py-1.5 font-medium">Farol</th>
                          <th className="py-1.5 font-medium">Natureza</th>
                          <th className="py-1.5 font-medium">Observação</th>
                          <th className="py-1.5 font-medium">Período</th>
                        </tr>
                      </thead>
                      <tbody>
                        {publicados.map((i) => {
                          const meta = metaDe(i.id);
                          const ap = apuracaoDe(i.id);
                          const atingimento = calculaAtingimento(ap?.valor, meta, i.polaridade);
                          const f = farolDe(atingimento);
                          return (
                            <tr key={i.id} className="border-b border-border/60 align-top">
                              <td className="py-2 pr-3">
                                <span className="num mr-1 text-xs text-muted-foreground">
                                  {i.codigo}
                                </span>
                                {i.nome}
                                {i.tipo_indicador === "direcao" ? (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    (direção)
                                  </span>
                                ) : null}
                                {ap?.reapresentado ? (
                                  <span className="ml-1 rounded-sm border border-farol-ambar/40 px-1 py-px text-xs text-farol-ambar">
                                    reapresentado
                                  </span>
                                ) : null}
                              </td>
                              <td className="num py-2 pr-3">
                                {meta === null ? (
                                  <span className="text-farol-ambar">sem meta</span>
                                ) : (
                                  fmtNumero(meta)
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                <Input
                                  key={`${i.id}-${periodoAtivo}-${ap?.valor ?? ""}`}
                                  defaultValue={ap?.valor ?? ""}
                                  inputMode="decimal"
                                  onBlur={(e) => salvarValor(i, e.target.value)}
                                  className="num h-8 w-28"
                                />
                              </td>
                              <td className="num py-2 pr-3">{fmtPercentual(atingimento)}</td>
                              <td className="py-2 pr-3">
                                <span
                                  className={`rounded-sm border px-1.5 py-px text-xs ${FAROL_CLASSE[f]}`}
                                >
                                  {FAROL_LABEL[f]}
                                </span>
                              </td>
                              <td className="py-2 pr-3">
                                <Select
                                  value={ap?.classificacao_numero ?? "dado_medido"}
                                  onValueChange={(v) =>
                                    salvarClassificacao(i.id, v as Classificacao)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="dado_medido">dado medido</SelectItem>
                                    <SelectItem value="estimativa">estimativa</SelectItem>
                                    <SelectItem value="premissa_da_diretoria">
                                      premissa da diretoria
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="mt-1">
                                  <SeloClassificacao
                                    valor={ap?.classificacao_numero ?? "dado_medido"}
                                  />
                                </div>
                              </td>
                              <td className="py-2 pr-3">
                                <Input
                                  key={`obs-${i.id}-${periodoAtivo}`}
                                  defaultValue={ap?.observacao ?? ""}
                                  placeholder="o que explica o número"
                                  onBlur={(e) =>
                                    e.target.value !== (ap?.observacao ?? "") &&
                                    salvarObservacao(i.id, e.target.value)
                                  }
                                  className="h-8 w-48"
                                />
                              </td>
                              <td className="py-2">
                                {ap ? (
                                  <Button
                                    size="sm"
                                    variant={ap.fechado ? "outline" : "secondary"}
                                    onClick={() => alternarFechamento(ap)}
                                  >
                                    {ap.fechado ? (
                                      <>
                                        <Lock className="h-3.5 w-3.5" /> fechado
                                      </>
                                    ) : (
                                      <>
                                        <LockOpen className="h-3.5 w-3.5" /> fechar
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum indicador publicado. Indicador em rascunho não entra no painel.
                  </p>
                )}
                {rascunhos ? (
                  <p className="mt-2 text-xs text-farol-ambar">
                    {rascunhos} indicador(es) em rascunho fora do painel.
                  </p>
                ) : null}
              </Painel>
            );
          })
        ) : (
          <Painel titulo="Nada para acompanhar ainda">
            <p className="text-sm text-muted-foreground">
              Crie objetivos e indicadores no mapa estratégico para o painel ganhar conteúdo.
            </p>
          </Painel>
        )}
      </div>

      <Dialog open={!!reapresentando} onOpenChange={(v) => !v && setReapresentando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Período fechado: isto é uma reapresentação</DialogTitle>
            <DialogDescription>
              O valor anterior continua registrado. A correção fica marcada como reapresentada, com
              motivo e autor.
            </DialogDescription>
          </DialogHeader>
          {reapresentando ? (
            <p className="num text-sm">
              {reapresentando.nome} · {fmtPeriodo(reapresentando.apuracao.periodo)}:{" "}
              {fmtNumero(reapresentando.apuracao.valor)} →{" "}
              {reapresentando.novo === "" ? "—" : fmtNumero(Number(reapresentando.novo))}
            </p>
          ) : null}
          <div>
            <Rotulo>Motivo da reapresentação</Rotulo>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={confirmarReapresentacao} disabled={!motivo.trim()}>
              Reapresentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
