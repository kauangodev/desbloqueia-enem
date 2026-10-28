# Catálogo didático v2

Esta revisão substitui os materiais PDF legados publicados por 16 e-books didáticos de 34 páginas, com capas correspondentes. A separação editorial é intencional:

- os e-books apresentam conteúdo didático;
- exercícios, simulados, tentativas, histórico e gamificação continuam nos módulos próprios;
- o e-book de Redação não ativa a correção automática, que permanece em manutenção;
- os PDFs ficam em armazenamento privado e são entregues pelo leitor autenticado.

## Planos

O Essencial mantém o preço vigente e libera os quatro materiais-base: Língua Portuguesa, História, Biologia e Matemática, além dos exercícios e cronograma descritos na oferta.

O Premium mantém o preço vigente e acrescenta os 16 e-books, 2.100 questões autorais, 30 simulados, 60 listas, a biblioteca histórica de 1.800 referências e o material de Redação. Nenhuma dessas descrições representa correção automática disponível.

## Publicação

1. Faça uma cópia do diretório `private/materials` antes de substituir arquivos.
2. Envie os 16 arquivos com os nomes `ebook-01-...-v2.pdf` a `ebook-16-...-v2.pdf` para o armazenamento privado da aplicação.
3. Execute `scripts/hostinger-ebooks-migration.sql` no banco de produção.
4. Aguarde o deployment e valide `pnpm audit:ebooks`, as capas públicas e um leitor de cada plano.

O SQL apenas despublica os materiais legados e faz upsert dos novos registros; não remove usuários nem linhas de progresso antigas.
