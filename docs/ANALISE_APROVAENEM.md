# Análise do AprovaENEM e plano para a GoDev Education

Análise feita em 18/11/2026 com a landing pública e a área de membros no plano grátis. Telas que exigem plano pago
(Plano de Estudos, Vestibulares, Preditivas completas, Dashboard completo, Redação além de 2 correções) foram vistas
apenas pelo que a própria plataforma mostra no bloqueio. **Nada do conteúdo, texto, questão ou identidade visual do
AprovaENEM foi copiado**: usamos apenas ideias de produto, reescritas para a GoDev, que mantém sua identidade.

## 1. Landing do AprovaENEM

| O que fazem | Efeito | Na GoDev |
|---|---|---|
| Título de dor ("Pare de travar nas questões") com promessa imediata | Clareza em 3 segundos | **Feito**: "Pare de errar a mesma questão. Revise com um caminho claro." |
| Questão interativa já no topo | Prova o produto antes de pedir cadastro | **Feito, melhor**: questão jogável com correção na hora, resolução, erro comum e botão de eliminar alternativas |
| Faixa de números (questões, provas) | Prova de escala | **Feito**: números calculados do acervo real (nunca digitados) |
| "O que tem lá dentro" com marca "no grátis" | Mostra o mapa do produto | **Feito**: ciclo revise→pratique→entenda→refaça + 8 recursos marcados "Essencial e Premium" ou "Só no Premium" |
| Plano grátis sem cartão | Remove atrito | **Parcial**: a questão jogável cumpre o papel de teste grátis. Um plano grátis de verdade exige conta e limites (ver "Próximos passos") |
| "Seu responsável pode pagar" | Aluno menor de idade não tem cartão | **Feito**: botão "Enviar para meu responsável pagar" (compartilhamento nativo ou WhatsApp) |
| Pix ou cartão, reembolso de 7 dias, sem renovação | Reduz medo | **Já existia** e foi reforçado no topo e no FAQ |
| Passe anual caro (R$ 199 / R$ 299), mensal R$ 29,90 / R$ 47,90 | Ticket alto | **Vantagem GoDev**: pagamento único a partir de R$ 11,89, sem mensalidade |

Pontos fracos do AprovaENEM que a GoDev evita: páginas do app que demoram de 10 a 15 s para renderizar, área logada sem
texto útil para leitor de tela, termos de gamificação em excesso (tokens, roleta, caixas), preços altos.

## 2. Área de membros do AprovaENEM

Telas encontradas: Início, Dashboard (diagnóstico, metas por vestibular, retrospectiva), Trilha ENEM (cidade dos números,
unidades por série), Treino Rápido, Banco de Questões (754 só de Matemática, 16 tópicos), Simulados (oficiais de 90
questões, reduzidos, personalizado pago), Redação IA (7 provas, 2 correções/mês), Flash Cards, Vestibulares 1ª e 2ª fase
(pago), Missões, Preditivas (900 inéditas, 12 liberadas), Tutor IA, Professor IA, Linguagens (inglês/espanhol, 120
lições), Plano de Estudos (pago), Amigos, Grupos, Comunidade, Ranking por ligas, Loja (tokens, roleta, caixas),
Ofensiva (sequência), Configurações, Planos.

Funções boas de uso diário que vimos na questão:
- tempo por questão, rascunho, eliminar alternativa, atalhos de teclado;
- feedback imediato com XP, "como foi?" (muito fácil/difícil) e explicação por IA opcional;
- missões do dia, sequência com calendário, meta diária ajustável, nível e XP;
- só a primeira tentativa vale XP (evita ganhar pontos repetindo a questão).

## 3. O que a GoDev já tinha (e o AprovaENEM não tem)

Revisões rápidas com exemplo resolvido e fichas de fórmulas, resolução passo a passo com "erro comum" e "por que sua
alternativa não serve", caderno de erros automático, simulados com mapa de questões, salvamento automático e retomada,
modo prova/prática, leitor protegido de e-books, plano da semana, pagamento único.

## 4. O que foi implementado nesta rodada

**Landing** (`components/landing/*`, `app/landing-plus.css`)
- Topo em duas colunas com questão jogável (`TryQuestion`).
- Faixa de números reais (`SalesNumbers`) e mapa de recursos por plano (`SalesTools`).
- Atalho "Enviar para meu responsável pagar" (`GuardianShare`) e FAQ ampliado.
- Texto do topo sem datas vencidas (o 2º dia do Enem 2026 já passou).

**Área do aluno** (`components/operacao/*`, `lib/operacao/momentum.ts`)
- Cartão "Ritmo de estudo": sequência de dias, nível/XP, últimos 7 dias e 3 missões do dia (`MomentumCard`).
- XP só na 1ª tentativa de cada questão; tudo calculado de ações já registradas (sem mudança de banco).
- Questão: eliminar alternativa, tempo na questão, rascunho (só neste aparelho), atalhos A–E e Enter.
- Simulado/treino: eliminar alternativa e atalhos A–E, ← →, D (dúvida).
- Testes novos em `tests/momentum.test.ts`.

## 5. Próximos passos recomendados (não feitos, por exigirem decisão ou infraestrutura)

1. **Reposicionar a oferta para o Enem 2027.** O produto ainda se chama "Desbloqueia ENEM 2026 / Operação 2º Domingo" e a
   campanha acabou em 15/11/2026. É decisão de marca e de calendário.
2. **Plano grátis com conta** (amostra limitada), para captar e-mails antes da venda.
3. **Tutor/Professor IA** e **correção de redação**: custo por uso na API e política de limites; a redação está em manutenção.
4. **Flash cards com repetição espaçada** a partir das fichas de fórmulas (novo tipo em `operacao_state`).
5. **Meta diária ajustável**, "como foi?" por questão, ranking por liga e grupos (precisam de novos dados e moderação).
6. **Diagnóstico por vestibular e retrospectiva** (dependem de conteúdo de outras bancas).
