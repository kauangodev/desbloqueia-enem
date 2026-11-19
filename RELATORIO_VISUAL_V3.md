# Reformulação visual v3: diagnóstico, correções, ativos e desempenho

## 1. Diagnóstico (confirmado por medição no domínio, 19/11/2026)

| Observação | Causa confirmada | Correção |
| --- | --- | --- |
| Hero, mosaico (4 retratos) e thumbs de trilha com baixa nitidez e recorte com cara de montagem | As imagens servidas (`/landing/hero.webp` 500×816, `estudante-1..4.webp` ~465×381) **eram recortes ampliados dos mockups** enviados como referência (raster de 125×204 px reescalado). Não há original melhor para recuperar. As capas 2:3 (`matematica.jpg`, `natureza.jpg`) e a página `mat-p07.webp` eram forçadas em caixas ~2:1 com `object-fit: cover` | Todas as imagens raster da landing foram **removidas**. Hero, mosaico e thumbs agora são HTML/SVG vetorial (nítidos em qualquer DPR) |
| Oito `<img>` sem `srcset`/`sizes` | Consequência do item anterior | Zero `<img>` na landing; nada a dimensionar |
| Seletor de tema na landing sem espelho no admin; admin aberto não reagia à troca | Só havia assinatura do evento de tema onde um seletor estava montado; o admin não montava nenhum | `ThemeSync` global no layout raiz (reaplica o tema por evento `storage`, mudança na mesma aba e mudança do sistema no modo Sistema) + seletor único `ThemeToggle` na topbar do admin e do aluno, visível em todas as larguras |
| Cartão "Seu próximo passo" ocupando a primeira dobra | Alternativas e aviso de calendário dentro do banner | Banner enxuto; alternativas em `<details>` e o aviso de calendário numa linha secundária abaixo. Nenhuma função removida |
| "Fila Pix indisponível" parecida com fila vazia | Mensagem genérica | Texto próprio: "indisponível (não é fila vazia)", com a pista da migração 06 e o link para o diagnóstico em Pagamentos Pix |
| Landing com R$ 11,89 / R$ 20,89 (taxa Cakto) e instruções Cakto | A chave `pix` estava **desligada por padrão** em produção | `gratis` e `pix` agora **ligadas por padrão** (desligar com `NEXT_PUBLIC_FEATURE_*=0`). Preço exibido = preço do plano, sem taxa; compra nova vai ao checkout próprio |

Observação sobre a causa do admin: a fila indisponível vem de a **migração 06 não estar aplicada no banco de produção** (hipótese forte; não confirmada porque não há acesso ao banco). Nada do layout resolve isso.

## 2. Manifesto de ativos

| Ativo | Origem | Uso | Formato / peso |
| --- | --- | --- | --- |
| Prévia da Trilha (hero) | Componente HTML/SVG original (`HeroV2`) | Hero | 0 bytes de imagem |
| Mosaico "Trilha / Resolução / Seus erros / Revisão" | SVG original (`ArtTile`) | Método | inline |
| Thumbs Matemática, Ciências da Natureza e Revisão | SVG original (`ArtMath/ArtScience/ArtReview`) | Cards de trilha | inline, 3 componentes |
| Logo | Wordmark tradicional (inalterado) | Cabeçalho, rodapé, sidebars | texto |

**Não há fotografias de pessoas na landing.** Não existe no repositório nenhum original de qualidade, as referências enviadas não podem ser recortadas, e não há ferramenta de geração ou banco de imagens licenciado disponível nesta sessão. Quando a GoDev fornecer fotos originais (ou autorizar uma licença), basta trocar `HeroV2`/mosaico por `<picture>` com `srcset`/`sizes`; a grade já reserva o espaço.

## 3. Tema (mecanismo único)
`lib/theme.ts` (chave `godev-theme`, `data-gd-theme`, `data-gd-pref`) permanece a fonte única. Novos: `components/theme-sync.tsx` (global), seletor no admin. Claro/Escuro/Sistema, persistência, outra aba e mudança do sistema (só em Sistema) cobertos. Alternar não recarrega, não reseta formulário nem timer (só altera atributos no `<html>`).

## 4. Onboarding e Pix (pedidos anteriores)
- Onboarding: edição posterior em **Minha conta → "Rever metas e ritmo"**, métricas no admin (contagens por etapa, sem respostas), demonstração "Monte seu plano de estudo" na landing (sem coletar dado). Continua atrás de `NEXT_PUBLIC_FEATURE_ONBOARDING=1` (**desligado**): coleta data de nascimento e a política para menores depende de decisão jurídica que não está disponível. Isso não é um bloqueio técnico.
- Pix: ligado por padrão. **Sem as migrações 06/07 aplicadas, sem os dois Copia e Cola cadastrados no admin e sem Google configurado, o pagamento por Pix aparece como "em breve" e nada é vendido.** Isso exige acesso ao banco e ao painel, que esta sessão não tem.

## 5. Desempenho (laboratório, uma execução; não é dado de campo)

Medição do domínio **antes** (versão publicada com fotos, `scripts/medir-landing.cjs`, Chrome, rede livre; tamanhos decodificados, não compactados):

| | Requisições | Imagens | CSS | JS | Fontes | LCP lab | CLS lab |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop 1366 | 37 | 404 KB (8 `<img>`) | 510 KB | 481 KB | 129 KB | 1136 ms | 0,000 |
| Mobile 390 | 34 | 75 KB | 510 KB | 481 KB | 129 KB | 1032 ms | 0,000 |

Depois: ver seção 6 (medido no domínio após a publicação). O maior custo restante é CSS (33 folhas legadas, ~650 KB de fonte) e JS; reduzi-los exige purga controlada do CSS legado, **não feita** por risco de regressão visual sem cobertura automática. Não se declara "100% de performance": LCP de campo (p75) não foi medido.

## 6. Verificação e publicação
Ver o registro no fim deste arquivo (preenchido após o deploy).
