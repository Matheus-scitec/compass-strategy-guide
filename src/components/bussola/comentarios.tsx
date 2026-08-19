import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useComentarios } from "@/lib/queries";
import { fmtData } from "@/lib/format";

type Membro = { user_id: string; perfil: { id: string; nome: string } | null };

type Comentario = {
  id: string;
  texto: string;
  autor: string;
  mencoes: string[];
  resolvido: boolean;
  created_at: string;
  perfil?: { id: string; nome: string } | null;
};

/** Detecta @Nome no texto e devolve os ids dos mencionados. */
function detectaMencoes(texto: string, membros: Membro[]): string[] {
  const alvo = texto.toLowerCase();
  return membros
    .filter((m) => {
      const nome = m.perfil?.nome?.toLowerCase();
      if (!nome) return false;
      const primeiro = nome.split(" ")[0]!;
      return alvo.includes(`@${nome}`) || alvo.includes(`@${primeiro}`);
    })
    .map((m) => m.user_id);
}

export function Comentarios({
  orgId,
  entidadeTipo,
  entidadeId,
  membros,
}: {
  orgId: string | undefined;
  entidadeTipo: string;
  entidadeId: string;
  membros: Membro[];
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const comentarios = useComentarios(entidadeTipo, entidadeId);
  const [texto, setTexto] = useState("");
  const lista = (comentarios.data ?? []) as unknown as Comentario[];
  const mencoes = detectaMencoes(texto, membros);

  async function enviar() {
    if (!texto.trim() || !orgId || !user) return;
    const { error } = await supabase.from("comentario").insert({
      org_id: orgId,
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      autor: user.id,
      texto: texto.trim(),
      mencoes,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTexto("");
    await qc.invalidateQueries({ queryKey: ["comentarios", entidadeTipo, entidadeId] });
  }

  async function alternarResolvido(c: Comentario) {
    const { error } = await supabase
      .from("comentario")
      .update({ resolvido: !c.resolvido })
      .eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["comentarios", entidadeTipo, entidadeId] });
  }

  const abertos = lista.filter((c) => !c.resolvido);
  const resolvidos = lista.filter((c) => c.resolvido);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {abertos.length ? (
          abertos.map((c) => (
            <div key={c.id} className="rounded-md border border-border bg-superficie p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {c.perfil?.nome ?? "Alguém"} · {fmtData(c.created_at)}
                </p>
                <Button size="sm" variant="ghost" onClick={() => alternarResolvido(c)}>
                  <Check className="h-3.5 w-3.5" /> resolver
                </Button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.texto}</p>
              {c.mencoes?.length ? (
                <p className="mt-1 text-xs text-primary">
                  {c.mencoes.length} pessoa(s) mencionada(s)
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> Nenhum ponto aberto.
          </p>
        )}
      </div>

      <div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva o ponto. Use @nome para chamar a pessoa responsável."
        />
        {mencoes.length ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Vai mencionar {mencoes.length} pessoa(s).
          </p>
        ) : null}
        <Button className="mt-2" size="sm" onClick={enviar} disabled={!texto.trim()}>
          Registrar ponto
        </Button>
      </div>

      {resolvidos.length ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-muted-foreground">
            {resolvidos.length} ponto(s) resolvido(s)
          </summary>
          <div className="mt-2 space-y-1">
            {resolvidos.map((c) => (
              <p key={c.id} className="text-sm text-muted-foreground line-through">
                {c.texto}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}