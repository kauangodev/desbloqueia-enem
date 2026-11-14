"use client";

/** Leva à demonstração da hero já na aba "Materiais", onde há uma amostra de leitura legível (além das capas). */
export default function OpenSampleLink() {
  return (
    <button
      type="button"
      className="ref-button ref-button-link"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("godev:open-tab", { detail: "materiais" }));
        document.getElementById("experimentar")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }}
    >
      Ler uma amostra do conteúdo
    </button>
  );
}
