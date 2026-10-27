-- Corrige a descrição pública da biblioteca histórica do Premium.
update public.products
set features = '["Tudo do Essencial","Kit completo de revisão com 87 páginas","2.100 questões autorais no estilo ENEM","30 simulados com 600 questões","60 listas de exercícios com 1.500 questões","Preparação para redação","Biblioteca histórica com 1.800 questões de referência","Fichas e checklists para a reta final"]'::jsonb
where id = 'premium';
