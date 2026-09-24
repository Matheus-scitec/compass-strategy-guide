# Corrigir o login do Bússola

## Objetivo
Fazer o acesso funcionar de forma previsível tanto com Google quanto com e-mail e senha, sem tratar uma conta Google como se ela já tivesse uma senha cadastrada.

## Implementação
- Ativar e validar os dois métodos já exibidos na tela: Google e e-mail/senha.
- Corrigir o retorno do Google para aguardar a sessão antes de abrir os ciclos.
- Melhorar as mensagens de erro em português, distinguindo credenciais inválidas, conta ainda não confirmada e conta criada com Google.
- Corrigir a criação de conta para respeitar a confirmação por e-mail, sem redirecionar como se o usuário já estivesse autenticado.
- Adicionar “Esqueci minha senha” e a tela pública para definir uma nova senha.
- Atualizar o estado global após entrar ou sair e limpar dados protegidos ao sair.

## Validação
- Testar entrada com Google até a tela de ciclos.
- Testar erro de senha inválida e recuperação de senha.
- Testar criação de conta e o estado de confirmação por e-mail.
