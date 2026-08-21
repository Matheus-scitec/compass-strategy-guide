CREATE TABLE public.convite (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizacao(id) ON DELETE CASCADE,
  email text,
  papel papel_org NOT NULL DEFAULT 'executivo',
  codigo text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status text NOT NULL DEFAULT 'pendente',
  convidado_por uuid NOT NULL DEFAULT auth.uid() REFERENCES public.perfil(id),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  aceito_em timestamptz,
  aceito_por uuid REFERENCES public.perfil(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convite TO authenticated;
GRANT ALL ON public.convite TO service_role;

ALTER TABLE public.convite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem convites da organizacao" ON public.convite
  FOR SELECT TO authenticated USING (public.e_membro(org_id));
CREATE POLICY "Facilitadores criam convites" ON public.convite
  FOR INSERT TO authenticated WITH CHECK (public.pode_editar(org_id));
CREATE POLICY "Facilitadores atualizam convites" ON public.convite
  FOR UPDATE TO authenticated USING (public.pode_editar(org_id)) WITH CHECK (public.pode_editar(org_id));
CREATE POLICY "Facilitadores apagam convites" ON public.convite
  FOR DELETE TO authenticated USING (public.pode_editar(org_id));

CREATE OR REPLACE FUNCTION public.convite_por_codigo(_codigo text)
RETURNS TABLE (org_nome text, papel papel_org, status text, expira_em timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.nome, c.papel, c.status, c.expira_em
  FROM public.convite c
  JOIN public.organizacao o ON o.id = c.org_id
  WHERE c.codigo = _codigo;
$$;

CREATE OR REPLACE FUNCTION public.aceitar_convite(_codigo text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c public.convite;
  _email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Necessário estar autenticado.';
  END IF;

  SELECT * INTO _c FROM public.convite WHERE codigo = btrim(_codigo);
  IF _c.id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado.';
  END IF;
  IF _c.status <> 'pendente' THEN
    RAISE EXCEPTION 'Este convite já foi usado ou cancelado.';
  END IF;
  IF _c.expira_em < now() THEN
    RAISE EXCEPTION 'Este convite expirou. Peça um novo ao facilitador.';
  END IF;

  SELECT email INTO _email FROM public.perfil WHERE id = auth.uid();
  IF _c.email IS NOT NULL AND btrim(_c.email) <> ''
     AND lower(btrim(_c.email)) <> lower(coalesce(_email, '')) THEN
    RAISE EXCEPTION 'Este convite foi enviado para outro e-mail.';
  END IF;

  INSERT INTO public.membro_organizacao (org_id, user_id, papel)
  VALUES (_c.org_id, auth.uid(), _c.papel)
  ON CONFLICT (org_id, user_id) DO UPDATE SET papel = EXCLUDED.papel;

  UPDATE public.convite
     SET status = 'aceito', aceito_em = now(), aceito_por = auth.uid()
   WHERE id = _c.id;

  RETURN _c.org_id;
END; $$;