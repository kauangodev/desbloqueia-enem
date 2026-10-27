# GoDev Education — Final Go-Live Audit

**Data:** 27/10/2026  
**Ambiente:** repositório local `ENEM`, branch `codex/maintenance-essay`, revisão-base `9f687f3`  
**Alvo de publicação:** Hostinger / `godeveducation.com.br`

## Veredito

**PRE-LAUNCH ONLY — NÃO APROVADO PARA VENDAS AINDA.**

As correções verificadas no código local foram aplicadas e passaram pelos testes locais. A publicação dessas correções na Hostinger ainda não foi executada nesta auditoria. Além disso, o fluxo real da Cakto — incluindo ambiente controlado, reembolso e chargeback — não foi homologado de forma independente. Portanto, não é tecnicamente correto declarar o site 100% pronto para operação comercial.

## Escopo preservado

O módulo de correção automática de redações foi deliberadamente excluído das alterações e permanece em manutenção, conforme solicitado. Não houve modificação em `components/essay-workspace.tsx` nem em `app/api/essays/route.ts`.

## Correções realizadas no código local

- Cadastro passou a criar usuário não verificado, enviar fluxo de confirmação por e-mail e bloquear login sem confirmação.
- Tokens de recuperação deixaram de ser registrados em logs; a entrega com Resend falha de forma explícita quando a configuração não existe ou o provedor rejeita o envio.
- Sessões anteriores são invalidadas após redefinição de senha por meio de `iat` e `updated_at`.
- Ofertas Cakto desconhecidas deixaram de receber fallback Premium; produto/oferta precisam estar na allowlist configurada.
- Estados terminais `refunded` e `chargedback` não podem ser reativados por eventos posteriores.
- Upload administrativo de PDF passou a ter limite de 50 MB, validado por tamanho declarado e tamanho real.

## Evidências funcionais

| Verificação | Resultado |
|---|---:|
| Instalação congelada (`pnpm install --frozen-lockfile`) | PASS |
| Testes unitários | **25/25 PASS** |
| Typecheck | PASS |
| Build de produção | PASS |
| E2E serial | **19/19 PASS** |
| Auditoria da biblioteca de questões | PASS |
| ESLint nos arquivos alterados | PASS |
| ESLint completo | inconclusivo: processo sem saída foi interrompido após travamento |
| `git diff --check` | PASS, apenas avisos de conversão CRLF |

O E2E cobriu as rotas públicas e privadas e os viewports de 320, 360, 390, 430, 768, 1024, 1440 e 1920 px.

## Conteúdo educacional

- Banco autoral total: **2.100 questões**.
- Exercícios: **1.500 questões**, distribuídas em 60 listas.
- Simulados: **30 simulados / 600 questões**.
- Biblioteca histórica referenciada: **1.800 itens**, dos quais apenas **7 estão resolvidos** e **1.793 continuam pendentes**.

Assim, o site pode apresentar os exercícios e simulados autorais validados, mas não deve anunciar 1.800 questões com resolução completa até que os 1.793 registros pendentes sejam realmente recuperados, revisados e cadastrados.

## Segurança

O scan de segurança padrão foi concluído sobre a revisão-base e identificou seis achados reproduzíveis: dois altos, três médios e um baixo. Todos receberam correção no working tree e foram cobertos por typecheck, testes, build e/ou E2E:

1. bypass de propriedade do e-mail no cadastro;
2. ofertas Cakto desconhecidas convertidas em Premium;
3. token de recuperação exposto em log;
4. sessões antigas preservadas após reset de senha;
5. reativação possível de pedidos reembolsados/estornados;
6. upload administrativo de PDF sem limite.

Não foram confirmados, na revisão estática, IDOR de aluno/admin, SQL injection, XSS, traversal ou credenciais embutidas. O arquivo `scripts/hostinger-data-migration.sql` contém dados operacionais e deve continuar tratado como material sensível.

## Integrações e produção

- A integração Cakto tem validação de assinatura, idempotência e allowlist cobertas localmente.
- A confirmação de um webhook principal ativo anteriormente não substitui a homologação controlada de compra, entrega, reembolso e chargeback.
- A versão corrigida deste working tree **ainda não foi publicada na Hostinger** nesta auditoria.
- O build/deployment anterior da Hostinger refere-se à versão anterior do código e não comprova que as correções atuais estão no domínio público.
- O estado atual do MySQL em produção não foi revalidado de forma destrutiva ou invasiva.

## Autorização comercial

- **Anúncios pagos:** PRE-LAUNCH ONLY.
- **Pagamentos reais:** NÃO liberar antes da homologação controlada da Cakto e da publicação validada.
- **Entrega automática de produtos comprados:** não homologada integralmente nesta auditoria.
- **Correção automática de redações:** indisponível, com aviso de manutenção preservado.

## Pendências objetivas para o go-live

1. Publicar o working tree corrigido na Hostinger e validar o domínio público na revisão publicada.
2. Executar homologação controlada da Cakto: compra aprovada, duplicidade, falha, reembolso e chargeback.
3. Confirmar no runtime público o envio de e-mail de cadastro e recuperação, sem expor tokens em logs.
4. Resolver ou remover da comunicação comercial as 1.793 referências históricas ainda pendentes.
5. Reexecutar a auditoria pós-publicação e só então emitir autorização de vendas.

**Conclusão:** o código local está em condição técnica significativamente melhor e os testes automatizados passaram, mas a evidência externa de produção e pagamentos ainda é insuficiente para uma certificação de go-live comercial.
