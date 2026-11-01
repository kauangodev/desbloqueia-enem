"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";
export default function PdfReader({
  id,
  initialPage,
}: {
  id: string;
  initialPage: number;
}) {
  const [doc, D] = useState<PDFDocumentProxy | null>(null),
    [page, P] = useState(initialPage),
    [zoom, Z] = useState(1),
    [error, E] = useState(""),
    [status, S] = useState("Carregando documento…");
  const canvas = useRef<HTMLCanvasElement>(null),
    frame = useRef<HTMLDivElement>(null);
  const [retry, R] = useState(0);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let closed = false;
    let loaded: PDFDocumentProxy | undefined;
    let loading: PDFDocumentLoadingTask | undefined;
    E("");
    D(null);
    S("Carregando documento…");
    (async () => {
      try {
        const res = await fetch(`/api/materials/${id}`, { cache: "no-store" });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        const pdf = await import("pdfjs-dist");
        pdf.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.compat.min.js";
        // Download once while the short-lived URL is valid. Subsequent page
        // changes must not depend on expired HTTP range requests.
        const file = await fetch(result.url);
        if (!file.ok) throw new Error("Não foi possível baixar o documento. Tente novamente.");
        const data = await file.arrayBuffer();
        if (closed) return;
        loading = pdf.getDocument({ data });
        loaded = await loading.promise;
        if (closed) {
          await loading.destroy();
          return;
        }
        D(loaded);
        P((p) => Math.max(1, Math.min(Math.trunc(p) || 1, loaded!.numPages)));
      } catch (e) {
        if (!closed) {
          E(e instanceof Error ? e.message : "Falha ao abrir PDF.");
          S("");
        }
      }
    })();
    return () => {
      closed = true;
      loading?.destroy();
    };
  }, [id, retry]);
  useEffect(() => {
    if (!doc || !canvas.current) return;
    let canceled = false;
    let task:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    (async () => {
      try {
        S("Preparando página…");
        E("");
        const pdfPage = await doc.getPage(page);
        if (canceled || !canvas.current) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const available = Math.max(120, (width || frame.current?.clientWidth || 800) - 40);
        const scale = Math.min(1.5, available / base.width) * zoom;
        const viewport = pdfPage.getViewport({ scale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const c = canvas.current;
        c.width = viewport.width * ratio;
        c.height = viewport.height * ratio;
        c.style.width = `${viewport.width}px`;
        c.style.height = `${viewport.height}px`;
        const canvasContext = c.getContext("2d");
        if (!canvasContext) throw new Error("Não foi possível preparar o canvas do leitor.");
        task = pdfPage.render({
          canvasContext,
          viewport,
          transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
        });
        await task.promise;
        if (canceled) return;
        S("");
        const saved = await fetch(`/api/materials/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page }),
        });
        if (!saved.ok) S("Página aberta. Não foi possível salvar o progresso.");
      } catch (e) {
        if (
          !canceled &&
          !(e instanceof Error && e.name === "RenderingCancelledException")
        )
          E("Não foi possível renderizar esta página. Tente novamente.");
      }
    })();
    return () => {
      canceled = true;
      task?.cancel();
    };
  }, [doc, page, zoom, id, width]);
  return (
    <div ref={frame}>
      <div className="reader-toolbar" aria-label="Controles de leitura">
        <div className="reader-navigation" aria-label="Navegação de páginas">
          <button
            className="button secondary"
            disabled={!doc || page <= 1}
            onClick={() => P(page - 1)}
          >
            Anterior
          </button>
          <label className="reader-page-indicator">
          Página{" "}
          <input
            aria-label="Página"
            type="number"
            min={1}
            max={doc?.numPages || 1}
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (doc && Number.isInteger(n) && n >= 1 && n <= doc.numPages) P(n);
            }}
          />{" "}
          / {doc?.numPages || "…"}
          </label>
          <button
            className="button secondary"
            disabled={!doc || page >= doc.numPages}
            onClick={() => P(page + 1)}
          >
            Próxima
          </button>
        </div>
        <div className="reader-actions" aria-label="Ajustes de visualização">
          <button
            className="button secondary"
            aria-label="Diminuir zoom"
            disabled={zoom <= 0.6}
            onClick={() => Z(Math.max(0.6, zoom - 0.2))}
          >
            −
          </button>
          <button
            className="button secondary"
            aria-label="Aumentar zoom"
            disabled={zoom >= 2}
            onClick={() => Z(Math.min(2, zoom + 0.2))}
          >
            +
          </button>
          <button
            className="button secondary"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else
                frame.current
                  ?.requestFullscreen?.()
                  .catch(() => E("Tela cheia não disponível neste navegador."));
            }}
          >
            Tela cheia
          </button>
        </div>
        <span className="subtle reader-notice">Leitura exclusiva pela plataforma · PDF não disponível para download</span>
      </div>
      <p role="status">{status}</p>
      {error && (
        <div role="alert" className="status-message">
          {error} <button onClick={() => R(retry + 1)}>Tentar novamente</button>
        </div>
      )}
      <div className="reader-canvas">
        <canvas
          ref={canvas}
          aria-label={`Página ${page} do material.`}
        />
      </div>
    </div>
  );
}


