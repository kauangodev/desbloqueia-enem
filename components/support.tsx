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
    ? (await db.from("support_settings").select("name,hours").eq("id", true).maybeSingle()).data
    : null;
  return (
    <div className="support-stack">
      <div className="empty-state">
        <h2>{settings?.name || "Atendimento GoDev Education"}</h2>
        {settings?.hours && <p>{settings.hours}</p>}
        {showPrivateEmail ? (
          <div className="support-private-contacts">
            <p>Atendimento por e-mail para alunos:</p>
            {privateSupportEmails.map((address) => (
              <a className="text-link" href={`mailto:${address}`} key={address}>
                {address}
              </a>
            ))}
          </div>
        ) : (
          <p>
            Entre na plataforma para acessar o atendimento interno. Se você comprou
            e ainda não consegue entrar, consulte o comprovante da compra e o canal
            oficial da Cakto para recuperar o acesso.
          </p>
        )}
      </div>
      {showTicketForm && <SupportTicketForm />}
    </div>
  );
}

