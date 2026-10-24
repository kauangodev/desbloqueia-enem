-- Existing private files must be uploaded before a catalog row is published.
update public.materials set cover='/covers/editorial-v3/'||id||'.jpg'
where id in ('guia','linguagens','humanas','natureza','matematica','kit');

insert into public.materials(id,title,description,category,plan,pages,cover,storage_path,published,downloadable)
select id,title,description,category,plan,pages,cover,storage_path,
  exists(select 1 from storage.objects o where o.bucket_id='materials' and o.name=v.storage_path),true
from (values
 ('resumos','Resumos estratégicos','Revisão organizada das quatro áreas de conhecimento.','Revisão','essencial',16,'/covers/editorial-v3/guia.jpg','private/01_RESUMOS_ESTRATEGICOS.pdf'),
 ('exercicios','40 exercícios autorais','Dez questões por área, com folha de respostas. Consulte as justificativas no caderno de gabaritos.','Exercícios','essencial',14,'/covers/editorial-v3/matematica.jpg','private/02_CADERNO_40_EXERCICIOS.pdf'),
 ('gabaritos','Gabaritos e comentários','Respostas e justificativas dos 40 exercícios e dos dois simulados. Os enunciados dos simulados fazem parte do Premium.','Exercícios','essencial',10,'/covers/editorial-v3/linguagens.jpg','private/05_GABARITOS_COMENTADOS.pdf'),
 ('simulado-dia-1','Simulado compacto · Dia 1','Treino autoral de Linguagens e Ciências Humanas, com folha de respostas.','Simulados','premium',10,'/covers/editorial-v3/humanas.jpg','private/03_SIMULADO_COMPACTO_DIA_1.pdf'),
 ('simulado-dia-2','Simulado compacto · Dia 2','Treino autoral de Ciências da Natureza e Matemática, com folha de respostas.','Simulados','premium',10,'/covers/editorial-v3/natureza.jpg','private/04_SIMULADO_COMPACTO_DIA_2.pdf'),
 ('redacao','Redação estratégica','Orientações, repertório e prática para organizar sua redação.','Redação','premium',13,'/covers/editorial-v3/linguagens.jpg','private/06_REDACAO_ESTRATEGICA.pdf'),
 ('cronograma','Cronograma da reta final','Plano de revisão de 22 de outubro a 15 de novembro. Adapte as etapas à sua rotina.','Cronograma','essencial',9,'/covers/editorial-v3/guia.jpg','private/07_CRONOGRAMA_22OUT_A_15NOV.pdf'),
 ('checklists','Fichas e checklists','Fichas rápidas para organizar a revisão e conferir a preparação.','Checklists','premium',3,'/covers/editorial-v3/kit.jpg','private/08_FICHAS_E_CHECKLISTS.pdf')
) as v(id,title,description,category,plan,pages,cover,storage_path)
on conflict(id) do update set title=excluded.title,description=excluded.description,
 category=excluded.category,plan=excluded.plan,pages=excluded.pages,cover=excluded.cover,
 storage_path=excluded.storage_path,published=excluded.published,downloadable=excluded.downloadable;
