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
