CREATE OR REPLACE FUNCTION public.criar_organizacao(_nome text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Necessário estar autenticado.';
  END IF;
  IF coalesce(btrim(_nome),'') = '' THEN
    RAISE EXCEPTION 'Informe o nome da organização.';
  END IF;

  INSERT INTO public.organizacao (nome, criado_por)
  VALUES (btrim(_nome), auth.uid())
  RETURNING id INTO _org_id;

  INSERT INTO public.membro_organizacao (org_id, user_id, papel)
  VALUES (_org_id, auth.uid(), 'facilitador');

  RETURN _org_id;
END; $$;

REVOKE ALL ON FUNCTION public.criar_organizacao(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_organizacao(text) TO authenticated;