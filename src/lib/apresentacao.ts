/** Conteúdo da apresentação guiada: uma trilha por tela, com explicação de cada campo. */

export type PassoGuia = {
  /** valor de data-guia do elemento destacado. Sem alvo, o passo aparece centralizado. */
  alvo?: string;
  titulo: string;
  texto: string;
  /** Explicação campo a campo do que aparece naquele ponto da tela. */
  campos?: { nome: string; texto: string }[];
};

export type TelaGuia =
  | "ciclos"
  | "etapas"
  | "diagnostico"
  | "escolhas"
  | "mapa"
  | "objetivo"
  | "iniciativa"
  | "pessoas"
  | "painel"
  | "revisao"
  | "conselho";

export const GUIAS: Record<TelaGuia, { titulo: string; passos: PassoGuia[] }> = {
  ciclos: {
    titulo: "Organizações e ciclos",
    passos: [
      {
        titulo: "Onde tudo começa",
        texto:
          "Aqui você escolhe a organização e abre o ciclo de planejamento. Um ciclo é um período fechado com começo, fim e as cinco etapas do método.",
      },
      {
        alvo: "organizacoes",
        titulo: "Organização",
        texto:
          "Cada organização isola dados, pessoas e ciclos. Quem cria entra como facilitador e pode convidar o time.",
        campos: [
          { nome: "Nome da empresa", texto: "Nome que aparece em relatórios e na sala do conselho. Use o nome real, não a sigla interna." },
          { nome: "Seu papel", texto: "Facilitador conduz o método; executivo responde por objetivos e números; conselheiro só lê." },
        ],
      },
      {
        alvo: "ciclos",
        titulo: "Ciclo de planejamento",
        texto:
          "O ciclo carrega as cinco etapas: diagnóstico, escolhas, mapa, plano operacional e acompanhamento. Etapa só fecha quando as regras do método estão cumpridas.",
        campos: [
          { nome: "Nome do ciclo", texto: "Referência temporal reconhecível pelo time, como “Plano 2026” ou “Ciclo 2º semestre”." },
          { nome: "Início e fim", texto: "Definem os períodos mensais de apuração do painel de execução. Não dá para apurar fora da janela do ciclo." },
        ],
      },
    ],
  },
  etapas: {
    titulo: "Trilha das cinco etapas",
    passos: [
      {
        titulo: "A trilha do método",
        texto:
          "Esta tela é o painel de controle do ciclo. Cada etapa só fecha quando o conteúdo mínimo existe — é isso que impede um plano bonito e vazio.",
      },
      {
        alvo: "trilha",
        titulo: "Etapas e bloqueios",
        texto:
          "Ao tentar fechar uma etapa, o sistema lista o que falta em vez de deixar passar. O bloqueio é a parte do método, não um erro.",
        campos: [
          { nome: "Etapa 1 · Diagnóstico", texto: "Exige, para cada bloco, um retrato factual ou uma lacuna declarada." },
          { nome: "Etapa 2 · Escolhas", texto: "Exige onde jogar, como ganhar e pelo menos uma renúncia explícita." },
          { nome: "Etapa 3 · Mapa", texto: "Exige objetivo com dono pessoa e nenhuma iniciativa órfã (sem objetivo)." },
          { nome: "Etapa 4 · Plano operacional", texto: "Exige que toda iniciativa publicada tenha ação com responsável e prazo." },
          { nome: "Etapa 5 · Acompanhamento", texto: "Roda mês a mês: apuração, farol e reunião de revisão com decisões." },
        ],
      },
      {
        alvo: "saude",
        titulo: "Saúde do ciclo",
        texto:
          "Leitura rápida de consistência: o que está publicado, o que está pendente e onde o plano ainda não se sustenta.",
      },
    ],
  },
  diagnostico: {
    titulo: "Diagnóstico (Etapa 1)",
    passos: [
      {
        titulo: "Fato ou lacuna — nunca achismo",
        texto:
          "O diagnóstico não aceita percepção disfarçada de dado. Ou você registra o retrato factual com fonte, ou declara a lacuna e ela vira iniciativa de instrumentação.",
      },
      {
        alvo: "blocos",
        titulo: "Blocos do diagnóstico",
        texto:
          "Cada bloco cobre uma frente do negócio. Todos precisam de conteúdo antes de fechar a etapa 1.",
        campos: [
          { nome: "Retrato factual", texto: "O número ou fato como ele é hoje, com a origem: “OTD de 72,4% em dez/2025, relatório OTD-12 do ERP”." },
          { nome: "Fonte", texto: "Sistema, relatório e quem extrai. Sem fonte, o número não é auditável em reunião." },
          { nome: "Lacuna declarada", texto: "Use quando o dado não existe. É mais honesto que preencher com estimativa — e gera iniciativa para construir a medição." },
          { nome: "Classificação do número", texto: "Dado medido, premissa da diretoria ou estimativa. Estimativa sempre aparece com ≈." },
          { nome: "Procedência", texto: "Registra se o item foi decidido pelo time, importado de documento, sugerido pelo sistema ou inferido." },
        ],
      },
    ],
  },
  escolhas: {
    titulo: "Escolhas estratégicas (Etapa 2)",
    passos: [
      {
        titulo: "Estratégia é escolha, e escolha exclui",
        texto:
          "Aqui o time declara onde vai jogar, como pretende ganhar e — obrigatoriamente — o que não fará. Sem renúncia, nenhuma capacidade é liberada.",
      },
      {
        alvo: "matriz",
        titulo: "Matriz atratividade × capacidade",
        texto:
          "Posicione as frentes candidatas. O quadrante de baixa atratividade e baixa capacidade é candidato natural à lista do que não faremos.",
        campos: [
          { nome: "Atratividade", texto: "O quanto essa frente vale para o negócio no horizonte do ciclo." },
          { nome: "Capacidade", texto: "O quanto o time realmente consegue executar hoje, com pessoas e recursos existentes." },
        ],
      },
      {
        alvo: "escolhas",
        titulo: "Os três blocos obrigatórios",
        texto:
          "Cada bloco é uma frase de decisão, não um tema. A etapa 2 só fecha com os três preenchidos.",
        campos: [
          { nome: "Onde jogar", texto: "Mercado, cliente ou frente escolhida: “Indústria de alimentos no Sudeste, contas acima de R$ 5 mi”." },
          { nome: "Como ganhar", texto: "A vantagem que faz o cliente escolher você e não o concorrente." },
          { nome: "Não faremos", texto: "Renúncia explícita: “Não entraremos em varejo próprio neste ciclo”. É o campo que dá foco ao plano." },
        ],
      },
    ],
  },
  mapa: {
    titulo: "Mapa estratégico (Etapa 3)",
    passos: [
      {
        titulo: "A cadeia de causa e efeito",
        texto:
          "O mapa lê de baixo para cima: pessoas sustentam processos, processos entregam ao cliente, cliente produz o financeiro. Financeiro é efeito, nunca causa.",
      },
      {
        alvo: "perspectivas",
        titulo: "Perspectivas",
        texto:
          "Cada faixa é uma perspectiva. A faixa de sustentação é licença para operar: pré-requisito, não crescimento.",
        campos: [
          { nome: "Objetivo", texto: "Frase de mudança com verbo de direção: “Reduzir o prazo de entrega a ponto de deixar de ser objeção comercial”." },
          { nome: "Dono", texto: "Uma pessoa nomeada. Área não responde em reunião; pessoa responde." },
          { nome: "Fórum", texto: "Onde os indicadores desse objetivo são olhados mês a mês." },
          { nome: "Indicadores", texto: "Mistura de resultado (conta o passado) e direção (antecipa). Só resultado é retrovisor." },
        ],
      },
      {
        alvo: "orfas",
        titulo: "Iniciativas órfãs",
        texto:
          "Iniciativa sem objetivo é esforço sem estratégia. A etapa 3 não fecha enquanto existir uma órfã: ou vincula, ou descarta.",
      },
    ],
  },
  objetivo: {
    titulo: "Detalhe do objetivo",
    passos: [
      {
        titulo: "Do objetivo ao número",
        texto:
          "Nesta tela o objetivo ganha indicadores auditáveis, metas por período e iniciativas que o sustentam.",
      },
      {
        alvo: "indicadores",
        titulo: "Indicadores",
        texto:
          "Indicador só é publicado quando é auditável — essa é a Regra 1. Enquanto faltar algo, ele fica em rascunho.",
        campos: [
          { nome: "Nome", texto: "O que se mede, sem ambiguidade." },
          { nome: "Fórmula", texto: "Numerador e denominador explícitos, para evitar dois painéis com números diferentes." },
          { nome: "Fonte", texto: "Sistema, relatório e responsável pela extração." },
          { nome: "Frequência", texto: "Ritmo de apuração. Define o que é cobrado em cada reunião." },
          { nome: "Polaridade", texto: "Maior é melhor ou menor é melhor — inverte o cálculo do farol automaticamente." },
          { nome: "Linha de base", texto: "Valor medido com data. Sem linha de base, meta é chute." },
          { nome: "Publicado", texto: "Só liga quando fórmula, fonte, frequência, polaridade e linha de base existem." },
        ],
      },
      {
        alvo: "metas",
        titulo: "Metas por período",
        texto:
          "A meta é definida período a período. Alterar meta já registrada exige justificativa e fica guardada no histórico de revisões — meta não muda no silêncio.",
        campos: [
          { nome: "Período", texto: "Mês de referência dentro da janela do ciclo." },
          { nome: "Valor da meta", texto: "O número acordado para o período, na mesma unidade do indicador." },
          { nome: "Justificativa da revisão", texto: "Obrigatória ao mudar uma meta existente. É o que permite auditar o plano depois." },
        ],
      },
      {
        alvo: "iniciativas",
        titulo: "Iniciativas do objetivo",
        texto:
          "Iniciativa é projeto com começo e fim. Publicar exige líder, prazo e entregável verificável — Regra 2.",
      },
    ],
  },
  iniciativa: {
    titulo: "Plano operacional da iniciativa (Etapa 4)",
    passos: [
      {
        titulo: "Onde a estratégia vira agenda",
        texto:
          "Iniciativa sem ação com dono e prazo não é plano, é intenção. Esta tela quebra a iniciativa no nível que se cobra em reunião.",
      },
      {
        alvo: "iniciativa",
        titulo: "Cabeçalho da iniciativa",
        texto: "Os campos que tornam a iniciativa cobrável.",
        campos: [
          { nome: "Título", texto: "Projeto, não rotina: “Implantar o módulo de ocorrências até junho”." },
          { nome: "Líder", texto: "Pessoa nomeada. Iniciativa de área é iniciativa de ninguém." },
          { nome: "Prazo", texto: "Data de conclusão. Sem data, nunca fecha." },
          { nome: "Entregável verificável", texto: "Algo que alguém abre e confere na data." },
          { nome: "Status", texto: "Não iniciada, em andamento, concluída ou travada. Travada pede decisão na reunião de revisão." },
        ],
      },
      {
        alvo: "acoes",
        titulo: "Ações",
        texto:
          "Cada ação tem responsável pessoa e prazo. A etapa 4 não fecha se alguma iniciativa publicada estiver sem ações completas.",
        campos: [
          { nome: "Descrição", texto: "Verbo + entrega conferível: “Publicar o procedimento revisado no portal”." },
          { nome: "Responsável", texto: "Uma pessoa, sempre." },
          { nome: "Prazo", texto: "Data limite. Aparece na carga por pessoa e nas pendências do mês." },
          { nome: "Status", texto: "Andamento da ação, usado para detectar travamento cedo." },
        ],
      },
    ],
  },
  pessoas: {
    titulo: "Carga por pessoa",
    passos: [
      {
        titulo: "O plano cabe nas pessoas?",
        texto:
          "Esta tela soma objetivos, iniciativas e ações por pessoa. É o teste de realidade do plano: ninguém entrega seis frentes ao mesmo tempo.",
      },
      {
        alvo: "carga",
        titulo: "Leitura da carga",
        texto: "Cada linha é uma pessoa e o que está no colo dela neste ciclo.",
        campos: [
          { nome: "Objetivos", texto: "Objetivos em que a pessoa é dona e responde pelo número." },
          { nome: "Iniciativas ativas", texto: "Projetos que ela lidera. Acima de três, o sistema sinaliza gargalo." },
          { nome: "Ações", texto: "Tarefas operacionais sob responsabilidade dela, com prazos do período." },
          { nome: "Alerta de gargalo", texto: "Sinal de que é preciso redistribuir, adiar ou renunciar — não empilhar." },
        ],
      },
    ],
  },
  painel: {
    titulo: "Painel de execução (Etapa 5)",
    passos: [
      {
        titulo: "Apuração mês a mês",
        texto:
          "Aqui o número real encontra a meta e o farol acende. Período fechado é imutável: mudar exige reapresentação registrada — Regra 5.",
      },
      {
        alvo: "periodo",
        titulo: "Período",
        texto: "Escolha o mês de apuração dentro da janela do ciclo. Cada mês tem seu próprio fechamento.",
      },
      {
        alvo: "apuracao",
        titulo: "Linha de apuração",
        texto: "Um indicador por linha, com o que foi medido e como se compara à meta.",
        campos: [
          { nome: "Meta do período", texto: "Vem das metas definidas no objetivo. Se estiver vazia, o farol não acende." },
          { nome: "Apurado", texto: "O valor real do mês, na unidade do indicador." },
          { nome: "Classificação", texto: "Dado medido, premissa da diretoria ou estimativa — a cifra sempre declara o que é." },
          { nome: "Farol", texto: "≥100% no plano, ≥90% atenção, abaixo disso crítico, respeitando a polaridade." },
          { nome: "Observação", texto: "Causa e contexto do desvio, para a reunião não gastar tempo reconstruindo a história." },
        ],
      },
      {
        alvo: "fechamento",
        titulo: "Fechar período",
        texto:
          "Fechar congela os números do mês. Qualquer alteração posterior abre uma reapresentação com motivo, autor e data, preservando o valor original.",
        campos: [
          { nome: "Fechar período", texto: "Trava a apuração do mês e libera a leitura oficial para o conselho." },
          { nome: "Motivo da reapresentação", texto: "Obrigatório ao corrigir um mês fechado. Fica no histórico, ao lado do valor anterior." },
        ],
      },
    ],
  },
  revisao: {
    titulo: "Reunião de revisão",
    passos: [
      {
        titulo: "Reunião que termina em decisão",
        texto:
          "A pauta é gerada pelos desvios do mês, não pela ordem de quem fala mais. E a ata só trava quando existe decisão registrada.",
      },
      {
        alvo: "pauta",
        titulo: "Pauta automática",
        texto:
          "Indicadores em atenção e crítico entram primeiro, com o desvio e a observação da apuração ao lado.",
      },
      {
        alvo: "decisoes",
        titulo: "Decisões",
        texto: "Decisão sem dono nomeado não sobrevive à semana seguinte.",
        campos: [
          { nome: "Decisão", texto: "O que foi decidido, em uma frase executável: “Antecipar a compra do molde”." },
          { nome: "Responsável", texto: "Pessoa que responde pela decisão na próxima reunião." },
          { nome: "Prazo", texto: "Data de verificação da decisão." },
          { nome: "Vínculo", texto: "Liga a decisão ao indicador, à iniciativa ou à ação afetada." },
        ],
      },
      {
        alvo: "ata",
        titulo: "Fechar a ata",
        texto:
          "Fechar a ata consolida pauta, desvios e decisões do mês. Sem decisão registrada, o fechamento fica bloqueado.",
      },
    ],
  },
  conselho: {
    titulo: "Sala do conselho",
    passos: [
      {
        titulo: "Leitura oficial, somente leitura",
        texto:
          "Visão para conselho e sócios: escolhas confirmadas, desempenho por perspectiva e números com procedência declarada. Nada é editado aqui.",
      },
      {
        alvo: "resumo",
        titulo: "Desempenho por perspectiva",
        texto: "Farol consolidado do período fechado, com destaque do que exige decisão.",
        campos: [
          { nome: "Perspectiva", texto: "Agrupa objetivos pela cadeia de causa e efeito do mapa." },
          { nome: "Procedência", texto: "Item sugerido ou inferido não entra em relatório sem confirmação humana." },
          { nome: "Classificação da cifra", texto: "Deixa explícito o que é dado medido, premissa ou estimativa (≈)." },
        ],
      },
      {
        alvo: "exportar",
        titulo: "Exportar",
        texto:
          "CSV abre no Excel em pt-BR; PDF sai pela impressão do navegador, mantendo o desenho da tela.",
      },
    ],
  },
};
