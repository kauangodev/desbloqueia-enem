"use client";
import { memo, useEffect, useId, useMemo, useRef, useState } from "react";

export type MapItem = { id: string; area: string; answered: boolean; flagged?: boolean };

type Props = {
  items: MapItem[];
  current: number;
  onSelect: (index: number) => void;
  /** Id do título da questão que recebe o foco depois de escolher um item no mapa. */
  focusTargetId?: string;
  /** Ações adicionais exibidas abaixo do mapa (ex.: Finalizar). */
  children?: React.ReactNode;
  /** Mostra a legenda de "dúvida" (só quando a marcação de dúvida existe). */
  showFlags?: boolean;
  /** "aside": só o painel lateral; "sheet": só o botão + painel móvel; padrão: ambos. */
  part?: "aside" | "sheet" | "both";
};

function Grid({ items, indexes, current, onPick, showFlags }: { items: MapItem[]; indexes: number[]; current: number; onPick: (i: number) => void; showFlags?: boolean }) {
  return (
    <ol className="qmap-grid">
      {indexes.map((i) => {
        const it = items[i];
        const state = `${i === current ? "is-current " : ""}${it.answered ? "is-done " : ""}${it.flagged ? "is-flag" : ""}`;
        return (
          <li key={it.id}>
            <button type="button" className={`qmap-dot ${state}`} aria-current={i === current ? "true" : undefined} aria-label={`Questão ${i + 1}${it.answered ? ", respondida" : ", em branco"}${it.flagged ? ", marcada com dúvida" : ""}${i === current ? ", atual" : ""}`} onClick={() => onPick(i)}>
              <span aria-hidden="true">{i + 1}</span>
              {it.flagged && showFlags ? <i className="qmap-flag" aria-hidden="true" /> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function QuestionMapBase({ items, current, onSelect, focusTargetId, children, showFlags, part = "both" }: Props) {
  const areas = useMemo(() => {
    const order: string[] = [];
    for (const it of items) if (!order.includes(it.area)) order.push(it.area);
    return order.map((name) => {
      const indexes = items.map((it, i) => (it.area === name ? i : -1)).filter((i) => i >= 0);
      return { name, indexes, answered: indexes.filter((i) => items[i].answered).length };
    });
  }, [items]);
  const tabbed = areas.length > 1 && items.length > 24;
  const currentArea = items[current]?.area;
  const [tab, setTab] = useState(currentArea || areas[0]?.name || "");
  useEffect(() => { if (currentArea) setTab(currentArea); }, [currentArea]);
  const [sheet, setSheet] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const picked = useRef(false);
  const titleId = useId();
  const total = items.length;
  const answered = items.filter((it) => it.answered).length;
  const flagged = items.filter((it) => it.flagged).length;

  const pick = (i: number) => {
    picked.current = true;
    onSelect(i);
    setSheet(false);
    if (focusTargetId) setTimeout(() => document.getElementById(focusTargetId)?.focus(), 80);
  };

  // Painel (bottom sheet) no mobile: foco, Escape, rolagem do fundo e retorno do foco.
  useEffect(() => {
    if (!sheet) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSheet(false); return; }
      if (e.key !== "Tab") return;
      const root = document.getElementById(`${titleId}-sheet`);
      const focusables = root ? [...root.querySelectorAll<HTMLElement>("button:not([disabled])")] : [];
      if (!focusables.length) return;
      const first = focusables[0]; const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; if (picked.current) picked.current = false; else (opener.current || previous)?.focus(); };
  }, [sheet, titleId]);

  const renderPanel = (sfx: string) => (
    <>
      {tabbed ? (
        <div className="qmap-tabs" role="tablist" aria-label="Áreas do simulado">
          {areas.map((a) => (
            <button key={a.name} type="button" role="tab" id={`${titleId}${sfx}-tab-${a.name}`} aria-selected={tab === a.name} aria-controls={`${titleId}${sfx}-panel`} className={`qmap-tab ${tab === a.name ? "is-on" : ""}`} onClick={() => setTab(a.name)}>
              {a.name} <small>{a.answered}/{a.indexes.length}</small>
            </button>
          ))}
        </div>
      ) : null}
      {(tabbed ? areas.filter((a) => a.name === tab) : [{ name: "all", indexes: items.map((_, i) => i), answered, }]).map((a) => (
        <div key={a.name} id={tabbed ? `${titleId}${sfx}-panel` : undefined} role={tabbed ? "tabpanel" : undefined} aria-labelledby={tabbed ? `${titleId}${sfx}-tab-${a.name}` : undefined}>
          <Grid items={items} indexes={a.indexes} current={current} onPick={pick} showFlags={showFlags} />
        </div>
      ))}
      <p className="qmap-legend"><span><i className="qmap-key is-done" /> respondida</span><span><i className="qmap-key" /> em branco</span>{showFlags ? <span><i className="qmap-key is-flag" /> dúvida</span> : null}<span><i className="qmap-key is-current" /> atual</span></p>
    </>
  );

  return (
    <>
      {part !== "sheet" ? <aside className="qmap" aria-label="Mapa de questões">
        <div className="qmap-head"><h4>Mapa de questões</h4><span className="qmap-count" aria-live="polite">{answered}/{total} respondidas{showFlags && flagged ? ` · ${flagged} com dúvida` : ""}</span></div>
        {renderPanel("-d")}
        {children ? <div className="qmap-actions">{children}</div> : null}
      </aside> : null}
      {part !== "aside" ? <div className="qmap-mobile">
        <button ref={opener} type="button" className="qmap-open" aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
          Mapa de questões <span>{answered}/{total}</span>
        </button>
        {sheet ? (
          <div className="qmap-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
            <div className="qmap-sheet" id={`${titleId}-sheet`} role="dialog" aria-modal="true" aria-labelledby={`${titleId}-t`}>
              <div className="qmap-head"><h4 id={`${titleId}-t`}>Mapa de questões</h4><button ref={closeBtn} type="button" className="qmap-close" onClick={() => setSheet(false)}>Fechar</button></div>
              <p className="qmap-count">{answered}/{total} respondidas{showFlags && flagged ? ` · ${flagged} com dúvida` : ""}</p>
              <div className="qmap-sheet-body">{renderPanel("-m")}</div>
              {children ? <div className="qmap-actions">{children}</div> : null}
            </div>
          </div>
        ) : null}
      </div> : null}
    </>
  );
}

const QuestionMap = memo(QuestionMapBase);
export default QuestionMap;
