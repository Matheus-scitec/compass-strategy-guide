REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cria_etapas_do_ciclo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.valida_publicacao_indicador() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.valida_publicacao_iniciativa() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protege_apuracao_fechada() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.e_membro(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tem_papel(uuid, public.papel_org) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_editar(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.org_do_ciclo(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.org_do_objetivo(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.org_do_indicador(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.org_da_iniciativa(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reapresentar_apuracao(uuid, numeric, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.e_membro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tem_papel(uuid, public.papel_org) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_editar(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_do_ciclo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_do_objetivo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_do_indicador(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_da_iniciativa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reapresentar_apuracao(uuid, numeric, text) TO authenticated;