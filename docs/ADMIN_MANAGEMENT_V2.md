# Gestão administrativa v2

## Navegação

O painel administrativo mantém a visão geral, CRM de alunos, produtos e planos, materiais, entregas, tickets, suporte e integrações. A nova área **Equipe e permissões** usa `/admin?tab=equipe`.

## Funções

| Função | Escopo |
| --- | --- |
| Proprietário | acesso integral, equipe, configurações e conteúdos |
| Administrador | operação de alunos, conteúdos, avaliações, suporte e equipe sem controlar o proprietário |
| Editor de conteúdo | materiais, capas, versões, publicação e despublicação |
| Equipe pedagógica | questões, explicações, simulados e leitura operacional de alunos |
| Suporte | consulta de alunos e atendimento autorizado |

As permissões são verificadas no servidor por ação. A interface apenas reflete essa política; ocultar um botão não é a proteção.

## Convites

`scripts/hostinger-admin-management.sql` é uma migração aditiva e idempotente para o MySQL da Hostinger. Depois de aplicada, o administrador pode convidar alguém por nome, e-mail e função. O token é armazenado somente como hash, expira em sete dias, tem uso único e não envia senha.

O fluxo de aceitação é `/convite?token=...`. A pessoa define sua própria senha; o convite é marcado como aceito e a ação é registrada em `audit_logs`.

Se `RESEND_API_KEY` e `EMAIL_FROM` não estiverem disponíveis, o convite continua registrado como pendente, mas a interface informa que o envio não foi confirmado. Isso evita declarar sucesso sem entrega real.

## Segurança operacional

- Suspensão é aplicada na leitura da sessão e bloqueia as próximas rotas protegidas.
- O operador não pode reduzir ou suspender o próprio acesso.
- O último proprietário ativo não pode ser removido ou desativado.
- Toda alteração de convite e membro registra ator, ação e alvo, sem senha ou token.
- A conta do aluno não é apagada ao remover o vínculo administrativo.
