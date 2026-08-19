import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, Bloqueio, Coach } from "@/components/bussola/selos";
import { Comentarios } from "@/components/bussola/comentarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  calculaAtingimento,
  farolDe,
  periodosMensais,
} from "@/lib/bussola";
import { fmtData, fmtNumero, fmtPercentual, fmtPeriodo } from "@/lib/format";
import {
  useApuracoes,
  useCiclo,
  useDecisoes,
  useMembros,
  useMetas,
  useObjetivos,
  useReunioes,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/revisao")({
  head: () => ({
    meta: [
      { title: "Reunião de revisão — Bússola" },
      {
        name: "description",
        content:
          "Pauta gerada pelos desvios do período e ata com decisões registradas, cada uma com responsável e prazo.",
      },
      { property: "og:title", content: "Reunião de revisão — Bússola" },
      {
        property: "og:description",
        content: "Reunião sem decisão registrada com dono e prazo não muda a execução.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RevisaoPagina,
});

type Membro = { user_id: string; perfil: { id: string; nome: string } | null };
type Reuniao = {
  id: string;
  periodo: string;
  data: string;
  status: string;
  observacoes: string | null;
};
type Decisao = {
  id: string;
  texto: string;
  responsavel_id: string | null;
  prazo: string | null;
  status: string;
  perfil?: { id: string; nome: string } | null;
};

function RevisaoPagina() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const c = ciclo.data as
    | { org_id: string; horizonte_inicio: string; horizonte_fim: string }
    | undefined;
  const membros = useMembros(c?.org_id);
  const reunioes = useReunioes(cicloId);
  const objetivos = useObjetivos(cicloId);
  const metas = useMetas(cicloId);
  const apuracoes = useApuracoes(cicloId);
  const qc = useQueryClient();

  const lista = (reunioes.data ?? []) as unknown as Reuniao[];
  const [selecionada, setSelecionada] = useState<string>("");
  const reuniao = lista.find((r) => r.id === selecionada) ?? lista[0];
  const decisoes = useDecisoes(reuniao?.id);
  const listaDecisoes = (decisoes.data ?? []) as unknown as Decisao[];
  const listaMembros = (membros.data ?? []) as unknown as Membro[];

  const periodos = useMemo(
    () => (c ? periodosMensais(c.horizonte_inicio, c.horizonte_fim) : []),
    [c],
  );
  const [novoPeriodo, setNovoPeriodo] = useState("");

  const [texto, setTexto] = useState("");
  const [responsavel, setResponsavel] = useState("__vazio");
  const [prazo, setPrazo] = useState("");

  const listaObjetivos = (objetivos.data ?? []) as unknown as {
    id: string;
    codigo: string;
    frase: string;
    indicador: {
      id: string;
      codigo: string;
      nome: string;
      publicado: boolean;
      polaridade: "maior" | "menor" | null;
    }[];
  }[];
  const listaMetas = (metas.data ?? []) as unknown as {
    indicador_id: string;
    periodo: string;
    valor: number | null;
  }[];
  const listaApuracoes = (apuracoes.data ?? []) as unknown as {
    indicador_id: string;
    periodo: string;
    valor: number | null;
    observacao: string | null;
    reapresentado: boolean;
  }[];

  const pauta = useMemo(() => {
    if (!reuniao) return [];
    const linhas: {
      objetivo: string;
      indicador: string;
      meta: number | null;
      apurado: number | null;
      atingimento: number | null;
      farol: ReturnType<typeof farolDe>;
      observacao: string | null;
      reapresentado: boolean;
    }[] = [];
    for (const o of listaObjetivos) {
      for (const i of (o.indicador ?? []).filter((x) => x.publicado)) {
        const meta =
          listaMetas.find((m) => m.indicador_id === i.id && m.periodo === reuniao.periodo)?.valor ??
          null;
        const ap = listaApuracoes.find(
          (a) => a.indicador_id === i.id && a.periodo === reuniao.periodo,
        );
        const atingimento = calculaAtingimento(ap?.valor, meta, i.polaridade);
        const farol = farolDe(atingimento);
        if (farol === "verde") continue;
        linhas.push({
          objetivo: `${o.codigo} · ${o.frase}`,
          indicador: `${i.codigo} · ${i.nome}`,
          meta,
          apurado: ap?.valor ?? null,
          atingimento,
          farol,
          observacao: ap?.observacao ?? null,
          reapresentado: ap?.reapresentado ?? false,
        });
      }
    }
    return linhas;
  }, [reuniao, listaObjetivos, listaMetas, listaApuracoes]);

  const semExplicacao = pauta.filter((l) => l.farol === "critico" && !l.observacao?.trim());
  const concluida = reuniao?.status === "concluida";

  async function criarReuniao() {
    const periodo = novoPeriodo || periodos[0];
    if (!periodo) return;
    const { error } = await supabase
      .from("reuniao_revisao")
      .insert({ ciclo_id: cicloId, periodo, data: new Date().toISOString().slice(0, 10) });
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["reunioes", cicloId] });
    toast.success("Reunião criada com a pauta dos desvios do período.");
  }

  async function criarDecisao() {
    if (!reuniao || !texto.trim()) return;
    const { error } = await supabase.from("decisao").insert({
      reuniao_id: reuniao.id,
      texto: texto.trim(),
      responsavel_id: responsavel === "__vazio" ? null : responsavel,
      prazo: prazo || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTexto("");
    setPrazo("");
    setResponsavel("__vazio");
    await qc.invalidateQueries({ queryKey: ["decisoes", reuniao.id] });
  }

  async function concluir() {
    if (!reuniao) return;
    if (!listaDecisoes.length) {
      toast.error("Registre pelo menos uma decisão antes de encerrar a ata.");
      return;
    }
    const semDono = listaDecisoes.filter((d) => !d.responsavel_id || !d.prazo);
    if (semDono.length) {
      toast.error("Toda decisão precisa de responsável pessoa e prazo antes de encerrar.");
      return;
    }
    const { error } = await supabase
      .from("reuniao_revisao")
      .update({ status: "concluida", concluida_em: new Date().toISOString() })
      .eq("id", reuniao.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["reunioes", cicloId] });
    toast.success("Ata encerrada: decisões passam a valer como compromisso do ciclo.");
  }

  async function salvarObservacoes(valor: string) {
    if (!reuniao) return;
    const { error } = await supabase
      .from("reuniao_revisao")
      .update({ observacoes: valor })
      .eq("id", reuniao.id);
    if (error) toast.error(error.message);
    else await qc.invalidateQueries({ queryKey: ["reunioes", cicloId] });
  }

  return (
    <AppShell
      cicloId={cicloId}
      titulo="Reunião de revisão"
      subtitulo="A pauta não é escolhida: ela é o desvio do período. Reunião termina em decisão com dono e prazo."
      acoes={
        <div className="flex flex-wrap gap-2">
          <div className="w-36">
            <Select value={novoPeriodo || (periodos[0] ?? "")} onValueChange={setNovoPeriodo}>
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
          <Button onClick={criarReuniao}>
            <Plus className="h-4 w-4" /> Nova reunião
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Painel
            titulo={reuniao ? `Pauta de ${fmtPeriodo(reuniao.periodo)}` : "Pauta"}
            descricao="Só entram objetivos e indicadores fora do plano no período."
          >
            {!reuniao ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma reunião criada. Escolha o período e crie a primeira.
              </p>
            ) : pauta.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Objetivo</th>
                      <th className="py-1.5 font-medium">Indicador</th>
                      <th className="py-1.5 font-medium">Meta</th>
                      <th className="py-1.5 font-medium">Apurado</th>
                      <th className="py-1.5 font-medium">Atingimento</th>
                      <th className="py-1.5 font-medium">Farol</th>
                      <th className="py-1.5 font-medium">Explicação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pauta.map((l) => (
                      <tr key={l.indicador} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-3">{l.objetivo}</td>
                        <td className="py-2 pr-3">
                          {l.indicador}
                          {l.reapresentado ? (
                            <span className="ml-1 rounded-sm border border-farol-ambar/40 px-1 py-px text-xs text-farol-ambar">
                              reapresentado
                            </span>
                          ) : null}
                        </td>
                        <td className="num py-2 pr-3">{fmtNumero(l.meta)}</td>
                        <td className="num py-2 pr-3">{fmtNumero(l.apurado)}</td>
                        <td className="num py-2 pr-3">{fmtPercentual(l.atingimento)}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-sm border px-1.5 py-px text-xs ${FAROL_CLASSE[l.farol]}`}
                          >
                            {FAROL_LABEL[l.farol]}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {l.observacao?.trim() || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum desvio no período. Se ninguém apurou, o farol cinza também é assunto.
              </p>
            )}
          </Painel>

          <Painel
            titulo="Ata — decisões"
            descricao="Decisão sem responsável pessoa e prazo não encerra a ata."
            acoes={
              reuniao ? (
                <Button
                  size="sm"
                  variant={concluida ? "outline" : "default"}
                  disabled={concluida}
                  onClick={concluir}
                >
                  {concluida ? (
                    <>
                      <Lock className="h-3.5 w-3.5" /> ata encerrada
                    </>
                  ) : (
                    "Encerrar ata"
                  )}
                </Button>
              ) : null
            }
          >
            <div className="space-y-2">
              {listaDecisoes.length ? (
                listaDecisoes.map((d) => (
                  <div key={d.id} className="rounded-md border border-border bg-superficie p-3">
                    <p className="text-sm">{d.texto}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.perfil?.nome ?? "sem responsável"} · prazo {fmtData(d.prazo)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma decisão registrada.</p>
              )}
            </div>

            {reuniao && !concluida ? (
              <div className="mt-3 rounded-md border border-border p-3">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nova decisão
                  <Coach chave="decisao_reuniao" />
                </span>
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Antecipar a compra do molde para não perder a janela de julho"
                />
                <div className="mt-2 flex flex-wrap gap-2">
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
                  <Button size="sm" onClick={criarDecisao} disabled={!texto.trim()}>
                    Registrar decisão
                  </Button>
                </div>
              </div>
            ) : null}
          </Painel>

          {reuniao ? (
            <Painel titulo="Pontos abertos da reunião">
              <Comentarios
                orgId={c?.org_id}
                entidadeTipo="reuniao_revisao"
                entidadeId={reuniao.id}
                membros={listaMembros}
              />
            </Painel>
          ) : null}
        </div>

        <div className="space-y-4">
          <Painel titulo="Reuniões do ciclo">
            {lista.length ? (
              <ul className="space-y-1">
                {lista.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionada(r.id)}
                      className={`w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-superficie-forte ${
                        reuniao?.id === r.id ? "bg-superficie-forte font-medium" : ""
                      }`}
                    >
                      {fmtPeriodo(r.periodo)} · {fmtData(r.data)}
                      {r.status === "concluida" ? (
                        <span className="ml-1 text-xs text-muted-foreground">encerrada</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma reunião ainda.</p>
            )}
          </Painel>

          <Painel titulo="Bloqueios da ata">
            <div className="space-y-2">
              {reuniao && !listaDecisoes.length ? (
                <Bloqueio
                  titulo="Nenhuma decisão registrada"
                  porque="Reunião que só revisa números não muda execução. O produto da revisão é decisão com dono e prazo."
                />
              ) : null}
              {listaDecisoes.filter((d) => !d.responsavel_id || !d.prazo).length ? (
                <Bloqueio
                  titulo="Decisão sem responsável ou prazo"
                  porque="Decisão sem pessoa nomeada e data volta como pauta idêntica no mês seguinte."
                />
              ) : null}
              {semExplicacao.length ? (
                <Aviso
                  titulo={`${semExplicacao.length} desvio(s) crítico(s) sem explicação`}
                  porque="Desvio crítico sem observação no painel chega à reunião como surpresa e a discussão vira busca de culpado."
                />
              ) : null}
              {reuniao && listaDecisoes.length && !semExplicacao.length ? (
                <p className="text-sm text-muted-foreground">A ata pode ser encerrada.</p>
              ) : null}
            </div>
          </Painel>

          {reuniao ? (
            <Painel titulo="Observações da ata">
              <Textarea
                key={reuniao.id}
                defaultValue={reuniao.observacoes ?? ""}
                disabled={concluida}
                placeholder="Contexto que ajuda quem ler a ata em seis meses."
                onBlur={(e) =>
                  e.target.value !== (reuniao.observacoes ?? "") &&
                  salvarObservacoes(e.target.value)
                }
              />
            </Painel>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}