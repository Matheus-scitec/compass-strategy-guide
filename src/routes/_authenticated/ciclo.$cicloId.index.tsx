import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, CircleDot, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, Bloqueio } from "@/components/bussola/selos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useAcoesDoCiclo,
  useCiclo,
  useDiagnostico,
  useEscolhas,
  useEtapas,
  useIniciativas,
  useObjetivos,
} from "@/lib/queries";
import {
  bloqueiosDiagnostico,
  bloqueiosEscolhas,
  bloqueiosPlanoOperacional,
  calculaSaude,
  faltasDaIniciativa,
  faltasDoIndicador,
  type AcaoItem,
  type DiagnosticoBloco,
  type EscolhaItem,
  type IniciativaBloq,
  type ObjetivoBloq,
} from "@/lib/bloqueios";
import { BLOCOS_DIAGNOSTICO } from "@/lib/bussola";
import { fmtNumero, fmtPercentual } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/")({
  head: () => ({
    meta: [
      { title: "Trilha do ciclo — Bússola" },
      {
        name: "description",
        content:
          "As cinco etapas do ciclo com progresso e a lista de bloqueios que impedem o fechamento de cada uma.",
      },
      { property: "og:title", content: "Trilha do ciclo — Bússola" },
      {
        property: "og:description",
        content: "Diagnóstico, escolhas, desdobramento, plano operacional e execução.",
      },
    ],
  }),
  component: CicloHome,
});

const ETAPAS_DESCRICAO: Record<number, string> = {
  1: "Retrato factual antes de opinião. Campo sem dado vira lacuna registrada, nunca preenchida por percepção.",
  2: "Onde jogar, como ganhar e — obrigatório — o que não faremos neste ciclo.",
  3: "Quatro perspectivas encadeadas mais a faixa de sustentação, com objetivos, indicadores e iniciativas.",
  4: "Cada iniciativa aberta em ações com responsável e entregável verificável.",
  5: "Apuração mensal, farol trimestral e reuniões de revisão registradas em ata.",
};

function CicloHome() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const etapas = useEtapas(cicloId);
  const objetivos = useObjetivos(cicloId);
  const iniciativas = useIniciativas(cicloId);
  const diagnostico = useDiagnostico(cicloId);
  const escolhas = useEscolhas(cicloId);
  const acoes = useAcoesDoCiclo(cicloId);
  const qc = useQueryClient();
  const [justificativa, setJustificativa] = useState("");

  const listaObjetivos = (objetivos.data ?? []) as unknown as ObjetivoBloq[];
  const listaIniciativas = (iniciativas.data ?? []) as unknown as IniciativaBloq[];
  const saude = useMemo(
    () => calculaSaude(listaObjetivos, listaIniciativas),
    [listaObjetivos, listaIniciativas],
  );

  const estadoDiagnostico = bloqueiosDiagnostico(
    BLOCOS_DIAGNOSTICO,
    (diagnostico.data ?? []) as unknown as DiagnosticoBloco[],
  );
  const estadoEscolhas = bloqueiosEscolhas((escolhas.data ?? []) as unknown as EscolhaItem[]);
  const estadoPlano = bloqueiosPlanoOperacional(
    listaIniciativas,
    (acoes.data ?? []) as unknown as AcaoItem[],
  );

  const c = ciclo.data as
    | { nome: string; tipo: string; organizacao: { nome: string } | null }
    | undefined;

  const bloqueiosDesdobramento = [
    saude.objetivosSemDono.length > 0,
    saude.iniciativasOrfas.length > 0,
  ].some(Boolean);

  async function fecharEtapa(numero: number, status: string) {
    if (status !== "fechada") {
      if (numero === 1 && !estadoDiagnostico.fechavel) {
        toast.error("Todo bloco do diagnóstico precisa de fato registrado ou lacuna declarada.");
        return;
      }
      if (numero === 2 && !estadoEscolhas.fechavel) {
        toast.error(
          "Escolhas exigem onde jogar, como ganhar e ao menos uma renúncia explícita.",
        );
        return;
      }
      if (numero === 4 && !estadoPlano.fechavel) {
        toast.error(
          "Toda iniciativa publicada precisa de ações com responsável pessoa e prazo.",
        );
        return;
      }
    }
    if (numero === 3 && bloqueiosDesdobramento) {
      toast.error("Resolva os bloqueios do desdobramento antes de fechar a etapa.");
      return;
    }
    if (numero === 3 && saude.gargalos.length && !justificativa.trim()) {
      toast.error("O teste de capacidade exige um aceite consciente com justificativa.");
      return;
    }
    const { error } = await supabase
      .from("etapa_ciclo")
      .update({
        status: status === "fechada" ? "em_andamento" : "fechada",
        fechada_em: status === "fechada" ? null : new Date().toISOString(),
        aceite_capacidade: numero === 3 ? justificativa || null : null,
      })
      .eq("ciclo_id", cicloId)
      .eq("numero", numero);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (status !== "fechada") {
      await supabase
        .from("ciclo")
        .update({ etapa_atual: Math.min(numero + 1, 5) })
        .eq("id", cicloId);
    }
    await qc.invalidateQueries();
  }

  return (
    <AppShell
      cicloId={cicloId}
      tela="etapas"
      titulo={c?.nome ?? "Ciclo"}
      subtitulo={
        c
          ? `${c.organizacao?.nome} · ciclo ${c.tipo === "tatico" ? "tático" : "estratégico"}`
          : ""
      }
      acoes={
        <Button asChild variant="outline">
          <Link to="/ciclo/$cicloId/mapa" params={{ cicloId }}>
            Abrir mapa estratégico
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Painel guia="trilha" titulo="As cinco etapas" descricao="É possível voltar, mas fechar exige bloqueios resolvidos.">
          <ol className="space-y-2">
            {((etapas.data ?? []) as { id: string; numero: number; nome: string; status: string }[]).map(
              (etapa) => {
                const travada =
                  etapa.status !== "fechada" &&
                  ((etapa.numero === 1 && !estadoDiagnostico.fechavel) ||
                    (etapa.numero === 2 && !estadoEscolhas.fechavel) ||
                    (etapa.numero === 3 && bloqueiosDesdobramento) ||
                    (etapa.numero === 4 && !estadoPlano.fechavel));
                return (
                  <li
                    key={etapa.id}
                    className="flex flex-wrap items-start gap-3 rounded-md border border-border bg-superficie p-3"
                  >
                    <span className="mt-0.5">
                      {etapa.status === "fechada" ? (
                        <Check className="h-4 w-4 text-farol-verde" />
                      ) : etapa.status === "em_andamento" ? (
                        <CircleDot className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm font-semibold">
                        {etapa.numero}. {etapa.nome}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ETAPAS_DESCRICAO[etapa.numero]}
                      </p>
                      {etapa.numero === 1 ? (
                        <Link
                          to="/ciclo/$cicloId/diagnostico"
                          params={{ cicloId }}
                          className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Trabalhar no diagnóstico
                        </Link>
                      ) : null}
                      {etapa.numero === 2 ? (
                        <Link
                          to="/ciclo/$cicloId/escolhas"
                          params={{ cicloId }}
                          className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Registrar as escolhas
                        </Link>
                      ) : null}
                      {etapa.numero === 4 ? (
                        <Link
                          to="/ciclo/$cicloId/pessoas"
                          params={{ cicloId }}
                          className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Ver carga por pessoa
                        </Link>
                      ) : null}
                      {etapa.numero === 3 ? (
                        <Link
                          to="/ciclo/$cicloId/mapa"
                          params={{ cicloId }}
                          className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Trabalhar no mapa estratégico
                        </Link>
                      ) : null}
                      {etapa.numero === 5 ? (
                        <Link
                          to="/ciclo/$cicloId/painel"
                          params={{ cicloId }}
                          className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Abrir painel de execução
                        </Link>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant={etapa.status === "fechada" ? "outline" : "default"}
                      disabled={travada}
                      onClick={() => fecharEtapa(etapa.numero, etapa.status)}
                    >
                      {etapa.status === "fechada" ? "Reabrir" : "Fechar etapa"}
                    </Button>
                  </li>
                );
              },
            )}
          </ol>
        </Painel>

        <div className="space-y-4">
          <Painel guia="saude" titulo="Bloqueios das etapas 1, 2 e 4">
            <div className="space-y-2">
              {estadoDiagnostico.semRetrato.length ? (
                <Bloqueio
                  titulo={`Etapa 1: ${estadoDiagnostico.semRetrato.length} bloco(s) sem retrato`}
                  porque="Bloco em branco no diagnóstico vira opinião na primeira discussão. Registre o fato ou declare a lacuna."
                >
                  <Link
                    to="/ciclo/$cicloId/diagnostico"
                    params={{ cicloId }}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Abrir diagnóstico
                  </Link>
                </Bloqueio>
              ) : null}
              {!estadoEscolhas.fechavel ? (
                <Bloqueio
                  titulo="Etapa 2: escolhas incompletas"
                  porque={`Falta ${[
                    estadoEscolhas.semOndeJogar ? "onde jogar" : null,
                    estadoEscolhas.semComoGanhar ? "como ganhar" : null,
                    estadoEscolhas.semRenuncia ? "renúncia explícita (não faremos)" : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}. Sem renúncia, nada sai da agenda e todo objetivo disputa a mesma capacidade.`}
                >
                  <Link
                    to="/ciclo/$cicloId/escolhas"
                    params={{ cicloId }}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Abrir escolhas
                  </Link>
                </Bloqueio>
              ) : null}
              {estadoPlano.semAcao.length ? (
                <Bloqueio
                  titulo={`Etapa 4: ${estadoPlano.semAcao.length} iniciativa(s) publicada(s) sem ações`}
                  porque="Iniciativa sem ação é intenção: ninguém sabe o primeiro passo nem quem dá."
                >
                  {estadoPlano.semAcao.map((i) => (
                    <Link
                      key={i.id}
                      to="/ciclo/$cicloId/iniciativa/$iniciativaId"
                      params={{ cicloId, iniciativaId: i.id }}
                      className="block text-primary underline-offset-4 hover:underline"
                    >
                      {i.codigo} · {i.titulo}
                    </Link>
                  ))}
                </Bloqueio>
              ) : null}
              {estadoPlano.acoesIncompletas.length ? (
                <Bloqueio
                  titulo={`Etapa 4: ${estadoPlano.acoesIncompletas.length} ação(ões) sem responsável ou prazo`}
                  porque="Ação sem pessoa nomeada e data não entra na carga de ninguém e não é cobrada em reunião."
                />
              ) : null}
              {estadoDiagnostico.fechavel && estadoEscolhas.fechavel && estadoPlano.fechavel ? (
                <p className="text-sm text-muted-foreground">
                  Diagnóstico, escolhas e plano operacional sem bloqueio.
                </p>
              ) : null}
            </div>
          </Painel>

          <Painel titulo="Bloqueios para fechar o desdobramento">
            {saude.objetivosSemDono.length ? (
              <Bloqueio
                titulo={`${saude.objetivosSemDono.length} objetivo(s) sem dono`}
                porque="Dono é pessoa, não área. Objetivo sem dono não é cobrado em reunião nenhuma."
              >
                {saude.objetivosSemDono.map((o) => (
                  <Link
                    key={o.id}
                    to="/ciclo/$cicloId/objetivo/$objetivoId"
                    params={{ cicloId, objetivoId: o.id }}
                    className="block text-primary underline-offset-4 hover:underline"
                  >
                    {o.codigo} · {o.frase}
                  </Link>
                ))}
              </Bloqueio>
            ) : null}

            {saude.iniciativasOrfas.length ? (
              <Bloqueio
                titulo={`${saude.iniciativasOrfas.length} iniciativa(s) órfã(s)`}
                porque="Iniciativa que não sustenta objetivo nenhum consome capacidade sem mover o plano."
              >
                {saude.iniciativasOrfas.map((i) => (
                  <p key={i.id}>
                    {i.codigo} · {i.titulo}
                  </p>
                ))}
              </Bloqueio>
            ) : null}

            {!bloqueiosDesdobramento ? (
              <p className="text-sm text-muted-foreground">
                Zero objetivos sem dono e zero iniciativas órfãs. A etapa 3 pode fechar.
              </p>
            ) : null}
          </Painel>

          <Painel titulo="Pendências que não bloqueiam" descricao="Avisos com o porquê.">
            <div className="space-y-2">
              {saude.indicadoresRascunho.length ? (
                <Aviso
                  titulo={`${saude.indicadoresRascunho.length} indicador(es) em rascunho`}
                  porque={`Falta ${faltasDoIndicador(saude.indicadoresRascunho[0]!).join(", ")} no primeiro deles. Indicador incompleto não aparece no painel — número sem fórmula e sem fonte gera dois painéis divergentes.`}
                />
              ) : null}
              {saude.iniciativasIncompletas.length ? (
                <Aviso
                  titulo={`${saude.iniciativasIncompletas.length} iniciativa(s) não publicável(is)`}
                  porque={`Falta ${faltasDaIniciativa(saude.iniciativasIncompletas[0]!).join(", ")}. Sem líder, prazo e entregável verificável, ninguém consegue cobrar.`}
                />
              ) : null}
              {saude.objetivosSemForum.length ? (
                <Aviso
                  titulo={`${saude.objetivosSemForum.length} objetivo(s) sem fórum de acompanhamento`}
                  porque="Objetivo sem fórum responsável só é olhado no fim do ano, quando já não dá para corrigir."
                />
              ) : null}
              {saude.excessoObjetivos ? (
                <Aviso
                  titulo={`${saude.totalObjetivos} objetivos no ciclo`}
                  porque="Acima de 16 objetivos o painel deixa de ser núcleo de leitura e vira inventário. Provavelmente há rotina operacional entre eles."
                />
              ) : null}
              {saude.excessoIndicadores ? (
                <Aviso
                  titulo={`${saude.totalIndicadores} indicadores no ciclo`}
                  porque="Acima de 25 indicadores o painel completo compete com o núcleo de leitura. Marque os de rotina operacional como não estratégicos."
                />
              ) : null}
              {saude.objetivosComExcessoIndicadores.length ? (
                <Aviso
                  titulo="Objetivo com mais de 3 indicadores"
                  porque="Provavelmente são dois objetivos disfarçados de um. Separe a frase de mudança."
                />
              ) : null}
              {saude.proporcaoResultado !== null && saude.proporcaoResultado > 70 ? (
                <Aviso
                  titulo={`${fmtPercentual(saude.proporcaoResultado)} dos indicadores são de resultado`}
                  porque="O painel virou retrovisor: você descobre o problema depois que ele aconteceu. Inclua indicadores antecedentes (de direção)."
                />
              ) : null}
              {saude.gargalos.length ? (
                <div className="rounded-md border border-farol-ambar/40 bg-farol-ambar/8 p-3">
                  <p className="text-sm font-semibold">Teste de capacidade</p>
                  <ul className="num mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {saude.gargalos.map((g) => (
                      <li key={g.lider}>
                        {g.nome} — {fmtNumero(g.ativas, 0)} iniciativas em paralelo
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Mais de três iniciativas ativas por líder é gargalo declarado. Não bloqueia,
                    mas exige aceite consciente com justificativa.
                  </p>
                  <Textarea
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    placeholder="Por que o time aceita esse gargalo neste ciclo?"
                    className="mt-2"
                  />
                </div>
              ) : null}
              {!saude.indicadoresRascunho.length &&
              !saude.iniciativasIncompletas.length &&
              !saude.objetivosSemForum.length &&
              !saude.gargalos.length &&
              !saude.excessoObjetivos &&
              !saude.excessoIndicadores ? (
                <p className="text-sm text-muted-foreground">Nenhuma pendência registrada.</p>
              ) : null}
            </div>
          </Painel>
        </div>
      </div>
    </AppShell>
  );
}
