import { sessionClient } from "../lib/supabase";
import SupportTicketForm from "./support-ticket-form";

const privateSupportEmails = ["kauango.dev@gmail.com", "paingo.dev@gmail.com"];

export default async function Support({
  showPrivateEmail = false,
  showTicketForm = false,
}: {
  showPrivateEmail?: boolean;
  showTicketForm?: boolean;
}) {
  const db = await sessionClient();
  const settings = db
    ? (await db.from("support_settings").select("name,hours,whatsapp,message,enabled").eq("id", true).maybeSingle()).data
    : null;
  const whatsapp = settings?.enabled && /^55d{10,11}$/.test(settings?.whatsapp || "") ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(settings.message || "Olá! Preciso de ajuda com o Desbloqueia ENEM.")}` : null;
  return (
    <div className="support-stack">
      <div className="empty-state">
        <h2>{settings?.name || "Atendimento GoDev Education"}</h2>
        {settings?.hours && <p>{settings.hours}</p>}
        <div className="support-private-contacts">
          <p>Atendimento por e-mail (não precisa estar logado):</p>
          {privateSupportEmails.map((address) => (
            <a className="text-link" href={`mailto:${address}`} key={address}>
              {address}
            </a>
          ))}
          {whatsapp ? <a className="text-link" href={whatsapp} rel="noopener noreferrer" target="_blank">Falar pelo WhatsApp</a> : null}
          <p className="support-note">Respondemos por ordem de chegada. Sempre informe o e-mail usado na compra e nunca envie sua senha ou dados do cartão.</p>
        </div>
        <div className="support-cases">
          <h3>Casos comuns</h3>
          <ul>
            <li><b>Paguei e o acesso não apareceu:</b> o plano é liberado quando a Cakto confirma o pagamento. Se já confirmou, escreva com o e-mail da compra e o comprovante.</li>
            <li><b>Digitei o e-mail errado:</b> envie o comprovante, o e-mail digitado e o correto para avaliarmos a correção.</li>
            <li><b>Senha:</b> no primeiro acesso, use “Primeiro acesso” na tela de entrada; se esqueceu, use a recuperação de senha.</li>
            <li><b>Reembolso:</b> você tem 7 dias após a compra. Escreva com o e-mail da compra e o identificador do pedido (veja a <a className="text-link" href="/politicas/reembolso">política de reembolso</a>).</li>
          </ul>
        </div>
      </div>
      {showTicketForm && <SupportTicketForm />}
    </div>
  );
}

