import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Painel } from "@/components/bussola/app-shell";
import { Rotulo, SeloProcedencia } from "@/components/bussola/selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCiclos, useOrganizacoes } from "@/lib/queries";
import { fmtData } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ciclos")({
  head: () => ({
    meta: [
      { title: "Ciclos de planejamento — Bússola" },
      {
        name: "description",
        content:
          "Escolha a organização e o ciclo de planejamento que você quer conduzir, ou abra um novo ciclo com as cinco etapas do método.",
      },
      { property: "og:title", content: "Ciclos de planejamento — Bússola" },
      {
        property: "og:description",
        content: "Organizações e ciclos de planejamento estratégico do seu time.",
      },
    ],
  }),
  component: CiclosPage,
});

const ETAPAS_NOMES = [
  "Diagnóstico",
  "Escolhas",
  "Desdobramento",
  "Plano operacional",
  "Execução",
];

function CiclosPage() {
  const orgs = useOrganizacoes();
  const ciclos = useCiclos();

  const listaOrgs = (orgs.data ?? []) as {
    papel: string;
    org_id: string;
    organizacao: { id: string; nome: string } | null;
  }[];
  const listaCiclos = (ciclos.data ?? []) as (Record<string, unknown> & {
    id: string;
    nome: string;
    org_id: string;
    tipo: string;
    etapa_atual: number;
    horizonte_inicio: string;
    horizonte_fim: string;
    organizacao: { nome: string } | null;
  })[];

  return (
    <AppShell
      titulo="Ciclos de planejamento"
      subtitulo="Um ciclo por horizonte. O facilitador conduz as etapas; executivos preenchem; conselheiros leem."
      acoes={
        <>
          <NovaOrganizacao />
          {listaOrgs.length ? <NovoCiclo orgs={listaOrgs} /> : null}
        </>
      }
    >
      {!listaOrgs.length ? (
        <Painel titulo="Comece pela organização">
          <p className="text-sm text-muted-foreground">
            O Bússola é multi-organização desde o início: cada empresa tem seus próprios ciclos,
            objetivos e números, isolados das demais. Crie a primeira organização para abrir um ciclo.
          </p>
        </Painel>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <Painel titulo="Ciclos" descricao="Clique para abrir a trilha das cinco etapas.">
          {ciclos.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : listaCiclos.length ? (
            <ul className="divide-y divide-border">
              {listaCiclos.map((ciclo) => (
                <li key={ciclo.id}>
                  <Link
                    to="/ciclo/$cicloId"
                    params={{ cicloId: ciclo.id }}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:bg-superficie -mx-2 px-2 rounded-sm"
                  >
                    <div>
                      <p className="font-medium">{ciclo.nome}</p>
                      <p className="num mt-0.5 text-xs text-muted-foreground">
                        {ciclo.organizacao?.nome} · ciclo{" "}
                        {ciclo.tipo === "tatico" ? "tático" : "estratégico"} ·{" "}
                        {fmtData(ciclo.horizonte_inicio)} a {fmtData(ciclo.horizonte_fim)}
                      </p>
                    </div>
                    <span className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      Etapa {ciclo.etapa_atual}/5 · {ETAPAS_NOMES[ciclo.etapa_atual - 1]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum ciclo ainda. Crie o primeiro para começar pelo diagnóstico.
            </p>
          )}
        </Painel>

        <Painel titulo="Organizações">
          <ul className="space-y-2 text-sm">
            {listaOrgs.map((m) => (
              <li key={m.org_id} className="flex items-center justify-between gap-2">
                <span>{m.organizacao?.nome}</span>
                <SeloProcedencia valor="decidido_pelo_time" />
                <span className="text-xs text-muted-foreground">{m.papel}</span>
              </li>
            ))}
            {!listaOrgs.length ? (
              <li className="text-muted-foreground">Nenhuma organização.</li>
            ) : null}
          </ul>
        </Painel>
      </div>
    </AppShell>
  );
}

function NovaOrganizacao() {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const qc = useQueryClient();

  async function criar() {
    if (!nome.trim()) return;
    const { error } = await supabase.rpc("criar_organizacao", { _nome: nome.trim() });
    if (error) {
      toast.error(error.message ?? "Não foi possível criar a organização.");
      return;
    }
    await qc.invalidateQueries();
    setNome("");
    setAberto(false);
    toast.success("Organização criada. Você é o facilitador dela.");
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" /> Organização
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova organização</DialogTitle>
          <DialogDescription>
            Você entra como facilitador: conduz o ciclo, abre e fecha etapas.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Rotulo obrigatorio>Nome da empresa</Rotulo>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={criar} disabled={!nome.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoCiclo({
  orgs,
}: {
  orgs: { org_id: string; organizacao: { id: string; nome: string } | null }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [orgId, setOrgId] = useState(orgs[0]?.org_id ?? "");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"estrategico" | "tatico">("estrategico");
  const [inicio, setInicio] = useState(`${new Date().getFullYear()}-01-01`);
  const [fim, setFim] = useState(`${new Date().getFullYear()}-12-31`);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function criar() {
    const { data, error } = await supabase
      .from("ciclo")
      .insert({
        org_id: orgId,
        nome,
        tipo,
        horizonte_inicio: inicio,
        horizonte_fim: fim,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível criar o ciclo.");
      return;
    }
    await qc.invalidateQueries();
    setAberto(false);
    void navigate({ to: "/ciclo/$cicloId", params: { cicloId: data.id } });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo ciclo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ciclo</DialogTitle>
          <DialogDescription>
            As cinco etapas são criadas na sequência do método. Você pode voltar, mas fechar uma
            etapa exige que os bloqueios dela estejam resolvidos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Rotulo obrigatorio>Organização</Rotulo>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.org_id} value={o.org_id}>
                    {o.organizacao?.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Rotulo obrigatorio>Nome do ciclo</Rotulo>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Plano 2026"
            />
          </div>
          <div>
            <Rotulo obrigatorio>Tipo</Rotulo>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estrategico">Estratégico</SelectItem>
                <SelectItem value="tatico">Tático</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Rotulo obrigatorio>Início do horizonte</Rotulo>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <Rotulo obrigatorio>Fim do horizonte</Rotulo>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={criar} disabled={!nome.trim() || !orgId}>
            Criar ciclo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
