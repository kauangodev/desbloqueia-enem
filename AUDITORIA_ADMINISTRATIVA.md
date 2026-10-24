# Auditoria administrativa

## Disponível

- Visão geral com contagens de perfis, pedidos, acessos e materiais.
- CRUD editorial de produtos, ofertas, materiais e configurações de suporte.
- CRM agrupado por e-mail com pagamentos, entitlement, perfil e entregas.
- Histórico de entregas e reenvio de instruções.
- Painel de integrações que diferencia configuração presente de homologação concluída.
- Acesso administrativo condicionado ao papel `admin`.

## Riscos e lacunas

- O painel não altera produtos diretamente na Cakto; os valores precisam permanecer iguais nos dois sistemas.
- A gestão de administradores ainda não é um CRUD completo de papéis; o mecanismo atual usa convites administrativos controlados no banco.
- Consultas do CRM estão limitadas a 500 registros por fonte e exibem esse limite ao operador.
- Não há prova de que `kauango.dev@gmail.com` esteja com papel admin na produção atual; isso depende da execução da migration/convite no Supabase conectado.

## Critério de liberação

Verificar um login admin real, consultar CRM com dados de teste, confirmar que um aluno não acessa `/admin` e revisar RLS após aplicar todas as migrations no Supabase de produção.

