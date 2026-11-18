import Link from "next/link";
import { studentSummary } from "../../../lib/aluno/summary";
import { publicPlans } from "../../../lib/catalog";
import { inventory } from "../../../lib/inventory";
import { campaignFacts } from "../../../lib/operacao/campaign-facts";
import { brl, SERVICE_FEE_CENTS } from "../../../lib/pricing";
import { checkoutConfigured } from "../../../lib/readiness";
import { checkoutHref } from "../../../lib/commerce";
import { features } from "../../../lib/features";
import { pixReadiness } from "../../../lib/pix/readiness";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos | GoDev Education" };

export default async function PlansPage() {
  const summary = await studentSummary();
  if (!summary) return null;
  const { plan, planLabel, who } = summary;
  const plans = await publicPlans().catch(() => []);
  const cents = (id: string) => plans.find((p) => p.id === id)?.cents ?? 0;
  const total = (id: string) => brl(cents(id) + SERVICE_FEE_CENTS);
  const facts = campaignFacts();
  const inv = inventory();
  const pix = await pixReadiness();
  const readyFor = (id: "essencial" | "premium") => (features.pix ? pix[id] : checkoutConfigured() && plans.length > 0);
  const buy = (id: "essencial" | "premium", label: string, primary: boolean) => readyFor(id)
    ? <Link className={`as-btn${primary ? " as-btn-primary" : ""}`} href={checkoutHref(id)}>{label}</Link>
    : features.pix ? <span className="as-muted">Pagamento por Pix em breve. Continue estudando no plano Grátis.</span> : <Link className="as-btn" href="/aluno/suporte">Falar com o atendimento</Link>;

  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Planos</h1><p>Pagamento único, sem mensalidade e sem renovação. Seu plano atual: <strong>{planLabel}</strong>.</p></div></header>
      <div className="as-plans">
        <article className={`as-plan${plan === "essencial" ? " is-current" : ""}`} aria-labelledby="pl-es">
          <h2 id="pl-es">Essencial {plan === "essencial" ? <span className="as-tag">Seu plano</span> : null}</h2>
          <p className="as-price">{readyFor("essencial") ? total("essencial") : "—"}</p>
          <p className="as-muted">{SERVICE_FEE_CENTS ? `no total · pagamento único (${brl(cents("essencial"))} + ${brl(SERVICE_FEE_CENTS)} de taxa do checkout)` : "no total · pagamento único por Pix, sem taxa adicional"}</p>
          <ul>
            <li>Matemática e Natureza: {facts.questions} questões comentadas, {facts.simulados} simulados e {facts.treinos} treinos</li>
            <li>{facts.modules} revisões rápidas e {facts.formulas} fichas de fórmulas</li>
            <li>Minha revisão, caderno de erros, missões e flash cards</li>
            <li>4 e-books: Língua Portuguesa, História, Biologia e Matemática</li>
          </ul>
          {plan === "none" ? buy("essencial", "Quero o Essencial", false) : null}
        </article>
        <article className={`as-plan is-premium${plan === "premium" ? " is-current" : ""}`} aria-labelledby="pl-pr">
          <h2 id="pl-pr">Premium {plan === "premium" || plan === "admin" ? <span className="as-tag">{plan === "admin" ? "Acesso total" : "Seu plano"}</span> : null}</h2>
          <p className="as-price">{readyFor("premium") ? total("premium") : "—"}</p>
          <p className="as-muted">{SERVICE_FEE_CENTS ? `no total · pagamento único (${brl(cents("premium"))} + ${brl(SERVICE_FEE_CENTS)} de taxa do checkout)` : "no total · pagamento único por Pix, sem taxa adicional"}</p>
          <ul>
            <li><b>Tudo do Essencial</b></li>
            <li><b>16 e-books</b>, incluindo Física, Química e Redação</li>
            <li>Banco geral: {inv.generalDistinct} questões distintas em {inv.lists} listas e {inv.simulados} simulados</li>
            <li>Biblioteca histórica: 1.800 referências com links para fontes oficiais (é um índice, não são resoluções autorais)</li>
            <li>Fichas e checklists de revisão</li>
          </ul>
          {plan === "none" || plan === "essencial" ? buy("premium", plan === "essencial" ? "Fazer upgrade para o Premium" : "Quero o Premium", true) : null}
        </article>
      </div>
      <section className="as-card">
        <h2>Como funciona o pagamento</h2>
        <ul className="as-list">
          {features.pix ? (
            <>
              <li><span>Pagamento único por Pix, sem renovação. Acompanhe o pedido em <Link className="op-link" href="/aluno/pagamentos">Meus pagamentos</Link>.</span></li>
              <li><span>O acesso é liberado depois que conferimos o recebimento na conta do recebedor, e fica na conta {who.user.email}.</span></li>
              <li><span>Garantia de 7 dias: peça reembolso pelo atendimento. <Link className="op-link" href="/politicas/reembolso">Política de reembolso</Link></span></li>
            </>
          ) : (
            <>
              <li><span>Pix ou cartão, pelo checkout seguro da Cakto.</span></li>
              <li><span>Garantia de 7 dias: peça reembolso pelo atendimento ou pelo comprovante da Cakto. <Link className="op-link" href="/politicas/reembolso">Política de reembolso</Link></span></li>
              <li><span>Use o mesmo e-mail da sua conta ({who.user.email}) no pagamento para o acesso ser liberado nela.</span></li>
            </>
          )}
          <li><span>Precisa de ajuda? <Link className="op-link" href="/aluno/suporte">Fale com o atendimento</Link>.</span></li>
        </ul>
      </section>
    </div>
  );
}
