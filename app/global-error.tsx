"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="not-found-page container" role="alert">
          <div className="not-found-illustration" aria-hidden="true">!</div>
          <span className="landing-eyebrow">GoDev Education</span>
          <h1>Vamos retomar em instantes.</h1>
          <p>O sistema encontrou uma interrupção inesperada.</p>
          <button className="ref-button ref-button-primary" type="button" onClick={() => reset()}>Tentar novamente</button>
        </main>
      </body>
    </html>
  );
}

