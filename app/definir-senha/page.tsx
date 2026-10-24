import { Header, Footer } from "../../components/site";
import SetPasswordForm from "../../components/set-password-form";
export const metadata = { title: "Criar senha | GoDev Education", robots: { index: false, follow: false } };
export default function SetPasswordPage() {
  return <><Header /><main id="conteudo" className="container section"><h1>Crie sua senha.</h1><p>Use uma senha pessoal para entrar na sua área de estudos.</p><SetPasswordForm /></main><Footer /></>;
}
