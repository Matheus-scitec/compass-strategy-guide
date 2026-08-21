import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rotulo } from "@/components/bussola/selos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useCiclo, useMembros } from "@/lib/queries";
import { fmtData } from "@/lib/format";

type Papel = "facilitador" | "executivo" | "conselheiro";

const PAPEIS: { valor: Papel; rotulo: string; texto: string }[] = [
  { valor: "facilitador", rotulo: "Facilitador", texto: "Conduz o ciclo, abre e fecha etapas." },
  { valor: "executivo", rotulo: "Executivo", texto: "Preenche objetivos, indicadores e apurações." },
  { valor: "conselheiro", rotulo: "Conselheiro", texto: "Só leitura: sala do conselho e relatórios." },
];

function linkDoConvite(codigo: string) {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/aceitar?c=${codigo}`;
}

export function CompartilharCiclo({ cicloId }: { cicloId: string }) {
  const [aberto, setAberto] = useState(false);
  const ciclo = useCiclo(cicloId);
  const orgId = (ciclo.data as { org_id?: string } | undefined)?.org_id;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-guia="compartilhar">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Compartilhar o ciclo</DialogTitle>
          <DialogDescription>
            Convide pessoas para a organização deste ciclo. Cada convite gera um link; quem abrir o
            link e entrar na conta passa a fazer parte do time com o papel escolhido.
          </DialogDescription>
        </DialogHeader>
        {orgId ? <PainelConvites orgId={orgId} /> : <p className="text-sm text-muted-foreground">Carregando…</p>}
      </DialogContent>
    </Dialog>
  );
}

function PainelConvites({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const membros = useMembros(orgId);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("executivo");
  const [salvando, setSalvando] = useState(false);

  const convites = useQuery({
    queryKey: ["convites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("convite")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  async function convidar() {
    setSalvando(true);
    const { data, error } = await supabase
      .from("convite")
      .insert({ org_id: orgId, email: email.trim() || null, papel })
      .select("codigo")
      .single();
    setSalvando(false);
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível criar o convite.");
      return;
    }
    setEmail("");
    await qc.invalidateQueries({ queryKey: ["convites", orgId] });
    await copiar(data.codigo);
    toast.success("Convite criado e link copiado. Envie para a pessoa.");
  }

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(linkDoConvite(codigo));
      toast.success("Link do convite copiado.");
    } catch {
      toast.message(linkDoConvite(codigo));
    }
  }

  async function cancelar(id: string) {
    const { error } = await supabase.from("convite").update({ status: "cancelado" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["convites", orgId] });
  }

  const lista = (convites.data ?? []) as {
    id: string;
    email: string | null;
    papel: Papel;
    codigo: string;
    status: string;
    expira_em: string;
  }[];

  const listaMembros = (membros.data ?? []) as {
    user_id: string;
    papel: string;
    perfil: { nome: string; email: string | null } | null;
  }[];

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-md border border-border p-3">
        <div>
          <Rotulo>E-mail da pessoa (opcional)</Rotulo>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pessoa@empresa.com"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Com e-mail, só essa conta pode aceitar. Sem e-mail, qualquer pessoa com o link entra.
          </p>
        </div>
        <div>
          <Rotulo obrigatorio>Papel no ciclo</Rotulo>
          <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAPEIS.map((p) => (
                <SelectItem key={p.valor} value={p.valor}>
                  {p.rotulo} — {p.texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={convidar} disabled={salvando}>
          <UserPlus className="h-4 w-4" /> Criar convite e copiar link
        </Button>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide">Convites</h3>
        {lista.length ? (
          <ul className="mt-2 divide-y divide-border text-sm">
            {lista.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p>{c.email ?? "Link aberto"}</p>
                  <p className="num text-xs text-muted-foreground">
                    {c.papel} · {c.status} · válido até {fmtData(c.expira_em)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => void copiar(c.codigo)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {c.status === "pendente" ? (
                    <Button variant="ghost" size="sm" onClick={() => void cancelar(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum convite ainda.</p>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide">Time da organização</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {listaMembros.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-2">
              <span>{m.perfil?.nome ?? m.perfil?.email ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{m.papel}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
