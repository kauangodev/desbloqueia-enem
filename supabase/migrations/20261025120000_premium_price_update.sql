-- Atualiza o preço público do Premium para R$ 32,90 e seus benefícios editoriais.
update public.products
set price_cents = 3290,
    features = '["Tudo do Essencial","Kit completo de revisão com 87 páginas","2.100 questões autorais no estilo ENEM","30 simulados com 600 questões","60 listas de exercícios com 1.500 questões","Preparação para redação","Biblioteca navegável com 1.800 referências","Fichas e checklists para a reta final"]'::jsonb
where id = 'premium';
