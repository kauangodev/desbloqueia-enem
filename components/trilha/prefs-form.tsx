"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client";

type Prefs = { serie: "" | "1" | "2" | "3" | "concluido"; modo: "aprender" | "treinar" };

/** Série e modo da trilha. Alterar não apaga progresso: o histórico de domínio é o mesmo nos dois modos. */
export default function PrefsForm({ initial }: { initial: Prefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save(next: Prefs) {
    setPrefs(next); setState("saving"); setMessage("");
    try { await post({ action: "prefs", serie: next.serie, modo: next.modo }); setState("saved"); router.refresh(); }
    catch (e) { setState("error"); setMessage(e instanceof Error ? e.message : "Não foi possível salvar."); setPrefs(initial); }
  }

  return (
    <details className="tr-prefs">
      <summary>Configurar a trilha <span>{prefs.modo === "aprender" ? "Aprender" : "Treinar"}{prefs.serie ? ` · ${prefs.serie === "concluido" ? "Já terminei a escola" : `${prefs.serie}º ano`}` : ""}</span></summary>
      <div className="tr-prefs-body">
        <fieldset>
          <legend>Modo</legend>
          <label><input type="radio" name="modo" checked={prefs.modo === "aprender"} onChange={() => void save({ ...prefs, modo: "aprender" })} /> <b>Aprender</b> — fundamentos primeiro, na ordem das unidades.</label>
          <label><input type="radio" name="modo" checked={prefs.modo === "treinar"} onChange={() => void save({ ...prefs, modo: "treinar" })} /> <b>Treinar</b> — prática e desafio em qualquer unidade, sem exigir o fundamento.</label>
        </fieldset>
        <label className="tr-field" htmlFor="tr-serie"><span>Sua série</span>
          <select id="tr-serie" value={prefs.serie} onChange={(e) => void save({ ...prefs, serie: e.target.value as Prefs["serie"] })}>
            <option value="">Prefiro não informar</option><option value="1">1º ano</option><option value="2">2º ano</option><option value="3">3º ano</option><option value="concluido">Já terminei a escola</option>
          </select>
        </label>
        <p className="tr-note">Guardamos a série para recomendar o ponto de partida assim que o acervo tiver marcação por série. Hoje a recomendação segue a ordem das unidades, e trocar de modo ou série não apaga o seu progresso.</p>
        <p className="tr-note" role="status" aria-live="polite">{state === "saving" ? "Salvando…" : state === "saved" ? "Preferências salvas." : state === "error" ? message : ""}</p>
      </div>
    </details>
  );
}
