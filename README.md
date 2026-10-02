# Bússola Estratégica

# Prompt inicial — Lovable

> Cole tudo abaixo desta linha como primeira mensagem no Lovable.

---

Construa um aplicativo web chamado **Bússola** — um copiloto de planejamento estratégico que guia um time executivo do diagnóstico até o acompanhamento da execução, com desdobramento em três níveis: estratégico, tático e operacional.

## O problema que ele resolve

Planejamento estratégico em empresas de médio porte falha por motivos previsíveis e repetidos: metas diferentes circulando ao mesmo tempo em arquivos diferentes; indicadores sem fórmula, sem fonte e sem linha de base; iniciativas sem dono; meses fechados que mudam depois sem explicação; metas revisadas para baixo silenciosamente; e material de conselho que informa mas não pede decisão nenhuma.

O Bússola não é um repositório de documentos. É um **sistema que se recusa a deixar o plano ficar frouxo** — ele bloqueia, avisa e ensina no momento em que a decisão está sendo tomada.

## Usuários e papéis

- **Facilitador** — conduz o ciclo, abre e fecha etapas, convida pessoas. Um por ciclo.
- **Executivo** — dono de objetivos e iniciativas, preenche apuração, comenta.
- **Conselheiro** — só leitura da visão estratégica e do painel de deliberação; não vê detalhe operacional nem dado sensível de pessoas.

Multi-organização desde o início (uma conta pode ter várias empresas), com RLS no Supabase isolando os dados por organização.

## O método, em cinco etapas

O app conduz o time por etapas em sequência, cada uma com um estado (`não iniciada` / `em andamento` / `fechada`). É possível voltar, mas fechar uma etapa exige que os bloqueios dela estejam resolvidos.

**1. Diagnóstico.** Retrato factual antes de opinião: desempenho do período anterior, concentração de carteira, capacidade, conformidade, pessoas. Campos sem dado ficam registrados como **lacuna do diagnóstico**, nunca preenchidos por percepção. Ferramentas opcionais: SWOT cruzada (o app só aceita SWOT se os quatro cruzamentos forem preenchidos — Força×Oportunidade, Fraqueza×Ameaça, Força×Ameaça, Fraqueza×Oportunidade), PESTEL com destaque para o eixo regulatório, 5 Forças e TAM/SAM/SOM com método declarado.

**2. Escolhas estratégicas.** Duas perguntas: *onde jogar* e *como ganhar*. Uma tela obrigatória de **"o que não faremos neste ciclo"** — mínimo de dois itens. Plano sem trade-off declarado não fecha a etapa. Cada movimento é classificado numa matriz de expansão (penetração / extensão de oferta / novo mercado / diversificação), e o app avisa que diversificação exige tese própria, não herda a validação do negócio atual.

**3. Desdobramento (estratégico → tático).** Mapa em quatro perspectivas encadeadas de baixo para cima: Aprendizado & Crescimento sustenta Processos Internos, que entregam Cliente & Mercado, que geram Financeiro. Abaixo das quatro, uma **faixa de sustentação** configurável para o que é licença para operar do negócio (em laboratório acreditado, por exemplo, manter escopo e conformidade normativa) — a faixa não é objetivo de crescimento, é pré-requisito, e o app deixa isso visível no desenho.

**4. Plano operacional.** Cada iniciativa se abre em ações trimestrais e mensais com responsável e entregável verificável.

**5. Execução e revisão.** Apuração mensal dos indicadores, farol trimestral e reuniões de revisão registradas em ata.

## Modelo de dados

```
organizacao
ciclo            org, nome, horizonte_inicio, horizonte_fim, tipo(estrategico|tatico), etapa_atual, status
diagnostico      ciclo, bloco, conteudo, lacunas[]
escolha          ciclo, tipo(onde_jogar|como_ganhar|nao_faremos), texto, quadrante_matriz
objetivo         ciclo, codigo, perspectiva, frase, por_que_importa, dono_id, forum_acompanhamento, risco_principal
indicador        objetivo, codigo, nome, formula, fonte, frequencia, polaridade(maior|menor),
                 unidade, linha_base, linha_base_data, meta_periodo[], responsavel_apuracao
apuracao         indicador, periodo, valor, fechado(bool), observacao
iniciativa       objetivo, codigo, titulo, lider_id, entregavel_verificavel, inicio, fim,
                 investimento, status(N|A|C|T), reversibilidade
acao             iniciativa, titulo, responsavel_id, prazo, status
revisao_meta     indicador, periodo, valor_anterior, valor_novo, motivo, autor, data
reapresentacao   apuracao, valor_anterior, valor_novo, motivo, autor, data
comentario       entidade_tipo, entidade_id, autor, texto, mencoes[], resolvido
```

**Campo `procedencia` em toda entidade** — enum: `decidido_pelo_time`, `importado_de_documento`, `sugerido_pelo_sistema`, `inferido`. Renderizar como selo discreto ao lado do valor. Nenhum item com procedência `sugerido` ou `inferido` entra em relatório de conselho sem confirmação explícita de um humano. Este campo é central, não decorativo: a confusão entre o que o time decidiu e o que alguém propôs é uma das principais causas de plano que ninguém reconhece como seu.

**Campo `classificacao_numero` em toda cifra** — enum: `dado_medido` (com fonte e data de extração), `premissa_da_diretoria`, `estimativa` (renderizada sempre com "≈" e método declarado). Aparece no app e em todos os exports.

## Regras que o sistema impõe

Estas são o coração do produto. Cada bloqueio vem com uma explicação curta do *porquê*, não só um aviso.

1. **Indicador não é publicável sem fórmula, fonte, frequência, polaridade e linha de base medida.** Se ninguém consegue produzir a linha de base, o app oferece criar uma iniciativa para construí-la em vez de aceitar o indicador vazio. Indicador incompleto fica em "rascunho" e não aparece no painel.
2. **Iniciativa não é publicável sem líder nomeado (pessoa, não área), prazo e entregável verificável.**
3. **Fechar o ciclo tático exige zero objetivos sem dono e zero iniciativas órfãs.** O app mostra a contagem de pendências como bloqueio explícito, com a lista clicável.
4. **Teste de capacidade.** Ao fechar o ciclo, mostrar iniciativas por líder. Quem tiver mais de três ativas em paralelo aparece sinalizado como gargalo declarado — não bloqueia, mas exige um aceite consciente com justificativa.
5. **Período apurado e fechado vira imutável.** Alterar exige registro em `reapresentacao` com motivo e autor, e o painel passa a exibir um selo "reapresentado" naquele período. Um número que muda sem rastro destrói a autoridade do painel inteiro.
6. **Revisar meta exige motivo.** Registro em `revisao_meta`, e o histórico fica visível no card do indicador. Meta silenciosamente reduzida transforma todo "verde" futuro em ruído.
7. **Aritmética do saldo sempre à vista.** Quando um período fecha abaixo da meta, o app recalcula o que os períodos restantes precisam entregar e mostra a soma das metas periódicas contra a meta anual. Se a soma passar a superar o total, exibir isso de forma explícita: "o ônus do déficit foi transferido para os períodos seguintes".
8. **Máximo de 16 objetivos e 25 indicadores por ciclo.** Ao ultrapassar, o app não bloqueia mas explica a diferença entre painel completo e núcleo de leitura, e sugere quais indicadores são de rotina operacional e não estratégicos.
9. **Objetivo aceita no máximo 3 indicadores.** Acima disso, sugerir que provavelmente são dois objetivos.
10. **Todo objetivo indica qual fórum acompanha seus indicadores no mês a mês.** Objetivo sem fórum responsável só é olhado no fim do ano, quando já não dá para corrigir.
11. **Equilíbrio entre indicadores de resultado e de direção.** Se mais de 70% forem de resultado, avisar que o painel virou retrovisor e sugerir indicadores antecedentes.
12. **Detecção de duplicidade.** Ao criar indicador com nome ou fórmula parecida com um existente, alertar — números divergentes para a mesma coisa em painéis diferentes é um problema clássico.

## Camada didática

O app ensina enquanto o time trabalha, sem virar wiki:

- **Coaching contextual** em cada campo: um ícone abre uma explicação de 2 a 3 frases com um exemplo bom e um ruim. Para objetivo: ✅ "Reduzir o prazo de entrega a ponto de deixar de ser objeção comercial" · ❌ "Excelência operacional" · ❌ "Lead time" (substantivo não é objetivo; objetivo é frase de mudança com direção).
- **Validação em tempo real da qualidade da redação**: alertar quando um objetivo é só um substantivo, quando não tem verbo de direção, ou quando uma iniciativa descreve rotina em vez de projeto com começo e fim ("melhorar atendimento" é rotina; "implantar o módulo de ocorrências até junho" é iniciativa).
- **Teste do desdobramento** ao fechar a etapa 4: "uma pessoa da equipe consegue dizer o que faz na segunda-feira que muda um número deste painel?" Se o facilitador responder não, o app sugere descer mais um nível.

## Colaboração

Comentários por entidade com @menções e estado resolvido/aberto. Atribuição de preenchimento com prazo ("Felipe, defina a linha de base do IND-04 até sexta"). Um modo **sessão de facilitação** com tela limpa para projetar em reunião, permitindo edição ao vivo. Histórico de alterações por campo. Notificação por e-mail de pendências atribuídas.

## Telas

1. **Home do ciclo** — trilha das cinco etapas com progresso e a lista de bloqueios que impedem o fechamento de cada uma.
2. **Diagnóstico** — blocos factuais + ferramentas opcionais, com lacunas destacadas.
3. **Escolhas** — onde jogar / como ganhar / o que não faremos, com a matriz de expansão.
4. **Mapa estratégico** — as quatro perspectivas encadeadas mais a faixa de sustentação; arrastar objetivos entre perspectivas; clicar abre a ficha completa.
5. **Ficha do objetivo** — por que importa, dono, indicadores, metas por período, iniciativas vinculadas, risco principal, fórum de acompanhamento, comentários.
6. **Painel de execução** — farol por período com verde ≥100%, atenção 90–100%, crítico <90%; polaridade "menor é melhor" invertida automaticamente; célula de apuração como única entrada manual; selo de reapresentação quando houver.
7. **Plano operacional** — visão por responsável e por trimestre, com carga de cada pessoa visível.
8. **Reunião de revisão** — roteiro guiado por tempo: farol (10min, sem discussão) → só os vermelhos (30min, classificando cada um como *meta errada*, *iniciativa não saiu* ou *hipótese errada*, porque são três diagnósticos com três respostas diferentes) → premissas contrariadas (15min) → decisões (20min, cada uma com responsável e data) → capacidade (10min, o que entra só se algo sair). Gera ata ao final separando decisão, encaminhamento e ponto em aberto.
9. **Sala do conselho** — visão de leitura com quatro blocos: onde estamos (4 a 6 números contra plano e contra ano anterior), o que mudou no contexto, riscos materiais, e **pontos de deliberação** — 2 a 4 perguntas concretas, cada uma com opções e a recomendação da diretoria. O app não permite publicar para o conselho sem ao menos um ponto de deliberação: sem ele a reunião vira relatório e o conselho vira plateia.

## Entregáveis exportáveis

- **Plano estratégico** (documento) com sumário executivo, diagnóstico, escolhas incluindo o "não faremos", mapa, fichas de objetivo, iniciativas, riscos, premissas críticas, governança do plano e anexo com a classificação de todas as cifras.
- **Painel de acompanhamento** (planilha) com abas de objetivos, indicadores, iniciativas e farol por período.
- **One-pager de status** para a diretoria.
- **Material de conselho** com os quatro blocos.
- **Plano operacional por responsável.**

Todos os exports carregam rodapé com nível de confidencialidade, que ajusta o conteúdo conforme o destinatário: conselho vê tudo; diretoria não vê detalhe de folha individual nem avaliação nominal de pessoas; equipe vê objetivos, metas e o porquê, sem margem por unidade nem tese de aquisição.

## Design

Sóbrio e denso, ferramenta de trabalho e não landing page. Tipografia com títulos em peso alto e números em fonte tabular. Paleta neutra com um acento forte único; cores de status reservadas para farol e nada mais — verde, âmbar, vermelho e cinza para "sem apuração". Nunca usar cor de status como decoração. Formatação numérica pt-BR (ponto de milhar, vírgula decimal). Responsivo com leitura confortável no celular, já que executivo consulta painel no telefone e edita no desktop.

## Tecnologia

React, Tailwind, Supabase com autenticação e RLS por organização. Português do Brasil em toda a interface.

## Construa agora, nesta ordem

Nesta primeira versão, entregue: autenticação e organizações; criação de ciclo com as cinco etapas; **mapa estratégico com CRUD de objetivos, indicadores e iniciativas, já com as regras 1, 2, 3 e 5 funcionando**; e o painel de execução com farol e apuração. As demais telas e os exports virão em iterações seguintes — deixe a estrutura preparada, mas não tente construir tudo de uma vez.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e99a55e-7829-49a3-bab9-bc87616dad93).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
