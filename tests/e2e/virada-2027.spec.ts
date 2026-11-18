import { test, expect } from "@playwright/test";

/** Virada 2027: URLs antigas redirecionam preservando query e destino; área logada exige sessão. */
test("URL antiga da Operação redireciona para Matemática e Natureza preservando a query", async ({ request }) => {
  const res = await request.get("/aluno/operacao-segundo-domingo/questoes?d=fisica&df=dificil&n=2", { maxRedirects: 0 });
  expect([307, 308]).toContain(res.status());
  const location = new URL(res.headers()["location"], "http://x");
  expect(location.pathname).toBe("/aluno/matematica-natureza/questoes");
  expect(location.searchParams.get("d")).toBe("fisica");
  expect(location.searchParams.get("df")).toBe("dificil");
  expect(location.searchParams.get("n")).toBe("2");
});

test("raiz e subcaminhos antigos também redirecionam", async ({ request }) => {
  for (const [from, to] of [["/aluno/operacao-segundo-domingo", "/aluno/matematica-natureza"], ["/aluno/operacao-segundo-domingo/materiais/mat-razao-proporcao", "/aluno/matematica-natureza/materiais/mat-razao-proporcao"], ["/aluno/operacao-segundo-domingo/treinos?abrir=simulado", "/aluno/matematica-natureza/treinos"]] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect([307, 308], from).toContain(res.status());
    expect(new URL(res.headers()["location"], "http://x").pathname).toBe(to);
  }
});

test("área do aluno exige sessão (novo e antigo endereço levam ao login)", async ({ page }) => {
  await page.goto("/aluno/matematica-natureza/questoes?d=fisica");
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/aluno/operacao-segundo-domingo/questoes?d=fisica");
  await expect(page).toHaveURL(/\/entrar/);
});

test("landing: sem datas de 2026 e com calendário a confirmar", async ({ page }) => {
  await page.goto("/landing");
  const text = await page.locator("body").innerText();
  expect(text).toContain("Calendário oficial do ENEM 2027 a confirmar");
  expect(text).not.toMatch(/Reta final|Operação 2º Domingo|domingo, 15\/11/);
});
