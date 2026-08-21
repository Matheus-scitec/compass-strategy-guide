REVOKE ALL ON FUNCTION public.aceitar_convite(text) FROM anon, public;
REVOKE ALL ON FUNCTION public.convite_por_codigo(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.aceitar_convite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convite_por_codigo(text) TO authenticated;