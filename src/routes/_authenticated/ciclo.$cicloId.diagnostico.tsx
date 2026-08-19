import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, Bloqueio, Coach, Rotulo, SeloProcedencia } from "@/components/bussola/selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BLOCOS_DIAGNOSTICO } from "@/lib/bussola";
import { bloqueiosDiagnostico, type DiagnosticoBloco } from "@/lib/bloqueios";
import { useCiclo, useDiagnostico } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico do ciclo — Bússola" },
      {
        name: "description",
        content:
          "Retrato factual antes de opinião: cada bloco recebe fatos com fonte ou uma lacuna declarada.",
      },
      { property: "og:title", content: "Diagnóstico do ciclo — Bússola" },
      {
        property: "og:description",
        content: "Campo sem dado vira lacuna registrada, nunca preenchida por percepção.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiagnosticoPagina,
});

function DiagnosticoPagina() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const diagnostico = useDiagnostico(cicloId);
  const qc = useQueryClient();
  const [novaLacuna, setNovaLacuna] = useState<Record<string, string>>({});

  const registros = (diagnostico.data ?? []) as unknown as (DiagnosticoBloco & {
    procedencia: "decidido_pelo_time" | "importado_de_documento" | "sugerido_pelo_sistema" | "inferido";
  })[];
  const estado = bloqueiosDiagnostico(BLOCOS_DIAGNOSTICO, registros);
  const registroDe = (bloco: string) => registros.find((r) => r.bloco === bloco);

  async function gravar(bloco: string, dados: { conteudo?: string; lacunas?: string[] }) {
    const existente = registroDe(bloco);
    const resposta = existente
      ? await supabase.from("diagnostico").update(dados).eq("id", existente.id)
      : await supabase.from("diagnostico").insert({
          ciclo_id: cicloId,
          bloco,
          conteudo: dados.conteudo ?? null,
          lacunas: dados.lacunas ?? [],
        });
    if (resposta.error) {
      toast.error(resposta.error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["diagnostico", cicloId] });
  }

  async function adicionarLacuna(bloco: string) {
    const texto = (novaLacuna[bloco] ?? "").trim();
    if (!texto) return;
    const atuais = registroDe(bloco)?.lacunas ?? [];
    await gravar(bloco, { lacunas: [...atuais, texto] });
    setNovaLacuna({ ...novaLacuna, [bloco]: "" });
  }

  async function removerLacuna(bloco: string, texto: string) {
    const atuais = registroDe(bloco)?.lacunas ?? [];
    await gravar(bloco, { lacunas: atuais.filter((l) => l !== texto) });
  }

  return (
    <AppShell
      cicloId={cicloId}
      titulo="Diagnóstico"
      subtitulo="Etapa 1: retrato factual antes de opinião. O que não existe como dado entra como lacuna."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {BLOCOS_DIAGNOSTICO.map((b) => {
            const r = registroDe(b.valor);
            const vazio = !r?.conteudo?.trim() && !(r?.lacunas ?? []).length;
            return (
              <Painel key={b.valor} titulo={b.nome} descricao={b.pergunta}>
                <div className="space-y-3">
                  <Textarea
                    key={`${b.valor}-${r?.id ?? "novo"}`}
                    defaultValue={r?.conteudo ?? ""}
                    placeholder="Fatos com número, fonte e data."
                    onBlur={(e) =>
                      e.target.value !== (r?.conteudo ?? "") &&
                      gravar(b.valor, { conteudo: e.target.value })
                    }
                  />

                  <div>
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Lacunas declaradas
                      <Coach chave="diagnostico_lacuna" />
                    </span>
                    <ul className="space-y-1">
                      {(r?.lacunas ?? []).map((l) => (
                        <li
                          key={l}
                          className="flex items-start justify-between gap-2 rounded-sm border border-dashed border-border px-2 py-1 text-sm"
                        >
                          <span>{l}</span>
                          <button
                            type="button"
                            aria-label="Remover lacuna"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => removerLacuna(b.valor, l)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={novaLacuna[b.valor] ?? ""}
                        onChange={(e) =>
                          setNovaLacuna({ ...novaLacuna, [b.valor]: e.target.value })
                        }
                        placeholder="Dado que hoje não existe"
                        className="h-9"
                      />
                      <Button size="sm" variant="outline" onClick={() => adicionarLacuna(b.valor)}>
                        <Plus className="h-3.5 w-3.5" /> Lacuna
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <SeloProcedencia valor={r?.procedencia ?? "decidido_pelo_time"} />
                    {vazio ? (
                      <span className="text-xs text-farol-ambar">
                        bloco sem retrato — impede fechar a etapa 1
                      </span>
                    ) : null}
                  </div>
                </div>
              </Painel>
            );
          })}
        </div>

        <div className="space-y-4">
          <Painel titulo="Bloqueios para fechar a etapa 1">
            {estado.semRetrato.length ? (
              <Bloqueio
                titulo={`${estado.semRetrato.length} bloco(s) sem retrato`}
                porque="Bloco em branco vira opinião na primeira reunião. Registre o fato ou declare a lacuna — as duas saídas são honestas, o vazio não."
              >
                {estado.semRetrato.map((b) => (
                  <p key={b.valor}>{b.nome}</p>
                ))}
              </Bloqueio>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todos os blocos têm fato ou lacuna. A etapa 1 pode fechar na trilha.
              </p>
            )}
          </Painel>

          <Painel titulo="Lacunas do ciclo" descricao="Cada lacuna é candidata a iniciativa de instrumentação.">
            {estado.totalLacunas ? (
              <>
                <p className="num text-2xl font-bold">{estado.totalLacunas}</p>
                <Aviso
                  titulo="Lacuna não é falha: é agenda"
                  porque="Dado que ninguém consegue produzir hoje precisa de uma iniciativa para existir. Sem isso, o indicador nasce sem linha de base e nunca sai de rascunho."
                />
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link to="/ciclo/$cicloId/mapa" params={{ cicloId }}>
                    Criar iniciativa no mapa
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma lacuna declarada ainda.</p>
            )}
          </Painel>

          <Painel titulo="Próxima etapa">
            <p className="text-sm text-muted-foreground">
              Com o retrato pronto, as escolhas estratégicas ficam ancoradas em fato, não em
              preferência.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/ciclo/$cicloId/escolhas" params={{ cicloId }}>
                Ir para as escolhas
              </Link>
            </Button>
          </Painel>

          {ciclo.isError ? <Rotulo>Ciclo não carregado</Rotulo> : null}
        </div>
      </div>
    </AppShell>
  );
}