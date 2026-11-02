"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {}, []);
  return (
    <main className="not-found-page container" role="alert">
      <div className="not-found-illustration" aria-hidden="true">!</div>
      <span className="landing-eyebrow">GoDev Education</span>
      <h1>Algo interrompeu esta etapa.</h1>
      <p>Não foi possível carregar esta página agora. Tente novamente ou volte ao início.</p>
      <div className="not-found-actions">
        <button className="ref-button ref-button-primary" type="button" onClick={() => reset()}>Tentar novamente</button>
        <Link className="ref-button ref-button-link" href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}

