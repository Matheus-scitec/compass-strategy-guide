-- ENUMS
CREATE TYPE public.papel_org AS ENUM ('facilitador','executivo','conselheiro');
CREATE TYPE public.procedencia AS ENUM ('decidido_pelo_time','importado_de_documento','sugerido_pelo_sistema','inferido');
CREATE TYPE public.classificacao_numero AS ENUM ('dado_medido','premissa_da_diretoria','estimativa');
CREATE TYPE public.perspectiva AS ENUM ('financeiro','cliente_mercado','processos_internos','aprendizado_crescimento','sustentacao');
CREATE TYPE public.polaridade AS ENUM ('maior','menor');
CREATE TYPE public.tipo_ciclo AS ENUM ('estrategico','tatico');
CREATE TYPE public.status_ciclo AS ENUM ('rascunho','ativo','encerrado');
CREATE TYPE public.status_etapa AS ENUM ('nao_iniciada','em_andamento','fechada');
CREATE TYPE public.status_iniciativa AS ENUM ('N','A','C','T');
CREATE TYPE public.tipo_escolha AS ENUM ('onde_jogar','como_ganhar','nao_faremos');

-- PERFIL
CREATE TABLE public.perfil (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.perfil TO authenticated;
GRANT ALL ON public.perfil TO service_role;
ALTER TABLE public.perfil ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfil (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ORGANIZACAO
CREATE TABLE public.organizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  criado_por uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizacao TO authenticated;
GRANT ALL ON public.organizacao TO service_role;
ALTER TABLE public.organizacao ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.membro_organizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizacao ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  papel public.papel_org NOT NULL DEFAULT 'executivo',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membro_organizacao TO authenticated;
GRANT ALL ON public.membro_organizacao TO service_role;
ALTER TABLE public.membro_organizacao ENABLE ROW LEVEL SECURITY;

-- HELPERS
CREATE OR REPLACE FUNCTION public.e_membro(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.membro_organizacao m WHERE m.org_id = _org AND m.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.tem_papel(_org uuid, _papel public.papel_org)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.membro_organizacao m WHERE m.org_id = _org AND m.user_id = auth.uid() AND m.papel = _papel);
$$;

CREATE OR REPLACE FUNCTION public.pode_editar(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.membro_organizacao m WHERE m.org_id = _org AND m.user_id = auth.uid() AND m.papel IN ('facilitador','executivo'));
$$;

CREATE POLICY "perfil visivel para si e colegas" ON public.perfil FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.membro_organizacao a JOIN public.membro_organizacao b ON a.org_id = b.org_id
  WHERE a.user_id = auth.uid() AND b.user_id = perfil.id));
CREATE POLICY "perfil proprio insert" ON public.perfil FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "perfil proprio update" ON public.perfil FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "org visivel para membros" ON public.organizacao FOR SELECT TO authenticated USING (public.e_membro(id));
CREATE POLICY "org criada por autenticado" ON public.organizacao FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
CREATE POLICY "org editada por facilitador" ON public.organizacao FOR UPDATE TO authenticated USING (public.tem_papel(id,'facilitador'));
CREATE POLICY "org removida por facilitador" ON public.organizacao FOR DELETE TO authenticated USING (public.tem_papel(id,'facilitador'));

CREATE POLICY "membros visiveis na org" ON public.membro_organizacao FOR SELECT TO authenticated USING (public.e_membro(org_id));
CREATE POLICY "primeiro membro ou facilitador convida" ON public.membro_organizacao FOR INSERT TO authenticated
WITH CHECK (
  public.tem_papel(org_id,'facilitador')
  OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.organizacao o WHERE o.id = org_id AND o.criado_por = auth.uid()))
);
CREATE POLICY "facilitador altera membros" ON public.membro_organizacao FOR UPDATE TO authenticated USING (public.tem_papel(org_id,'facilitador'));
CREATE POLICY "facilitador remove membros" ON public.membro_organizacao FOR DELETE TO authenticated USING (public.tem_papel(org_id,'facilitador'));

-- CICLO
CREATE TABLE public.ciclo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizacao ON DELETE CASCADE,
  nome text NOT NULL,
  horizonte_inicio date NOT NULL,
  horizonte_fim date NOT NULL,
  tipo public.tipo_ciclo NOT NULL DEFAULT 'estrategico',
  etapa_atual smallint NOT NULL DEFAULT 1,
  status public.status_ciclo NOT NULL DEFAULT 'ativo',
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  criado_por uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ciclo TO authenticated;
GRANT ALL ON public.ciclo TO service_role;
ALTER TABLE public.ciclo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ciclo leitura membros" ON public.ciclo FOR SELECT TO authenticated USING (public.e_membro(org_id));
CREATE POLICY "ciclo insert editores" ON public.ciclo FOR INSERT TO authenticated WITH CHECK (public.pode_editar(org_id));
CREATE POLICY "ciclo update editores" ON public.ciclo FOR UPDATE TO authenticated USING (public.pode_editar(org_id));
CREATE POLICY "ciclo delete facilitador" ON public.ciclo FOR DELETE TO authenticated USING (public.tem_papel(org_id,'facilitador'));

CREATE OR REPLACE FUNCTION public.org_do_ciclo(_ciclo uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.ciclo WHERE id = _ciclo;
$$;

CREATE TABLE public.etapa_ciclo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ciclo ON DELETE CASCADE,
  numero smallint NOT NULL,
  nome text NOT NULL,
  status public.status_etapa NOT NULL DEFAULT 'nao_iniciada',
  fechada_em timestamptz,
  fechada_por uuid,
  aceite_capacidade text,
  UNIQUE (ciclo_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapa_ciclo TO authenticated;
GRANT ALL ON public.etapa_ciclo TO service_role;
ALTER TABLE public.etapa_ciclo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etapa leitura" ON public.etapa_ciclo FOR SELECT TO authenticated USING (public.e_membro(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "etapa insert" ON public.etapa_ciclo FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "etapa update" ON public.etapa_ciclo FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "etapa delete" ON public.etapa_ciclo FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));

CREATE OR REPLACE FUNCTION public.cria_etapas_do_ciclo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.etapa_ciclo (ciclo_id, numero, nome, status) VALUES
    (NEW.id, 1, 'Diagnóstico', 'em_andamento'),
    (NEW.id, 2, 'Escolhas estratégicas', 'nao_iniciada'),
    (NEW.id, 3, 'Desdobramento', 'nao_iniciada'),
    (NEW.id, 4, 'Plano operacional', 'nao_iniciada'),
    (NEW.id, 5, 'Execução e revisão', 'nao_iniciada');
  RETURN NEW;
END; $$;
CREATE TRIGGER ciclo_cria_etapas AFTER INSERT ON public.ciclo
FOR EACH ROW EXECUTE FUNCTION public.cria_etapas_do_ciclo();

-- DIAGNOSTICO / ESCOLHA (estrutura preparada)
CREATE TABLE public.diagnostico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ciclo ON DELETE CASCADE,
  bloco text NOT NULL,
  conteudo text,
  lacunas text[] NOT NULL DEFAULT '{}',
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostico TO authenticated;
GRANT ALL ON public.diagnostico TO service_role;
ALTER TABLE public.diagnostico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag leitura" ON public.diagnostico FOR SELECT TO authenticated USING (public.e_membro(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "diag insert" ON public.diagnostico FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "diag update" ON public.diagnostico FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "diag delete" ON public.diagnostico FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));

CREATE TABLE public.escolha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ciclo ON DELETE CASCADE,
  tipo public.tipo_escolha NOT NULL,
  texto text NOT NULL,
  quadrante_matriz text,
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escolha TO authenticated;
GRANT ALL ON public.escolha TO service_role;
ALTER TABLE public.escolha ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escolha leitura" ON public.escolha FOR SELECT TO authenticated USING (public.e_membro(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "escolha insert" ON public.escolha FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "escolha update" ON public.escolha FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "escolha delete" ON public.escolha FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));

-- OBJETIVO
CREATE TABLE public.objetivo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ciclo ON DELETE CASCADE,
  codigo text NOT NULL,
  perspectiva public.perspectiva NOT NULL,
  frase text NOT NULL,
  por_que_importa text,
  dono_id uuid REFERENCES auth.users ON DELETE SET NULL,
  forum_acompanhamento text,
  risco_principal text,
  ordem int NOT NULL DEFAULT 0,
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, codigo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objetivo TO authenticated;
GRANT ALL ON public.objetivo TO service_role;
ALTER TABLE public.objetivo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "obj leitura" ON public.objetivo FOR SELECT TO authenticated USING (public.e_membro(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "obj insert" ON public.objetivo FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "obj update" ON public.objetivo FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "obj delete" ON public.objetivo FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));

CREATE OR REPLACE FUNCTION public.org_do_objetivo(_obj uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.org_id FROM public.objetivo o JOIN public.ciclo c ON c.id = o.ciclo_id WHERE o.id = _obj;
$$;

-- INDICADOR
CREATE TABLE public.indicador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objetivo_id uuid NOT NULL REFERENCES public.objetivo ON DELETE CASCADE,
  codigo text NOT NULL,
  nome text NOT NULL,
  formula text,
  fonte text,
  frequencia text,
  polaridade public.polaridade,
  unidade text,
  linha_base numeric,
  linha_base_data date,
  responsavel_apuracao uuid REFERENCES auth.users ON DELETE SET NULL,
  tipo_indicador text NOT NULL DEFAULT 'resultado',
  publicado boolean NOT NULL DEFAULT false,
  classificacao_numero public.classificacao_numero NOT NULL DEFAULT 'dado_medido',
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicador TO authenticated;
GRANT ALL ON public.indicador TO service_role;
ALTER TABLE public.indicador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ind leitura" ON public.indicador FOR SELECT TO authenticated USING (public.e_membro(public.org_do_objetivo(objetivo_id)));
CREATE POLICY "ind insert" ON public.indicador FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_objetivo(objetivo_id)));
CREATE POLICY "ind update" ON public.indicador FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_objetivo(objetivo_id)));
CREATE POLICY "ind delete" ON public.indicador FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_objetivo(objetivo_id)));

CREATE OR REPLACE FUNCTION public.valida_publicacao_indicador()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.publicado THEN
    IF coalesce(NEW.formula,'') = '' OR coalesce(NEW.fonte,'') = '' OR coalesce(NEW.frequencia,'') = ''
       OR NEW.polaridade IS NULL OR NEW.linha_base IS NULL OR NEW.linha_base_data IS NULL THEN
      RAISE EXCEPTION 'Indicador não é publicável sem fórmula, fonte, frequência, polaridade e linha de base medida (com data).';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER indicador_valida_publicacao BEFORE INSERT OR UPDATE ON public.indicador
FOR EACH ROW EXECUTE FUNCTION public.valida_publicacao_indicador();

CREATE OR REPLACE FUNCTION public.org_do_indicador(_ind uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.org_id FROM public.indicador i
  JOIN public.objetivo o ON o.id = i.objetivo_id
  JOIN public.ciclo c ON c.id = o.ciclo_id WHERE i.id = _ind;
$$;

CREATE TABLE public.meta_indicador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES public.indicador ON DELETE CASCADE,
  periodo text NOT NULL,
  valor numeric NOT NULL,
  classificacao_numero public.classificacao_numero NOT NULL DEFAULT 'premissa_da_diretoria',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (indicador_id, periodo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_indicador TO authenticated;
GRANT ALL ON public.meta_indicador TO service_role;
ALTER TABLE public.meta_indicador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta leitura" ON public.meta_indicador FOR SELECT TO authenticated USING (public.e_membro(public.org_do_indicador(indicador_id)));
CREATE POLICY "meta insert" ON public.meta_indicador FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_indicador(indicador_id)));
CREATE POLICY "meta update" ON public.meta_indicador FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_indicador(indicador_id)));
CREATE POLICY "meta delete" ON public.meta_indicador FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_indicador(indicador_id)));

CREATE TABLE public.revisao_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES public.indicador ON DELETE CASCADE,
  periodo text NOT NULL,
  valor_anterior numeric,
  valor_novo numeric,
  motivo text NOT NULL,
  autor uuid NOT NULL DEFAULT auth.uid(),
  data timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.revisao_meta TO authenticated;
GRANT ALL ON public.revisao_meta TO service_role;
ALTER TABLE public.revisao_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revmeta leitura" ON public.revisao_meta FOR SELECT TO authenticated USING (public.e_membro(public.org_do_indicador(indicador_id)));
CREATE POLICY "revmeta insert" ON public.revisao_meta FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_indicador(indicador_id)) AND autor = auth.uid());

-- APURACAO
CREATE TABLE public.apuracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES public.indicador ON DELETE CASCADE,
  periodo text NOT NULL,
  valor numeric,
  fechado boolean NOT NULL DEFAULT false,
  observacao text,
  reapresentado boolean NOT NULL DEFAULT false,
  classificacao_numero public.classificacao_numero NOT NULL DEFAULT 'dado_medido',
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (indicador_id, periodo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apuracao TO authenticated;
GRANT ALL ON public.apuracao TO service_role;
ALTER TABLE public.apuracao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apu leitura" ON public.apuracao FOR SELECT TO authenticated USING (public.e_membro(public.org_do_indicador(indicador_id)));
CREATE POLICY "apu insert" ON public.apuracao FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_indicador(indicador_id)));
CREATE POLICY "apu update" ON public.apuracao FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_indicador(indicador_id)));
CREATE POLICY "apu delete" ON public.apuracao FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_indicador(indicador_id)) AND fechado = false);

CREATE TABLE public.reapresentacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apuracao_id uuid NOT NULL REFERENCES public.apuracao ON DELETE CASCADE,
  valor_anterior numeric,
  valor_novo numeric,
  motivo text NOT NULL,
  autor uuid NOT NULL DEFAULT auth.uid(),
  data timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reapresentacao TO authenticated;
GRANT ALL ON public.reapresentacao TO service_role;
ALTER TABLE public.reapresentacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reap leitura" ON public.reapresentacao FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.apuracao a WHERE a.id = apuracao_id AND public.e_membro(public.org_do_indicador(a.indicador_id))));

-- Regra 5: periodo fechado e imutavel; alterar exige a funcao de reapresentacao
CREATE OR REPLACE FUNCTION public.protege_apuracao_fechada()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.fechado AND coalesce(current_setting('bussola.reapresentando', true),'') <> 'on' THEN
    IF NEW.valor IS DISTINCT FROM OLD.valor OR NEW.fechado IS DISTINCT FROM OLD.fechado THEN
      RAISE EXCEPTION 'Período apurado e fechado é imutável. Registre uma reapresentação com motivo para alterar este número.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER apuracao_protege_fechada BEFORE UPDATE ON public.apuracao
FOR EACH ROW EXECUTE FUNCTION public.protege_apuracao_fechada();

CREATE OR REPLACE FUNCTION public.reapresentar_apuracao(_apuracao uuid, _valor_novo numeric, _motivo text)
RETURNS public.apuracao LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ap public.apuracao;
BEGIN
  SELECT * INTO _ap FROM public.apuracao WHERE id = _apuracao;
  IF _ap.id IS NULL THEN RAISE EXCEPTION 'Apuração não encontrada.'; END IF;
  IF NOT public.pode_editar(public.org_do_indicador(_ap.indicador_id)) THEN
    RAISE EXCEPTION 'Sem permissão para reapresentar este período.';
  END IF;
  IF coalesce(btrim(_motivo),'') = '' THEN RAISE EXCEPTION 'A reapresentação exige um motivo.'; END IF;

  INSERT INTO public.reapresentacao (apuracao_id, valor_anterior, valor_novo, motivo, autor)
  VALUES (_apuracao, _ap.valor, _valor_novo, _motivo, auth.uid());

  PERFORM set_config('bussola.reapresentando','on', true);
  UPDATE public.apuracao SET valor = _valor_novo, reapresentado = true WHERE id = _apuracao RETURNING * INTO _ap;
  PERFORM set_config('bussola.reapresentando','off', true);
  RETURN _ap;
END; $$;
GRANT EXECUTE ON FUNCTION public.reapresentar_apuracao(uuid, numeric, text) TO authenticated;

-- INICIATIVA
CREATE TABLE public.iniciativa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ciclo ON DELETE CASCADE,
  objetivo_id uuid REFERENCES public.objetivo ON DELETE SET NULL,
  codigo text NOT NULL,
  titulo text NOT NULL,
  lider_id uuid REFERENCES auth.users ON DELETE SET NULL,
  entregavel_verificavel text,
  inicio date,
  fim date,
  investimento numeric,
  status public.status_iniciativa NOT NULL DEFAULT 'N',
  reversibilidade text,
  publicado boolean NOT NULL DEFAULT false,
  classificacao_numero public.classificacao_numero NOT NULL DEFAULT 'estimativa',
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, codigo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iniciativa TO authenticated;
GRANT ALL ON public.iniciativa TO service_role;
ALTER TABLE public.iniciativa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ini leitura" ON public.iniciativa FOR SELECT TO authenticated USING (public.e_membro(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "ini insert" ON public.iniciativa FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "ini update" ON public.iniciativa FOR UPDATE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));
CREATE POLICY "ini delete" ON public.iniciativa FOR DELETE TO authenticated USING (public.pode_editar(public.org_do_ciclo(ciclo_id)));

CREATE OR REPLACE FUNCTION public.valida_publicacao_iniciativa()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.publicado THEN
    IF NEW.lider_id IS NULL OR NEW.fim IS NULL OR coalesce(NEW.entregavel_verificavel,'') = '' THEN
      RAISE EXCEPTION 'Iniciativa não é publicável sem líder nomeado (pessoa), prazo e entregável verificável.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER iniciativa_valida_publicacao BEFORE INSERT OR UPDATE ON public.iniciativa
FOR EACH ROW EXECUTE FUNCTION public.valida_publicacao_iniciativa();

CREATE TABLE public.acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iniciativa_id uuid NOT NULL REFERENCES public.iniciativa ON DELETE CASCADE,
  titulo text NOT NULL,
  responsavel_id uuid REFERENCES auth.users ON DELETE SET NULL,
  prazo date,
  status text NOT NULL DEFAULT 'aberta',
  procedencia public.procedencia NOT NULL DEFAULT 'decidido_pelo_time',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acao TO authenticated;
GRANT ALL ON public.acao TO service_role;
ALTER TABLE public.acao ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.org_da_iniciativa(_ini uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.org_id FROM public.iniciativa i JOIN public.ciclo c ON c.id = i.ciclo_id WHERE i.id = _ini;
$$;
CREATE POLICY "acao leitura" ON public.acao FOR SELECT TO authenticated USING (public.e_membro(public.org_da_iniciativa(iniciativa_id)));
CREATE POLICY "acao insert" ON public.acao FOR INSERT TO authenticated WITH CHECK (public.pode_editar(public.org_da_iniciativa(iniciativa_id)));
CREATE POLICY "acao update" ON public.acao FOR UPDATE TO authenticated USING (public.pode_editar(public.org_da_iniciativa(iniciativa_id)));
CREATE POLICY "acao delete" ON public.acao FOR DELETE TO authenticated USING (public.pode_editar(public.org_da_iniciativa(iniciativa_id)));

-- COMENTARIO (estrutura preparada)
CREATE TABLE public.comentario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizacao ON DELETE CASCADE,
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  autor uuid NOT NULL DEFAULT auth.uid(),
  texto text NOT NULL,
  mencoes uuid[] NOT NULL DEFAULT '{}',
  resolvido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comentario TO authenticated;
GRANT ALL ON public.comentario TO service_role;
ALTER TABLE public.comentario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "com leitura" ON public.comentario FOR SELECT TO authenticated USING (public.e_membro(org_id));
CREATE POLICY "com insert" ON public.comentario FOR INSERT TO authenticated WITH CHECK (public.e_membro(org_id) AND autor = auth.uid());
CREATE POLICY "com update" ON public.comentario FOR UPDATE TO authenticated USING (public.pode_editar(org_id));
CREATE POLICY "com delete" ON public.comentario FOR DELETE TO authenticated USING (autor = auth.uid());