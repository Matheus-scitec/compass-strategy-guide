import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, SeloClassificacao, SeloProcedencia, prefixoCifra } from "@/components/bussola/selos";
import { Button } from "@/components/ui/button";
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
  TIPOS_ESCOLHA,
  calculaAtingimento,
  farolDe,
  periodosMensais,
  type ClassificacaoNumero,
  type Farol,
  type Perspectiva,
  type Procedencia,
} from "@/lib/bussola";
import { fmtNumero, fmtPercentual, fmtPeriodo } from "@/lib/format";
import { baixarCSV, imprimirPDF } from "@/lib/exportar";
import {
  useApuracoes,
  useCiclo,
  useEscolhas,
  useIniciativas,
  useMetas,
  useObjetivos,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/conselho")({
  head: () => ({
    meta: [
      { title: "Sala do conselho — Bússola" },
      {
        name: "description",
        content:
          "Leitura executiva do ciclo: escolhas, farol por perspectiva e iniciativas, com procedência e natureza de cada cifra.",
      },
      { property: "og:title", content: "Sala do conselho — Bússola" },
      {
        property: "og:description",
        content: "Vista somente leitura: item sugerido ou inferido só entra depois de confirmado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConselhoPagina,
});

type IndicadorLinha = {
  id: string;
  codigo: string;
  nome: string;
  publicado: boolean;
  polaridade: "maior" | "menor" | null;
  unidade: string | null;
};

function ConselhoPagina() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const objetivos = useObjetivos(cicloId);
  const iniciativas = useIniciativas(cicloId);
  const escolhas = useEscolhas(cicloId);
  const metas = useMetas(cicloId);
  const apuracoes = useApuracoes(cicloId);

  const c = ciclo.data as
    | { nome: string; horizonte_inicio: string; horizonte_fim: string; organizacao: { nome: string } | null }
    | undefined;
  const periodos = useMemo(
    () => (c ? periodosMensais(c.horizonte_inicio, c.horizonte_fim) : []),
    [c],
  );
  const hoje = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [periodo, setPeriodo] = useState("");
  const periodoAtivo = periodo || (periodos.includes(hoje) ? hoje : (periodos.at(-1) ?? ""));

  const listaObjetivos = (objetivos.data ?? []) as unknown as {
    id: string;
    codigo: string;
    frase: string;
    perspectiva: Perspectiva;
    procedencia: Procedencia;
    perfil: { nome: string } | null;
    indicador: IndicadorLinha[];
  }[];
  const listaIniciativas = (iniciativas.data ?? []) as unknown as {
    id: string;
    codigo: string;
    titulo: string;
    status: "N" | "A" | "C" | "T";
    publicado: boolean;
    procedencia: Procedencia;
    investimento: number | null;
    perfil: { nome: string } | null;
  }[];
  const listaEscolhas = (escolhas.data ?? []) as unknown as {
    id: string;
    tipo: "onde_jogar" | "como_ganhar" | "nao_faremos";
    texto: string;
    procedencia: Procedencia;
  }[];
  const listaMetas = (metas.data ?? []) as unknown as {
    indicador_id: string;
    periodo: string;
    valor: number | null;
    classificacao_numero: ClassificacaoNumero;
  }[];
  const listaApuracoes = (apuracoes.data ?? []) as unknown as {
    indicador_id: string;
    periodo: string;
    valor: number | null;
    reapresentado: boolean;
    classificacao_numero: ClassificacaoNumero;
  }[];

  const confirmado = (p: Procedencia) =>
    p === "decidido_pelo_time" || p === "importado_de_documento";

  const metaDe = (id: string) =>
    listaMetas.find((m) => m.indicador_id === id && m.periodo === periodoAtivo);
  const apDe = (id: string) =>
    listaApuracoes.find((a) => a.indicador_id === id && a.periodo === periodoAtivo);

  const objetivosConfirmados = listaObjetivos.filter((o) => confirmado(o.procedencia));
  const naoConfirmados =
    listaObjetivos.length - objetivosConfirmados.length +
    listaEscolhas.filter((e) => !confirmado(e.procedencia)).length;

  function farolObjetivo(o: (typeof listaObjetivos)[number]): Farol {
    const publicados = (o.indicador ?? []).filter((i) => i.publicado);
    const farois = publicados.map((i) =>
      farolDe(calculaAtingimento(apDe(i.id)?.valor, metaDe(i.id)?.valor ?? null, i.polaridade)),
    );
    if (!farois.length || farois.every((f) => f === "sem_apuracao")) return "sem_apuracao";
    if (farois.includes("critico")) return "critico";
    if (farois.includes("atencao")) return "atencao";
    return "verde";
  }

  function exportar() {
    const linhas: (string | number | null)[][] = [];
    for (const o of objetivosConfirmados) {
      for (const i of (o.indicador ?? []).filter((x) => x.publicado)) {
        const meta = metaDe(i.id);
        const ap = apDe(i.id);
        const atingimento = calculaAtingimento(ap?.valor, meta?.valor ?? null, i.polaridade);
        linhas.push([
          PERSPECTIVAS.find((p) => p.valor === o.perspectiva)?.nome ?? o.perspectiva,
          `${o.codigo} · ${o.frase}`,
          o.perfil?.nome ?? "sem dono",
          `${i.codigo} · ${i.nome}`,
          i.unidade,
          meta?.valor ?? null,
          ap?.valor ?? null,
          atingimento === null ? null : Number(atingimento.toFixed(1)),
          FAROL_LABEL[farolDe(atingimento)],
          ap?.classificacao_numero ?? "",
          ap?.reapresentado ? "sim" : "não",
        ]);
      }
    }
    baixarCSV(
      `conselho-${c?.nome ?? "ciclo"}-${periodoAtivo}`,
      [
        "Perspectiva",
        "Objetivo",
        "Dono",
        "Indicador",
        "Unidade",
        "Meta",
        "Apurado",
        "Atingimento (%)",
        "Farol",
        "Natureza da cifra",
        "Reapresentado",
      ],
      linhas,
    );
  }

  return (
    <AppShell
      cicloId={cicloId}
      tela="conselho"
      titulo="Sala do conselho"
      subtitulo={`${c?.organizacao?.nome ?? ""} · ${c?.nome ?? ""} · leitura de ${fmtPeriodo(periodoAtivo || hoje)} — vista somente leitura`}
      acoes={
        <div className="flex flex-wrap gap-2">
          <div className="w-36">
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
          <Button variant="outline" onClick={exportar}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={imprimirPDF}>
            Salvar em PDF
          </Button>
        </div>
      }
    >
      {naoConfirmados ? (
        <div className="mb-4">
          <Aviso
            titulo={`${naoConfirmados} item(ns) fora desta leitura`}
            porque="Item sugerido pelo sistema ou inferido não entra em relatório de conselho sem confirmação humana. Confirme a procedência para incluir."
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <Painel guia="resumo" titulo="Escolhas do ciclo" descricao="Onde jogar, como ganhar e o que ficou de fora.">
          <div className="grid gap-3 sm:grid-cols-3">
            {TIPOS_ESCOLHA.map((t) => (
              <div key={t.valor}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.nome}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {listaEscolhas
                    .filter((e) => e.tipo === t.valor && confirmado(e.procedencia))
                    .map((e) => (
                      <li key={e.id} className="flex flex-wrap items-center gap-1.5">
                        {e.texto}
                        <SeloProcedencia valor={e.procedencia} />
                      </li>
                    ))}
                  {!listaEscolhas.some((e) => e.tipo === t.valor && confirmado(e.procedencia)) ? (
                    <li className="text-muted-foreground">—</li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>
        </Painel>

        {PERSPECTIVAS.map((p) => {
          const doGrupo = objetivosConfirmados.filter((o) => o.perspectiva === p.valor);
          if (!doGrupo.length) return null;
          return (
            <Painel key={p.valor} titulo={p.nome} descricao={p.explicacao}>
              <div className="space-y-3">
                {doGrupo.map((o) => {
                  const farol = farolObjetivo(o);
                  return (
                    <div key={o.id} className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            <span className="num mr-1 text-xs text-muted-foreground">
                              {o.codigo}
                            </span>
                            {o.frase}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            dono: {o.perfil?.nome ?? "sem dono"}
                          </p>
                        </div>
                        <span
                          className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${FAROL_CLASSE[farol]}`}
                        >
                          {FAROL_LABEL[farol]}
                        </span>
                      </div>

                      <table className="mt-2 w-full text-sm">
                        <tbody>
                          {(o.indicador ?? [])
                            .filter((i) => i.publicado)
                            .map((i) => {
                              const meta = metaDe(i.id);
                              const ap = apDe(i.id);
                              const atingimento = calculaAtingimento(
                                ap?.valor,
                                meta?.valor ?? null,
                                i.polaridade,
                              );
                              return (
                                <tr key={i.id} className="border-t border-border/60">
                                  <td className="py-1.5 pr-3">{i.nome}</td>
                                  <td className="num py-1.5 pr-3">
                                    meta {prefixoCifra(meta?.classificacao_numero)}
                                    {fmtNumero(meta?.valor ?? null)}
                                  </td>
                                  <td className="num py-1.5 pr-3">
                                    apurado {prefixoCifra(ap?.classificacao_numero)}
                                    {fmtNumero(ap?.valor ?? null)}
                                  </td>
                                  <td className="num py-1.5 pr-3">{fmtPercentual(atingimento)}</td>
                                  <td className="py-1.5">
                                    <SeloClassificacao valor={ap?.classificacao_numero} />
                                    {ap?.reapresentado ? (
                                      <span className="ml-1 rounded-sm border border-farol-ambar/40 px-1 py-px text-xs text-farol-ambar">
                                        reapresentado
                                      </span>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </Painel>
          );
        })}

        <Painel titulo="Iniciativas publicadas" descricao="Compromissos com líder nomeado e prazo.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-1.5 font-medium">Iniciativa</th>
                  <th className="py-1.5 font-medium">Líder</th>
                  <th className="py-1.5 font-medium">Status</th>
                  <th className="py-1.5 font-medium">Investimento</th>
                  <th className="py-1.5 font-medium">Procedência</th>
                </tr>
              </thead>
              <tbody>
                {listaIniciativas
                  .filter((i) => i.publicado && confirmado(i.procedencia))
                  .map((i) => (
                    <tr key={i.id} className="border-b border-border/60">
                      <td className="py-1.5 pr-3">
                        <span className="num mr-1 text-xs text-muted-foreground">{i.codigo}</span>
                        {i.titulo}
                      </td>
                      <td className="py-1.5 pr-3">{i.perfil?.nome ?? "—"}</td>
                      <td className="py-1.5 pr-3">{i.status}</td>
                      <td className="num py-1.5 pr-3">
                        {i.investimento === null ? "—" : `R$ ${fmtNumero(i.investimento)}`}
                      </td>
                      <td className="py-1.5">
                        <SeloProcedencia valor={i.procedencia} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Painel>
      </div>
    </AppShell>
  );
}