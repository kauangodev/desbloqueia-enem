insert into public.materials(id,title,description,category,plan,pages,cover) values
('guia','Mapa da revisão','Prioridades de estudo e curadoria pedagógica.','Cronograma','essencial',12,'/covers/guia.png'),
('linguagens','Linguagens & Redação','Leitura, interpretação e construção de argumentos.','Linguagens','essencial',13,'/covers/linguagens.png'),
('humanas','Ciências Humanas','Contextos e conexões para revisar.','Humanas','essencial',15,'/covers/humanas.png'),
('natureza','Ciências da Natureza','Fundamentos, exemplos e alertas de prova.','Natureza','essencial',15,'/covers/natureza.png'),
('matematica','Matemática','Raciocínio e prática.','Matemática','essencial',14,'/covers/matematica.png'),
('kit','Kit completo de revisão','Revisão, exercícios, simulados e redação.','Simulados','premium',87,'/covers/kit.png');
-- Publish only after uploading private files. The 40-exercise Essencial selection must
-- be uploaded separately; do not expose the complete Premium volume to Essencial.
