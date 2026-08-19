import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Ciclo = {
  id: string;
  org_id: string;
  nome: string;
  horizonte_inicio: string;
  horizonte_fim: string;
  tipo: "estrategico" | "tatico";
  etapa_atual: number;
  status: "rascunho" | "ativo" | "encerrado";
};

async function precisa<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

export function useOrganizacoes() {
  return useQuery({
    queryKey: ["organizacoes"],
    queryFn: async () =>
      precisa(
        supabase
          .from("membro_organizacao")
          .select("papel, org_id, organizacao(id, nome)")
          .order("created_at"),
      ),
  });
}

export function useCiclos() {
  return useQuery({
    queryKey: ["ciclos"],
    queryFn: async () =>
      precisa(
        supabase
          .from("ciclo")
          .select("*, organizacao(nome)")
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useCiclo(cicloId: string) {
  return useQuery({
    queryKey: ["ciclo", cicloId],
    queryFn: async () =>
      precisa(
        supabase
          .from("ciclo")
          .select("*, organizacao(id, nome)")
          .eq("id", cicloId)
          .single(),
      ),
  });
}

export function useEtapas(cicloId: string) {
  return useQuery({
    queryKey: ["etapas", cicloId],
    queryFn: async () =>
      precisa(
        supabase.from("etapa_ciclo").select("*").eq("ciclo_id", cicloId).order("numero"),
      ),
  });
}

export function useMembros(orgId: string | undefined) {
  return useQuery({
    enabled: !!orgId,
    queryKey: ["membros", orgId],
    queryFn: async () =>
      precisa(
        supabase
          .from("membro_organizacao")
          .select("user_id, papel, perfil:user_id(id, nome, email)")
          .eq("org_id", orgId!),
      ),
  });
}

export function useObjetivos(cicloId: string) {
  return useQuery({
    queryKey: ["objetivos", cicloId],
    queryFn: async () =>
      precisa(
        supabase
          .from("objetivo")
          .select("*, indicador(*), perfil:dono_id(id, nome)")
          .eq("ciclo_id", cicloId)
          .order("codigo"),
      ),
  });
}

export function useObjetivo(objetivoId: string) {
  return useQuery({
    queryKey: ["objetivo", objetivoId],
    queryFn: async () =>
      precisa(
        supabase
          .from("objetivo")
          .select("*, indicador(*), perfil:dono_id(id, nome)")
          .eq("id", objetivoId)
          .single(),
      ),
  });
}

export function useIniciativas(cicloId: string) {
  return useQuery({
    queryKey: ["iniciativas", cicloId],
    queryFn: async () =>
      precisa(
        supabase
          .from("iniciativa")
          .select("*, perfil:lider_id(id, nome), objetivo(id, codigo, frase)")
          .eq("ciclo_id", cicloId)
          .order("codigo"),
      ),
  });
}

export function useMetas(cicloId: string) {
  return useQuery({
    queryKey: ["metas", cicloId],
    queryFn: async () => {
      const indicadores = await precisa(
        supabase
          .from("indicador")
          .select("id, objetivo!inner(ciclo_id)")
          .eq("objetivo.ciclo_id", cicloId),
      );
      const ids = (indicadores as { id: string }[]).map((i) => i.id);
      if (!ids.length) return [];
      return precisa(supabase.from("meta_indicador").select("*").in("indicador_id", ids));
    },
  });
}

export function useApuracoes(cicloId: string) {
  return useQuery({
    queryKey: ["apuracoes", cicloId],
    queryFn: async () => {
      const indicadores = await precisa(
        supabase
          .from("indicador")
          .select("id, objetivo!inner(ciclo_id)")
          .eq("objetivo.ciclo_id", cicloId),
      );
      const ids = (indicadores as { id: string }[]).map((i) => i.id);
      if (!ids.length) return [];
      return precisa(supabase.from("apuracao").select("*").in("indicador_id", ids));
    },
  });
}

export function useMetasDoIndicador(indicadorId: string | undefined) {
  return useQuery({
    enabled: !!indicadorId,
    queryKey: ["metas-indicador", indicadorId],
    queryFn: async () =>
      precisa(
        supabase
          .from("meta_indicador")
          .select("*")
          .eq("indicador_id", indicadorId!)
          .order("periodo"),
      ),
  });
}

export function useDiagnostico(cicloId: string) {
  return useQuery({
    queryKey: ["diagnostico", cicloId],
    queryFn: async () =>
      precisa(supabase.from("diagnostico").select("*").eq("ciclo_id", cicloId)),
  });
}

export function useEscolhas(cicloId: string) {
  return useQuery({
    queryKey: ["escolhas", cicloId],
    queryFn: async () =>
      precisa(
        supabase.from("escolha").select("*").eq("ciclo_id", cicloId).order("created_at"),
      ),
  });
}

export function useIniciativa(iniciativaId: string) {
  return useQuery({
    queryKey: ["iniciativa", iniciativaId],
    queryFn: async () =>
      precisa(
        supabase
          .from("iniciativa")
          .select("*, perfil:lider_id(id, nome), objetivo(id, codigo, frase, ciclo_id)")
          .eq("id", iniciativaId)
          .single(),
      ),
  });
}

export function useAcoesDaIniciativa(iniciativaId: string) {
  return useQuery({
    queryKey: ["acoes", iniciativaId],
    queryFn: async () =>
      precisa(
        supabase
          .from("acao")
          .select("*, perfil:responsavel_id(id, nome)")
          .eq("iniciativa_id", iniciativaId)
          .order("prazo", { nullsFirst: false }),
      ),
  });
}

export function useAcoesDoCiclo(cicloId: string) {
  return useQuery({
    queryKey: ["acoes-ciclo", cicloId],
    queryFn: async () =>
      precisa(
        supabase
          .from("acao")
          .select("*, perfil:responsavel_id(id, nome), iniciativa!inner(id, codigo, titulo, ciclo_id)")
          .eq("iniciativa.ciclo_id", cicloId),
      ),
  });
}

export function useReunioes(cicloId: string) {
  return useQuery({
    queryKey: ["reunioes", cicloId],
    queryFn: async () =>
      precisa(
        supabase
          .from("reuniao_revisao")
          .select("*")
          .eq("ciclo_id", cicloId)
          .order("data", { ascending: false }),
      ),
  });
}

export function useDecisoes(reuniaoId: string | undefined) {
  return useQuery({
    enabled: !!reuniaoId,
    queryKey: ["decisoes", reuniaoId],
    queryFn: async () =>
      precisa(
        supabase
          .from("decisao")
          .select("*, perfil:responsavel_id(id, nome)")
          .eq("reuniao_id", reuniaoId!)
          .order("created_at"),
      ),
  });
}

export function useComentarios(entidadeTipo: string, entidadeId: string | undefined) {
  return useQuery({
    enabled: !!entidadeId,
    queryKey: ["comentarios", entidadeTipo, entidadeId],
    queryFn: async () =>
      precisa(
        supabase
          .from("comentario")
          .select("*, perfil:autor(id, nome)")
          .eq("entidade_tipo", entidadeTipo)
          .eq("entidade_id", entidadeId!)
          .order("created_at"),
      ),
  });
}

export function useReapresentacoes(cicloId: string) {
  return useQuery({
    queryKey: ["reapresentacoes", cicloId],
    queryFn: async () => {
      const indicadores = await precisa(
        supabase
          .from("indicador")
          .select("id, objetivo!inner(ciclo_id)")
          .eq("objetivo.ciclo_id", cicloId),
      );
      const ids = (indicadores as { id: string }[]).map((i) => i.id);
      if (!ids.length) return [];
      return precisa(
        supabase
          .from("reapresentacao")
          .select("*, apuracao(indicador_id, periodo)")
          .in("apuracao_id",
            (
              await precisa(
                supabase.from("apuracao").select("id").in("indicador_id", ids),
              )
            ).map((a: { id: string }) => a.id),
          ),
      );
    },
  });
}
