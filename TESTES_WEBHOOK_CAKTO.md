# Testes do webhook Cakto

## Matriz executada

| Caso | Resultado | Evidência |
| --- | --- | --- |
| Corpo JSON inválido | aprovado | rota retorna erro de validação |
| Assinatura ausente/inválida | aprovado | produção respondeu `401` |
| Timestamp fora da janela | aprovado | `verifySignature` rejeita replay |
| Corpo adulterado | aprovado | HMAC não confere |
| Assinatura válida | aprovado | testes de pagamento |
| Payload V1 com objeto | aprovado | `eventSchema` |
| Payload V2 com lista | aprovado | `eventSchema` |
| Evento repetido | aprovado | chave `order_id:event` |
| Pix/boleto/Open Finance pendente | aprovado | entitlement permanece inativo |
| Compra aprovada | aprovado localmente | persistência atômica |
| Reembolso | aprovado localmente | acesso revogado |
| Chargeback | aprovado localmente | acesso revogado |
| Renovação/cancelamento de assinatura | aprovado no contrato local | migration incremental |
| Falha temporária de banco | seguro | não retorna sucesso falso; requer reenvio |
| Teste oficial Cakto | pendente | requer acesso à conta |

## Comandos executados

```text
pnpm test       # 23 aprovados
pnpm typecheck  # aprovado
pnpm lint       # aprovado
pnpm build      # aprovado na publicação anterior e revalidável localmente
```

Nenhuma cobrança real foi realizada.

