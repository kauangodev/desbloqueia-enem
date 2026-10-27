# Backup e rollback — GoDev Education

## Antes de qualquer troca

- Exportar banco completo e testar a restauração em uma instância separada.
- Versionar o commit implantado e registrar o hash do build aprovado.
- Guardar uma cópia dos arquivos privados e seus metadados.
- Registrar configurações de DNS, SMTP, Cakto e variáveis por ambiente sem incluir segredos no repositório.
- Fazer um teste de login, entitlement, leitura de material, simulado, redação e ticket.

## Rollback operacional

1. Interromper novos webhooks no destino somente se houver risco de duplicação.
2. Reapontar DNS para a última implantação estável da Vercel.
3. Reativar o processamento idempotente no backend anterior.
4. Verificar login, acesso por plano e checkout com uma conta de teste.
5. Comparar eventos de pagamento recebidos durante a janela e reconciliar entitlements.
6. Registrar causa, horário, commit e dados restaurados.

## Regras de segurança

- Não apagar o banco de origem até concluir a janela de observação.
- Não reutilizar senha temporária ou token de serviço em documentação.
- Não expor e-mails, IPs ou payloads de pagamento em logs públicos.
- O IP de primeiro acesso, quando usado para antifraude, deve ter finalidade documentada, retenção limitada e tratamento conforme a LGPD.
- Uma compra só libera acesso após webhook autenticado, validado e processado de modo idempotente.

## Estado atual

A produção Vercel está saudável e deve permanecer como rollback até que a instalação Hostinger seja realmente independente e homologada.
