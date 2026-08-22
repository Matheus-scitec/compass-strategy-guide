
alter table public.indicador add column if not exists responsavel_nome text;
alter table public.indicador add column if not exists meta_texto text;

do $$
declare
  c uuid := '2f762f2f-7654-48a5-901b-a349338eda57';
  f1 uuid; f2 uuid; f3 uuid; f4 uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid;
  a1 uuid; a2 uuid; a3 uuid;
  ind uuid;
begin
  -- Diagnóstico: SWOT do documento
  insert into public.diagnostico (ciclo_id, bloco, conteudo, lacunas, procedencia) values
  (c,'swot_forcas','Forças (SWOT — documento de planejamento 2026-2030).', array[
    'Busca Contínua por Melhoria e Inovação','Humanização no Trato com Pessoas',
    'Capacidade técnica (Certificação, Ancoragem)','Benefícios e clima Organizacional',
    'Escopo Acreditado (Certificação)','Atendimento Global (Certificação)',
    'Oferta de soluções integradas (OCP + ENSAIO)'],'importado_de_documento'),
  (c,'swot_fraquezas','Fraquezas (SWOT — documento de planejamento 2026-2030).', array[
    'Falta de padronização de processos entre as áreas','Atendimento a cliente',
    'Comunicação interna ineficiente','Falta de clareza sobre a identidade organizacional e cultura',
    'Gargalos operacionais e sobrecarga de algumas áreas',
    'Gestão do conhecimento: baixa documentação e retenção de know-how',
    'Gestão de Projetos amadora (com baixa assertividade)',
    'Falta de Integração de Ferramentas de Gestão','Falta capacidade técnica (Saúde)',
    'Infraestrutura Laboratorial'],'importado_de_documento'),
  (c,'swot_oportunidades','Oportunidades (SWOT — documento de planejamento 2026-2030).', array[
    'Investimento em novas metodologias, pesquisa e Inovação',
    'Explorar os dados de ensaio já existentes e monetizar essa informação',
    'Disseminação da cultura organizacional como diferencial competitivo',
    'Adoção de novas tecnologias para ensaio','Automação de processos de ensaio',
    'Outros acreditadores ILAC',
    'Escopo de certificação de países vizinhos ou que seguem a mesma norma',
    'Expansão de Escopo - Materiais (Médicos) / Microbiologia / Embalagem / Alarme de Incêndio / Máquina de Solda / Viaturas',
    'Expandir fisicamente para outras regiões do mundo (principalmente China e EUA)'],'importado_de_documento'),
  (c,'swot_ameacas','Ameaças (SWOT — documento de planejamento 2026-2030).', array[
    'Instabilidade política e econômica','Sanções socioeconômicas em produtos nacionais',
    'Falta de networking ou presença institucional',
    'Ameaças tecnológicas e mudança de metodologias','Localização Geográfica',
    'Interrupção das Atividades','Redução de investimento com Capital Próprio',
    'Cibersegurança'],'importado_de_documento');

  -- Objetivos (BSC do documento)
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-01','financeiro','Crescer em Faturamento',1,'importado_de_documento') returning id into f1;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-02','financeiro','Aumentar a participação de receita Internacional na Receita total',2,'importado_de_documento') returning id into f2;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-03','financeiro','Geração de Caixa Operacional Sustentável',3,'importado_de_documento') returning id into f3;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-04','financeiro','Aumentar a Rentabilidade do Negócios',4,'importado_de_documento') returning id into f4;

  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-05','cliente_mercado','Ampliar Base de Clientes Esterilidade/Endo',5,'importado_de_documento') returning id into c1;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-06','cliente_mercado','Melhorar a Percepção de Valor do Cliente',6,'importado_de_documento') returning id into c2;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-07','cliente_mercado','Expandir fisicamente para China (certificação)',7,'importado_de_documento') returning id into c3;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-08','cliente_mercado','Expandir fisicamente para América do Norte (Saúde)',8,'importado_de_documento') returning id into c4;

  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-09','processos_internos','Aumentar Eficiência Operacional (redução de custo e erros)',9,'importado_de_documento') returning id into p1;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-10','processos_internos','Aplicar IA nas atividades Operacionais Repetitivas',10,'importado_de_documento') returning id into p2;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-11','processos_internos','Ampliar Escopos',11,'importado_de_documento') returning id into p3;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-12','processos_internos','Inovação na área de Saúde e Microbiologia',12,'importado_de_documento') returning id into p4;

  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-13','aprendizado_crescimento','Melhorar a Capacitação e Engajamento das Pessoas',13,'importado_de_documento') returning id into a1;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-14','aprendizado_crescimento','Desenvolvimento de Lideranças e gestão de pessoas',14,'importado_de_documento') returning id into a2;
  insert into public.objetivo (ciclo_id, codigo, perspectiva, frase, ordem, procedencia)
  values (c,'OBJ-15','aprendizado_crescimento','Fortalecer a cultura e melhorar o clima organizacional da empresa',15,'importado_de_documento') returning id into a3;

  -- Indicadores (metas dos objetivos, páginas 11 e 12)
  create temp table _ind (
    codigo text, objetivo uuid, nome text, resp text, meta_texto text, meta numeric,
    linha_base numeric, unidade text, polaridade public.polaridade
  ) on commit drop;

  insert into _ind values
  ('IND-01',f1,'Vendas Ensaios (R$)','Felipe','R$ 18.685.740,23',18685740.23,15226452.59,'R$','maior'),
  ('IND-02',f1,'Faturamento Ensaios (R$)','Juliana','R$ 15.752.000,00',15752000,14819079.00,'R$','maior'),
  ('IND-03',f2,'Faturamento Ensaios Internacional (R$)','Juliana','> 20%',20,null,'%','maior'),
  ('IND-04',f3,'Receita com Entrega de Ensaios (R$)','Matheus','≥ Faturamento',null,13950163.33,'R$','maior'),
  ('IND-05',f4,'Custo com Folha (R$)','Juliana','< 25%',25,23.3,'%','menor'),
  ('IND-06',f4,'Lucro Líquido (%)','Juliana','> 23%',23,25.17,'%','maior'),
  ('IND-07',f3,'Inadimplência (%)','Juliana','< 1,4%',1.4,1.3,'%','menor'),
  ('IND-08',c2,'Pesquisa de Satisfação - NPS','Evellyn','> 75',75,74,'pontos','maior'),
  ('IND-09',c2,'SLA – Prazo de Entrega (%)','Matheus','> 99%',99,98.6,'%','maior'),
  ('IND-10',c2,'Ocorrências (Qde média)','Evellyn','25',25,47,'qtd/mês','menor'),
  ('IND-11',c1,'Clientes Ativos de Microbiologia','Felipe',null,null,5,'clientes','maior'),
  ('IND-12',p2,'Número de Processos Automatizados por IA','Matheus','> 5',5,0,'processos','maior'),
  ('IND-13',p1,'Ocorrências Procedentes (Qde média)','Evellyn','< 10/mês',10,9,'qtd/mês','menor'),
  ('IND-14',p1,'Não Conformidades (Qde média)','Evellyn','< 5/mês',5,5,'qtd/mês','menor'),
  ('IND-15',p1,'Eficiência Operacional (%) - Novo','Matheus',null,null,null,'%',null),
  ('IND-16',p1,'Custo por Amostra - Novo','Matheus',null,null,null,'R$',null),
  ('IND-17',a1,'Assiduidade','Juliana','> 98%',98,null,'%','maior'),
  ('IND-18',a3,'Turnover','Lais','< 2',2,null,'%','menor'),
  ('IND-19',a3,'Satisfação dos Colaboradores - ENPS','Lais','> 75',75,84,'pontos','maior'),
  ('IND-20',a1,'Receita Colaborador - Novo','Matheus','> 25.000,00',25000,null,'R$','maior'),
  ('IND-21',a1,'Horas de Treinamentos - Novo','Evellyn','> 500',500,700,'horas','maior');

  for ind in
    select null::uuid limit 0
  loop null; end loop;

  insert into public.indicador (
    objetivo_id, codigo, nome, unidade, polaridade, linha_base, linha_base_data,
    responsavel_nome, meta_texto, publicado, classificacao_numero, procedencia
  )
  select objetivo, codigo, nome, unidade, polaridade, linha_base,
         case when linha_base is not null then date '2025-12-31' end,
         resp, meta_texto, false, 'dado_medido', 'importado_de_documento'
  from _ind;

  insert into public.meta_indicador (indicador_id, periodo, valor, classificacao_numero)
  select i.id, '2026-12', t.meta, 'premissa_da_diretoria'
  from _ind t join public.indicador i on i.codigo = t.codigo and i.objetivo_id = t.objetivo
  where t.meta is not null;

  -- Projetos: plano de ação tático
  insert into public.iniciativa (ciclo_id, objetivo_id, codigo, titulo, fim, status, publicado, procedencia, classificacao_numero)
  values
  (c,null,'INI-01','Mapear e Padronizar processos chaves dos setores',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-02','Implantação ERP - Prosyst',date '2026-04-30','N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-03','Desenvolver rotinas automáticas para atividades operacionais (IA)',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-04','Ampliar Escopo de Materiais Saúde',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-05','Ampliar Escopo de Embalagens',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-06','Implementar CRM integrado ao ERP',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-07','MASTERCLASS Usabilidade de Dispositivos Médicos',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-08','Desenvolver Escopo ROHS Brasileira',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-09','Cyber Security e Qualidade de Software (Serviço)',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-10','Ensaios em Eletromédicos',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-11','Escopo Anatel',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-12','Ampliação de Escopo (Ventiladores Pulmonares, Centrais de Alarme de Incêndio e Máquinas de Solda) (AVALIAR)',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-13','Estruturar P&D SCITEC',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-14','Gestão de Estoque',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-15','Ampliar escopo de Microbiologia (Esterilidade e Endotoxinas)',null,'N',false,'importado_de_documento','estimativa'),
  -- Projetos: plano de ação estratégico
  (c,null,'INI-16','Venda de equipamentos de laboratório',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-17','Venda de serviço de manutenção de equipamentos de laboratório',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-18','Projeto e desenvolvimento de equipamentos',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-19','Serviço de projeto e desenvolvimento de laboratórios para fábrica',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-20','Gerenciamento de laboratório para fábricas',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-21','Representação de equipamentos de laboratório',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-22','Aquisição de microlaboratórios especializados',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-23','Segurança cibernética',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-24','Inteligência artificial',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-25','Unidade Estados Unidos',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-26','Unidade China',null,'N',false,'importado_de_documento','estimativa'),
  (c,null,'INI-27','Serviços de inspeção da qualidade pré-embarque para importadores',null,'N',false,'importado_de_documento','estimativa');
end $$;
