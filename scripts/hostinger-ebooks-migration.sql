-- GoDev Education / Desbloqueia ENEM 2026
-- Catalogo v2: 16 e-books didaticos de 34 paginas.
-- Idempotente: despublica o catalogo legado, preserva progresso e faz upsert
-- dos novos materiais. Execute no banco de producao dentro de uma transacao.
START TRANSACTION;

UPDATE products SET features = '["E-books essenciais de quatro áreas","Cronograma e mapa da revisão","40 exercícios comentados","Leitura protegida no leitor da plataforma"]'
WHERE id = 'essencial';

UPDATE products SET features = '["Tudo do Essencial","Coleção completa com 16 e-books didáticos de 34 páginas","2.100 questões autorais no estilo ENEM","30 simulados com 600 questões","60 listas de exercícios com 1.500 questões","Biblioteca histórica com 1.800 referências","E-book de Redação; correção automática em manutenção"]'
WHERE id = 'premium';

UPDATE materials SET published = FALSE
WHERE id NOT LIKE 'ebook-%';

INSERT INTO materials
  (id, title, description, category, plan, pages, cover, storage_path, published, downloadable, public_sample_url, version)
VALUES
  ('ebook-01-lingua-portuguesa','Língua Portuguesa','Leitura, sentidos e linguagem para interpretar textos com mais segurança.','Linguagens','essencial',34,'/covers/enem-2026/01-lingua-portuguesa.png','private/ebook-01-lingua-portuguesa-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-02-literatura','Literatura','Obras, contextos e vozes para ampliar repertório e leitura crítica.','Linguagens','premium',34,'/covers/enem-2026/02-literatura.png','private/ebook-02-literatura-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-03-ingles','Inglês','Leitura, contexto e sentido para resolver questões de língua estrangeira.','Linguagens','premium',34,'/covers/enem-2026/03-ingles.png','private/ebook-03-ingles-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-04-espanhol','Espanhol','Língua, cultura e interpretação para a prova de língua estrangeira.','Linguagens','premium',34,'/covers/enem-2026/04-espanhol.png','private/ebook-04-espanhol-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-05-artes','Artes','Linguagens, formas e expressão em diálogo com a matriz do ENEM.','Linguagens','premium',34,'/covers/enem-2026/05-artes.png','private/ebook-05-artes-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-06-educacao-fisica','Educação Física','Corpo, cultura e movimento como práticas sociais e temas de prova.','Linguagens','premium',34,'/covers/enem-2026/06-educacao-fisica.png','private/ebook-06-educacao-fisica-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-07-tecnologias-informacao','Tecnologias da Informação e Comunicação','Redes, mídia e cidadania para ler o mundo conectado.','Linguagens','premium',34,'/covers/enem-2026/07-tecnologias-informacao.png','private/ebook-07-tecnologias-informacao-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-08-historia','História','Tempo, memória e sociedade para conectar processos históricos.','Humanas','essencial',34,'/covers/enem-2026/08-historia.png','private/ebook-08-historia-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-09-geografia','Geografia','Espaço, natureza e território para interpretar relações socioambientais.','Humanas','premium',34,'/covers/enem-2026/09-geografia.png','private/ebook-09-geografia-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-10-filosofia','Filosofia','Ideias, ética e pensamento para construir argumentos fundamentados.','Humanas','premium',34,'/covers/enem-2026/10-filosofia.png','private/ebook-10-filosofia-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-11-sociologia','Sociologia','Cultura, direitos e relações para analisar a vida em sociedade.','Humanas','premium',34,'/covers/enem-2026/11-sociologia.png','private/ebook-11-sociologia-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-12-biologia','Biologia','Vida, evolução e ambiente com foco nos conceitos recorrentes do ENEM.','Natureza','essencial',34,'/covers/enem-2026/12-biologia.png','private/ebook-12-biologia-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-13-quimica','Química','Matéria, energia e transformações para estudar fenômenos com método.','Natureza','premium',34,'/covers/enem-2026/13-quimica.png','private/ebook-13-quimica-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-14-fisica','Física','Movimento, ondas e energia em uma revisão visual e conectada.','Natureza','premium',34,'/covers/enem-2026/14-fisica.png','private/ebook-14-fisica-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-15-matematica','Matemática','Números, formas e relações para organizar o raciocínio quantitativo.','Matemática','essencial',34,'/covers/enem-2026/15-matematica.png','private/ebook-15-matematica-v2.pdf',TRUE,TRUE,NULL,2),
  ('ebook-16-redacao','Redação','Tese, argumentação e clareza para estruturar sua produção textual.','Redação','premium',34,'/covers/enem-2026/16-redacao.png','private/ebook-16-redacao-v2.pdf',TRUE,TRUE,NULL,2)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), description = VALUES(description), category = VALUES(category),
  plan = VALUES(plan), pages = VALUES(pages), cover = VALUES(cover),
  storage_path = VALUES(storage_path), published = VALUES(published),
  downloadable = VALUES(downloadable), public_sample_url = VALUES(public_sample_url),
  version = VALUES(version);

COMMIT;
