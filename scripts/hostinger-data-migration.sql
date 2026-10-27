-- Data migration from the legacy Supabase public schema.
-- Password hashes are intentionally omitted; users must reset their passwords.
SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO users (id, email, name, password_hash, role, email_verified_at)
VALUES ('50f1b79b-7b8f-4b85-8563-f7d81ac42c0f', 'kauango.dev@gmail.com', 'Kauan', NULL, 'admin', CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO products (id, name, description, price_cents, features) VALUES
('essencial', 'Essencial', 'Uma base clara para retomar o que importa.', 1990, '["Resumos estratégicos por disciplina","Cronograma de estudos","40 exercícios comentados","Leitura na plataforma"]'),
('premium', 'Premium', 'Mais prática. Mais repertório. Tudo conectado.', 3990, '["Tudo do Essencial","Kit completo de revisão com 87 páginas","Dois simulados compactos","Preparação para redação","Biblioteca navegável com 1.800 referências","7 resoluções autorais já disponíveis","Fichas e checklists para a reta final"]');

INSERT IGNORE INTO offers (plan, cakto_product_id, cakto_offer_id, checkout_url, enabled) VALUES
('essencial', '6ff97951-a03a-4bed-bbe5-62c88031c0fc', '3biievb', 'https://pay.cakto.com.br/3biievb_1233750', TRUE),
('premium', 'e1fc994d-6000-41d4-9b08-5af47ec3ce07', '3fq7t2s', 'https://pay.cakto.com.br/3fq7t2s_1233753', TRUE);

INSERT IGNORE INTO materials (id, title, description, category, plan, pages, cover, storage_path, published, downloadable, public_sample_url, version) VALUES
('checklists','Fichas e checklists','Fichas rápidas para organizar a revisão e conferir a preparação.','Checklists','premium',3,'/covers/editorial-v3/kit.jpg','private/08_FICHAS_E_CHECKLISTS.pdf',TRUE,TRUE,NULL,1),
('cronograma','Cronograma da reta final','Plano de revisão de 22 de outubro a 15 de novembro.','Cronograma','essencial',9,'/covers/editorial-v3/guia.jpg','private/07_CRONOGRAMA_22OUT_A_15NOV.pdf',TRUE,TRUE,NULL,1),
('exercicios','40 exercícios autorais','Dez questões por área, com folha de respostas.','Exercícios','essencial',14,'/covers/editorial-v3/matematica.jpg','private/02_CADERNO_40_EXERCICIOS.pdf',TRUE,TRUE,NULL,1),
('gabaritos','Gabaritos e comentários','Respostas e justificativas dos 40 exercícios e dos dois simulados.','Exercícios','essencial',10,'/covers/editorial-v3/linguagens.jpg','private/05_GABARITOS_COMENTADOS.pdf',TRUE,TRUE,NULL,1),
('guia','Mapa da revisão','Prioridades de estudo e curadoria pedagógica.','Cronograma','essencial',12,'/covers/editorial-v3/guia.jpg','private/00_GUIA_EDITORIAL_E_RECORRENCIA.pdf',TRUE,TRUE,NULL,1),
('humanas','Ciências Humanas','Contextos e conexões para revisar.','Humanas','essencial',15,'/covers/editorial-v3/humanas.jpg','private/02_HUM_CADERNO_DIDATICO.pdf',TRUE,TRUE,NULL,1),
('kit','Kit completo de revisão','Revisão, exercícios, simulados e redação.','Simulados','premium',87,'/covers/editorial-v3/kit.jpg','private/KIT_COMPLETO_ENEM_2026.pdf',TRUE,TRUE,NULL,1),
('linguagens','Linguagens & Redação','Leitura, interpretação e construção de argumentos.','Linguagens','essencial',13,'/covers/editorial-v3/linguagens.jpg','private/01_LIN_CADERNO_DIDATICO.pdf',TRUE,TRUE,NULL,1),
('matematica','Matemática','Raciocínio e prática.','Matemática','essencial',14,'/covers/editorial-v3/matematica.jpg','private/04_MAT_CADERNO_DIDATICO.pdf',TRUE,TRUE,NULL,1),
('natureza','Ciências da Natureza','Fundamentos, exemplos e alertas de prova.','Natureza','essencial',15,'/covers/editorial-v3/natureza.jpg','private/03_NAT_CADERNO_DIDATICO.pdf',TRUE,TRUE,NULL,1),
('redacao','Redação estratégica','Orientações, repertório e prática para organizar sua redação.','Redação','premium',13,'/covers/editorial-v3/linguagens.jpg','private/06_REDACAO_ESTRATEGICA.pdf',TRUE,TRUE,NULL,1),
('resumos','Resumos estratégicos','Revisão organizada das quatro áreas de conhecimento.','Revisão','essencial',16,'/covers/editorial-v3/guia.jpg','private/01_RESUMOS_ESTRATEGICOS.pdf',TRUE,TRUE,NULL,1),
('simulado-dia-1','Simulado compacto - Dia 1','Treino autoral de Linguagens e Ciências Humanas.','Simulados','premium',10,'/covers/editorial-v3/humanas.jpg','private/03_SIMULADO_COMPACTO_DIA_1.pdf',TRUE,TRUE,NULL,1),
('simulado-dia-2','Simulado compacto - Dia 2','Treino autoral de Ciências da Natureza e Matemática.','Simulados','premium',10,'/covers/editorial-v3/natureza.jpg','private/04_SIMULADO_COMPACTO_DIA_2.pdf',TRUE,TRUE,NULL,1);

INSERT IGNORE INTO orders (id, email, name, plan, amount, status, created_at, updated_at) VALUES
('2cd00c7e-df96-4427-8027-9eb03d9713d2','kauanpoliveira138@gmail.com','KAUAN PEREIRA DE OLIVEIRA','essencial',20.89,'pending','2026-10-25 03:07:30.013','2026-10-25 03:07:30.013'),
('2e9202b4-4bc3-4e52-8ae7-c3e529d337f5','kauanpoliveira138@gmail.com','KAUAN PEREIRA DE OLIVEIRA','premium',40.89,'pending','2026-10-25 03:09:13.549','2026-10-25 03:09:13.549'),
('319f4881-2c34-453e-b48f-7edcf1a8d90f','kauanpoliveira138@gmail.com','KAUAN PEREIRA DE OLIVEIRA','premium',33.89,'pending','2026-10-25 19:00:59.080','2026-10-25 19:00:59.080'),
('3a67eb18-98fa-4163-93f9-733fd5be1bb4','p.augusto7733@gmail.com','Pedro Augusto de Lima Ferreira','premium',33.89,'pending','2026-10-27 01:37:16.070','2026-10-27 01:37:16.070');

INSERT IGNORE INTO payment_events (id, order_id, event, data, received_at) VALUES
('2cd00c7e-df96-4427-8027-9eb03d9713d2:pix_gerado','2cd00c7e-df96-4427-8027-9eb03d9713d2','pix_gerado','{"id":"2cd00c7e-df96-4427-8027-9eb03d9713d2","offer":{"id":"3biievb"},"amount":20.89,"status":"waiting_payment","product":{"id":"6ff97951-a03a-4bed-bbe5-62c88031c0fc"},"currency":"BRL","customer":{"name":"KAUAN PEREIRA DE OLIVEIRA","email":"kauanpoliveira138@gmail.com"},"baseAmount":19.9}','2026-10-25 03:07:30.013'),
('2e9202b4-4bc3-4e52-8ae7-c3e529d337f5:pix_gerado','2e9202b4-4bc3-4e52-8ae7-c3e529d337f5','pix_gerado','{"id":"2e9202b4-4bc3-4e52-8ae7-c3e529d337f5","offer":{"id":"3fq7t2s"},"amount":40.89,"status":"waiting_payment","product":{"id":"e1fc994d-6000-41d4-9b08-5af47ec3ce07"},"currency":"BRL","customer":{"name":"KAUAN PEREIRA DE OLIVEIRA","email":"kauanpoliveira138@gmail.com"},"baseAmount":39.9}','2026-10-25 03:09:13.549'),
('319f4881-2c34-453e-b48f-7edcf1a8d90f:pix_gerado','319f4881-2c34-453e-b48f-7edcf1a8d90f','pix_gerado','{"id":"319f4881-2c34-453e-b48f-7edcf1a8d90f","offer":{"id":"3fq7t2s"},"amount":33.89,"status":"waiting_payment","product":{"id":"e1fc994d-6000-41d4-9b08-5af47ec3ce07"},"currency":"BRL","customer":{"name":"KAUAN PEREIRA DE OLIVEIRA","email":"kauanpoliveira138@gmail.com"},"baseAmount":32.9}','2026-10-25 19:00:59.080'),
('3a67eb18-98fa-4163-93f9-733fd5be1bb4:pix_gerado','3a67eb18-98fa-4163-93f9-733fd5be1bb4','pix_gerado','{"id":"3a67eb18-98fa-4163-93f9-733fd5be1bb4","offer":{"id":"3fq7t2s"},"amount":33.89,"status":"waiting_payment","product":{"id":"e1fc994d-6000-41d4-9b08-5af47ec3ce07"},"currency":"BRL","customer":{"name":"Pedro Augusto de Lima Ferreira","email":"p.augusto7733@gmail.com"},"baseAmount":32.9}','2026-10-27 01:37:16.070');

INSERT IGNORE INTO entitlements (order_id, user_id, email, plan, active) VALUES
('2cd00c7e-df96-4427-8027-9eb03d9713d2',NULL,'kauanpoliveira138@gmail.com','essencial',FALSE),
('2e9202b4-4bc3-4e52-8ae7-c3e529d337f5',NULL,'kauanpoliveira138@gmail.com','premium',FALSE),
('319f4881-2c34-453e-b48f-7edcf1a8d90f',NULL,'kauanpoliveira138@gmail.com','premium',FALSE),
('3a67eb18-98fa-4163-93f9-733fd5be1bb4',NULL,'p.augusto7733@gmail.com','premium',FALSE);

INSERT IGNORE INTO reading_progress (user_id, material_id, page, updated_at) VALUES
('50f1b79b-7b8f-4b85-8563-f7d81ac42c0f','exercicios',12,'2026-10-24 04:11:08.482'),
('50f1b79b-7b8f-4b85-8563-f7d81ac42c0f','linguagens',13,'2026-10-25 18:15:09.197'),
('50f1b79b-7b8f-4b85-8563-f7d81ac42c0f','cronograma',8,'2026-10-27 01:25:58.652');

INSERT IGNORE INTO assessment_attempts (id, user_id, activity, score, total, answers, completed_at) VALUES
('5be44d58-97d3-4ab7-8ce3-51b85ef4c9bf','50f1b79b-7b8f-4b85-8563-f7d81ac42c0f','simulado-1',2,4,'{"aut-005":"A","aut-006":"B","aut-007":"E","aut-008":"A"}','2026-10-24 04:09:42.913'),
('a49119af-78e2-4b66-94fd-7b5237fc7aa2','50f1b79b-7b8f-4b85-8563-f7d81ac42c0f','exercicios',2,8,'{"aut-001":"A","aut-002":"B","aut-003":"E","aut-004":"B","aut-013":"A","aut-014":"D","aut-015":"C","aut-016":"A"}','2026-10-24 14:13:14.741');

INSERT IGNORE INTO admin_invites (email, name, active) VALUES ('kauango.dev@gmail.com','Kauan',TRUE);
SET FOREIGN_KEY_CHECKS = 1;
