import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
test('biblioteca React: filtro de ano, área, resolução, busca e paginação', async ({ page }) => {
  // Isolated component fixture only in the test runner; no production bypass route.
  const entries=JSON.parse(readFileSync('data/library.json','utf8'));
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Library from './components/library';createRoot(document.getElementById('root')).render(React.createElement(Library,{entries:${JSON.stringify(entries)}}));`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic'});
  await page.route('**/component-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="pt-BR"><head><title>Teste isolado da biblioteca</title></head><body><main id="root"></main></body></html>'}));
  await page.goto('/component-fixture');
  await page.addStyleTag({content:readFileSync('app/globals.css','utf8')});
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.getByRole('status')).toHaveText('1.800 referências encontradas');
  await page.getByRole('button',{name:'Próxima'}).click();
  await expect(page.locator('.pager')).toContainText('2 / 75');
  await page.getByLabel('Ano',{exact:true}).selectOption('2025');
  await expect(page.getByRole('status')).toHaveText('180 referências encontradas');
  await page.getByLabel('Área',{exact:true}).selectOption('Matemática');
  await expect(page.getByRole('status')).toHaveText('45 referências encontradas');
  await page.getByLabel('Área',{exact:true}).selectOption('');
  await page.getByLabel('Situação').selectOption('sol');
  await expect(page.locator('.solution')).toHaveCount(7);
  await page.getByLabel('Buscar questão').fill('ENEM-2025-160');
  await expect(page.getByRole('status')).toHaveText('1 referências encontradas');
  await expect(page.getByRole('link',{name:'Prova oficial'})).toHaveAttribute('href',/gov.br/);
  await page.getByLabel('Buscar questão').fill('inexistente');
  await expect(page.getByText('Nenhuma referência para estes filtros.')).toBeVisible();
});
test('acessibilidade automatizada da landing e entrada',async({page})=>{
  for(const route of ['/','/landing','/entrar']){
    await page.goto(route);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});

