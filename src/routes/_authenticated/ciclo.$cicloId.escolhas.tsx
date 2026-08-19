import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso, Bloqueio, Coach, SeloProcedencia } from "@/components/bussola/selos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUADRANTES_MATRIZ, TIPOS_ESCOLHA, type TipoEscolha } from "@/lib/bussola";
import { bloqueiosEscolhas, type EscolhaItem } from "@/lib/bloqueios";
import { useEscolhas } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/escolhas")({
  head: () => ({
    meta: [
      { title: "Escolhas estratégicas — Bússola" },
      {
        name: "description",
        content:
          "Onde jogar, como ganhar e o que não faremos neste ciclo, com a matriz de atratividade e capacidade.",
      },
      { property: "og:title", content: "Escolhas estratégicas — Bússola" },
      {
        property: "og:description",
        content: "Plano sem renúncia explícita é lista de desejos: tudo disputa a mesma capacidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EscolhasPagina,
});

function EscolhasPagina() {
  const { cicloId } = Route.useParams();
  const escolhas = useEscolhas(cicloId);
  const qc = useQueryClient();
  const [rascunho, setRascunho] = useState<Record<string, string>>({});

  const lista = (escolhas.data ?? []) as unknown as (EscolhaItem & {
    procedencia: "decidido_pelo_time" | "importado_de_documento" | "sugerido_pelo_sistema" | "inferido";
  })[];
  const estado = bloqueiosEscolhas(lista);

  async function adicionar(tipo: TipoEscolha) {
    const texto = (rascunho[tipo] ?? "").trim();
    if (!texto) return;
    const { error } = await supabase.from("escolha").insert({
      ciclo_id: cicloId,
      tipo,
      texto,
      quadrante_matriz: tipo === "onde_jogar" ? "investir" : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRascunho({ ...rascunho, [tipo]: "" });
    await qc.invalidateQueries({ queryKey: ["escolhas", cicloId] });
  }

  async function atualizarQuadrante(id: string, quadrante: string) {
    const { error } = await supabase
      .from("escolha")
      .update({ quadrante_matriz: quadrante })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["escolhas", cicloId] });
  }

  async function remover(id: string) {
    const { error } = await supabase.from("escolha").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["escolhas", cicloId] });
  }

  return (
    <AppShell
      cicloId={cicloId}
      titulo="Escolhas estratégicas"
      subtitulo="Etapa 2: onde jogar, como ganhar e — obrigatório — o que não faremos neste ciclo."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {TIPOS_ESCOLHA.map((t) => {
            const itens = lista.filter((e) => e.tipo === t.valor);
            return (
              <Painel key={t.valor} titulo={t.nome} descricao={t.explicacao}>
                <div className="space-y-2">
                  {itens.length ? (
                    itens.map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-wrap items-start gap-2 rounded-md border border-border bg-superficie p-3"
                      >
                        <p className="min-w-[200px] flex-1 text-sm">{e.texto}</p>
                        {t.valor === "onde_jogar" ? (
                          <Select
                            value={e.quadrante_matriz ?? "investir"}
                            onValueChange={(v) => atualizarQuadrante(e.id, v)}
                          >
                            <SelectTrigger className="h-8 w-64 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUADRANTES_MATRIZ.map((q) => (
                                <SelectItem key={q.valor} value={q.valor}>
                                  {q.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                        <SeloProcedencia valor={e.procedencia} />
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Remover escolha"
                          onClick={() => remover(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nada registrado. Exemplo: “{t.exemplo}”.
                    </p>
                  )}

                  <div>
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Nova escolha
                      {t.valor === "nao_faremos" ? <Coach chave="escolha_nao_faremos" /> : null}
                    </span>
                    <Textarea
                      value={rascunho[t.valor] ?? ""}
                      onChange={(e) => setRascunho({ ...rascunho, [t.valor]: e.target.value })}
                      placeholder={t.exemplo}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => adicionar(t.valor)}
                      disabled={!(rascunho[t.valor] ?? "").trim()}
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                  </div>
                </div>
              </Painel>
            );
          })}
        </div>

        <div className="space-y-4">
          <Painel titulo="Bloqueios para fechar a etapa 2">
            <div className="space-y-2">
              {estado.semOndeJogar ? (
                <Bloqueio
                  titulo="Nenhum recorte de onde jogar"
                  porque="Sem recorte, a empresa disputa todo mercado com a capacidade de um. Escolha é dizer onde não vai brigar."
                />
              ) : null}
              {estado.semComoGanhar ? (
                <Bloqueio
                  titulo="Nenhuma vantagem declarada"
                  porque="Se ninguém sabe por que o cliente escolheria vocês, o plano vira esforço genérico e o preço decide."
                />
              ) : null}
              {estado.semRenuncia ? (
                <Bloqueio
                  titulo="Nenhuma renúncia registrada"
                  porque="Toda escolha libera capacidade em algum lugar. Sem “não faremos”, nada sai da agenda e o ciclo começa sobrecarregado."
                />
              ) : null}
              {estado.fechavel ? (
                <p className="text-sm text-muted-foreground">
                  Onde jogar, como ganhar e renúncia registrados. A etapa 2 pode fechar na trilha.
                </p>
              ) : null}
            </div>
          </Painel>

          <Painel titulo="Matriz de atratividade e capacidade">
            <div className="grid grid-cols-2 gap-2">
              {QUADRANTES_MATRIZ.map((q) => {
                const itens = estado.ondeJogar.filter((e) => e.quadrante_matriz === q.valor);
                return (
                  <div key={q.valor} className="rounded-md border border-border p-2">
                    <p className="text-xs font-semibold">{q.nome}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{q.explicacao}</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {itens.map((e) => (
                        <li key={e.id}>{e.texto}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {estado.semQuadrante.length ? (
              <div className="mt-2">
                <Aviso
                  titulo={`${estado.semQuadrante.length} recorte(s) sem quadrante`}
                  porque="Sem posicionar na matriz, não se sabe se o recorte pede investimento ou construção de capacidade antes de prometer resultado."
                />
              </div>
            ) : null}
          </Painel>

          <Painel titulo="Próxima etapa">
            <p className="text-sm text-muted-foreground">
              Escolhas fechadas viram objetivos encadeados no mapa estratégico.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/ciclo/$cicloId/mapa" params={{ cicloId }}>
                Abrir mapa estratégico
              </Link>
            </Button>
          </Painel>
        </div>
      </div>
    </AppShell>
  );
}