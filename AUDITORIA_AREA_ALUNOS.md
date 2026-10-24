# Auditoria da área de alunos

## Funciona hoje

- Acesso protegido por Supabase Auth e entitlement ativo.
- Cadastro direto com e-mail, nome e senha no site, quando o e-mail possui compra aprovada ou convite administrativo.
- Exercícios e simulados são corrigidos e o resultado é persistido em `assessment_attempts` quando o banco está disponível.
- Histórico de tentativas, materiais por plano e biblioteca navegável estão presentes.
- Há auditoria de fingerprint por hash, sem armazenar o IP puro.

## Limites comprovados

- A experiência interativa usa 32 questões autorais, não 2.100 completas.
- Existem apenas dois simulados e uma lista de exercícios.
- A correção de redação possui estrutura de submissão, mas a execução de OpenAI em produção depende de chave e endpoint configurados.
- Fingerprint não substitui política de sessão, suporte e revisão de falsos positivos.

## Próxima etapa segura

Expandir o modelo para catálogo versionado no banco, com importação validada e testes de autorização por plano antes de publicar novas listas.

