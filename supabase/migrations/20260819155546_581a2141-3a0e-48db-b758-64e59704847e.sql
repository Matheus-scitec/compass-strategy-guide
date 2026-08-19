CREATE TABLE public.reuniao_revisao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id uuid NOT NULL REFERENCES public.ciclo(id) ON DELETE CASCADE,
  periodo text NOT NULL,
  data date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'aberta',
  observacoes text,
  concluida_em timestamp with time zone,
  concluida_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, periodo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reuniao_revisao TO authenticated;
GRANT ALL ON public.reuniao_revisao TO service_role;
ALTER TABLE public.reuniao_revisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reuniao_select" ON public.reuniao_revisao FOR SELECT TO authenticated
  USING (public.e_membro(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "reuniao_insert" ON public.reuniao_revisao FOR INSERT TO authenticated
  WITH CHECK (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "reuniao_update" ON public.reuniao_revisao FOR UPDATE TO authenticated
  USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "reuniao_delete" ON public.reuniao_revisao FOR DELETE TO authenticated
  USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));

CREATE OR REPLACE FUNCTION public.org_da_reuniao(_reuniao uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.org_id FROM public.reuniao_revisao r JOIN public.ciclo c ON c.id = r.ciclo_id WHERE r.id = _reuniao;
$$;
REVOKE ALL ON FUNCTION public.org_da_reuniao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_da_reuniao(uuid) TO authenticated, service_role;

CREATE TABLE public.decisao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reuniao_id uuid NOT NULL REFERENCES public.reuniao_revisao(id) ON DELETE CASCADE,
  texto text NOT NULL,
  responsavel_id uuid,
  prazo date,
  status text NOT NULL DEFAULT 'aberta',
  acao_id uuid REFERENCES public.acao(id) ON DELETE SET NULL,
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  autor uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.decisao TO authenticated;
GRANT ALL ON public.decisao TO service_role;
ALTER TABLE public.decisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decisao_select" ON public.decisao FOR SELECT TO authenticated
  USING (public.e_membro(public.org_da_reuniao(reuniao_id)));
CREATE POLICY "decisao_insert" ON public.decisao FOR INSERT TO authenticated
  WITH CHECK (public.pode_editar(public.org_da_reuniao(reuniao_id)));
CREATE POLICY "decisao_update" ON public.decisao FOR UPDATE TO authenticated
  USING (public.pode_editar(public.org_da_reuniao(reuniao_id)));
CREATE POLICY "decisao_delete" ON public.decisao FOR DELETE TO authenticated
  USING (public.pode_editar(public.org_da_reuniao(reuniao_id)));