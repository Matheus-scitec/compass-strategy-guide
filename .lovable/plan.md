# Bússola — Versão 2

Completar o método de ponta a ponta: as duas primeiras etapas (diagnóstico e escolhas), o nível operacional (ações), o ritual de revisão com comentários, e a sala do conselho com exports. Entrego em quatro blocos, nesta ordem, para que cada um já fique usável.

## Bloco 1 — Diagnóstico e escolhas estratégicas

- Nova tela `Diagnóstico` no ciclo: blocos de análise (contexto, cliente, concorrência, capacidades, riscos), cada um com texto e lista de lacunas nomeadas. Cada lacuna vira um item que pode ser convertido em iniciativa ou ação.
- Nova tela `Escolhas`: três colunas — onde jogar, como ganhar, o que não faremos. "Não faremos" é obrigatório para fechar a etapa 2: escolha sem renúncia explícita não é escolha.
- Matriz de posicionamento com quadrantes para as escolhas de "onde jogar", arrastar não é necessário — seleção de quadrante no formulário.
- Bloqueios de fechamento: etapa 1 exige pelo menos um bloco preenchido por área e lacunas registradas; etapa 2 exige ao menos uma escolha de cada tipo, incluindo renúncia.
- Cada texto e cifra mostra o selo de procedência já existente.

## Bloco 2 — Nível operacional: ações

- Aba `Ações` dentro da ficha da iniciativa: título, responsável (pessoa da organização), prazo, status, procedência.
- Cálculo de progresso da iniciativa a partir das ações concluídas, exibido no mapa e no painel.
- Visão `Por pessoa`: carga de iniciativas e ações ativas por responsável, com alerta de gargalo (mais de 3 frentes ativas) e de prazos vencidos.
- Bloqueio da etapa 4: iniciativa publicada sem nenhuma ação com responsável e prazo aparece na lista de pendências.

## Bloco 3 — Reunião de revisão e comentários

- Tela `Revisão` com roteiro fixo por período: farol dos indicadores, desvios acima do limite, iniciativas atrasadas, decisões pendentes.
- Comentários em qualquer objetivo, indicador, iniciativa ou ação, com menção a membros e marcação de resolvido.
- Registro de decisões da reunião (o que foi decidido, quem responde, até quando), gerando ações automaticamente quando o usuário pedir.
- Cada desvio exige um comentário de causa antes de a reunião ser marcada como concluída.

## Bloco 4 — Sala do conselho e exports

- Rota somente leitura para o papel conselheiro: mapa, farol do período, top desvios, decisões e riscos principais, sem nenhum botão de edição.
- Export do plano completo (objetivos, indicadores, iniciativas, ações) e do painel do período em CSV, e uma versão de apresentação em PDF de uma página por perspectiva.
- Todo número exportado carrega a classificação (dado medido, premissa, estimativa) para que ninguém trate estimativa como fato.

## Detalhes técnicos

- Tabelas `diagnostico`, `escolha`, `acao` e `comentario` já existem com RLS por organização; uso-as como estão. Preciso de duas novas tabelas para o bloco 3: `reuniao_revisao` (ciclo, período, status, roteiro concluído) e `decisao` (reunião, texto, responsável, prazo, ação gerada), com grants e políticas no mesmo padrão das demais.
- Bloco 4 sem novas tabelas: a sala do conselho é leitura filtrada pelas políticas existentes; exports são gerados no cliente a partir das mesmas consultas, com PDF via biblioteca compatível com o runtime do navegador.
- Novas rotas sob o layout protegido: `/ciclo/$cicloId/diagnostico`, `/ciclo/$cicloId/escolhas`, `/ciclo/$cicloId/iniciativa/$iniciativaId`, `/ciclo/$cicloId/pessoas`, `/ciclo/$cicloId/revisao`, `/ciclo/$cicloId/conselho`.
- Regras de fechamento de etapa continuam calculadas em `src/lib/bloqueios.ts`, estendido com as pendências das etapas 1, 2 e 4.
- Mantenho o padrão atual de consultas em `src/lib/queries.ts` e os diálogos em `src/components/bussola/formularios.tsx`.
