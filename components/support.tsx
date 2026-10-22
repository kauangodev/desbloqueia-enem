import { sessionClient } from "../lib/supabase";
export default async function Support() {
  const db = await sessionClient();
  const settings = db
    ? (
        await db
          .from("support_settings")
          .select("*")
          .eq("id", true)
          .maybeSingle()
      ).data
    : null;
  const email =
    settings?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
      ? settings.email
      : null;
  const phone =
    settings?.enabled && /^55\d{10,11}$/.test(settings.whatsapp)
      ? settings.whatsapp
      : null;
  return (
    <div className="empty-state">
      <h2>{settings?.name || "Atendimento GoDev Education"}</h2>
      {settings?.hours && <p>{settings.hours}</p>}
      {email && (
        <p>
          <a className="text-link" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
      )}
      {phone && (
        <a
          className="button primary"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${phone}?text=${encodeURIComponent(settings.message || "Olá! Preciso de ajuda.")}`}
        >
          Conversar pelo WhatsApp
        </a>
      )}
      {!email && !phone && (
        <p>
          Os canais de atendimento estão em preparação. Eles serão publicados
          aqui antes da abertura das vendas.
        </p>
      )}
    </div>
  );
}
