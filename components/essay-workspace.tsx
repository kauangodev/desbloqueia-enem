"use client";
import { useState } from "react";
import EssayThemeLibrary from "./essay-theme-library";
import { essayThemes } from "../data/essay-themes";
import type { EssayTheme } from "../data/essay-themes";

type Feedback = { score: number; summary: string; strengths: string[]; improvements: string[]; action_plan: string[]; competencies: { name: string; score: number; rationale: string }[] };
export default function EssayWorkspace() {
  const [theme, setTheme] = useState<EssayTheme>(essayThemes[0]);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function correct() {
    if (!image) return;
    setMessage("");
    setFeedback(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("title", title || "Redação sem título");
      body.append("prompt", theme.title);
      body.append("image", image);
      const response = await fetch("/api/essays", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível corrigir agora.");
      setFeedback(data.feedback);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível corrigir agora.");
    } finally {
      setBusy(false);
    }
  }
  function chooseImage(file: File | undefined) {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  }
  return <div className="essay-workspace">
    <div className="essay-header"><div><span className="eyebrow">Laboratório de redação</span><h2>Pesquise, escreva no caderno e fotografe sua redação.</h2><p>Escolha um tema na biblioteca, leia o repertório de apoio e envie uma foto nítida. A IA interpreta o manuscrito e orienta sua revisão; a nota é estimativa pedagógica, não avaliação oficial.</p></div><span className="essay-badge">Foto até 8 MB</span></div>
    <EssayThemeLibrary themes={essayThemes} value={theme.id} onChange={setTheme} />
    <div className="essay-grid">
      <form className="form-card essay-editor" onSubmit={(event) => { event.preventDefault(); void correct(); }}>
        <div className="essay-selected-theme"><span className="eyebrow">Tema selecionado</span><strong>{theme.title}</strong><p>{theme.summary}</p></div>
        <label className="field">Título opcional<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Minha proposta de intervenção" /></label>
        <label className="essay-upload" htmlFor="essay-image"><span className="essay-upload-icon">＋</span><b>{image ? image.name : "Escolha a foto da sua redação"}</b><small>JPG, PNG ou WEBP · até 8 MB · boa luz e texto inteiro visível</small><input id="essay-image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => chooseImage(event.target.files?.[0])} /></label>
        {preview && <div className="essay-preview"><img src={preview} alt="Prévia da redação selecionada" /><button type="button" className="button secondary" onClick={() => { setImage(null); setPreview(""); }}>Trocar foto</button></div>}
        <div className="essay-actions"><span className="subtle">A foto será usada somente para esta correção.</span><button className="button primary" disabled={busy || !image}>{busy ? "Analisando foto…" : "Enviar para correção"}</button></div>
        <p role="status" className="error" hidden={!message}>{message}</p>
      </form>
      <aside className="essay-side"><span className="eyebrow">Antes de enviar</span><h3>Checklist da foto</h3><ul className="task-list"><li>Fotografe a folha inteira.</li><li>Evite sombras e reflexos.</li><li>Deixe a letra legível.</li><li>Confira se o tema está correto.</li></ul></aside>
    </div>
    {feedback && <section className="essay-feedback" aria-live="polite"><div className="feedback-score"><span>Diagnóstico estimado</span><strong>{feedback.score}</strong><small>/ 1000 · orientação pedagógica</small></div><div><span className="eyebrow">Leitura geral</span><p>{feedback.summary}</p><div className="competency-grid">{feedback.competencies.map((item) => <article key={item.name}><b>{item.name}</b><strong>{item.score}/200</strong><p>{item.rationale}</p></article>)}</div><div className="feedback-columns"><div><h3>Pontos fortes</h3><ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>Próximos ajustes</h3><ul>{feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div></div><h3>Plano de revisão</h3><ol>{feedback.action_plan.map((item) => <li key={item}>{item}</li>)}</ol><p className="subtle">A correção é automatizada e orientativa; não substitui a avaliação oficial do ENEM.</p></div></section>}
  </div>;
}


