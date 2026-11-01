import { Header, Footer } from "../../components/site";
import Support from "../../components/support";
export const metadata = { title: "Suporte | GoDev Education" };
export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" className="container section">
        <h1 className="page-title">Como podemos ajudar?</h1>
        <Support />
      </main>
      <Footer />
    </>
  );
}

