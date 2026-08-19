import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Aviso } from "@/components/bussola/selos";
import { Button } from "@/components/ui/button";
import { STATUS_INICIATIVA_LABEL } from "@/lib/bussola";
import { acaoAtrasada, type AcaoItem, type IniciativaBloq } from "@/lib/bloqueios";
import { fmtData, fmtNumero } from "@/lib/format";
import { baixarCSV } from "@/lib/exportar";
import { useAcoesDoCiclo, useCiclo, useIniciativas, useMembros, useObjetivos } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ciclo/$cicloId/pessoas")({
  head: () => ({
    meta: [
      { title: "Carga por pessoa — Bússola" },
      {
        name: "description",
        content:
          "O que cada pessoa lidera no ciclo: objetivos, iniciativas ativas e ações com prazo, com alerta de gargalo.",
      },
      { property: "og:title", content: "Carga por pessoa — Bússola" },
      {
        property: "og:description",
        content: "Mais de três iniciativas ativas por líder é gargalo declarado, não heroísmo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PessoasPagina,
});

type Membro = { user_id: string; perfil: { id: string; nome: string } | null };
type AcaoComIniciativa = AcaoItem & { iniciativa: { id: string; codigo: string; titulo: string } };

function PessoasPagina() {
  const { cicloId } = Route.useParams();
  const ciclo = useCiclo(cicloId);
  const c = ciclo.data as { org_id: string; nome: string } | undefined;
  const membros = useMembros(c?.org_id);
  const iniciativas = useIniciativas(cicloId);
  const objetivos = useObjetivos(cicloId);
  const acoes = useAcoesDoCiclo(cicloId);

  const listaMembros = (membros.data ?? []) as unknown as Membro[];
  const listaIniciativas = (iniciativas.data ?? []) as unknown as IniciativaBloq[];
  const listaObjetivos = (objetivos.data ?? []) as unknown as {
    id: string;
    codigo: string;
    frase: string;
    dono_id: string | null;
  }[];
  const listaAcoes = (acoes.data ?? []) as unknown as AcaoComIniciativa[];

  const carga = useMemo(
    () =>
      listaMembros.map((m) => {
        const ini = listaIniciativas.filter((i) => i.lider_id === m.user_id);
        const ativas = ini.filter((i) => i.status === "A" || i.status === "N");
        const acoesPessoa = listaAcoes.filter((a) => a.responsavel_id === m.user_id);
        return {
          userId: m.user_id,
          nome: m.perfil?.nome ?? "Sem nome",
          objetivos: listaObjetivos.filter((o) => o.dono_id === m.user_id),
          iniciativas: ini,
          ativas: ativas.length,
          acoes: acoesPessoa,
          atrasadas: acoesPessoa.filter(acaoAtrasada).length,
        };
      }),
    [listaMembros, listaIniciativas, listaObjetivos, listaAcoes],
  );

  const semResponsavel = listaAcoes.filter((a) => !a.responsavel_id);

  function exportar() {
    baixarCSV(
      `carga-por-pessoa-${c?.nome ?? "ciclo"}`,
      ["Pessoa", "Objetivos como dono", "Iniciativas", "Iniciativas ativas", "Ações", "Ações atrasadas"],
      carga.map((p) => [
        p.nome,
        p.objetivos.length,
        p.iniciativas.length,
        p.ativas,
        p.acoes.length,
        p.atrasadas,
      ]),
    );
  }

  return (
    <AppShell
      cicloId={cicloId}
      tela="pessoas"
      titulo="Carga por pessoa"
      subtitulo="Capacidade é finita: o plano só é executável se couber na agenda de quem vai executar."
      acoes={
        <Button variant="outline" onClick={exportar}>
          Exportar CSV
        </Button>
      }
    >
      {semResponsavel.length ? (
        <div className="mb-4">
          <Aviso
            titulo={`${semResponsavel.length} ação(ões) sem responsável`}
            porque="Ação sem pessoa nomeada não aparece na carga de ninguém — e por isso não é feita por ninguém."
          />
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2" data-guia="carga">
        {carga.map((p) => (
          <Painel
            key={p.userId}
            titulo={p.nome}
            descricao={`${fmtNumero(p.ativas, 0)} iniciativa(s) ativa(s) · ${fmtNumero(p.acoes.length, 0)} ação(ões)`}
          >
            {p.ativas > 3 ? (
              <div className="mb-3">
                <Aviso
                  titulo="Gargalo declarado"
                  porque="Acima de três iniciativas ativas em paralelo, a pessoa passa a alternar contexto em vez de entregar. Redistribua ou aceite o gargalo com justificativa na trilha."
                />
              </div>
            ) : null}

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Objetivos como dono
                </p>
                {p.objetivos.length ? (
                  p.objetivos.map((o) => (
                    <Link
                      key={o.id}
                      to="/ciclo/$cicloId/objetivo/$objetivoId"
                      params={{ cicloId, objetivoId: o.id }}
                      className="block text-primary underline-offset-4 hover:underline"
                    >
                      {o.codigo} · {o.frase}
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum.</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Iniciativas</p>
                {p.iniciativas.length ? (
                  p.iniciativas.map((i) => (
                    <Link
                      key={i.id}
                      to="/ciclo/$cicloId/iniciativa/$iniciativaId"
                      params={{ cicloId, iniciativaId: i.id }}
                      className="block text-primary underline-offset-4 hover:underline"
                    >
                      {i.codigo} · {i.titulo}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({STATUS_INICIATIVA_LABEL[i.status]} · {fmtData(i.fim)})
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhuma.</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Ações com prazo
                </p>
                {p.acoes.length ? (
                  <ul className="space-y-0.5">
                    {p.acoes.map((a) => (
                      <li key={a.id}>
                        {a.titulo}{" "}
                        <span
                          className={`text-xs ${acaoAtrasada(a) ? "text-farol-vermelho" : "text-muted-foreground"}`}
                        >
                          {fmtData(a.prazo)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Nenhuma.</p>
                )}
              </div>
            </div>
          </Painel>
        ))}
      </div>
    </AppShell>
  );
}