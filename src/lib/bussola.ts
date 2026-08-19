import type { Database } from "@/integrations/supabase/types";

export type Perspectiva = Database["public"]["Enums"]["perspectiva"];
export type Procedencia = Database["public"]["Enums"]["procedencia"];
export type ClassificacaoNumero = Database["public"]["Enums"]["classificacao_numero"];
export type Polaridade = Database["public"]["Enums"]["polaridade"];

export const PERSPECTIVAS: {
  valor: Perspectiva;
  nome: string;
  explicacao: string;
  sustentacao?: boolean;
}[] = [
  {
    valor: "financeiro",
    nome: "Financeiro",
    explicacao: "O resultado que as outras perspectivas produzem. Nunca é a causa, é o efeito.",
  },
  {
    valor: "cliente_mercado",
    nome: "Cliente & Mercado",
    explicacao: "O que o cliente precisa perceber para que o financeiro aconteça.",
  },
  {
    valor: "processos_internos",
    nome: "Processos Internos",
    explicacao: "O que a operação precisa entregar para o cliente perceber a mudança.",
  },
  {
    valor: "aprendizado_crescimento",
    nome: "Aprendizado & Crescimento",
    explicacao: "Pessoas, competências e sistemas que sustentam os processos.",
  },
  {
    valor: "sustentacao",
    nome: "Faixa de sustentação",
    explicacao:
      "Licença para operar: não é objetivo de crescimento, é pré-requisito. Se cair, nada acima existe.",
    sustentacao: true,
  },
];

export const PROCEDENCIA_LABEL: Record<Procedencia, string> = {
  decidido_pelo_time: "decidido pelo time",
  importado_de_documento: "importado de documento",
  sugerido_pelo_sistema: "sugerido pelo sistema",
  inferido: "inferido",
};

export const CLASSIFICACAO_LABEL: Record<ClassificacaoNumero, string> = {
  dado_medido: "dado medido",
  premissa_da_diretoria: "premissa da diretoria",
  estimativa: "estimativa",
};

export const STATUS_INICIATIVA_LABEL: Record<string, string> = {
  N: "Não iniciada",
  A: "Em andamento",
  C: "Concluída",
  T: "Travada",
};

export const STATUS_ACAO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** Etapa 1 — retrato factual. Campo sem dado vira lacuna, nunca percepção. */
export const BLOCOS_DIAGNOSTICO: { valor: string; nome: string; pergunta: string }[] = [
  {
    valor: "mercado_cliente",
    nome: "Mercado e cliente",
    pergunta:
      "Que fatos existem sobre tamanho de mercado, segmentos, ganho/perda e o que o cliente reclama? Cite fonte e data.",
  },
  {
    valor: "financeiro",
    nome: "Situação financeira",
    pergunta:
      "Receita, margem por linha, capital de giro e endividamento nos últimos períodos — números fechados, não projeção.",
  },
  {
    valor: "operacao",
    nome: "Operação e processos",
    pergunta:
      "Capacidade instalada, gargalos medidos, prazo e retrabalho. Onde o processo já falha hoje, com número?",
  },
  {
    valor: "pessoas",
    nome: "Pessoas e cultura",
    pergunta:
      "Quadro, competências faltantes, rotatividade e concentração de conhecimento em poucas pessoas.",
  },
  {
    valor: "tecnologia_dados",
    nome: "Tecnologia e dados",
    pergunta:
      "Sistemas em uso, integrações que faltam e quais números hoje ninguém consegue extrair com confiança.",
  },
  {
    valor: "concorrencia",
    nome: "Concorrência",
    pergunta:
      "Quem ganha de vocês, em que exatamente, e como isso apareceu em negociação perdida.",
  },
  {
    valor: "riscos",
    nome: "Riscos e conformidade",
    pergunta:
      "Licenças, dependências de fornecedor ou cliente único, passivos e riscos com probabilidade e impacto.",
  },
  {
    valor: "forcas_fraquezas",
    nome: "Forças e fraquezas verificáveis",
    pergunta:
      "Só entra força que se prova com fato. Adjetivo sem evidência é opinião — registre como lacuna.",
  },
];

export type TipoEscolha = Database["public"]["Enums"]["tipo_escolha"];

export const TIPOS_ESCOLHA: {
  valor: TipoEscolha;
  nome: string;
  explicacao: string;
  exemplo: string;
}[] = [
  {
    valor: "onde_jogar",
    nome: "Onde jogar",
    explicacao:
      "Segmentos, geografias e ofertas onde a empresa vai disputar. Escolha é recorte: se cabe tudo, não houve escolha.",
    exemplo: "Indústria alimentícia de médio porte no Sul, na linha de embalagem primária",
  },
  {
    valor: "como_ganhar",
    nome: "Como ganhar",
    explicacao:
      "A vantagem que faz o cliente escolher vocês naquele recorte, e que o concorrente não copia em um trimestre.",
    exemplo: "Entrega em 7 dias com engenharia de aplicação dentro do cliente",
  },
  {
    valor: "nao_faremos",
    nome: "Não faremos",
    explicacao:
      "Renúncia explícita. Plano sem renúncia é lista de desejos: tudo continua concorrendo pela mesma capacidade.",
    exemplo: "Não atenderemos licitação pública neste ciclo",
  },
];

export const QUADRANTES_MATRIZ: { valor: string; nome: string; explicacao: string }[] = [
  {
    valor: "investir",
    nome: "Atratividade alta · capacidade alta",
    explicacao: "Onde jogar para ganhar. Recebe iniciativa e investimento.",
  },
  {
    valor: "desenvolver",
    nome: "Atratividade alta · capacidade baixa",
    explicacao: "Precisa construir capacidade antes de prometer resultado.",
  },
  {
    valor: "selecionar",
    nome: "Atratividade baixa · capacidade alta",
    explicacao: "Colher com esforço mínimo, sem consumir capacidade nova.",
  },
  {
    valor: "sair",
    nome: "Atratividade baixa · capacidade baixa",
    explicacao: "Candidato natural à lista do que não faremos.",
  },
];

export const COACHING_EXTRA = {
  diagnostico_lacuna: {
    texto:
      "Lacuna é dado que não existe hoje. Registrar a lacuna é mais honesto que preencher o campo com percepção — e ela vira iniciativa de instrumentação, não achismo.",
    bom: "Não temos margem por linha de produto: o ERP não separa custo indireto",
    ruim: ["A margem deve estar por volta de 20%"],
  },
  escolha_nao_faremos: {
    texto:
      "Toda estratégia precisa de pelo menos uma renúncia explícita. Sem isso, nada é liberado de capacidade e todo objetivo disputa a mesma agenda.",
    bom: "Não entraremos em varejo próprio neste ciclo",
    ruim: ["Vamos priorizar tudo que der retorno"],
  },
  acao_entregavel: {
    texto:
      "Ação é o nível operacional da iniciativa: responsável pessoa, prazo e algo que alguém abre e confere. Se não dá para conferir, não dá para cobrar em reunião.",
    bom: "Publicar o procedimento revisado no portal até 20/03",
    ruim: ["Alinhar com o time"],
  },
  decisao_reuniao: {
    texto:
      "Reunião de revisão termina em decisão registrada com responsável e prazo. Decisão sem dono nomeado não sobrevive à semana seguinte.",
    bom: "Antecipar a compra do molde — Marina Rocha — até 12/04",
    ruim: ["Vamos estudar o assunto"],
  },
} satisfies Record<string, { texto: string; bom?: string; ruim?: string[] }>;

/** Coaching contextual: 2 a 3 frases, um exemplo bom e um ruim. */
export const COACHING: Record<string, { texto: string; bom?: string; ruim?: string[] }> = {
  ...COACHING_EXTRA,
  objetivo_frase: {
    texto:
      "Objetivo é frase de mudança com direção, não substantivo. Diga o que muda e por que isso deixa de ser um problema.",
    bom: "Reduzir o prazo de entrega a ponto de deixar de ser objeção comercial",
    ruim: ["Excelência operacional", "Lead time"],
  },
  objetivo_forum: {
    texto:
      "Todo objetivo precisa dizer qual fórum olha seus indicadores mês a mês. Objetivo sem fórum responsável só é olhado no fim do ano, quando já não dá para corrigir.",
    bom: "Comitê comercial mensal (1ª terça)",
    ruim: ["A diretoria acompanha"],
  },
  objetivo_dono: {
    texto:
      "Dono é uma pessoa, não uma área. Área não responde em reunião; pessoa responde.",
    bom: "Felipe Andrade",
    ruim: ["Operações"],
  },
  indicador_formula: {
    texto:
      "Fórmula explícita evita dois painéis com números diferentes para a mesma coisa. Escreva numerador e denominador.",
    bom: "(nº de entregas no prazo ÷ nº de entregas do mês) × 100",
    ruim: ["Pontualidade"],
  },
  indicador_fonte: {
    texto:
      "Fonte é o sistema e o relatório de onde o número sai, com quem extrai. Sem fonte, o número não é auditável.",
    bom: "ERP — relatório OTD-12, extraído pelo PCP",
    ruim: ["Planilha do time"],
  },
  indicador_linha_base: {
    texto:
      "Linha de base é medida, não estimada, e tem data. Se ninguém consegue produzir a linha de base, crie uma iniciativa para construí-la em vez de aceitar o indicador vazio.",
    bom: "72,4% em 31/12/2025",
    ruim: ["Cerca de 70%"],
  },
  indicador_polaridade: {
    texto:
      "Polaridade define a leitura do farol. Em 'menor é melhor' o cálculo é invertido automaticamente.",
    bom: "Menor é melhor, para prazo de entrega em dias",
  },
  indicador_tipo: {
    texto:
      "Indicador de resultado conta o passado; de direção antecipa. Painel só com resultado é retrovisor: você descobre o problema quando ele já aconteceu.",
    bom: "Direção: nº de propostas técnicas revisadas na semana",
    ruim: ["Só faturamento e margem"],
  },
  iniciativa_titulo: {
    texto:
      "Iniciativa é projeto com começo e fim, não rotina. Rotina não tem data de conclusão e por isso nunca fecha.",
    bom: "Implantar o módulo de ocorrências até junho",
    ruim: ["Melhorar atendimento"],
  },
  iniciativa_entregavel: {
    texto:
      "Entregável verificável é algo que alguém consegue abrir e conferir na data. Se não dá para conferir, não dá para cobrar.",
    bom: "Módulo em produção com 100% das ocorrências registradas no sistema",
    ruim: ["Time mais engajado"],
  },
  iniciativa_lider: {
    texto: "Líder é pessoa nomeada. Iniciativa de área é iniciativa de ninguém.",
    bom: "Marina Rocha",
    ruim: ["Qualidade"],
  },
  procedencia: {
    texto:
      "Procedência separa o que o time decidiu do que alguém propôs. Item sugerido ou inferido não entra em relatório de conselho sem confirmação humana.",
  },
  classificacao_numero: {
    texto:
      "Toda cifra declara o que é: dado medido (com fonte e data), premissa da diretoria ou estimativa. Estimativa aparece sempre com ≈.",
  },
};

const VERBOS_DIRECAO = [
  "reduzir", "aumentar", "ampliar", "elevar", "acelerar", "encurtar", "eliminar",
  "dobrar", "triplicar", "conquistar", "expandir", "diversificar", "melhorar",
  "baixar", "cortar", "recuperar", "transformar", "deixar", "tornar", "garantir",
  "manter", "sustentar", "implantar", "migrar", "reverter", "crescer",
];

export function avaliaFraseObjetivo(frase: string): string[] {
  const avisos: string[] = [];
  const limpo = frase.trim();
  if (!limpo) return avisos;
  const palavras = limpo.toLowerCase().split(/\s+/);
  if (palavras.length <= 3) {
    avisos.push(
      "Isso parece um substantivo ou tema, não um objetivo. Objetivo é frase de mudança com direção.",
    );
  }
  if (!VERBOS_DIRECAO.some((v) => palavras.some((p) => p.startsWith(v.slice(0, 5))))) {
    avisos.push(
      "Não encontrei verbo de direção (reduzir, ampliar, encurtar…). Sem direção, ninguém sabe para onde o número deve andar.",
    );
  }
  return avisos;
}

const PALAVRAS_ROTINA = [
  "melhorar", "acompanhar", "monitorar", "manter", "apoiar", "gerenciar",
  "cuidar", "atender", "otimizar",
];

export function avaliaTituloIniciativa(titulo: string): string[] {
  const avisos: string[] = [];
  const limpo = titulo.trim().toLowerCase();
  if (!limpo) return avisos;
  if (PALAVRAS_ROTINA.some((p) => limpo.startsWith(p))) {
    avisos.push(
      "Isso descreve rotina, não projeto. Iniciativa tem começo, fim e um entregável que alguém confere: “implantar o módulo de ocorrências até junho”.",
    );
  }
  return avisos;
}

export type Farol = "verde" | "atencao" | "critico" | "sem_apuracao";

export function calculaAtingimento(
  valor: number | null | undefined,
  meta: number | null | undefined,
  polaridade: Polaridade | null,
): number | null {
  if (valor === null || valor === undefined || meta === null || meta === undefined) return null;
  if (polaridade === "menor") {
    if (valor === 0) return meta === 0 ? 100 : 200;
    return (meta / valor) * 100;
  }
  if (meta === 0) return valor >= 0 ? 100 : 0;
  return (valor / meta) * 100;
}

export function farolDe(atingimento: number | null): Farol {
  if (atingimento === null) return "sem_apuracao";
  if (atingimento >= 100) return "verde";
  if (atingimento >= 90) return "atencao";
  return "critico";
}

export const FAROL_CLASSE: Record<Farol, string> = {
  verde: "bg-farol-verde/12 text-farol-verde border-farol-verde/35",
  atencao: "bg-farol-ambar/12 text-farol-ambar border-farol-ambar/35",
  critico: "bg-farol-vermelho/12 text-farol-vermelho border-farol-vermelho/35",
  sem_apuracao: "bg-farol-cinza/10 text-muted-foreground border-border",
};

export const FAROL_LABEL: Record<Farol, string> = {
  verde: "No plano",
  atencao: "Atenção",
  critico: "Crítico",
  sem_apuracao: "Sem apuração",
};

/** Períodos mensais (YYYY-MM) entre duas datas ISO. */
export function periodosMensais(inicio: string, fim: string): string[] {
  const out: string[] = [];
  const d = new Date(`${inicio.slice(0, 8)}01T12:00:00`);
  const limite = new Date(`${fim.slice(0, 8)}01T12:00:00`);
  let guarda = 0;
  while (d <= limite && guarda < 120) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() + 1);
    guarda += 1;
  }
  return out;
}

export function proximoCodigo(prefixo: string, existentes: string[]): string {
  const numeros = existentes
    .map((c) => Number(c.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const proximo = (numeros.length ? Math.max(...numeros) : 0) + 1;
  return `${prefixo}-${String(proximo).padStart(2, "0")}`;
}
