# Bússola — Versão 1

Copiloto de planejamento estratégico em português do Brasil, com backend Lovable Cloud (banco, autenticação, isolamento por organização).

## Escopo desta primeira entrega

1. **Autenticação e organizações** — cadastro/login por e-mail e senha, criação de organização, papéis (facilitador, executivo, conselheiro) em tabela separada de permissões, e isolamento total dos dados por organização.
2. **Ciclos** — criação de ciclo (nome, horizonte, tipo estratégico/tático) e a trilha das cinco etapas na home do ciclo, cada uma com estado (não iniciada / em andamento / fechada) e a lista de bloqueios que impedem o fechamento.
3. **Mapa estratégico** — quatro perspectivas encadeadas (Aprendizado & Crescimento → Processos Internos → Cliente & Mercado → Financeiro) mais a faixa de sustentação, com CRUD de objetivos, indicadores e iniciativas. Ficha do objetivo com por que importa, dono, fórum de acompanhamento, risco principal, indicadores e iniciativas.
4. **Painel de execução** — apuração mensal como única entrada manual, farol por período (verde ≥100%, atenção 90–100%, crítico <90%, cinza sem apuração), inversão automática quando a polaridade é "menor é melhor", e selo de reapresentação.

## Regras que já funcionam nesta versão

- **Regra 1** — indicador só sai de rascunho com fórmula, fonte, frequência, polaridade e linha de base medida. Sem linha de base, o app oferece criar uma iniciativa para construí-la. Indicador em rascunho não aparece no painel.
- **Regra 2** — iniciativa só é publicável com líder pessoa nomeada, prazo e entregável verificável.
- **Regra 3** — fechar o ciclo tático exige zero objetivos sem dono e zero iniciativas órfãs; a contagem aparece como bloqueio com lista clicável.
- **Regra 5** — período apurado e fechado é imutável; alterar exige registro de reapresentação com motivo e autor, e o painel passa a exibir o selo.

Cada bloqueio traz uma explicação curta do porquê, não só o aviso.

## Estrutura preparada (sem construir agora)

Tabelas e rotas ficam criadas para diagnóstico, escolhas, ações, revisão de meta, comentários, reunião de revisão, sala do conselho e exports — as telas correspondentes entram em iterações seguintes. Os campos `procedencia` e `classificacao_numero` já existem em todas as entidades e cifras, renderizados como selo discreto ao lado do valor.

## Design

Ferramenta de trabalho, sóbria e densa: paleta neutra com um único acento forte, títulos em peso alto, números em fonte tabular, formatação pt-BR (ponto de milhar, vírgula decimal). Cores de status usadas exclusivamente no farol. Leitura confortável no celular, edição no desktop.

## Detalhes técnicos

- Lovable Cloud (Postgres + Auth) com RLS por organização em todas as tabelas; papéis em `membro_organizacao` (nunca no perfil), checados por função security definer.
- Tabelas desta fase: `organizacao`, `membro_organizacao`, `ciclo`, `etapa_ciclo`, `objetivo`, `indicador`, `apuracao`, `iniciativa`, `reapresentacao`, `revisao_meta`, `comentario`, mais as demais do modelo criadas vazias para as próximas iterações. Grants explícitos para `authenticated`/`service_role` em cada tabela.
- Validações de publicação implementadas no banco (constraints/triggers de estado rascunho vs publicado) e espelhadas no formulário, para que a regra não dependa só da tela.
- Imutabilidade de apuração fechada via trigger que exige registro em `reapresentacao`.
- Rotas: `/auth`, `/` (seleção de organização e ciclos), `/ciclo/$id` (trilha das etapas), `/ciclo/$id/mapa`, `/ciclo/$id/objetivo/$objetivoId`, `/ciclo/$id/painel`. Rotas autenticadas sob o layout protegido.
- Leituras e escritas por server functions autenticadas; nenhuma lógica sensível no cliente.
