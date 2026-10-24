import { Header, Footer } from "../../components/site";
import LoginForm from "../../components/login-form";
import { authConfigured } from "../../lib/supabase";
export const metadata = {
  title: "Entrar | GoDev Education",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <>
      <Header />
      <main id="conteudo" className="container section">
        <div className="form-card">
          <h1>
            Bom ter você
            <br />
            por aqui.
          </h1>
          <p>Entre no seu espaço de estudo do Desbloqueia ENEM 2026.</p>
          {erro && (
            <p role="alert" className="error">
              {erro === "otp_expired"
                ? "Este link de segurança expirou. Solicite um novo link abaixo e use-o assim que chegar."
                : erro === "access_denied"
                  ? "O acesso foi recusado ou o link já foi utilizado. Solicite uma nova configuração de senha abaixo."
                  : "Não foi possível validar este acesso. Solicite uma nova configuração de senha abaixo."}
            </p>
          )}
          <LoginForm configured={authConfigured()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
