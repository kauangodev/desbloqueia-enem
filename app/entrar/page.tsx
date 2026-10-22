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
              Este link expirou ou não é válido. Solicite um novo abaixo.
            </p>
          )}
          <LoginForm configured={authConfigured()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
